// Test script to verify realtime is working
// Run this in the browser console while in the chat

// 1. First, let's check if we can access the supabase client
console.log('Testing realtime connection...');

// Get the current session
const { data: session } = await window.supabase?.auth.getSession();
if (!session) {
  console.error('No session found. Please log in first.');
} else {
  console.log('Session found:', session.user.id);

  // Test inserting a message directly
  const testMessage = {
    channel_id: 'your-channel-id-here', // Replace with actual channel ID
    sender_id: session.user.id,
    content: `Test message at ${new Date().toISOString()}`,
  };

  console.log('Inserting test message:', testMessage);

  const { data, error } = await window.supabase
    .from('messages')
    .insert(testMessage)
    .select()
    .single();

  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Insert successful:', data);
  }
}

// To run this script:
// 1. Open the chat page in your browser
// 2. Open developer tools (F12)
// 3. Go to Console tab
// 4. Copy and paste this entire script
// 5. Replace 'your-channel-id-here' with an actual channel ID from your database
// 6. Press Enter to run
// 7. Check if the message appears in realtime