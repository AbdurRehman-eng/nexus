# 🎥 LiveKit Video Call Setup Guide

## Overview

We've replaced the custom WebRTC implementation with **LiveKit** - a production-ready, open-source platform for real-time video and audio.

### Why LiveKit?

✅ **Reliable** - Production-tested by thousands of apps
✅ **Simple** - No complex signaling or peer connection management
✅ **Scalable** - Handles 100+ participants in a room
✅ **Feature-Rich** - Screen sharing, reactions, chat, recording built-in
✅ **Well-Maintained** - Active development and support

---

## Setup Instructions

### Step 1: Get LiveKit Credentials

#### **Option A: LiveKit Cloud (Recommended - Free Tier)**

1. Go to https://cloud.livekit.io
2. Sign up for a free account
3. Create a new project
4. Copy your credentials:
   - **API Key** (e.g., `APIxxxxxxxxxxxxxxx`)
   - **API Secret** (e.g., `xxxxxxxxxxxxxxxxxxxxx`)
   - **WebSocket URL** (e.g., `wss://your-project-abc123.livekit.cloud`)

#### **Option B: Self-Hosted (Advanced)**

1. Install LiveKit server:
   ```bash
   # macOS
   brew install livekit
   
   # Linux
   curl -sSL https://get.livekit.io | bash
   
   # Windows
   # Download from: https://github.com/livekit/livekit/releases
   ```

2. Start server in dev mode:
   ```bash
   livekit-server --dev
   ```

3. Use dev credentials:
   - API Key: `devkey`
   - API Secret: `secret`
   - WebSocket URL: `ws://localhost:7880`

---

### Step 2: Update Environment Variables

Open `.env.local` and replace the placeholder values:

```env
# LiveKit Configuration
LIVEKIT_API_KEY=your_actual_api_key_here
LIVEKIT_API_SECRET=your_actual_api_secret_here
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
```

**Important:** 
- Replace `your_actual_api_key_here` with your actual API key
- Replace `your_actual_api_secret_here` with your actual API secret
- Replace `wss://your-project.livekit.cloud` with your actual WebSocket URL
- The `NEXT_PUBLIC_` prefix on the URL is required for client-side access

---

### Step 3: Restart Development Server

After updating `.env.local`, you **must** restart your dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
# or
pnpm dev
```

---

### Step 4: Test the Video Call

1. **User A:** Create or join a workspace, click the video call button
2. **User B:** Join the same workspace, click the video call button
3. **Both users should see each other immediately!** ✅

---

## Features

### Built-in Features (No Code Required)

✅ **Video & Audio** - Automatic camera and microphone access
✅ **Screen Sharing** - Click button to share screen
✅ **Participant Grid** - Automatic layout for multiple users
✅ **Speaker Detection** - Highlights active speaker
✅ **Connection Quality** - Shows network status indicators
✅ **Adaptive Bitrate** - Adjusts quality based on network
✅ **Echo Cancellation** - Built-in audio processing
✅ **Noise Suppression** - Automatic background noise reduction

### UI Controls

- **Mute/Unmute Microphone**
- **Enable/Disable Camera**
- **Share Screen**
- **Leave Call**
- **Settings** (select camera/microphone)

---

## Architecture

### How It Works

```
┌─────────────┐
│  Browser A  │
│   (User A)  │
└──────┬──────┘
       │
       │ WebSocket
       ↓
┌─────────────────┐
│  LiveKit Cloud  │  ← Handles all signaling, routing, NAT traversal
│   (or Server)   │
└─────────────────┘
       ↑
       │ WebSocket
       │
┌──────┴──────┐
│  Browser B  │
│   (User B)  │
└─────────────┘
```

### Token Flow

```
Client Request:
├─ Browser → Next.js API Route (/api/livekit/token)
├─ API Route → Generate JWT token (using API key/secret)
└─ Token → Browser

