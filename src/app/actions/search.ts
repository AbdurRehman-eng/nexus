'use server'

import { createClient } from '@supabase/supabase-js'

// Helper to create admin client for server-side operations
function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

interface SearchResult {
  type: 'message' | 'channel' | 'workspace';
  id: string;
  title: string;
  content: string;
  author?: string;
  timestamp?: string;
  channel?: string;
  channelId?: string;
  workspaceId?: string;
}

export async function searchWorkspace(accessToken: string, query: string) {
  const supabase = getSupabaseAdmin()

  // Validate token and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
  if (authError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  if (!query || query.trim().length === 0) {
    return { error: 'Query cannot be empty', data: null }
  }

  const searchTerm = `%${query.toLowerCase()}%`
  const results: SearchResult[] = []

  try {
    // Get user's workspaces
    const { data: userWorkspaces } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)

    if (!userWorkspaces || userWorkspaces.length === 0) {
      return { data: [], error: null }
    }

    const workspaceIds = userWorkspaces.map(w => w.workspace_id)

    // Search Messages
    const { data: messages } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        sender_id,
        channel_id,
        channels!inner(
          id,
          name,
          workspace_id
        )
      `)
      .in('channels.workspace_id', workspaceIds)
      .ilike('content', searchTerm)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get sender profiles for messages
    if (messages && messages.length > 0) {
      const senderIds = [...new Set(messages.map(m => m.sender_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, email')
        .in('id', senderIds)

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

      messages.forEach(msg => {
        const profile = profileMap.get(msg.sender_id)
        const channel = msg.channels as any
        
        results.push({
          type: 'message',
          id: msg.id,
          title: `Message in #${channel?.name || 'unknown'}`,
          content: msg.content,
          author: profile?.username || profile?.email?.split('@')[0] || 'Unknown',
          timestamp: new Date(msg.created_at).toLocaleString(),
          channel: `#${channel?.name || 'unknown'}`,
          channelId: msg.channel_id,
          workspaceId: channel?.workspace_id,
        })
      })
    }

    // Search Channels
    const { data: channels } = await supabase
      .from('channels')
      .select('id, name, description, workspace_id, is_private')
      .in('workspace_id', workspaceIds)
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(10)

    if (channels) {
      // Filter private channels to only those user is a member of
      for (const channel of channels) {
        if (channel.is_private) {
          const { data: membership } = await supabase
            .from('channel_members')
            .select('*')
            .eq('channel_id', channel.id)
            .eq('user_id', user.id)
            .single()

          if (!membership) continue
        }

        results.push({
          type: 'channel',
          id: channel.id,
          title: `#${channel.name}`,
          content: channel.description || 'No description',
          channel: `#${channel.name}`,
          channelId: channel.id,
          workspaceId: channel.workspace_id,
        })
      }
    }

    // Search Workspaces
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id, name')
      .in('id', workspaceIds)
      .ilike('name', searchTerm)
      .limit(5)

    if (workspaces) {
      workspaces.forEach(workspace => {
        results.push({
          type: 'workspace',
          id: workspace.id,
          title: workspace.name,
          content: 'Workspace',
          workspaceId: workspace.id,
        })
      })
    }

    // Sort results by relevance (messages first, then channels, then workspaces)
    results.sort((a, b) => {
      const typeOrder = { message: 0, channel: 1, workspace: 2 }
      return typeOrder[a.type] - typeOrder[b.type]
    })

    return { data: results, error: null }
  } catch (error: any) {
    console.error('[searchWorkspace] Error:', error)
    return { error: error.message || 'Search failed', data: null }
  }
}

export async function searchGlobal(accessToken: string, query: string) {
  // For now, same as workspace search
  // Can be enhanced later to search across all accessible content
  return searchWorkspace(accessToken, query)
}
