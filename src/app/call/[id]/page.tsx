'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  LiveKitRoom, 
  VideoConference, 
  RoomAudioRenderer,
  useDataChannel,
  useRoomContext
} from '@livekit/components-react';
import '@livekit/components-styles';
import { getActiveCall, createCall, joinCall, leaveCall } from '@/app/actions/calls';
import toast from 'react-hot-toast';

// Emoji Reaction Component
function EmojiReactions() {
  const [reactions, setReactions] = useState<Array<{ id: string; emoji: string; from: string; x: number; y: number }>>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const room = useRoomContext();

  // Listen for emoji reactions via data channel
  const handleEmojiMessage = useCallback((message: any) => {
    try {
      const payload = JSON.parse(new TextDecoder().decode(message.payload));
      if (payload.type === 'emoji') {
        const reactionId = `${payload.from}-${Date.now()}-${Math.random()}`;
        setReactions(prev => [...prev, {
          id: reactionId,
          emoji: payload.emoji,
          from: payload.from,
          x: Math.random() * 80 + 10, // Random x position between 10-90%
          y: 20 + Math.random() * 30 // Start from 20-50% height
        }]);

        // Remove reaction after animation
        setTimeout(() => {
          setReactions(prev => prev.filter(r => r.id !== reactionId));
        }, 3000);
      }
    } catch (error) {
      console.error('[Emoji] Error processing reaction:', error);
    }
  }, []);

  const { send } = useDataChannel('emoji-reactions', handleEmojiMessage);

  const sendEmoji = useCallback((emoji: string) => {
    if (!send) return;
    
    const payload = JSON.stringify({
      type: 'emoji',
      emoji,
      from: room?.localParticipant?.identity || 'Unknown',
      timestamp: Date.now()
    });

    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    send(data, { reliable: true } as any);
    setShowEmojiPicker(false);
  }, [send, room]);

  const emojis = ['👍', '❤️', '😂', '🎉', '👏', '🔥', '😮', '👀'];

  return (
    <>
      {/* Floating Emoji Reactions */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {reactions.map((reaction) => (
          <div
            key={reaction.id}
            className="absolute animate-float-up"
            style={{
              left: `${reaction.x}%`,
              top: `${reaction.y}%`,
              fontSize: '3rem',
            }}
          >
            {reaction.emoji}
          </div>
        ))}
      </div>

      {/* Emoji Picker Button */}
      <div className="absolute bottom-20 right-4 sm:bottom-24 sm:right-6 md:bottom-28 md:right-8 z-50">
        {showEmojiPicker && (
          <div className="mb-2 bg-white rounded-2xl shadow-2xl p-3 sm:p-4 grid grid-cols-4 gap-2 sm:gap-3 animate-slide-up">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendEmoji(emoji)}
                className="text-3xl sm:text-4xl md:text-5xl hover:scale-125 transition-transform duration-200 p-2 hover:bg-gray-100 rounded-lg"
                title={`Send ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white hover:bg-gray-100 rounded-full shadow-lg flex items-center justify-center text-2xl sm:text-3xl transition-all duration-200 hover:scale-110"
          title="Send reaction"
        >
          😊
        </button>
      </div>
    </>
  );
}

export default function CallPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;

  const [token, setToken] = useState('');
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    initializeCall();

    return () => {
      // Cleanup when leaving
      handleLeaveCall();
    };
  }, [workspaceId]);

  const initializeCall = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Get or create active call
      let activeCall = await getActiveCall(session.access_token, workspaceId);
      
      if (activeCall.error) {
        throw new Error(activeCall.error);
      }
      
      let callId: string;
      
      if (activeCall.data) {
        callId = activeCall.data.id;
        const joinResult = await joinCall(session.access_token, callId);
        if (joinResult.error) {
          throw new Error(joinResult.error);
        }
      } else {
        const newCall = await createCall(session.access_token, workspaceId);
        if (newCall.error) {
          throw new Error(newCall.error);
        }
        callId = newCall.data!.id;
      }

      // Get user profile for display name
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, email')
        .eq('id', session.user.id)
        .single();

      const displayName = profile?.username || profile?.email?.split('@')[0] || 'User';
      setUserName(displayName);

      // Generate LiveKit token
      const response = await fetch(
        `/api/livekit/token?roomName=${encodeURIComponent(callId)}&participantName=${encodeURIComponent(displayName)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get access token');
      }

      const data = await response.json();
      setToken(data.token);
      setRoomName(callId);
      setLoading(false);
      
      toast.success('Joined call successfully!');
    } catch (err: any) {
      console.error('[Call] Error initializing:', err);
      setError(err.message || 'Failed to initialize call');
      setLoading(false);
      toast.error(err.message || 'Failed to join call');
    }
  };

  const handleLeaveCall = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && roomName) {
        await leaveCall(session.access_token, roomName);
      }
    } catch (error) {
      console.error('[Call] Error leaving call:', error);
    }
  };

  const handleDisconnect = () => {
    handleLeaveCall();
    router.push(`/chat/${workspaceId}`);
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Joining call...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Unable to Join Call</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push(`/chat/${workspaceId}`)}
            className="px-4 sm:px-6 py-2 bg-dark-red text-white rounded-lg hover:bg-maroon font-semibold text-sm sm:text-base"
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!livekitUrl) {
    return (
      <div className="h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Configuration Error</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            LiveKit URL is not configured. Please add NEXT_PUBLIC_LIVEKIT_URL to your .env.local file.
          </p>
          <button
            onClick={() => router.push(`/chat/${workspaceId}`)}
            className="px-4 sm:px-6 py-2 bg-dark-red text-white rounded-lg hover:bg-maroon font-semibold text-sm sm:text-base"
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black overflow-hidden">
      <LiveKitRoom
        token={token}
        serverUrl={livekitUrl}
        connect={true}
        video={true}
        audio={true}
        onDisconnected={handleDisconnect}
        style={{ height: '100%', width: '100%' }}
        data-lk-theme="default"
        className="relative"
      >
        {/* Video Conference UI with controls */}
        <div className="h-full w-full">
          <VideoConference />
        </div>
        
        {/* Audio Renderer for remote participants */}
        <RoomAudioRenderer />
        
        {/* Emoji Reactions */}
        <EmojiReactions />
        
        {/* Custom Leave Button Overlay */}
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-50">
          <button
            onClick={handleDisconnect}
            className="px-3 py-2 sm:px-4 sm:py-2 bg-dark-red text-white rounded-lg hover:bg-maroon font-semibold flex items-center gap-1 sm:gap-2 text-sm sm:text-base shadow-lg transition-all duration-200 hover:scale-105"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:inline">Leave Call</span>
            <span className="sm:hidden">Leave</span>
          </button>
        </div>
      </LiveKitRoom>
    </div>
  );
}
