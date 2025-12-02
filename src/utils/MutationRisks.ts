/**
 * Mutation Risks Demonstration
 * 
 * This file demonstrates:
 * 3. Risks of mutation in message objects
 */

import { Message } from '../models/Message';

/**
 * Example 1: Mutable timestamp causes time-travel bugs
 * 
 * RISK: If timestamp is mutable, external code can change it,
 * breaking the representation invariant that timestamps are immutable.
 */
export function demonstrateMutableTimestampRisk(): void {
  // BAD: Mutable timestamp
  class BadMessage {
    public timestamp: Date; // Mutable - DANGEROUS!

    constructor(timestamp: Date) {
      this.timestamp = timestamp;
    }
  }

  const badMsg = new BadMessage(new Date('2024-01-01'));
  const originalTime = badMsg.timestamp;

  // External code can mutate the timestamp
  badMsg.timestamp.setFullYear(2025); // MUTATION!

  // Now originalTime is also changed! (Date objects are mutable)
  console.log('Original time:', originalTime); // Shows 2025, not 2024!
  console.log('Message time:', badMsg.timestamp); // Also shows 2025

  // This breaks the RI: "timestamp must be immutable after creation"
  // This causes bugs in:
  // - Message ordering (messages appear out of chronological order)
  // - Audit logs (timestamps can be retroactively changed)
  // - Thread reconstruction (parent-child relationships break)
}

/**
 * Example 2: Mutable embeddings break semantic search
 * 
 * RISK: If embeddings are mutable, they can be accidentally modified,
 * causing semantic search to return incorrect results.
 */
export function demonstrateMutableEmbeddingRisk(): void {
  // BAD: Mutable embedding
  class BadMessage {
    public embedding: number[]; // Mutable - DANGEROUS!

    constructor(embedding: number[]) {
      this.embedding = embedding;
    }
  }

  const badMsg = new BadMessage([0.1, 0.2, 0.3, /* ... 1533 more ... */]);
  const originalEmbedding = badMsg.embedding;

  // External code accidentally mutates the embedding
  badMsg.embedding[0] = 999; // MUTATION!

  // Now originalEmbedding is also changed!
  console.log('Original embedding[0]:', originalEmbedding[0]); // Shows 999, not 0.1!
  console.log('Message embedding[0]:', badMsg.embedding[0]); // Also shows 999

  // This breaks semantic search because:
  // - Search indexes become inconsistent
  // - Similarity calculations produce wrong results
  // - Message retrieval returns incorrect matches
  // - The RI is violated: "embedding must be immutable"
}

/**
 * Example 3: Mutable content allows message tampering
 * 
 * RISK: If message content is mutable, messages can be edited after
 * being sent, breaking audit trails and thread integrity.
 */
export function demonstrateMutableContentRisk(): void {
  // BAD: Mutable content
  class BadMessage {
    public content: string; // Mutable - DANGEROUS!

    constructor(content: string) {
      this.content = content;
    }
  }

  const badMsg = new BadMessage("Hello, world!");
  const storedReference = badMsg.content;

  // External code can mutate the content
  badMsg.content = "Hacked message!"; // MUTATION!

  // Now storedReference might be affected (depending on implementation)
  // This breaks:
  // - Message history (original content is lost)
  // - Thread integrity (replies reference changed content)
  // - Audit logs (can't verify what was actually sent)
  // - The RI: "content must be immutable after creation"
}

/**
 * Example 4: Real-world bug scenario
 * 
 * This demonstrates how mutation causes a real bug in message threading.
 */
export function demonstrateThreadingBug(): void {
  // BAD: Mutable message in a thread
  interface MutableMessage {
    id: string;
    content: string;
    timestamp: Date; // Mutable!
    threadId: string | null;
  }

  const parent: MutableMessage = {
    id: "msg-1",
    content: "Original message",
    timestamp: new Date('2024-01-01T10:00:00Z'),
    threadId: null
  };

  const reply: MutableMessage = {
    id: "msg-2",
    content: "Reply to original",
    timestamp: new Date('2024-01-01T10:05:00Z'),
    threadId: "msg-1"
  };

  // Later, some code accidentally mutates the parent timestamp
  parent.timestamp.setFullYear(2025); // MUTATION!

  // Now when we reconstruct the thread:
  // - Parent appears to be from 2025
  // - Reply appears to be from 2024
  // - Thread ordering is broken (reply appears before parent!)
  // - UI displays messages in wrong order
  // - Users see confusing conversation flow

  console.log('Parent timestamp:', parent.timestamp); // 2025
  console.log('Reply timestamp:', reply.timestamp); // 2024
  // Bug: Reply appears before parent in chronological order!
}

/**
 * SOLUTION: Use immutable Message class (see Message.ts)
 * 
 * The Message class uses:
 * - readonly fields
 * - Defensive copying in getters
 * - Immutable Date objects
 * - Immutable arrays for embeddings
 * 
 * This prevents all the mutation risks demonstrated above.
 */

