'use server'

import { createClient } from '@supabase/supabase-js'
import { MessageQueryLanguage } from '@/search/mql'

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

  // Check if query looks like MQL syntax
  const isMQLQuery = /:\s*|AND|OR|NOT|contains\(|startswith\(|endswith\(|hasattachments\(|isreply\(|ispinned\(|age\(|mentions\(|regex\(/i.test(query)
  
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
    let messages: any[] = []
    
    if (isMQLQuery) {
      // For MQL queries, fetch messages without content filter first
      // We'll filter them with MQL after enriching with author info
      const { data: allMessages } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          channel_id,
          parent_id,
          reply_to,
          pinned,
          is_pinned,
          attachments,
          type,
          channels!inner(
            id,
            name,
            workspace_id
          )
        `)
        .in('channels.workspace_id', workspaceIds)
        .order('created_at', { ascending: false })
        .limit(500) // Fetch more for MQL filtering

      if (allMessages && allMessages.length > 0) {
        // Get sender profiles
        const senderIds = Array.from(new Set(allMessages.map(m => m.sender_id)))
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, email')
          .in('id', senderIds)

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

        // Transform messages to MQL-compatible format
        const mqlMessages = allMessages.map(msg => {
          const profile = profileMap.get(msg.sender_id)
          return {
            id: msg.id,
            content: msg.content || '',
            created_at: msg.created_at,
            author: profile?.username || profile?.email?.split('@')[0] || '',
            sender_id: msg.sender_id,
            channel_id: msg.channel_id,
            parent_id: msg.parent_id,
            reply_to: msg.reply_to,
            pinned: msg.pinned,
            is_pinned: msg.is_pinned,
            attachments: msg.attachments || [],
            type: msg.type,
            channels: msg.channels,
          }
        })

        // Try to use MQL to filter messages
        try {
          const mql = new MessageQueryLanguage()
          const validation = mql.validate(query)
          
          if (validation.valid) {
            const filteredMessages = mql.query(query, mqlMessages)
            messages = filteredMessages.slice(0, 20) // Limit to 20 results
          } else {
            // If MQL validation fails, fall back to simple search
            messages = allMessages.filter(msg => 
              (msg.content || '').toLowerCase().includes(query.toLowerCase())
            ).slice(0, 20)
          }
        } catch (mqlError) {
          // If MQL execution fails, fall back to simple search
          console.error('[MQL Error]', mqlError)
          messages = allMessages.filter(msg => 
            (msg.content || '').toLowerCase().includes(query.toLowerCase())
          ).slice(0, 20)
        }
      }
    } else {
      // Simple search - use existing logic
      const { data: simpleMessages } = await supabase
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

      messages = simpleMessages || []
    }

    // Get sender profiles for messages (if not already fetched for MQL)
    if (messages && messages.length > 0) {
      let profileMap = new Map()
      
      // Only fetch profiles if not already enriched (MQL queries already have author)
      if (!isMQLQuery || !messages[0]?.author) {
        const senderIds = Array.from(new Set(messages.map(m => m.sender_id)))
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, email')
          .in('id', senderIds)

        profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
      }

      messages.forEach(msg => {
        const channel = msg.channels as any
        let author = msg.author
        
        // If author not already set (from MQL), get it from profile map
        if (!author) {
          const profile = profileMap.get(msg.sender_id)
          author = profile?.username || profile?.email?.split('@')[0] || 'Unknown'
        }
        
        results.push({
          type: 'message',
          id: msg.id,
          title: `Message in #${channel?.name || 'unknown'}`,
          content: msg.content,
          author: author,
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
