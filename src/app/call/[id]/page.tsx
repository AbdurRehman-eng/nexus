'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WebRTCService, SignalData, Participant, isWebRTCSupported } from '@/lib/webrtc';
import { 
  getActiveCall, 
  createCall, 
  joinCall, 
  leaveCall, 
  updateParticipantMedia, 
  getCallParticipants 
} from '@/app/actions/calls';
import toast from 'react-hot-toast';

export default function CallPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;

  const [accessToken, setAccessToken] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [callId, setCallId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [emojiReactions, setEmojiReactions] = useState<Array<{
    id: string;
    emoji: string;
    userName: string;
    x: number;
    y: number;
  }>>([]);

  const webrtcRef = useRef<WebRTCService | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const supabaseChannelRef = useRef<any>(null);

  // Initialize call
  useEffect(() => {
    checkAuthAndInitialize();
    
    return () => {
      cleanup();
    };
  }, [workspaceId]);

  // Handle local stream when it's available
  useEffect(() => {
    console.log('[Call] useEffect triggered - localStream:', localStream, 'videoRef:', localVideoRef.current);
    
    if (localStream && localVideoRef.current) {
      console.log('[Call] Setting local stream on video element');
      localVideoRef.current.srcObject = localStream;
      
      // Force play
      const playPromise = localVideoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('[Call] Video playing successfully!');
          })
          .catch(err => {
            console.error('[Call] Error playing local video:', err);
          });
      }
    } else {
      if (!localStream) console.log('[Call] Waiting for local stream...');
      if (!localVideoRef.current) console.log('[Call] Video ref not ready yet...');
    }
  }, [localStream]);

  const checkAuthAndInitialize = async () => {
    // Check WebRTC support
    if (!isWebRTCSupported()) {
      setError('Your browser does not support video calls. Please use a modern browser.');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    setAccessToken(session.access_token);
    setCurrentUserId(session.user.id);
    
    await initializeCall(session.access_token, session.user.id);
  };

  const initializeCall = async (token: string, userId: string) => {
    try {
      // Check for active call or create new one
      let activeCall = await getActiveCall(token, workspaceId);
      let currentCallId: string;
      
      if (activeCall.data) {
        currentCallId = activeCall.data.id;
        setCallId(currentCallId);
        await joinCall(token, currentCallId);
      } else {
        const newCall = await createCall(token, workspaceId);
        if (newCall.error) {
          throw new Error(newCall.error);
        }
        currentCallId = newCall.data!.id;
        setCallId(currentCallId);
      }

      // Initialize WebRTC
      const webrtc = new WebRTCService(userId);
      webrtcRef.current = webrtc;

      // Initialize local media
      const stream = await webrtc.initializeLocalMedia();
      console.log('[Call] Local stream obtained:', stream);
      console.log('[Call] Video tracks:', stream.getVideoTracks());
      console.log('[Call] Audio tracks:', stream.getAudioTracks());
      
      // Setup WebRTC callbacks
      webrtc.onTrack((participantId, stream) => {
        console.log('[Call] Received stream from:', participantId);
        const videoElement = videoRefs.current.get(participantId);
        if (videoElement) {
          videoElement.srcObject = stream;
          // Ensure remote video plays
          videoElement.play().catch(error => {
            console.error('[Call] Error playing remote video:', error);
          });
        }
      });

      webrtc.onParticipantLeft((participantId) => {
        console.log('[Call] Participant left:', participantId);
        setParticipants(prev => prev.filter(p => p.id !== participantId));
      });

      // Setup Supabase Realtime for signaling
      await setupRealtimeSignaling(currentCallId, token, userId);

      setLoading(false);
      
      // Set stream after loading is false so video element is rendered
      setLocalStream(stream);
      
      toast.success('Joined call successfully!');
    } catch (err: any) {
      console.error('[Call] Error initializing:', err);
      setError(err.message || 'Failed to initialize call');
      setLoading(false);
      toast.error(err.message || 'Failed to join call');
    }
  };

  const setupRealtimeSignaling = async (callId: string, token: string, userId: string) => {
    const supabase = createClient();

    // Subscribe to call signaling channel
    const channel = supabase.channel(`call:${callId}`);

    // Listen for signaling messages
    channel.on('broadcast', { event: 'signal' }, async ({ payload }: { payload: SignalData }) => {
      if (!webrtcRef.current) return;

      // Ignore messages from self
      if (payload.from === userId) return;

      console.log('[Call] Received signal:', payload.type, 'from:', payload.from);

      try {
        switch (payload.type) {
          case 'user-joined':
            if (payload.participant) {
              // New user joined - send them an offer
              setParticipants(prev => {
                if (prev.find(p => p.id === payload.participant!.id)) return prev;
                return [...prev, payload.participant!];
              });

              // Only send offer if we're not the new user
              if (payload.participant.id !== userId) {
                await webrtcRef.current.createOffer(payload.participant.id, (signal) => {
                  channel.send({
                    type: 'broadcast',
                    event: 'signal',
                    payload: signal
                  });
                });
              }
            }
            break;

          case 'offer':
            if (payload.to === userId && payload.offer) {
              await webrtcRef.current.handleOffer(payload.from, payload.offer, (signal) => {
                channel.send({
                  type: 'broadcast',
                  event: 'signal',
                  payload: signal
                });
              });
            }
            break;

          case 'answer':
            if (payload.to === userId && payload.answer) {
              await webrtcRef.current.handleAnswer(payload.from, payload.answer);
            }
            break;

          case 'ice-candidate':
            if (payload.to === userId && payload.candidate) {
              await webrtcRef.current.handleIceCandidate(payload.from, payload.candidate);
            }
            break;

          case 'media-state':
            setParticipants(prev => prev.map(p => 
              p.id === payload.from 
                ? { ...p, isMuted: payload.isMuted ?? p.isMuted, isCameraOff: payload.isCameraOff ?? p.isCameraOff }
                : p
            ));
            break;

          case 'user-left':
            setParticipants(prev => prev.filter(p => p.id !== payload.from));
            if (webrtcRef.current) {
              webrtcRef.current.closePeerConnection(payload.from);
            }
            break;

          case 'emoji-reaction':
            if (payload.emoji && payload.userName) {
              // Add emoji reaction to display
              const reactionId = `${Date.now()}-${Math.random()}`;
              const randomX = Math.random() * 80 + 10; // 10-90% from left
              const randomY = Math.random() * 20 + 40; // 40-60% from top
              
              setEmojiReactions(prev => [...prev, {
                id: reactionId,
                emoji: payload.emoji!,
                userName: payload.userName!,
                x: randomX,
                y: randomY
              }]);

              // Remove after 3 seconds
              setTimeout(() => {
                setEmojiReactions(prev => prev.filter(r => r.id !== reactionId));
              }, 3000);
            }
            break;
        }
      } catch (error) {
        console.error('[Call] Error handling signal:', error);
      }
    });

    // Subscribe to participant changes
    channel.on('postgres_changes', 
      { event: '*', schema: 'public', table: 'call_participants', filter: `call_id=eq.${callId}` },
      async () => {
        // Reload participants
        const result = await getCallParticipants(token, callId);
        if (result.data) {
          setParticipants(result.data);
        }
      }
    );

    await channel.subscribe();
    supabaseChannelRef.current = channel;

    // Load initial participants
    const result = await getCallParticipants(token, callId);
    if (result.data) {
      setParticipants(result.data);
    }

    // Announce our joining
    channel.send({
      type: 'broadcast',
      event: 'signal',
      payload: {
        type: 'user-joined',
        from: userId,
        participant: {
          id: userId,
          name: 'You',
          avatar: 'YO',
          isMuted: false,
          isCameraOff: false
        }
      } as SignalData
    });
  };

  const handleToggleMute = async () => {
    if (!webrtcRef.current) return;

    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    webrtcRef.current.toggleAudio(!newMutedState);

    // Update in database
    if (callId && accessToken) {
      await updateParticipantMedia(accessToken, callId, newMutedState, isCameraOff);
    }

    // Broadcast state change
    if (supabaseChannelRef.current) {
      supabaseChannelRef.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          type: 'media-state',
          from: currentUserId,
          isMuted: newMutedState,
          isCameraOff
        } as SignalData
      });
    }

    toast.success(newMutedState ? 'Microphone muted' : 'Microphone unmuted');
  };

  const handleToggleCamera = async () => {
    if (!webrtcRef.current) return;

    const newCameraState = !isCameraOff;
    setIsCameraOff(newCameraState);
    webrtcRef.current.toggleVideo(!newCameraState);

    // Update in database
    if (callId && accessToken) {
      await updateParticipantMedia(accessToken, callId, isMuted, newCameraState);
    }

    // Broadcast state change
    if (supabaseChannelRef.current) {
      supabaseChannelRef.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          type: 'media-state',
          from: currentUserId,
          isMuted,
          isCameraOff: newCameraState
        } as SignalData
      });
    }

    toast.success(newCameraState ? 'Camera off' : 'Camera on');
  };

  const handleToggleScreenShare = async () => {
    if (!webrtcRef.current) return;

    try {
      if (isScreenSharing) {
        webrtcRef.current.stopScreenShare();
        setIsScreenSharing(false);
        toast.success('Stopped screen sharing');
      } else {
        await webrtcRef.current.startScreenShare();
        setIsScreenSharing(true);
        toast.success('Started screen sharing');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to share screen');
    }
  };

  const handleSendEmoji = (emoji: string) => {
    if (!supabaseChannelRef.current || !currentUserId) return;

    // Get participant name
    const currentParticipant = participants.find(p => p.id === currentUserId);
    const userName = currentParticipant?.name || 'You';

    // Broadcast emoji to all participants
    supabaseChannelRef.current.send({
      type: 'broadcast',
      event: 'signal',
      payload: {
        type: 'emoji-reaction',
        from: currentUserId,
        emoji: emoji,
        userName: userName
      }
    });

    // Show emoji locally
    const reactionId = `${Date.now()}-${Math.random()}`;
    const randomX = Math.random() * 80 + 10;
    const randomY = Math.random() * 20 + 40;
    
    setEmojiReactions(prev => [...prev, {
      id: reactionId,
      emoji: emoji,
      userName: userName,
      x: randomX,
      y: randomY
    }]);

    // Remove after 3 seconds
    setTimeout(() => {
      setEmojiReactions(prev => prev.filter(r => r.id !== reactionId));
    }, 3000);
  };

  const handleEndCall = async () => {
    if (callId && accessToken) {
      await leaveCall(accessToken, callId);
    }
    cleanup();
    router.push(`/chat/${workspaceId}`);
  };

  const cleanup = () => {
    // Cleanup WebRTC
    if (webrtcRef.current) {
      webrtcRef.current.cleanup();
      webrtcRef.current = null;
    }

    // Cleanup Supabase channel
    if (supabaseChannelRef.current) {
      supabaseChannelRef.current.unsubscribe();
      supabaseChannelRef.current = null;
    }

    // Cleanup video refs
    videoRefs.current.clear();
  };

  const emojis = ['👍', '❤️', '😂', '👏', '🎉', '🔥'];

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Joining call...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <button
            onClick={() => router.push(`/chat/${workspaceId}`)}
            className="px-6 py-3 bg-dark-red text-white rounded-button hover:bg-maroon"
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col relative">
      {/* Emoji Reactions Overlay */}
      {emojiReactions.map((reaction) => (
        <div
          key={reaction.id}
          className="absolute pointer-events-none z-50 animate-float-up"
          style={{
            left: `${reaction.x}%`,
            top: `${reaction.y}%`,
            animation: 'floatUp 3s ease-out forwards'
          }}
        >
          <div className="flex flex-col items-center">
            <span className="text-6xl mb-2">{reaction.emoji}</span>
            <span className="text-white text-sm bg-black/70 px-2 py-1 rounded">
              {reaction.userName}
            </span>
          </div>
        </div>
      ))}

      {/* Video Grid */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
          {/* Local Video (You) */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
            {!localStream ? (
              <div className="text-white">Loading camera...</div>
            ) : isCameraOff ? (
              <div className="w-24 h-24 rounded-full bg-dark-red text-white flex items-center justify-center text-3xl font-bold">
                YO
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
            )}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/70 px-3 py-2 rounded">
              <span className="text-white text-sm font-medium">You</span>
              {isMuted && (
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded text-xs">
              LIVE
            </div>
          </div>

          {/* Remote Participants */}
          {participants.filter(p => p.id !== currentUserId).map((participant) => (
            <div
              key={participant.id}
              className="relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center"
            >
              {participant.isCameraOff ? (
                <div className="w-24 h-24 rounded-full bg-dark-red text-white flex items-center justify-center text-3xl font-bold">
                  {participant.avatar}
                </div>
              ) : (
                <video
                  ref={(el) => {
                    if (el) {
                      videoRefs.current.set(participant.id, el);
                      // Ensure video plays when element is created
                      if (el.srcObject) {
                        el.play().catch(err => console.error('[Call] Error playing remote video:', err));
                      }
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  onLoadedMetadata={(e) => {
                    console.log('[Call] Remote video metadata loaded for:', participant.id);
                    (e.target as HTMLVideoElement).play().catch(err => 
                      console.error('[Call] Error playing remote video:', err)
                    );
                  }}
                />
              )}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/70 px-3 py-2 rounded">
                <span className="text-white text-sm font-medium">{participant.name}</span>
                {participant.isMuted && (
                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="h-24 bg-gray-900 flex items-center justify-center gap-2 sm:gap-4 px-4 sm:px-8">
        {/* Mic Toggle */}
        <button
          onClick={handleToggleMute}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={handleToggleCamera}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors ${
            isCameraOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {isCameraOff ? (
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0018 14V7a2 2 0 00-2.828-1.828l-1.472-1.472A2 2 0 0012 3H6.414L3.707 2.293zM6 7.586L12.414 14H6V7.586z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>

        {/* Screen Share */}
        <button
          onClick={handleToggleScreenShare}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors ${
            isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Share Screen"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* End Call */}
        <button
          onClick={handleEndCall}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
          title="End Call"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
        </button>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Live Emojis */}
        <div className="hidden sm:flex gap-2">
          {emojis.map((emoji, idx) => (
            <button
              key={idx}
              onClick={() => handleSendEmoji(emoji)}
              className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-xl transition-colors hover:scale-110 active:scale-95"
              title="Send emoji reaction"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
