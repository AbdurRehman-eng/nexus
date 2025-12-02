/**
 * Message Model
 * 
 * This file demonstrates:
 * 1. Abstraction Function (AF) and Representation Invariant (RI)
 */

/**
 * AF: A Message represents an abstract communication in a channel.
 * The internal representation (id, content, timestamp, senderId, etc.)
 * maps to the abstract concept of a user sending text at a specific time.
 * 
 * RI: The following invariants must hold:
 * - timestamp must be a valid Date object and immutable after creation
 * - senderId must reference a valid user ID (non-empty string)
 * - content must be a non-empty string (length > 0)
 * - channelId must reference a valid channel ID (non-empty string)
 * - threadId, if present, must reference a valid parent message ID
 * - embedding, if present, must be an array of exactly 1536 numbers
 */
export class Message {
  private readonly _id: string;
  private readonly _content: string;
  private readonly _timestamp: Date; // Immutable - RI requirement
  private readonly _senderId: string; // Must be valid user ID - RI requirement
  private readonly _channelId: string; // Must be valid channel ID - RI requirement
  private readonly _threadId: string | null; // Optional parent message - RI requirement
  private readonly _embedding: number[] | null; // Optional semantic embedding - RI requirement

  constructor(
    id: string,
    content: string,
    timestamp: Date,
    senderId: string,
    channelId: string,
    threadId: string | null = null,
    embedding: number[] | null = null
  ) {
    // RI enforcement: Validate invariants at construction
    if (!id || id.trim().length === 0) {
      throw new Error("Message ID must be non-empty");
    }
    if (!content || content.trim().length === 0) {
      throw new Error("Message content must be non-empty");
    }
    if (!senderId || senderId.trim().length === 0) {
      throw new Error("Sender ID must be valid (non-empty)");
    }
    if (!channelId || channelId.trim().length === 0) {
      throw new Error("Channel ID must be valid (non-empty)");
    }
    if (embedding !== null && embedding.length !== 1536) {
      throw new Error("Embedding must be exactly 1536 dimensions");
    }

    this._id = id;
    this._content = content;
    this._timestamp = new Date(timestamp.getTime()); // Defensive copy - RI enforcement
    this._senderId = senderId;
    this._channelId = channelId;
    this._threadId = threadId;
    this._embedding = embedding ? [...embedding] : null; // Defensive copy - RI enforcement
  }

  // Getters that preserve immutability (AF requirement)
  get id(): string {
    return this._id;
  }

  get content(): string {
    return this._content;
  }

  get timestamp(): Date {
    return new Date(this._timestamp.getTime()); // Return defensive copy - RI enforcement
  }

  get senderId(): string {
    return this._senderId;
  }

  get channelId(): string {
    return this._channelId;
  }

  get threadId(): string | null {
    return this._threadId;
  }

  get embedding(): number[] | null {
    return this._embedding ? [...this._embedding] : null; // Return defensive copy - RI enforcement
  }

  /**
   * AF: Returns true if this message is a reply (part of a thread)
   * RI: threadId must be non-null for this to return true
   */
  isThreadReply(): boolean {
    return this._threadId !== null;
  }

  /**
   * AF: Returns a representation of this message suitable for display
   * RI: All returned fields must satisfy the representation invariants
   */
  toJSON(): object {
    return {
      id: this._id,
      content: this._content,
      timestamp: this._timestamp.toISOString(),
      senderId: this._senderId,
      channelId: this._channelId,
      threadId: this._threadId,
      hasEmbedding: this._embedding !== null
    };
  }
}

