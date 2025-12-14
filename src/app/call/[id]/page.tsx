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
  const [currentUserName, setCurrentUserName] = useState('You');
  const [callId, setCallId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [emojiReactions, setEmojiReactions] = useState<Array<{
    id: string;
    emoji: string;
    userName: string;
    x: number;
    y: number;
  }>>([]);

  const webrtcRef = useRef<WebRTCService | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const supabaseChannelRef = useRef<any>(null);
  // Buffer for streams that arrive before video elements are ready
  const pendingStreams = useRef<Map<string, MediaStream>>(new Map());

  // Initialize call
  useEffect(() => {
    checkAuthAndInitialize();
    
    return () => {
      cleanup();
    };
  }, [workspaceId]);

  // Effect to attach pending streams to video elements that were created before stream arrived
  useEffect(() => {
    // Check if there are any pending streams that now have video elements
    const pendingIds = Array.from(pendingStreams.current.keys());
    
    if (pendingIds.length > 0) {
      console.log('[Call] 🔍 Checking for pending streams:', pendingIds);
    }
    
    for (const participantId of pendingIds) {
      const videoElement = videoRefs.current.get(participantId);
      const stream = pendingStreams.current.get(participantId);
      
      if (videoElement && stream) {
        console.log('[Call] 🔄 Attaching pending stream to now-available video element:', participantId);
        videoElement.srcObject = stream;
        pendingStreams.current.delete(participantId);
        videoElement.play().catch(err => {
          if (err.name !== 'AbortError') {
            console.error('[Call] Error playing pending video:', err);
          }
        });
      }
    }
  }, [participants]); // Re-check when participants change (new video elements might be rendered)

  // Unified video management - handles all camera states
  useEffect(() => {
    // Handle local camera video
    if (localStream && localVideoRef.current && !isCameraOff && !isScreenSharing) {
      console.log('[Call] Setting up local camera video');
      
      // Check if stream is already set to avoid redundant operations
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.play().catch(err => {
          // Ignore AbortError - it just means we're updating the stream
          if (err.name !== 'AbortError') {
            console.error('[Call] Error playing local video:', err);
          }
        });
      }
    }
  }, [localStream, isCameraOff, isScreenSharing]);

  // Handle screen share stream display in separate video element
  useEffect(() => {
    if (screenStream && screenVideoRef.current) {
      console.log('[Call] Setting screen share stream');
      
      if (screenVideoRef.current.srcObject !== screenStream) {
        screenVideoRef.current.srcObject = screenStream;
        screenVideoRef.current.play().catch(err => {
          if (err.name !== 'AbortError') {
            console.error('[Call] Error playing screen share:', err);
          }
        });
      }
    }
  }, [screenStream]);

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
      
      // Handle errors (including "Not a workspace member")
      if (activeCall.error) {
        throw new Error(activeCall.error);
      }
      
      let currentCallId: string;
      
      if (activeCall.data) {
        currentCallId = activeCall.data.id;
        setCallId(currentCallId);
        const joinResult = await joinCall(token, currentCallId);
        if (joinResult.error) {
          throw new Error(joinResult.error);
        }
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
        console.log('[Call] 📹 Received stream from:', participantId);
        console.log('[Call] Stream has', stream.getVideoTracks().length, 'video tracks and', stream.getAudioTracks().length, 'audio tracks');
        
        const videoElement = videoRefs.current.get(participantId);
        if (videoElement) {
          console.log('[Call] ✅ Video element found, attaching stream');
          videoElement.srcObject = stream;
          // Ensure remote video plays
          videoElement.play().catch(error => {
            if (error.name !== 'AbortError') {
              console.error('[Call] ❌ Error playing remote video:', error);
            }
          });
        } else {
          console.warn('[Call] ⏳ Video element not ready yet for participant:', participantId);
          console.log('[Call] Buffering stream until video element is ready');
          console.log('[Call] Available video refs:', Array.from(videoRefs.current.keys()));
          // Buffer the stream until the video element is ready
          pendingStreams.current.set(participantId, stream);
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

      console.log('[Call] ========================================');
      console.log('[Call] Received signal:', payload.type, 'from:', payload.from);
      console.log('[Call] My ID:', userId);
      console.log('[Call] Current participants:', participants.map(p => p.id));
      console.log('[Call] Active connections:', webrtcRef.current?.getActivePeerConnections());
      console.log('[Call] ========================================');

      try {
        switch (payload.type) {
          case 'user-joined':
            console.log('[Call] Processing user-joined, payload.participant:', payload.participant);
            if (!payload.participant) {
              console.error('[Call] ❌ user-joined received but payload.participant is missing!');
              console.error('[Call] Full payload:', payload);
              break;
            }
            
            // Check if we already have a peer connection (more reliable than state check)
            const hasConnection = webrtcRef.current?.getActivePeerConnections().includes(payload.participant.id);
              
            
            if (hasConnection) {
              console.log('[Call] Already have connection with', payload.participant.id, '- ignoring duplicate user-joined');
              break;
            }

            // Check for existing participant using functional state update to get current value
            let shouldAdd = false;
            setParticipants(prev => {
              const exists = prev.find(p => p.id === payload.participant!.id);
              if (exists) {
                console.log('[Call] Participant already in list, ignoring duplicate user-joined');
                return prev;
              }
              shouldAdd = true;
              console.log('[Call] Adding new participant:', payload.participant!.name);
              return [...prev, payload.participant!];
            });

            // Only proceed if we actually added the participant
            if (!shouldAdd) {
              console.log('[Call] ⏭️ Participant not added (duplicate), skipping offer creation');
              break;
            }
            
            console.log('[Call] ✅ New participant added, proceeding with offer logic');

            // Use deterministic rule: only the user with smaller ID creates offer
            // This prevents both users from creating offers simultaneously
            const shouldCreateOffer = userId < payload.participant.id;
            
            console.log('[Call] Comparing IDs:', {
              myId: userId,
              theirId: payload.participant.id,
              shouldCreateOffer,
              comparison: `${userId} < ${payload.participant.id} = ${shouldCreateOffer}`
            });
            
            if (shouldCreateOffer) {
              console.log('[Call] ✅ I have smaller ID, creating offer to:', payload.participant.id);
              try {
                await webrtcRef.current.createOffer(payload.participant.id, (signal) => {
                  console.log('[Call] 📤 Sending offer signal to:', payload.participant.id);
                  channel.send({
                    type: 'broadcast',
                    event: 'signal',
                    payload: signal
                  });
                });
                console.log('[Call] ✅ Offer created and sent successfully');
              } catch (error) {
                console.error('[Call] ❌ Error creating offer:', error);
              }
            } else {
              console.log('[Call] ⏳ Other user has smaller ID, waiting for their offer');
            }
            break;

          case 'offer':
            console.log('[Call] 📥 Received offer - to:', payload.to, 'from:', payload.from, 'myId:', userId);
            if (payload.to === userId && payload.offer) {
              console.log('[Call] ✅ Offer is for me! Creating answer...');
              try {
                await webrtcRef.current.handleOffer(payload.from, payload.offer, (signal) => {
                  console.log('[Call] 📤 Sending answer to:', payload.from);
                  channel.send({
                    type: 'broadcast',
                    event: 'signal',
                    payload: signal
                  });
                });
                console.log('[Call] ✅ Answer created and sent successfully');
              } catch (error) {
                console.error('[Call] ❌ Error handling offer:', error);
              }
            } else {
              console.log('[Call] ⏭️ Offer not for me, ignoring');
            }
            break;

          case 'answer':
            console.log('[Call] 📥 Received answer - to:', payload.to, 'from:', payload.from, 'myId:', userId);
            if (payload.to === userId && payload.answer) {
              console.log('[Call] ✅ Answer is for me! Processing...');
              console.log('[Call] Answer payload:', payload.answer);
              
              // Check if we have a peer connection waiting for this answer
              const peerConnections = webrtcRef.current?.getActivePeerConnections() || [];
              console.log('[Call] Current peer connections:', peerConnections);
              console.log('[Call] Looking for peer connection with:', payload.from);
              
              try {
                await webrtcRef.current.handleAnswer(payload.from, payload.answer);
                console.log('[Call] ✅ Answer processed successfully from:', payload.from);
              } catch (error) {
                console.error('[Call] ❌ Error handling answer:', error);
                console.error('[Call] Error details:', error);
              }
            } else {
              console.log('[Call] ⏭️ Answer not for me, ignoring');
            }
            break;

          case 'ice-candidate':
            if (payload.to === userId && payload.candidate) {
              console.log('[Call] 🧊 Received ICE candidate from:', payload.from);
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

    // Subscribe to participant changes - REMOVED
    // We don't need postgres_changes for INSERT because the broadcast handles it
    // postgres_changes was causing duplicate participant additions without WebRTC setup

    // Listen for participants leaving
    channel.on('postgres_changes', 
      { event: 'DELETE', schema: 'public', table: 'call_participants', filter: `call_id=eq.${callId}` },
      async () => {
        console.log('[Call] Participant left (detected via postgres_changes)');
        // Reload participants
        const result = await getCallParticipants(token, callId);
        if (result.data) {
          setParticipants(result.data);
        }
      }
    );

    // Subscribe and wait for it to be ready
    await channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Call] Successfully subscribed to call channel');
      }
    });
    
    supabaseChannelRef.current = channel;

    // Small delay to ensure channel is fully ready
    await new Promise(resolve => setTimeout(resolve, 100));

    // Load initial participants
    const result = await getCallParticipants(token, callId);
    
    let existingParticipants: any[] = [];
    
    if (result.data) {
      const otherParticipants = result.data.filter(p => p.id !== userId);
      existingParticipants = otherParticipants;
      
      // IMPORTANT: Only set SELF in participants initially
      // Other participants will be added via their "user-joined" broadcasts
      // This ensures clean state management
      const currentUser = result.data.find(p => p.id === userId);
      setParticipants(currentUser ? [currentUser] : []);
      
      console.log('[Call] Loaded', result.data.length, 'total participants from database');
      console.log('[Call] Found', otherParticipants.length, 'existing participants (excluding self)');
      console.log('[Call] Setting only self in state initially');
      
      // If I'm joining an existing call with participants, I need to initiate connections
      // For participants with LARGER IDs, I create offers
      // For participants with SMALLER IDs, they'll receive my broadcast and create offers
      for (const participant of otherParticipants) {
        const shouldCreateOffer = userId < participant.id;
        
        if (shouldCreateOffer) {
          console.log('[Call] 🎯 I have smaller ID - creating offer for existing participant:', participant.id);
          
          // Add participant to state first
          setParticipants(prev => [...prev, participant]);
          
          // Then create WebRTC offer
          try {
            await webrtcRef.current!.createOffer(participant.id, (signal) => {
              console.log('[Call] 📤 Sending offer to existing participant:', participant.id);
              channel.send({
                type: 'broadcast',
                event: 'signal',
                payload: signal
              });
            });
          } catch (error) {
            console.error('[Call] ❌ Error creating offer to existing participant:', error);
          }
        } else {
          console.log('[Call] ⏳ Participant', participant.id, 'has smaller ID - will wait for their offer after I broadcast');
        }
      }
    }

    // Get current user profile for announcement
    const currentUser = result.data?.find(p => p.id === userId);
    const userName = currentUser?.name || 'User';
    
    // Store current user name for emojis
    setCurrentUserName(userName);
    
    // Calculate other participants count for logging
    const otherParticipantsCount = result.data ? result.data.filter(p => p.id !== userId).length : 0;
    
    // ALWAYS announce our joining, even if alone
    // Other users might join after we check but before their listener is set up
    console.log('[Call] 📢 Broadcasting user-joined announcement');
    console.log('[Call] My details:', {
      id: userId,
      name: userName,
      otherParticipantsCount
    });
    
    channel.send({
      type: 'broadcast',
      event: 'signal',
      payload: {
        type: 'user-joined',
        from: userId,
        participant: {
          id: userId,
          name: userName,
          avatar: currentUser?.avatar || 'U',
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
        // Stop screen sharing
        webrtcRef.current.stopScreenShare();
        setIsScreenSharing(false);
        setScreenStream(null);
        toast.success('Stopped screen sharing');
      } else {
        // Start screen sharing
        const stream = await webrtcRef.current.startScreenShare();
        setIsScreenSharing(true);
        setScreenStream(stream);
        
        // Handle when user stops sharing via browser UI
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
          webrtcRef.current?.stopScreenShare();
          toast.success('Screen sharing stopped');
        };
        
        toast.success('Started screen sharing');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to share screen');
    }
  };

  const handleSendEmoji = (emoji: string) => {
    if (!supabaseChannelRef.current || !currentUserId) return;

    // Use stored current user name
    const userName = currentUserName;

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

    // Cleanup screen stream
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
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
          {/* Screen Share (if active) - Shows first */}
          {isScreenSharing && screenStream && (
            <div className="relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/70 px-3 py-2 rounded">
                <span className="text-white text-sm font-medium">Your Screen</span>
              </div>
              <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded text-xs font-semibold flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                </svg>
                SHARING
              </div>
            </div>
          )}

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
                      console.log('[Call] 📺 Video element created for participant:', participant.id);
                      videoRefs.current.set(participant.id, el);
                      
                      // Check if there's a pending stream waiting for this element
                      const pendingStream = pendingStreams.current.get(participant.id);
                      if (pendingStream) {
                        console.log('[Call] ✅ Found pending stream, attaching now!');
                        el.srcObject = pendingStream;
                        pendingStreams.current.delete(participant.id);
                        el.play().catch(err => {
                          if (err.name !== 'AbortError') {
                            console.error('[Call] Error playing remote video:', err);
                          }
                        });
                      } else if (el.srcObject) {
                        // Ensure video plays when element is created with existing stream
                        el.play().catch(err => {
                          if (err.name !== 'AbortError') {
                            console.error('[Call] Error playing remote video:', err);
                          }
                        });
                      }
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  onLoadedMetadata={(e) => {
                    console.log('[Call] Remote video metadata loaded for:', participant.id);
                    (e.target as HTMLVideoElement).play().catch(err => {
                      if (err.name !== 'AbortError') {
                        console.error('[Call] Error auto-playing remote video:', err);
                      }
                    });
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
