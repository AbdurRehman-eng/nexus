'use server'

import { createClient } from '@supabase/supabase-js'

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

// Create a reminder
export async function createReminder(
  accessToken: string, 
  workspaceId: string, 
  channelId: string, 
  title: string, 
  description: string,
  scheduledTime: string
) {
  const supabase = getSupabaseAdmin()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  if (!title.trim() || !scheduledTime) {
    return { error: 'Title and scheduled time are required', data: null }
  }

  const scheduledDate = new Date(scheduledTime)
  if (scheduledDate <= new Date()) {
    return { error: 'Scheduled time must be in the future', data: null }
  }

  try {
    // First, let's verify the reminders table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('reminders')
      .select('id')
      .limit(1)

    if (tableError && tableError.code === '42P01') {
      return { error: 'Database migration needed: reminders table does not exist. Please run the migration in QUICK_START.md', data: null }
    }

    const { data: reminder, error } = await supabase
      .from('reminders')
      .insert([{
        title: title.trim(),
        description: description?.trim() || '',
        scheduled_time: scheduledDate.toISOString(),
        workspace_id: workspaceId,
        channel_id: channelId,
        created_by: user.id,
        status: 'pending'
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating reminder:', error)
      return { error: `Database error: ${error.message}. Details: ${error.details || 'No details'}`, data: null }
    }

    return { data: reminder, error: null }
  } catch (error) {
    console.error('Error in createReminder:', error)
    return { error: `Failed to create reminder: ${error instanceof Error ? error.message : 'Unknown error'}`, data: null }
  }
}

// Get user's reminders
export async function getReminders(accessToken: string, workspaceId?: string) {
  const supabase = getSupabaseAdmin()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  try {
    let query = supabase
      .from('reminders')
      .select(`
        id,
        title,
        description,
        scheduled_time,
        status,
        workspace_id,
        channel_id,
        created_at,
        channels!inner (
          name,
          workspaces!inner (
            name
          )
        )
      `)
      .eq('created_by', user.id)
      .in('status', ['pending', 'sent'])
      .order('scheduled_time')

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    const { data: reminders, error } = await query

    if (error) {
      console.error('Error fetching reminders:', error)
      return { error: 'Failed to fetch reminders', data: null }
    }

    // Transform data to match the interface structure
    const transformedReminders = reminders?.map((reminder: any) => ({
      id: reminder.id,
      title: reminder.title,
      description: reminder.description,
      scheduled_time: reminder.scheduled_time,
      status: reminder.status,
      workspace_id: reminder.workspace_id,
      channel_id: reminder.channel_id,
      created_at: reminder.created_at,
      channels: reminder.channels?.[0] ? {
        name: reminder.channels[0].name,
        workspaces: reminder.channels[0].workspaces?.[0] ? {
          name: reminder.channels[0].workspaces[0].name
        } : undefined
      } : undefined
    })) || []

    return { data: transformedReminders, error: null }
  } catch (error) {
    console.error('Error in getReminders:', error)
    return { error: 'Failed to fetch reminders', data: null }
  }
}

// Delete a reminder
export async function deleteReminder(accessToken: string, reminderId: string) {
  const supabase = getSupabaseAdmin()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  try {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', reminderId)
      .eq('created_by', user.id) // Ensure user can only delete their own reminders

    if (error) {
      console.error('Error deleting reminder:', error)
      return { error: 'Failed to delete reminder', data: null }
    }

    return { data: { success: true }, error: null }
  } catch (error) {
    console.error('Error in deleteReminder:', error)
    return { error: 'Failed to delete reminder', data: null }
  }
}

// Check and send due reminders (this would be called by a cron job or similar)
export async function processDueReminders(accessToken: string, workspaceId: string) {
  const supabase = getSupabaseAdmin()
  
  // Verify authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }
  
  try {
    console.log('[Reminders] Checking for due reminders in workspace:', workspaceId)
    const now = new Date().toISOString()
    
    // Get all pending reminders that are due in this workspace
    const { data: dueReminders, error } = await supabase
      .from('reminders')
      .select(`
        id,
        title,
        description,
        channel_id,
        workspace_id,
        created_by,
        scheduled_time
      `)
      .eq('status', 'pending')
      .eq('workspace_id', workspaceId)
      .lte('scheduled_time', now)

    console.log('[Reminders] Found due reminders:', dueReminders?.length || 0)

    if (error) {
      console.error('Error fetching due reminders:', error)
      return { error: 'Failed to fetch due reminders', data: null }
    }

    if (!dueReminders || dueReminders.length === 0) {
      return { data: { processed: 0 }, error: null }
    }

    console.log('[Reminders] Processing', dueReminders.length, 'due reminders')

    // Send reminder messages to channels
    for (const reminder of dueReminders) {
      console.log('[Reminders] Processing reminder:', reminder.title, 'for channel:', reminder.channel_id)
      
      const reminderMessage = `🔔 **Reminder: ${reminder.title}**${reminder.description ? `\n\n${reminder.description}` : ''}`

      // Send message to the channel
      const { data: newMessage, error: messageError } = await supabase
        .from('messages')
        .insert([{
          content: reminderMessage,
          channel_id: reminder.channel_id,
          sender_id: reminder.created_by
        }])
        .select()
        .single()

      if (messageError) {
        console.error('[Reminders] Error sending reminder message:', messageError)
      } else {
        console.log('[Reminders] Reminder message sent successfully:', newMessage)
        
        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from('reminders')
          .update({ 
            status: 'sent', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', reminder.id)
          
        if (updateError) {
          console.error('[Reminders] Error updating reminder status:', updateError)
        } else {
          console.log('[Reminders] Reminder status updated to sent')
        }
      }
    }

    console.log('[Reminders] Successfully processed', dueReminders.length, 'reminders')
    return { data: { processed: dueReminders.length }, error: null }
  } catch (error) {
    console.error('Error in processDueReminders:', error)
    return { error: 'Failed to process due reminders', data: null }
  }
}