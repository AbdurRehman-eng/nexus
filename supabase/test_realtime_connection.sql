-- TEST REALTIME CONNECTION
-- Insert a test message to see if realtime events are triggered

-- First, get a channel ID to test with (replace with actual channel ID)
-- You can find this in your browser console or database
-- SELECT id, name FROM channels LIMIT 1;

-- Insert a test message (replace 'your-channel-id' and 'your-user-id')
-- INSERT INTO messages (channel_id, sender_id, content)
-- VALUES ('your-channel-id', 'your-user-id', 'Test realtime message ' || NOW());

-- If realtime is working, you should see this message appear instantly
-- in the chat UI without refreshing the page

-- To test from SQL:
-- 1. Replace the IDs above with real ones
-- 2. Run the INSERT statement
-- 3. Check if the message appears in realtime in your chat UI

-- Alternative: Use the browser test script in test_realtime.js