Client Connection:
├─ Browser → Connect to LiveKit server (using token)
├─ LiveKit → Validates token
└─ Connection → Established
```

---

## Files Changed

### New Files

1. **`src/app/api/livekit/token/route.ts`**
   - API endpoint to generate LiveKit access tokens
   - Uses `livekit-server-sdk` to create JWT tokens
   - Grants permissions for room join, publish, subscribe

2. **Updated `.env.local`**
   - Added LiveKit credentials (API key, secret, URL)
   - You need to fill in your actual credentials

### Modified Files

1. **`src/app/call/[id]/page.tsx`**
   - Completely replaced custom WebRTC implementation
   - Now uses LiveKit's `<LiveKitRoom>` and `<VideoConference>` components
   - Much simpler: ~150 lines vs 800+ lines before!

### Removed Dependencies

The old custom implementation in `src/lib/webrtc.ts` is no longer used for calls, but kept for reference.

---

## Troubleshooting

### Issue: "LiveKit credentials not configured"

**Solution:** 
- Check that you've added `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` to `.env.local`
- Restart the dev server after adding env vars

### Issue: "Failed to get access token"

**Solution:**
- Check that the API route is accessible: http://localhost:3000/api/livekit/token?roomName=test&participantName=test
- Check server console for errors
- Verify your LiveKit credentials are correct

### Issue: "LiveKit URL is not configured"

**Solution:**
- Check that you've added `NEXT_PUBLIC_LIVEKIT_URL` to `.env.local`
- Must start with `wss://` (or `ws://` for local dev)
- Restart the dev server

### Issue: Can't see other participants

**Check:**
1. Are both users in the same room? (Same call ID)
2. Are you using different accounts? (Not the same user twice)
3. Check browser console for LiveKit errors
4. Verify LiveKit server is accessible from your network

### Issue: No video/audio permissions

**Solution:**
- Browser needs camera/microphone permissions
- Check browser address bar for permission prompt
- Grant permissions and refresh

---

## Benefits vs Custom WebRTC

### Before (Custom WebRTC):

❌ Complex signaling logic
❌ Race conditions with React state
❌ Manual peer connection management
❌ ICE candidate queueing
❌ Offer collision handling
❌ Browser compatibility issues
❌ NAT traversal problems
❌ 800+ lines of code
❌ Hard to debug

### After (LiveKit):

✅ Zero signaling code
✅ No race conditions
✅ Automatic connection management
✅ Built-in ICE handling
✅ No collision issues
✅ Works in all browsers
✅ Enterprise-grade NAT traversal
✅ ~150 lines of code
✅ Clear error messages

---

## Advanced Configuration

### Custom UI Styling

LiveKit components are customizable. You can override styles:

```typescript
<LiveKitRoom
  token={token}
  serverUrl={livekitUrl}
  data-lk-theme="default" // or create custom theme
  style={{ height: '100%' }}
>
  <VideoConference />
</LiveKitRoom>
```

### Room Events

You can listen to room events:

```typescript
<LiveKitRoom
  onConnected={() => console.log('Connected!')}
  onDisconnected={() => console.log('Disconnected!')}
  onError={(error) => console.error('Error:', error)}
>
```

### Custom Controls

Replace `<VideoConference>` with custom components:

```typescript
import { 
  ParticipantTile, 
  ControlBar, 
  useTracks,
  useParticipants 
} from '@livekit/components-react';

// Build your own UI with LiveKit hooks
```

---

## Pricing

### LiveKit Cloud (Recommended)

**Free Tier:**
- 10,000 participant minutes/month
- Perfect for testing and small apps
- No credit card required

**Paid Plans:**
- $99/month for 100,000 minutes
- Enterprise plans available
- Pay-as-you-go options

### Self-Hosted (Free)

- Completely free
- Requires server infrastructure
- You manage scaling and updates
- Open source (Apache 2.0 license)

---

## Next Steps

1. **Get LiveKit credentials** from https://cloud.livekit.io
2. **Update `.env.local`** with your credentials
3. **Restart dev server**
4. **Test the call!**

---

## Documentation Links

- LiveKit Docs: https://docs.livekit.io
- React Components: https://docs.livekit.io/reference/components/react
- Server SDK: https://docs.livekit.io/reference/server-sdks
- Cloud Dashboard: https://cloud.livekit.io

---

**Enjoy reliable, production-ready video calls!** 🎉📹✨
