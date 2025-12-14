'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

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

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  // Code
  'text/javascript', 'text/html', 'text/css',
  'application/json',
]

export async function uploadFile(
  accessToken: string,
  messageId: string,
  file: { name: string; type: string; size: number; arrayBuffer: ArrayBuffer }
) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { error: 'File size exceeds 10MB limit', data: null }
  }

  // Validate file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { error: 'File type not allowed', data: null }
  }

  // Verify message exists and user has access
  const { data: message } = await supabase
    .from('messages')
    .select('channel_id')
    .eq('id', messageId)
    .single()

  if (!message) {
    return { error: 'Message not found', data: null }
  }

  // Verify user is a channel member
  const { data: member } = await supabase
    .from('channel_members')
    .select('*')
    .eq('channel_id', message.channel_id)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return { error: 'Not a channel member', data: null }
  }

  // Generate unique file path
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `${message.channel_id}/${messageId}/${fileName}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('message-attachments')
    .upload(filePath, file.arrayBuffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    console.error('[uploadFile] Storage error:', uploadError)
    return { error: `Upload failed: ${uploadError.message}`, data: null }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('message-attachments')
    .getPublicUrl(filePath)

  // Save attachment metadata to database
  const { data: attachment, error: dbError } = await supabase
    .from('message_attachments')
    .insert({
      message_id: messageId,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: filePath,
      uploaded_by: user.id,
    })
    .select()
    .single()

  if (dbError) {
    // Clean up uploaded file if database insert fails
    await supabase.storage
      .from('message-attachments')
      .remove([filePath])
    
    return { error: dbError.message, data: null }
  }

  revalidatePath('/chat')
  return { 
    data: {
      ...attachment,
      url: publicUrl
    }, 
    error: null 
  }
}

export async function getMessageAttachments(accessToken: string, messageId: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  const { data: attachments, error } = await supabase
    .from('message_attachments')
    .select('*')
    .eq('message_id', messageId)
    .order('created_at', { ascending: true })

  if (error) {
    return { error: error.message, data: null }
  }

  // Add public URLs
  const attachmentsWithUrls = attachments?.map(att => {
    const { data: { publicUrl } } = supabase.storage
      .from('message-attachments')
      .getPublicUrl(att.storage_path)
    
    return {
      ...att,
      url: publicUrl
    }
  })

  return { data: attachmentsWithUrls || [], error: null }
}

export async function deleteAttachment(accessToken: string, attachmentId: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  // Get attachment info
  const { data: attachment } = await supabase
    .from('message_attachments')
    .select('*')
    .eq('id', attachmentId)
    .single()

  if (!attachment) {
    return { error: 'Attachment not found', data: null }
  }

  // Verify user owns the attachment
  if (attachment.uploaded_by !== user.id) {
    return { error: 'Not authorized to delete this attachment', data: null }
  }

  // Delete from storage
  await supabase.storage
    .from('message-attachments')
    .remove([attachment.storage_path])

  // Delete from database
  const { error } = await supabase
    .from('message_attachments')
    .delete()
    .eq('id', attachmentId)

  if (error) {
    return { error: error.message, data: null }
  }

  revalidatePath('/chat')
  return { data: null, error: null }
}
