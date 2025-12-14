// WebRTC Service for Video Calls
// Re-implemented using the MDN "Perfect Negotiation" pattern to safely handle offer glare/collisions.

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  isMuted: boolean;
  isCameraOff: boolean;
}

export interface SignalData {
  type:
    | 'offer'
    | 'answer'
    | 'ice-candidate'
    | 'user-joined'
    | 'user-left'
    | 'media-state'
    | 'emoji-reaction';
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
  emojiId?: string;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

type PeerState = {
  pc: RTCPeerConnection;
  polite: boolean;
  makingOffer: boolean;
  pendingIce: RTCIceCandidateInit[];
};

export class WebRTCService {
  private localParticipantId: string;
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private peers: Map<string, PeerState> = new Map();

  private onTrackCallback?: (participantId: string, stream: MediaStream) => void;
  private onParticipantLeftCallback?: (participantId: string) => void;

  constructor(localParticipantId: string) {
    this.localParticipantId = localParticipantId;
  }

  async initializeLocalMedia(audio = true, video = true): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audio
          ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          : false,
        video: video
          ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
          : false
      });
      this.localStream = stream;
      return stream;
    } catch (error) {
      console.error('[WebRTC] Error accessing media devices:', error);
      throw new Error('Failed to access camera/microphone. Please grant permissions.');
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  toggleAudio(enabled: boolean): void {
    this.localStream?.getAudioTracks().forEach((t) => (t.enabled = enabled));
  }

  toggleVideo(enabled: boolean): void {
    this.localStream?.getVideoTracks().forEach((t) => (t.enabled = enabled));
  }

  async startScreenShare(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });
      this.screenStream = stream;

      const videoTrack = stream.getVideoTracks()[0];
      this.peers.forEach(({ pc }) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
      });

      videoTrack.onended = () => this.stopScreenShare();
      return stream;
    } catch (error) {
      console.error('[WebRTC] Error starting screen share:', error);
      throw new Error('Failed to start screen sharing');
    }
  }

  stopScreenShare(): void {
    if (!this.screenStream) return;
    this.screenStream.getTracks().forEach((t) => t.stop());
    this.screenStream = null;

    const camTrack = this.localStream?.getVideoTracks()[0];
    if (!camTrack) return;

    this.peers.forEach(({ pc }) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) sender.replaceTrack(camTrack);
    });
  }

  onTrack(callback: (participantId: string, stream: MediaStream) => void): void {
    this.onTrackCallback = callback;
  }

  onParticipantLeft(callback: (participantId: string) => void): void {
    this.onParticipantLeftCallback = callback;
  }

  getActivePeerConnections(): string[] {
    return Array.from(this.peers.keys());
  }

  private ensurePeer(participantId: string, onSignal: (signal: SignalData) => void): PeerState {
    const existing = this.peers.get(participantId);
    if (existing) return existing;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    const polite = this.localParticipantId < participantId; // deterministic roles
    const state: PeerState = { pc, polite, makingOffer: false, pendingIce: [] };

    // Add local tracks if available (camera/mic)
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        pc.addTrack(track, this.localStream);
      }
    }

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      onSignal({
        type: 'ice-candidate',
        from: this.localParticipantId,
        to: participantId,
        candidate: event.candidate.toJSON()
      });
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream) this.onTrackCallback?.(participantId, stream);
    };

    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      console.log('[WebRTC] Connection state with', participantId, st);
      if (st === 'failed' || st === 'closed') this.closePeerConnection(participantId);
    };

    this.peers.set(participantId, state);
    return state;
  }

  // Explicitly create an offer (used by call page when a peer is discovered).
  async createOffer(participantId: string, onSignal: (signal: SignalData) => void): Promise<void> {
    const peer = this.ensurePeer(participantId, onSignal);
    const { pc } = peer;

    if (pc.connectionState === 'connected' && pc.signalingState === 'stable') return;
    if (pc.signalingState === 'have-local-offer') return;

    try {
      peer.makingOffer = true;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      onSignal({
        type: 'offer',
        from: this.localParticipantId,
        to: participantId,
        offer: pc.localDescription ?? offer
      });
    } finally {
      peer.makingOffer = false;
    }
  }

  async handleOffer(
    participantId: string,
    offer: RTCSessionDescriptionInit,
    onSignal: (signal: SignalData) => void
  ): Promise<void> {
    const peer = this.ensurePeer(participantId, onSignal);
    const { pc } = peer;

    const desc = new RTCSessionDescription(offer);
    const offerCollision = desc.type === 'offer' && (peer.makingOffer || pc.signalingState !== 'stable');

    if (offerCollision) {
      if (!peer.polite) {
        console.log('[WebRTC] Glare: impolite peer ignoring offer from', participantId);
        return;
      }
      console.log('[WebRTC] Glare: polite peer rolling back to accept offer from', participantId);
      try {
        await pc.setLocalDescription({ type: 'rollback' });
      } catch (e) {
        console.warn('[WebRTC] Rollback failed (continuing):', e);
      }
    }

    await pc.setRemoteDescription(desc);

    // Drain queued ICE candidates
    if (peer.pendingIce.length > 0) {
      for (const c of peer.pendingIce) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        } catch (e) {
          console.warn('[WebRTC] Failed to add queued ICE:', e);
        }
      }
      peer.pendingIce = [];
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    onSignal({
      type: 'answer',
      from: this.localParticipantId,
      to: participantId,
      answer: pc.localDescription ?? answer
    });
  }

  async handleAnswer(participantId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peer = this.peers.get(participantId);
    if (!peer) return;
    const { pc } = peer;

    // Ignore duplicates if already stable with a remote description
    if (pc.signalingState === 'stable' && pc.remoteDescription) return;

    await pc.setRemoteDescription(new RTCSessionDescription(answer));

    // Drain queued ICE candidates
    if (peer.pendingIce.length > 0) {
      for (const c of peer.pendingIce) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        } catch (e) {
          console.warn('[WebRTC] Failed to add queued ICE:', e);
        }
      }
      peer.pendingIce = [];
    }
  }

  async handleIceCandidate(participantId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peer = this.peers.get(participantId);
    if (!peer) return;
    const { pc } = peer;

    // Queue ICE until remote description is set
    if (!pc.remoteDescription) {
      peer.pendingIce.push(candidate);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn('[WebRTC] Error adding ICE candidate:', e);
    }
  }

  closePeerConnection(participantId: string): void {
    const peer = this.peers.get(participantId);
    if (!peer) return;
    peer.pc.close();
    this.peers.delete(participantId);
    this.onParticipantLeftCallback?.(participantId);
  }

  cleanup(): void {
    for (const [id, peer] of this.peers.entries()) {
      peer.pc.close();
      this.peers.delete(id);
    }

    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;

    this.screenStream?.getTracks().forEach((t) => t.stop());
    this.screenStream = null;
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
