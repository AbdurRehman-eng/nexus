// WebRTC Service for Video Calls
// Handles peer-to-peer connections, media streams, and signaling

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  isMuted: boolean;
  isCameraOff: boolean;
  stream?: MediaStream;
}

export interface SignalData {
  type: 'offer' | 'answer' | 'ice-candidate' | 'user-joined' | 'user-left' | 'media-state' | 'emoji-reaction';
  from: string;
  to?: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  participant?: Participant;
  isMuted?: boolean;
  isCameraOff?: boolean;
  emoji?: string;
  userName?: string;
}

// STUN servers for NAT traversal (free Google STUN servers)
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
};

export class WebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private localParticipantId: string;
  private onTrackCallback?: (participantId: string, stream: MediaStream) => void;
  private onParticipantLeftCallback?: (participantId: string) => void;

  constructor(localParticipantId: string) {
    this.localParticipantId = localParticipantId;
  }

  // Initialize local media (camera + microphone)
  async initializeLocalMedia(audio = true, video = true): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false,
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false
      });

      this.localStream = stream;
      return stream;
    } catch (error) {
      console.error('[WebRTC] Error accessing media devices:', error);
      throw new Error('Failed to access camera/microphone. Please grant permissions.');
    }
  }

  // Get local stream
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Toggle microphone
  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  // Toggle camera
  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  // Start screen sharing
  async startScreenShare(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always'
        },
        audio: false
      });

      this.screenStream = stream;

      // Replace video tracks in all peer connections
      const videoTrack = stream.getVideoTracks()[0];
      this.peerConnections.forEach((pc) => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Handle when user stops sharing via browser UI
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      return stream;
    } catch (error) {
      console.error('[WebRTC] Error starting screen share:', error);
      throw new Error('Failed to start screen sharing');
    }
  }

  // Stop screen sharing
  stopScreenShare(): void {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;

      // Switch back to camera
      if (this.localStream) {
        const videoTrack = this.localStream.getVideoTracks()[0];
        this.peerConnections.forEach((pc) => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
    }
  }

  // Create peer connection for a participant
  createPeerConnection(
    participantId: string,
    onSignal: (signal: SignalData) => void
  ): RTCPeerConnection {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onSignal({
          type: 'ice-candidate',
          from: this.localParticipantId,
          to: participantId,
          candidate: event.candidate.toJSON()
        });
      }
    };

    // Handle incoming tracks (remote video/audio)
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track from:', participantId);
      if (this.onTrackCallback) {
        this.onTrackCallback(participantId, event.streams[0]);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${participantId}:`, pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeerConnection(participantId);
      }
    };

    this.peerConnections.set(participantId, pc);
    return pc;
  }

  // Create and send offer to participant
  async createOffer(participantId: string, onSignal: (signal: SignalData) => void): Promise<void> {
    const pc = this.createPeerConnection(participantId, onSignal);

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await pc.setLocalDescription(offer);

      onSignal({
        type: 'offer',
        from: this.localParticipantId,
        to: participantId,
        offer: offer
      });
    } catch (error) {
      console.error('[WebRTC] Error creating offer:', error);
      throw error;
    }
  }

  // Handle received offer and create answer
  async handleOffer(
    participantId: string,
    offer: RTCSessionDescriptionInit,
    onSignal: (signal: SignalData) => void
  ): Promise<void> {
    const pc = this.createPeerConnection(participantId, onSignal);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      onSignal({
        type: 'answer',
        from: this.localParticipantId,
        to: participantId,
        answer: answer
      });
    } catch (error) {
      console.error('[WebRTC] Error handling offer:', error);
      throw error;
    }
  }

  // Handle received answer
  async handleAnswer(participantId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peerConnections.get(participantId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('[WebRTC] Error handling answer:', error);
        throw error;
      }
    }
  }

  // Handle received ICE candidate
  async handleIceCandidate(participantId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peerConnections.get(participantId);
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('[WebRTC] Error adding ICE candidate:', error);
      }
    }
  }

  // Close connection with specific participant
  closePeerConnection(participantId: string): void {
    const pc = this.peerConnections.get(participantId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(participantId);
      
      if (this.onParticipantLeftCallback) {
        this.onParticipantLeftCallback(participantId);
      }
    }
  }

  // Cleanup all connections and streams
  cleanup(): void {
    // Close all peer connections
    this.peerConnections.forEach((pc, participantId) => {
      pc.close();
    });
    this.peerConnections.clear();

    // Stop local streams
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }
  }

  // Set callbacks
  onTrack(callback: (participantId: string, stream: MediaStream) => void): void {
    this.onTrackCallback = callback;
  }

  onParticipantLeft(callback: (participantId: string) => void): void {
    this.onParticipantLeftCallback = callback;
  }

  // Get all active peer connections
  getActivePeerConnections(): string[] {
    return Array.from(this.peerConnections.keys());
  }
}

// Utility: Check if browser supports WebRTC
export function isWebRTCSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.RTCPeerConnection
  );
}

// Utility: Check camera/microphone permissions
export async function checkMediaPermissions(): Promise<{
  camera: boolean;
  microphone: boolean;
}> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    stream.getTracks().forEach(track => track.stop());
    return { camera: true, microphone: true };
  } catch (error) {
    return { camera: false, microphone: false };
  }
}
