/**
 * Message Model
 * 
 * This file demonstrates:
 * 1. Abstraction Function (AF) and Representation Invariant (RI)
 * 
 * This file shows how AF and RI are implemented in the actual Nexus codebase
 * and how they ensure correctness as the system grows.
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
  private readonly _content: string; // Immutable - prevents mutation that would break SearchService.keywordMatch()
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
    // Return defensive copy - RI enforcement
    // MUTATION RISK: If we returned this._timestamp directly, external code could mutate it:
    //   const ts = message.timestamp; ts.setFullYear(2025); // Would break MessageService thread ordering!
    // This would cause messages to appear out of chronological order in threads.
    // See MessageService.addMessage() line 88-90 for thread validation that relies on immutable timestamps.
    return new Date(this._timestamp.getTime());
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
    // Return defensive copy - RI enforcement
    // MUTATION RISK: If we returned this._embedding directly, external code could mutate it:
    //   const emb = message.embedding; emb[0] = 999; // Would break SearchService semantic search!
    // This would cause SearchService.semanticMatch() (line 93-104 in SearchService.ts) to produce
    // incorrect similarity scores, making search results inconsistent.
    return this._embedding ? [...this._embedding] : null;
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

/**
 * Example usage in Nexus components:
 * 
 * // Used in MessageService.addMessage() (see MessageService.ts line 59)
 * const message = new Message(
 *   'msg-123',
 *   'Hello, world!',
 *   new Date('2024-01-01T10:00:00Z'),
 *   'user1',
 *   'channel1',
 *   null, // Not a thread reply
 *   null // No embedding
 * );
 * 
 * // Used in SearchService for semantic search (see SearchService.ts line 84-95)
 * const embedding = new Array(1536).fill(0).map(() => Math.random() * 0.1);
 * const messageWithEmbedding = new Message(
 *   'msg-124',
 *   'Searchable content',
 *   new Date(),
 *   'user1',
 *   'channel1',
 *   null,
 *   embedding // 1536-dimensional embedding for semantic search
 * );
 * 
 * // Used in thread creation (see MessageService.ts lines 78-87)
 * const parent = new Message('msg-125', 'Question?', new Date(), 'user1', 'channel1', null);
 * const reply = new Message('msg-126', 'Answer', new Date(), 'user2', 'channel1', 'msg-125');
 * 
 * // AF ensures: All these Message objects represent the abstract concept of "a user sending text"
 * // RI ensures: All invariants are validated and preserved (immutable, valid IDs, correct dimensions)
 */
