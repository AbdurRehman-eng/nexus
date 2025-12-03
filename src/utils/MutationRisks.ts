/**
 * Mutation Risks Documentation
 * 
 * This file documents mutation risks in the Nexus codebase.
 * The actual risks are demonstrated through inline comments in the working code.
 * 
 * This file serves as a reference guide pointing to where mutation risks are
 * addressed in the actual Nexus components.
 */

/**
 * MUTATION RISKS IN NEXUS
 * 
 * The following risks are demonstrated through inline comments in the actual working code:
 * 
 * 1. Mutable Timestamps Break Thread Ordering
 *    - Location: Message.ts line 77-79 (timestamp getter)
 *    - Risk: If timestamps were mutable, MessageService thread validation would break
 *    - Protection: Defensive copying in timestamp getter
 *    - See: MessageService.ts line 88-90 for thread validation that relies on immutable timestamps
 * 
 * 2. Mutable Embeddings Break Semantic Search
 *    - Location: Message.ts line 93-94 (embedding getter)
 *    - Risk: If embeddings were mutable, SearchService.semanticMatch() would produce wrong results
 *    - Protection: Defensive copying in embedding getter
 *    - See: SearchService.ts line 93-104 for semanticMatch() that relies on immutable embeddings
 * 
 * 3. Mutable Content Breaks Keyword Search
 *    - Location: Message.ts line 23 (readonly content field)
 *    - Risk: If content were mutable, SearchService.keywordMatch() would return inconsistent results
 *    - Protection: readonly field prevents mutation
 *    - See: SearchService.ts line 80-83 for keywordMatch() that relies on immutable content
 * 
 * 4. Mutable Content Breaks Thread Integrity
 *    - Location: Message.ts line 23 (readonly content field)
 *    - Risk: If parent message content is mutated, thread context is lost
 *    - Protection: readonly field prevents mutation
 *    - See: MessageService.ts line 83-92 for thread validation
 * 
 * All mutation risks are prevented through:
 * - readonly fields in Message class (lines 22-28 in Message.ts)
 * - Defensive copying in getters (lines 77-79, 93-94 in Message.ts)
 * - Immutable Date objects via defensive copying
 * - Immutable arrays via spread operator
 * 
 * The actual working code in Message.ts, SearchService.ts, and MessageService.ts
 * contains inline comments explaining these risks in context.
 */
