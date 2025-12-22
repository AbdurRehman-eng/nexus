"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Helper to create admin client for server-side operations
function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getChannels(accessToken: string, workspaceId: string) {
  const supabase = getSupabaseAdmin();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);
  if (userError || !user) {
    return { error: "Not authenticated", data: null };
  }

  // Verify user is a workspace member
  const { data: workspaceMember } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .single();

  if (!workspaceMember) {
    return { error: "Not a workspace member", data: null };
  }

  // Get all channels in workspace
  const { data: allChannels, error: channelsError } = await supabase
    .from("channels")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (channelsError) {
    return { error: channelsError.message, data: null };
  }

  // Get user's channel memberships
  const { data: userChannelMemberships } = await supabase
    .from("channel_members")
    .select("channel_id")
    .eq("user_id", user.id);

  const userChannelIds = new Set(
    userChannelMemberships?.map((m) => m.channel_id) || []
  );

  // Filter channels:
  // - Public channels (user has access to all public channels in their workspace)
  // - Private channels where user is a member
  const accessibleChannels =
    allChannels?.filter(
      (channel) => !channel.is_private || userChannelIds.has(channel.id)
    ) || [];

  // Auto-add user to public channels they're not yet a member of
  const publicChannelsToJoin = accessibleChannels.filter(
    (channel) => !channel.is_private && !userChannelIds.has(channel.id)
  );

  if (publicChannelsToJoin.length > 0) {
    const membershipsToAdd = publicChannelsToJoin.map((channel) => ({
      channel_id: channel.id,
      user_id: user.id,
    }));

    await supabase.from("channel_members").insert(membershipsToAdd).select();
  }

  return { data: accessibleChannels, error: null };
}

export async function createChannel(
  accessToken: string,
  workspaceId: string,
  name: string,
  description: string = "",
  isPrivate: boolean = false
) {
  const supabase = getSupabaseAdmin();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);
  if (userError || !user) {
    return { error: "Not authenticated", data: null };
  }

  // Verify user is a workspace member
  const { data: member } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .single();

  if (!member) {
    return { error: "Not a workspace member", data: null };
  }

  const { data: channel, error } = await supabase
    .from("channels")
    .insert({
      workspace_id: workspaceId,
      name,
      description,
      is_private: isPrivate,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  // Add creator as channel member
  const { error: memberError } = await supabase.from("channel_members").insert({
    channel_id: channel.id,
    user_id: user.id,
  });

  if (memberError) {
    console.error(
      "[createChannel] Failed to add creator as member:",
      memberError
    );
  }

  // If it's a public channel, add all workspace members
  if (!isPrivate) {
    const { data: workspaceMembers } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspaceId);

    if (workspaceMembers && workspaceMembers.length > 0) {
      const channelMemberships = workspaceMembers
        .filter((wm: { user_id: any }) => wm.user_id !== user.id) // Exclude creator (already added)
        .map((wm: { user_id: any }) => ({
          channel_id: channel.id,
          user_id: wm.user_id,
        }));

      if (channelMemberships.length > 0) {
        await supabase.from("channel_members").insert(channelMemberships);
      }
    }
  }

  revalidatePath(`/chat/${workspaceId}`);
  return { data: channel, error: null };
}

export async function getChannel(accessToken: string, channelId: string) {
  const supabase = getSupabaseAdmin();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);
  if (userError || !user) {
    return { error: "Not authenticated", data: null };
  }

  const { data: channel, error } = await supabase
    .from("channels")
    .select("*")
    .eq("id", channelId)
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  // Check if user has access
  if (channel.is_private) {
    const { data: member } = await supabase
      .from("channel_members")
      .select("*")
      .eq("channel_id", channelId)
      .eq("user_id", user.id)
      .single();

    if (!member) {
      return { error: "Access denied", data: null };
    }
  }

  return { data: channel, error: null };
}
