# 🎉 Emoji Reactions in Video Calls

## Overview

Emoji reactions have been added to LiveKit video calls, allowing participants to send animated emoji reactions that float up on the screen for all participants to see.

---

## ✨ Features

### Emoji Reactions
- **8 Quick Emojis**: 👍 ❤️ 😂 🎉 👏 🔥 😮 👀
- **Floating Animation**: Emojis float up and fade out over 3 seconds
- **Real-time Sync**: All participants see reactions instantly
- **Random Positioning**: Emojis appear at random positions to avoid overlap
- **Non-intrusive**: Reactions don't block video or controls

### Responsive Design
- **Mobile-first**: Works on phones, tablets, and desktops
- **Adaptive UI**: Buttons and emojis scale appropriately
- **Touch-friendly**: Large touch targets for mobile devices
- **Breakpoints**:
  - Mobile (< 640px): Smaller buttons, compact layout
  - Tablet (640px - 768px): Medium size
  - Desktop (> 768px): Full size

---

## 🎮 How to Use

### As a User:

1. **Join a video call**
2. **Look for the 😊 button** in the bottom-right corner
3. **Click/tap the button** to open emoji picker
4. **Select an emoji** from the grid
5. **Watch it float up!** ✨

### All Participants See:
- The emoji appears on everyone's screen
- Animates upward and fades out
- Position is randomized for visual variety

---

## 🛠️ Technical Implementation

### Data Channel
Uses LiveKit's `useDataChannel` hook for real-time messaging:

```typescript
const { send } = useDataChannel('emoji-reactions', (message) => {
  // Process incoming emoji reactions
  const payload = JSON.parse(new TextDecoder().decode(message.payload));
  // Display emoji with animation
});
```

### Message Format
```typescript
{
  type: 'emoji',
  emoji: '👍',
  from: 'username',
  timestamp: 1234567890
}
```

### Animation
- **Duration**: 3 seconds
- **Movement**: Floats up 150px
- **Opacity**: Fades from 0 → 1 → 0
- **Scale**: Grows then shrinks slightly
- **CSS**: Defined in `globals.css` as `@keyframes floatUp`

---

## 📱 Responsive Behavior

### Mobile (< 640px):
- Emoji button: 48px (3rem)
- Emoji picker: 4 columns, compact grid
- Emojis in picker: 48px
- "Leave" text hidden, only icon shown

### Tablet (640px - 768px):
- Emoji button: 56px (3.5rem)
- Emoji picker: 4 columns, medium spacing
- Emojis in picker: 64px

### Desktop (> 768px):
- Emoji button: 64px (4rem)
- Emoji picker: 4 columns, larger spacing
- Emojis in picker: 80px
- Full "Leave Call" text visible

---

## 🎨 UI Elements

### Emoji Picker
- **Position**: Bottom-right corner, above emoji button
- **Background**: White with shadow
- **Animation**: Slides up when opened
- **Close**: Auto-closes after selecting emoji or click button again

### Floating Emojis
- **Layer**: z-index 40 (above video, below controls)
- **Pointer Events**: Disabled (won't block clicks)
- **Size**: 3rem (48px)
- **Position**: Random 10-90% horizontally, 20-50% vertically

### Leave Button
- **Position**: Top-left corner
- **Responsive Text**: "Leave" on mobile, "Leave Call" on desktop
- **Color**: Dark red (#5A0F0F)
- **Hover**: Scales up slightly

---

## 🔧 Code Structure

### Components

**`EmojiReactions` Component:**
```typescript
- State: reactions (array of active emojis)
- State: showEmojiPicker (boolean)
- Hook: useDataChannel (send/receive)
- Hook: useRoomContext (get participant info)
- Function: sendEmoji (broadcasts emoji)
- UI: Floating emojis + picker button + picker grid
```

**`CallPage` Component:**
```typescript
- Main call page wrapper
- Handles auth, token generation, room setup
- Renders LiveKitRoom with VideoConference
- Includes EmojiReactions component
- Responsive styling throughout
```

---

## 🎯 Available Emojis

| Emoji | Meaning | Use Case |
|-------|---------|----------|
| 👍 | Thumbs up | Agree, acknowledge |
| ❤️ | Heart | Love, appreciation |
| 😂 | Laughing | Funny moment |
| 🎉 | Party | Celebration, success |
| 👏 | Clapping | Applause, congratulations |
| 🔥 | Fire | Hot take, exciting |
| 😮 | Surprised | Shock, amazement |
| 👀 | Eyes | Looking, interested |

---

## 📊 Performance

### Optimization:
- **Efficient Rendering**: Only active reactions are rendered
- **Auto-cleanup**: Reactions removed after 3 seconds
- **Lightweight Data**: Messages are < 100 bytes
- **No Persistence**: Reactions are ephemeral (not stored)

### Bandwidth:
- Each emoji: ~50-80 bytes
- Typical usage: 5-10 emojis/minute
- Impact: < 1 KB/minute per participant

---

## 🔍 Debugging

### Check Console:
```
[Emoji] Error processing reaction: ...
```

### Common Issues:

**Issue: Emojis not appearing**
- Check browser console for errors
- Verify data channel is connected
- Ensure room is properly initialized

**Issue: Emojis appearing twice**
- Each user should only see one instance
- Check for duplicate useDataChannel hooks

**Issue: Animation not working**
- Verify `globals.css` includes `floatUp` keyframes
- Check `animate-float-up` class is applied
- Clear browser cache

---

## 🚀 Future Enhancements

### Possible Features:
- [ ] Custom emoji selection
- [ ] Emoji history/stats
- [ ] Emoji reactions to specific participants
- [ ] Sound effects for emojis
- [ ] Animated GIF support
- [ ] Emoji skin tone selection
- [ ] More emojis (categories)
- [ ] Persistent reaction counts

---

## 📝 Files Modified

1. **`src/app/call/[id]/page.tsx`**
   - Added `EmojiReactions` component
   - Integrated `useDataChannel` hook
   - Added responsive styling

2. **`src/app/globals.css`**
   - Added `floatUp` animation
   - Added `slideUp` animation
   - Defined animation utility classes

3. **`tailwind.config.js`**
   - No changes needed (existing config sufficient)

---

## 🎓 How It Works

### Flow:

```
User clicks emoji button
  ↓
Emoji picker opens (8 emojis)
  ↓
User selects emoji
  ↓
sendEmoji() encodes message
  ↓
useDataChannel.send() broadcasts
  ↓
LiveKit relays to all participants
  ↓
useDataChannel callback receives
  ↓
Decode message, add to state
  ↓
React renders floating emoji
  ↓
CSS animation (3s)
  ↓
Timeout removes from state
  ↓
Cleanup complete
```

---

## 💡 Tips

### Best Practices:
- Use emojis sparingly (don't spam)
- Emojis auto-disappear (no manual cleanup needed)
- Picker auto-closes after selection (smooth UX)
- Works on all devices (responsive)

### User Experience:
- Emojis don't block video
- Non-disruptive animations
- Quick access (bottom-right button)
- Visual feedback on send

---

## 🆘 Support

### If Emojis Don't Work:

1. **Check Network**: Verify data channel is working
2. **Check Logs**: Look for errors in console
3. **Refresh**: Reload the call page
4. **Update**: Ensure latest LiveKit version
5. **Browser**: Try different browser (Chrome recommended)

### Browser Support:
- ✅ Chrome/Edge (best)
- ✅ Firefox
- ✅ Safari (iOS/macOS)
- ⚠️ Older browsers may have issues

---

**Enjoy sending reactions during your video calls!** 🎉✨
