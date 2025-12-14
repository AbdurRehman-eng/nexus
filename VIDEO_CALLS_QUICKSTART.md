# 🎥 Video Calls - Quick Start (3 Minutes)

## Step 1: Run Database Migration (1 min)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Copy/paste contents from: `supabase/create_calls_table.sql`
4. Click **"Run"**
5. ✅ Tables created!

## Step 2: Enable Realtime (1 min)

1. Go to **Database** → **Replication** in Supabase
2. Find and enable these tables:
   - ✅ `calls`
   - ✅ `call_participants`
3. Click **"Save"**

## Step 3: Test It! (1 min)

1. Start dev server: `npm run dev`
2. Open chat → Click 📞 call icon
3. Grant camera/mic permissions
4. Open another browser/incognito:
   - Login as different user
   - Join same workspace
   - Click call icon
5. **You should see each other!** 🎉

---

## ✨ Features

- ✅ Real-time video & audio (WebRTC P2P)
- ✅ Screen sharing
- ✅ Mute/camera controls
- ✅ Multiple participants
- ✅ Auto-cleanup
- ✅ Mobile responsive

---

## 🎯 What Was Implemented

**Backend:**
- `src/lib/webrtc.ts` - WebRTC service (P2P connections)
- `src/app/actions/calls.ts` - Call management
- `supabase/create_calls_table.sql` - Database

**Frontend:**
- `src/app/call/[id]/page.tsx` - Complete video call UI

**Features:**
- Real camera/microphone access
- Peer-to-peer video streaming
- Screen sharing
- Supabase Realtime signaling
- Media controls (mute, camera, screen share)

---

## 📱 How to Use

### Start a Call:
1. Click 📞 in chat header
2. Grant permissions
3. Wait for others to join

### Join a Call:
1. Click 📞 (shows "Join active call")
2. Grant permissions
3. Instantly connect!

### Controls:
- 🎤 **Microphone:** Click to mute/unmute
- 📹 **Camera:** Click to turn on/off
- 🖥️ **Screen Share:** Click to share screen
- 📞 **End Call:** Red button to leave

---

## 🐛 Troubleshooting

**"Can't access camera/microphone"**
→ Click lock icon in address bar → Allow permissions

**"Can't see other users"**
→ Ensure they granted permissions too

**"Screen share not working"**
→ Desktop only, select correct window

---

## 📚 Documentation

See `VIDEO_CALLS_COMPLETE.md` for:
- Complete technical documentation
- Architecture diagrams
- Troubleshooting guide
- Code examples

---

**That's it! Video calls are ready! 🎉🎥**
