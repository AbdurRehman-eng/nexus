# 🔍 Video Call Debug Guide

## Changes Made

### **1. Always Broadcast user-joined**
**Before:** Only broadcast if there are other participants
**After:** ALWAYS broadcast, even when alone

**Why:** Timing issue - if User B joins while User A is setting up their listener, User A might miss User B's join and never know to create an offer.

### **2. Listen for INSERT Events**
Added postgres_changes listener for INSERT events on call_participants table to detect when new users join via the database.

### **3. Enhanced Logging**
Added comprehensive logging with emoji indicators to make debugging easier:
- 📢 Broadcasting
- 📥 Receiving
- 📤 Sending
- ✅ Success
- ❌ Error
- ⏳ Waiting
- ⏭️ Skipping
- 📹 Video stream
- 🧊 ICE candidate

---

## Expected Console Flow

### **User A (Joins First)**

```
[Call] Local stream obtained: MediaStream {...}
[Call] Video tracks: [...]
[Call] Audio tracks: [...]
[Call] Successfully subscribed to call channel
[Call] Found 0 existing participants (excluding self)
[Call] 📢 Broadcasting user-joined announcement
[Call] My details: { id: 'aaa...', name: 'Alice', otherParticipantsCount: 0 }
[Call] Setting up local camera video
```

**What's happening:**
- User A joins
- Gets local media
- No other participants
- Broadcasts user-joined anyway
- Sets up local video

---

### **User B (Joins Second)**

```
[Call] Local stream obtained: MediaStream {...}
[Call] Video tracks: [...]
[Call] Audio tracks: [...]
[Call] Successfully subscribed to call channel
[Call] Found 1 existing participants (excluding self)
[Call] Waiting for offer from existing participant: aaa...
[Call] 📢 Broadcasting user-joined announcement
[Call] My details: { id: 'bbb...', name: 'Bob', otherParticipantsCount: 1 }
[Call] Setting up local camera video
```

**What's happening:**
- User B joins
- Finds User A already there
- User A's ID < User B's ID → waits for offer
- Broadcasts user-joined

---

### **User A Receives User B's user-joined**

```
[Call] ========================================
[Call] Received signal: user-joined from: bbb...
[Call] My ID: aaa...
[Call] Current participants: ['aaa...']
[Call] Active connections: []
[Call] ========================================
[Call] Adding new participant: Bob
[Call] Comparing IDs: {
  myId: 'aaa...',
  theirId: 'bbb...',
  shouldCreateOffer: true,
  comparison: 'aaa... < bbb... = true'
}
[Call] ✅ I have smaller ID, creating offer to: bbb...
[Call] 📤 Sending offer signal to: bbb...
[Call] ✅ Offer created and sent successfully
```

**What's happening:**
- User A receives User B's broadcast
- Checks: no existing connection
- Adds User B to participants
- Compares IDs: User A < User B → creates offer
- Sends offer to User B

---

### **User B Receives Offer from User A**

```
[Call] ========================================
[Call] Received signal: offer from: aaa...
[Call] My ID: bbb...
[Call] Current participants: ['aaa...', 'bbb...']
[Call] Active connections: []
[Call] ========================================
[Call] 📥 Received offer - to: bbb..., from: aaa..., myId: bbb...
[Call] ✅ Offer is for me! Creating answer...
[Call] 📤 Sending answer to: aaa...
[Call] ✅ Answer created and sent successfully
```

**What's happening:**
- User B receives offer
- Checks: offer is for me
- Creates peer connection
- Creates answer
- Sends answer back

---

### **User A Receives Answer from User B**

```
[Call] ========================================
[Call] Received signal: answer from: bbb...
[Call] My ID: aaa...
[Call] Current participants: ['aaa...', 'bbb...']
[Call] Active connections: ['bbb...']
[Call] ========================================
[Call] 📥 Received answer - to: aaa..., from: bbb..., myId: aaa...
[Call] ✅ Answer is for me! Processing...
[Call] ✅ Answer processed successfully from: bbb...
```

**What's happening:**
- User A receives answer
- Sets remote description
- Connection in progress

---

### **ICE Candidates Exchange**

Both users should see:
```
[Call] 🧊 Received ICE candidate from: xxx...
[Call] 🧊 Received ICE candidate from: xxx...
[Call] 🧊 Received ICE candidate from: xxx...
```

Multiple ICE candidates will be exchanged as the browsers negotiate the best connection path.

---

### **Stream Received**

Both users should eventually see:
```
[Call] 📹 Received stream from: xxx...
[Call] Stream has 1 video tracks and 1 audio tracks
[Call] ✅ Video element found, attaching stream
[WebRTC] Connection state with xxx...: connected
```

**What's happening:**
- Remote stream received
- Stream attached to video element
- Connection established!

---

## Troubleshooting

### **Problem: "No other participants yet" on both sides**

**Symptoms:**
```
User A: [Call] My details: { ..., otherParticipantsCount: 0 }
User B: [Call] My details: { ..., otherParticipantsCount: 0 }
```

**Cause:** Both users joined at almost exactly the same time

**Solution:** One user should leave and rejoin

---

### **Problem: "user-joined" never received**

**Symptoms:**
```
User A: [Call] 📢 Broadcasting user-joined
User B: (no "Received signal: user-joined" log)
```

