'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function submitContactForm(name: string, email: string, message: string) {
  // Validate inputs
  if (!name || name.trim().length === 0) {
    return { error: 'Name is required', data: null }
  }

  if (!email || email.trim().length === 0) {
    return { error: 'Email is required', data: null }
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Invalid email address', data: null }
  }

  if (!message || message.trim().length === 0) {
    return { error: 'Message is required', data: null }
  }

  if (message.length > 5000) {
    return { error: 'Message exceeds maximum length (5000 characters)', data: null }
  }

  // Use public client with anon key for anonymous inserts
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('contact_messages')
    .insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      status: 'new',
    })
    .select()
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  revalidatePath('/contact')
  return { data, error: null }
}
