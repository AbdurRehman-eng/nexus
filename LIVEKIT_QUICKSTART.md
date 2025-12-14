# ⚡ LiveKit Quick Start - 5 Minutes to Working Video Calls

## ✅ What's Already Done

- ✅ LiveKit packages installed
- ✅ Token generation API created (`/api/livekit/token`)
- ✅ Call page replaced with LiveKit components
- ✅ Environment variables added (need your credentials)

---

## 🚀 Quick Start (3 Steps)

### Step 1: Get LiveKit Cloud Credentials (2 minutes)

1. **Go to:** https://cloud.livekit.io
2. **Sign up** for free (no credit card required)
3. **Create a project** (click "+ New Project")
4. **Copy credentials** from the dashboard:
   - API Key (looks like: `APIxxxxxxxxxxxxxx`)
   - API Secret (looks like: `xxxxxxxxxxxxxxxxxxxxxxxx`)
   - WebSocket URL (looks like: `wss://your-project-abc123.livekit.cloud`)

---

### Step 2: Update Environment Variables (1 minute)

Open `d:\Projects\nexus\.env.local` and replace these lines:

**Replace:**
```env
LIVEKIT_API_KEY=your_livekit_api_key_here
LIVEKIT_API_SECRET=your_livekit_api_secret_here
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
```

**With your actual credentials:**
```env
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project-abc123.livekit.cloud
```

---

### Step 3: Restart Dev Server (1 minute)

**In your terminal:**
```bash
# Stop the current server (Ctrl+C)
# Then start fresh:
pnpm dev
```

---

## 🎉 That's It! Test Now:

1. **Browser A:** Login → Join workspace → Click video call button
2. **Browser B:** Login (different account) → Same workspace → Click video call button
3. **Both users should see each other immediately!** ✅

---

## 📋 What You Should See

### User A (First):
```
1. Click video call button
2. Browser asks for camera/mic permissions → Click "Allow"
3. See your own video
4. Wait for User B...
```

### User B (Joins):
```
1. Click video call button
2. Browser asks for permissions → Click "Allow"
3. See your own video
4. See User A's video immediately! ✅
```

### Both Users:
```
- See each other's video ✅
- Hear each other's audio ✅
- Controls work (mute, camera, screen share) ✅
- No debugging needed! ✅
```

---

## 🎛️ Built-in Features

**Controls (bottom toolbar):**
- 🎤 Microphone mute/unmute
- 📹 Camera on/off
- 🖥️ Screen sharing
- ⚙️ Settings (select devices)
- 📞 Leave call

**Automatic Features:**
- 🔊 Active speaker highlighting
- 📊 Network quality indicators
- 🔄 Automatic reconnection
- 📱 Responsive layout
- 🎨 Professional UI

---

## ❌ Troubleshooting

### "LiveKit credentials not configured"

**Solution:**
- Check that you updated `.env.local` with real credentials
- Remove `your_livekit_api_key_here` placeholders
- Restart dev server

### "Failed to get access token"

**Solution:**
- Check `/api/livekit/token` route exists
- Verify credentials in `.env.local` are correct
- Check browser console and terminal for errors

### Can't see other users

**Check:**
- Using different accounts? (Can't join same user twice)
- Same workspace?
- Granted camera/mic permissions?
- Check browser console for errors

### No audio/video

**Check:**
- Browser permissions granted?
- Correct camera/mic selected in settings?
- Camera/mic not used by another app?

---

## 🎯 Free Tier Limits

**LiveKit Cloud Free Tier:**
- **10,000 participant minutes/month**
- Perfect for testing and small teams
- No credit card required

**Example usage:**
- 2 users × 30 min/day × 20 days = 1,200 minutes ✅
- 5 users × 1 hour/day × 10 days = 3,000 minutes ✅
- 10 users × 2 hours/day × 20 days = 24,000 minutes ❌ (upgrade needed)

---

## 🆘 Need Help?

### LiveKit Support:
- **Docs:** https://docs.livekit.io
- **Community:** https://livekit.io/community
- **Examples:** https://github.com/livekit-examples

### Common Issues:
- **"Invalid token"** → Check API key/secret in `.env.local`
- **"Cannot connect"** → Check WebSocket URL format (must be `wss://`)
- **"Room error"** → Check room name is valid (no special characters)

---

## 📖 Next Steps

### You're Ready!
1. Get LiveKit credentials (2 min)
2. Update `.env.local` (1 min)
3. Restart server (1 min)
4. Test calls ✅

### Later:
- Explore LiveKit dashboard
- Try screen sharing
- Test with more users
- Customize UI if needed

---

**That's all! Enjoy production-ready video calls!** 🎉📹✨