**Possible causes:**
1. **Channel subscription issue** - Check for "Successfully subscribed"
2. **Supabase Realtime not working** - Check network tab
3. **User blocked themselves** - Check `if (payload.from === userId)` line

**Debug:**
- Check if both users see "Successfully subscribed to call channel"
- Check Supabase dashboard for Realtime activity
- Try refreshing both pages

---

### **Problem: Offer created but never received**

**Symptoms:**
```
User A: [Call] 📤 Sending offer signal to: bbb...
User B: (no "Received offer" log)
```

**Possible causes:**
1. **Channel broadcast failed**
2. **payload.to mismatch**

**Debug:**
- Check if User IDs match exactly
- Check network tab for broadcast requests
- Check if `payload.to === userId` in User B's console

---

### **Problem: Video element not found**

**Symptoms:**
```
[Call] ❌ No video element found for participant: xxx...
[Call] Available video refs: []
```

**Cause:** React hasn't rendered the video element yet when stream arrives

**Solution:** The ref callback should handle this automatically, but if not:
1. Check if participant is in `participants` array
2. Check if video element renders in the DOM
3. Try toggling camera off/on

---

### **Problem: Stream has 0 tracks**

**Symptoms:**
```
[Call] 📹 Received stream from: xxx...
[Call] Stream has 0 video tracks and 0 audio tracks
```

**Cause:** Other user's camera/microphone is off or permissions denied

**Solution:**
- Other user should grant camera/microphone permissions
- Other user should toggle camera/mic on
- Check browser console for permission errors

---

### **Problem: Connection state "failed"**

**Symptoms:**
```
[WebRTC] Connection state with xxx...: failed
```

**Possible causes:**
1. **Firewall blocking WebRTC** - Corporate network/VPN
2. **NAT traversal failure** - Need TURN server
3. **ICE candidate gathering failed**

**Solution:**
- Try on different network
- Disable VPN
- Add TURN servers to ICE configuration (requires setup)

---

## What to Share When Reporting Issues

When reporting that video/audio doesn't work, please share:

### **From Both Users:**

1. **Complete console logs** from page load to "connection established" or error
2. **User IDs** - Check the logs for "My ID: xxx"
3. **Participant count** - Check "otherParticipantsCount"
4. **Active connections** - Check "Active connections: []"
5. **Any error messages** marked with ❌

### **Specific Questions to Answer:**

1. Did User A see "📢 Broadcasting user-joined"? ✅/❌
2. Did User B see "Received signal: user-joined from A"? ✅/❌
3. Did User A see "✅ I have smaller ID, creating offer"? ✅/❌
4. Did User B see "📥 Received offer"? ✅/❌
5. Did User B see "📤 Sending answer"? ✅/❌
6. Did User A see "📥 Received answer"? ✅/❌
7. Did either user see "📹 Received stream"? ✅/❌
8. Did either user see "❌" errors? If yes, what were they?

---

## Testing Checklist

### **Setup:**
- [ ] Two separate browser windows (or incognito + normal)
- [ ] Two different user accounts
- [ ] Both accounts are workspace members
- [ ] Browser console open in both windows
- [ ] Camera/microphone permissions granted

### **User A (Joins First):**
- [ ] Sees own video
- [ ] Console: "Successfully subscribed"
- [ ] Console: "Found 0 existing participants"
- [ ] Console: "📢 Broadcasting user-joined"
- [ ] No errors

### **User B (Joins Second):**
- [ ] Sees own video
- [ ] Console: "Successfully subscribed"
- [ ] Console: "Found 1 existing participants"
- [ ] Console: "⏳ Waiting for offer" OR "✅ Creating offer" (depending on ID)
- [ ] Console: "📢 Broadcasting user-joined"
- [ ] No errors

### **User A (After User B joins):**
- [ ] Console: "Received signal: user-joined from B"
- [ ] Console: "Adding new participant: [Bob's name]"
- [ ] Console: Either "✅ Creating offer" OR "⏳ Waiting for offer"
- [ ] If creating: "📤 Sending offer signal"
- [ ] Console: "📥 Received answer" (later)
- [ ] Console: "📹 Received stream from B"
- [ ] Sees User B's video tile appear
- [ ] User B's video plays

### **User B (After Connection):**
- [ ] Console: "📥 Received offer" (if waiting for offer)
- [ ] Console: "📤 Sending answer"
- [ ] Console: "📹 Received stream from A"
- [ ] Sees User A's video tile appear
- [ ] User A's video plays

### **Both Users:**
- [ ] Can see each other's video
- [ ] Can hear each other's audio
- [ ] Controls work (mute, camera toggle)
- [ ] Emojis show correct names
- [ ] No "❌" errors in console

---

## Success Indicators

You'll know it's working when you see:

✅ Both users broadcast user-joined
✅ User-joined signals are received
✅ Offer created by user with smaller ID
✅ Offer received by other user
✅ Answer sent back
✅ Answer received
✅ Multiple ICE candidates exchanged
✅ "📹 Received stream" on both sides
✅ "Connection state: connected"
✅ Video tiles showing both users

---

**With this extensive logging, we can now pinpoint exactly where the signaling breaks down!** 🎉🔍

