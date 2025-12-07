# Snippet Locations

This document maps each of the 7 questions to exact file names and line ranges for easy reference.

## 1. Abstraction Function (AF) and Representation Invariant (RI)

**File:** `src/models/Message.ts`  
**Snippet:** Lines 8-150 (entire file)

**Key sections:**
- AF documentation: Lines 8-11
- RI documentation: Lines 13-19
- RI enforcement in constructor: Lines 39-54
- Defensive copying in constructor: Lines 58, 62
- Defensive copying in getters: Lines 74-75, 90-91
- Usage examples with actual Nexus components: Lines 118-150

**What to look for:**
- Comments explaining how internal representation maps to abstract concept (AF)
- Comments listing all invariants that must hold (RI)
- Code that validates and enforces invariants
- Defensive copying to prevent mutation
- Examples showing actual usage in MessageService and SearchService

---

## 2. Declarative specification for search(query)

**File:** `src/search/SearchService.ts`  
**Snippet:** Lines 10-150 (entire file)

**Key sections:**
- Declarative specification comment: Lines 10-30
- search() method implementation: Lines 41-49
- match() function demonstrating replaceability: Lines 51-68
- Alternative implementations (semanticMatch, hybridMatch): Lines 78-104
- Integration with MessageService: Lines 109-111
- Complete usage examples with actual Message objects: Lines 113-150

**What to look for:**
- JSDoc-style specification describing WHAT the function returns
- Specification that doesn't specify HOW (implementation detail)
- Comments explaining that match() can be replaced without affecting callers
- Examples of different match implementations (keyword, semantic, hybrid)
- Actual usage examples with real Message objects
- Integration with MessageService showing component interaction

---

## 3. Risks of mutation in message objects

**Primary locations (actual working code):**
- **Message.ts** Lines 23, 77-79, 93-94: Inline comments explaining mutation risks in getters
- **SearchService.ts** Lines 80-83, 93-104: Inline comments in keywordMatch() and semanticMatch()
- **MessageService.ts** Lines 88-90: Inline comment in thread validation

**Reference file:** `src/utils/MutationRisks.ts`  
**Snippet:** Lines 1-50 (reference documentation)

**Key sections:**
- Reference documentation pointing to actual code locations
- Summary of all mutation risks and their protections
- Cross-references to Message.ts, SearchService.ts, and MessageService.ts

**What to look for:**
- Inline comments in actual working code explaining mutation risks
- Defensive copying in Message.ts getters (lines 77-79, 93-94)
- readonly fields preventing mutation (line 23 in Message.ts)
- Comments in SearchService showing why immutability matters
- Comments in MessageService showing thread validation dependencies

---

## 4. Using recursion to compute thread depth

**File:** `src/utils/ThreadDepth.ts`  
**Snippet:** Lines 35-200 (entire file)

**Key sections:**
- getThreadDepth() recursive function: Lines 35-48
- Base case: Lines 38-40
- Recursive case: Lines 42-47
- Additional recursive examples: Lines 50-114 (getThreadMessageCount, getDeepestMessage, flattenThread)
- Integration with MessageService: Lines 116-150

**What to look for:**
- Base case: thread with no replies returns 0
- Recursive case: 1 + maximum depth of child threads
- Tree structure explanation
- Comments explaining why recursion is necessary
- Actual usage with MessageService components

---

## 5. Assertions for debugging (e.g., checking embedding dimensions)

**File:** `src/utils/Assertions.ts`  
**Snippet:** Lines 1-220 (entire file)

**Key sections:**
- Embedding dimension assertion: Lines 16-39
- Message invariant assertions: Lines 41-92
- Search query assertions: Lines 94-112
- Thread structure assertions: Lines 114-141
- Usage examples with actual components: Lines 193-220

**What to look for:**
- `console.assert()` calls with descriptive error messages
- Embedding dimension check (1536)
- Message RI validation
- References to actual usage in MessageService and SearchService
- Various assertion examples for different scenarios

---

## 6. Partition testing for addMessage()

**File:** `src/services/MessageService.ts`  
**Snippet:** Lines 11-250 (entire file)

**Key sections:**
- Partition documentation: Lines 11-21
- Partition test case documentation: Lines 27-58
- addMessage() implementation with partition validation: Lines 59-135
- Integration with SearchService: Lines 130-135
- Complete test examples with actual Message objects: Lines 137-250

**What to look for:**
- Documentation of 5 partitions (content length, user validity, channel validity, thread relationship, embedding)
- Validation code for each partition with actual Message objects
- Complete test examples using real Message constructor calls
- Integration with SearchService showing actual component usage
- Comments explaining equivalence classes

---

## 7. Least privilege access control

**File:** `src/auth/AccessControl.ts`  
**Snippet:** Lines 1-280 (entire file)

**Key sections:**
- Permission type definitions: Lines 17-29
- requirePermission() method: Lines 52-69
- grantPermission() and revokePermission(): Lines 71-95
- Integration with MessageService: Lines 157-200 (createMessageSecurely, deleteMessageSecurely)
- Complete usage examples with actual components: Lines 202-280

**What to look for:**
- Fine-grained permission types
- requirePermission() enforcing least privilege
- Default deny (empty permissions for new users)
- Integration methods showing actual usage with MessageService
- Complete examples using real Message objects and MessageService
- Examples showing users only get specific permissions, not broad access

---

## Answers to the 7 Questions

### 1. (Design & Modelling — AF & RI)
**How do Abstraction Functions (AF) and Representation Invariants (RI) help ensure your system stays correct as it grows?**

**Answer:**
Abstraction Functions (AF) and Representation Invariants (RI) provide a formal way to reason about correctness as the system grows. In Nexus:

- **AF (Lines 8-11 in Message.ts)**: Defines how the internal representation (id, content, timestamp, etc.) maps to the abstract concept of "a user sending a message at a specific time." This abstraction allows us to think about messages conceptually without worrying about implementation details.

- **RI (Lines 13-19 in Message.ts)**: Lists all invariants that must hold (timestamp immutable, senderId valid, content non-empty, etc.). These invariants are enforced at construction (Lines 39-54) and preserved through defensive copying (Lines 58, 62, 74-75, 90-91).

As Nexus grows, the RI ensures that:
1. New code can't accidentally violate message integrity (e.g., by mutating timestamps)
2. The AF provides a stable contract that other components (SearchService, MessageService) can rely on
3. Bugs are caught early through invariant validation rather than manifesting as subtle errors later

For example, if a new developer tries to modify a message's timestamp, the readonly fields and defensive copying prevent this, maintaining system correctness.

---

### 2. (Specifications — Declarative Specs)
**How does writing a declarative specification for a search(query) function make it easier to switch from keyword search to semantic search later?**

**Answer:**
The declarative specification in SearchService.ts (Lines 10-30) describes WHAT the function does ("returns all messages m where match(m, query) == true") without specifying HOW it finds them. This separation of specification from implementation provides several benefits:

- **Implementation Independence**: The search() method (Lines 41-49) uses a match() function that can be swapped. Currently it uses keywordMatch() (Line 67), but it could use semanticMatch() (Lines 84-95) or hybridMatch() (Lines 100-104) without changing the search() signature.

- **Caller Protection**: Code that calls searchService.search("hello") doesn't need to change when we switch from keyword to semantic search. The specification guarantees the same behavior: "returns all matching messages."

- **Flexible Evolution**: As Nexus grows, we can:
  - Start with keyword search (current implementation)
  - Add semantic search later (semanticMatch() already exists)
  - Combine both (hybridMatch() demonstrates this)
  - All without breaking existing code

The declarative spec acts as a contract: as long as match() returns true for messages that should match, the implementation details don't matter to callers.

---

### 3. (Mutability — Risks of Mutation)
**What problems can happen if message objects (timestamps, sender IDs, embeddings) are mutable?**

**Answer:**
Mutation risks are demonstrated through inline comments in the actual working Nexus code:

1. **Mutable Timestamps Break Thread Ordering** (Message.ts lines 77-79):
   - Inline comment explains: If timestamps were mutable, external code could change them
   - This would break MessageService.addMessage() thread validation (MessageService.ts line 88-90)
   - Messages would appear out of chronological order (reply before parent)
   - Protection: Defensive copying in timestamp getter returns new Date object

2. **Mutable Embeddings Break Semantic Search** (Message.ts lines 93-94, SearchService.ts lines 93-104):
   - Inline comment in Message.ts explains: If embeddings were mutable, they could be modified
   - This would break SearchService.semanticMatch() which relies on stable embeddings
   - Search indexes would become inconsistent, similarity calculations would be wrong
   - Protection: Defensive copying in embedding getter returns new array

3. **Mutable Content Breaks Keyword Search** (Message.ts line 23, SearchService.ts lines 80-83):
   - Inline comment in SearchService.ts explains: If content were mutable, it could change after indexing
   - This would break SearchService.keywordMatch() - search results wouldn't match displayed content
   - Users would see confusing mismatches (search for "hello" returns message showing "goodbye")
   - Protection: readonly field prevents mutation

4. **Mutable Content Breaks Thread Integrity** (Message.ts line 23, MessageService.ts lines 88-90):
   - Inline comment in MessageService.ts explains: If parent message content is mutated, thread context is lost
   - Reply says "Answer to question" but parent now says "Changed question"
   - Thread integrity is broken, audit trails become unreliable
   - Protection: readonly field prevents mutation

**Solution**: Message.ts uses readonly fields (line 23) and defensive copying (lines 77-79, 93-94) to prevent all these risks. The actual working code contains inline comments explaining these risks in context.

---

### 4. (Recursion — Thread Depth)
**How would you use recursion to calculate the depth of a conversation thread with replies inside replies?**

**Answer:**
Recursion is used in ThreadDepth.ts to compute thread depth because threads form a tree structure (a message can have replies, which can have their own replies).

**Base Case** (Lines 38-40 in ThreadDepth.ts):
- If a thread has no replies, the depth is 0 (just the root message)

**Recursive Case** (Lines 42-47):
- The depth is 1 (for this level) plus the maximum depth of any child thread
- We recursively call getThreadDepth() on each reply and take the maximum

**Example**:
```
Message A (depth 0)
  └─ Message B (depth 1)
      └─ Message C (depth 2)
```

The function getThreadDepth() (Lines 35-48) naturally handles this:
- For Message C: base case returns 0 (no replies)
- For Message B: recursive case returns 1 + max(getThreadDepth(C)) = 1 + 0 = 1
- For Message A: recursive case returns 1 + max(getThreadDepth(B)) = 1 + 1 = 2

**Why Recursion?** (Lines 139-146):
- Thread structure is inherently recursive (tree-like)
- Iterative solutions would require maintaining a stack manually
- Recursion naturally matches the problem structure
- Used in actual Nexus MessageService integration (Lines 116-150)

---

### 5. (Debugging — Assertions)
**How can adding simple assertions (like checking embedding dimensions) help catch bugs early in your AI search system?**

**Answer:**
Assertions in Assertions.ts catch bugs early by validating assumptions at runtime:

1. **Embedding Dimension Check** (Lines 16-39):
   - Validates embeddings are exactly 1536 dimensions (required for semantic search)
   - Catches bugs if embedding generation produces wrong dimensions
   - Used before semantic search operations

2. **Message Invariant Validation** (Lines 41-92):
   - Validates all RI requirements (non-empty IDs, valid timestamps, etc.)
   - Used in MessageService.addMessage() (Line 98 in MessageService.ts)
   - Catches invalid messages before they're stored

3. **Search Query Validation** (Lines 94-112):
   - Validates queries are non-empty strings with reasonable length
   - Used in SearchService.search() to catch invalid inputs early
   - Prevents downstream errors in search processing

4. **Thread Structure Validation** (Lines 114-141):
   - Validates thread relationships (parent exists, same channel, correct timestamp order)
   - Used in MessageService.addMessage() thread validation (Lines 78-87)
   - Catches thread integrity violations immediately

**Benefits**:
- Bugs are caught during development (assertions fail immediately)
- Clear error messages point to exact problems
- Prevents corrupted data from entering the system
- Makes debugging faster by catching issues at the source

For example, if embedding generation accidentally produces 1535 dimensions, the assertion at Line 22-25 catches it immediately rather than causing mysterious search failures later.

---

### 6. (Static Checking & Testing — Partition Testing)
**How would you design basic test partitions (e.g., empty message, long message, invalid user) for testing addMessage()?**

**Answer:**
Partition testing in MessageService.ts divides the input space into equivalence classes (Lines 11-21). Each partition represents inputs that should be handled similarly:

**Partition 1: Content Length** (Lines 32-37, validation at Lines 60-66):
- Empty content (should fail) - tested by checking trim().length === 0
- Short content (1-10 chars) - should succeed
- Normal content (11-1000 chars) - should succeed
- Long content (1001-10000 chars) - should succeed
- Very long content (>10000 chars) - should fail (Line 64-66)

**Partition 2: User Validity** (Lines 39-42, validation at Lines 68-71):
- Valid user ID - should succeed (checked against validUserIds Set)
- Invalid user ID (empty string) - should fail (caught by Message constructor)
- Non-existent user ID - should fail (Line 69-71)

**Partition 3: Channel Validity** (Lines 44-47, validation at Lines 73-76):
- Valid channel ID - should succeed
- Invalid channel ID (empty string) - should fail
- Non-existent channel ID - should fail (Line 74-76)

**Partition 4: Thread Relationship** (Lines 49-52, validation at Lines 78-87):
- Root message (threadId = null) - should succeed
- Valid thread reply (threadId references existing message) - should succeed (Lines 79-87)
- Invalid thread reply (threadId references non-existent message) - should fail (Lines 80-82)

**Partition 5: Embedding** (Lines 54-57, validation at Lines 89-92):
- With valid embedding (1536 dimensions) - should succeed
- Without embedding (null) - should succeed
- With invalid embedding (wrong dimensions) - should fail (Lines 90-92)

**Test Strategy** (Lines 117-169):
- Test one representative from each partition
- Test boundary cases (empty, max length, null)
- Test combinations (e.g., valid user + invalid channel)

This approach ensures comprehensive coverage with minimal test cases, as each partition represents a class of equivalent inputs.

---

### 7. (Security — Least Privilege)
**How does the principle of least privilege help keep private channels and user data secure?**

**Answer:**
Least privilege in AccessControl.ts ensures users only get the minimum permissions necessary:

1. **Fine-Grained Permissions** (Lines 17-29):
   - Separate permissions for read, write, delete, manage operations
   - Users need 'channel:read' to view, but don't automatically get 'channel:write' or 'channel:delete'
   - Prevents accidental or malicious over-privilege

2. **Default Deny** (Lines 116-124):
   - New users get NO permissions by default (empty Set)
   - Permissions must be explicitly granted
   - Prevents security holes from default permissions

3. **Explicit Permission Checks** (Lines 52-69):
   - requirePermission() enforces exact permission matching
   - Users must have the specific permission or 'admin:all'
   - No broad access granted automatically

4. **Granular Control** (Lines 71-95):
   - grantPermission() and revokePermission() allow fine-grained management
   - Can grant 'message:write' without granting 'message:delete'
   - Can revoke specific permissions without affecting others

**Security Benefits**:
- **Private Channels**: Users without 'channel:read' can't access private channels (Line 132-134)
- **Data Protection**: Users without 'message:delete' can't delete messages, even their own (Line 152-154)
- **Audit Trail**: Fine-grained permissions make it clear who can do what
- **Damage Limitation**: If a user account is compromised, limited permissions reduce potential damage

**Example** (Lines 157-178):
- Regular user gets 'channel:read' and 'message:write' only
- Cannot delete messages, manage channels, or access admin functions
- Even if their account is compromised, attacker has limited access
- Admin gets 'admin:all' but this is explicit and auditable

This principle ensures that security is built into the permission model, not added as an afterthought.

---

### 8. (Code Reviews — Catching Mistakes Early)
**How can code reviews help catch mistakes early?**

**Answer:**
Code reviews catch mistakes early by having multiple developers examine code before it's merged. In Nexus, code reviews would catch several types of issues:

1. **Type Mismatches** (MessageService.ts line 31):
   - **Bug**: `private validChannelIds: Set<string> = new Map();` - declares Set but initializes Map
   - **Code Review Catch**: Reviewer notices type mismatch between declaration and initialization
   - **Impact**: Runtime error when trying to use Set methods (like `.has()`) on a Map object
   - **Fix**: Changed to `new Set<string>()` to match the declaration (see line 31 with comment)
   - **Prevention**: TypeScript compiler would catch this, but code review ensures intent is correct and catches it before compilation

2. **Missing Validation** (MessageService.ts lines 64-100):
   - **Potential Bug**: If a developer adds a new partition but forgets to validate it
   - **Code Review Catch**: Reviewer checks that all 5 partitions are validated
   - **Impact**: Invalid messages could be stored, breaking system invariants
   - **Prevention**: Review checklist ensures all partitions are covered

3. **Security Issues** (AccessControl.ts lines 170-200):
   - **Potential Bug**: If `createMessageSecurely()` didn't check permissions
   - **Code Review Catch**: Reviewer verifies `requirePermission()` is called before operations
   - **Impact**: Unauthorized users could create messages, violating least privilege
   - **Prevention**: Security-focused review ensures all permission checks are present

4. **Missing Defensive Copying** (Message.ts lines 77-79, 93-94):
   - **Potential Bug**: If getters returned direct references instead of copies
   - **Code Review Catch**: Reviewer checks for defensive copying in getters
   - **Impact**: External code could mutate timestamps/embeddings, breaking invariants
   - **Prevention**: Review ensures immutability is preserved

5. **Incorrect Recursion Base Case** (ThreadDepth.ts lines 42-55):
   - **Potential Bug**: If base case returned wrong value (e.g., -1 instead of 0)
   - **Code Review Catch**: Reviewer verifies base case logic matches specification
   - **Impact**: Thread depth calculations would be wrong, breaking UI rendering
   - **Prevention**: Review ensures recursive functions have correct base cases

6. **Missing Assertions** (MessageService.ts line 106):
   - **Potential Bug**: If `assertMessageInvariants()` wasn't called
   - **Code Review Catch**: Reviewer checks that assertions are used in critical paths
   - **Impact**: Invalid messages might be stored, causing bugs later
   - **Prevention**: Review ensures assertions are placed where invariants must hold

7. **Incomplete Partition Testing** (MessageService.ts lines 64-100):
   - **Potential Bug**: If a partition (e.g., embedding validation) was missing
   - **Code Review Catch**: Reviewer verifies all documented partitions are tested
   - **Impact**: Some invalid inputs would be accepted, breaking system correctness
   - **Prevention**: Review checklist matches documentation to implementation

**Code Review Process in Nexus:**
- **Before Merge**: All changes reviewed by at least one other developer
- **Checklist**: Verify type safety, security checks, invariant preservation, test coverage
- **Examples**: Review MessageService.addMessage() to ensure all 5 partitions are validated
- **Benefits**: Catches bugs before they reach production, shares knowledge, improves code quality

**Specific Review Points:**
- Message.ts: Verify all getters return defensive copies (lines 77-79, 93-94)
- SearchService.ts: Ensure declarative spec is maintained when changing match() (lines 64-68)
- MessageService.ts: Check all partitions are validated (lines 64-100)
- AccessControl.ts: Verify permission checks before all operations (lines 170-227)
- ThreadDepth.ts: Confirm base case and recursive case are correct (lines 42-55)

Code reviews act as a safety net, catching mistakes that automated tools might miss and ensuring code quality before integration.

**Code Snippets:**
See `docs/code-review-snippets.md` for actual code snippets from Nexus that demonstrate code review checkpoints.

---

## Additional Files

### UI Components (Color Scheme Demonstration)

**Login Page:** `src/ui/LoginPage.tsx`  
- Lines 1-100: Complete component with Deep Burgundy (#4B0908), Soft Gray (#E7EBF3), White, and Black color scheme

**Chat Page:** `src/ui/ChatPage.tsx`  
- Lines 1-120: Complete component demonstrating the same color scheme in a chat interface

### Supporting Models

**Channel Model:** `src/models/Channel.ts`  
- Basic channel structure

**User Model:** `src/models/User.ts`  
- Basic user structure

**Semantic Search:** `src/search/semanticSearch.ts`  
- Placeholder for semantic search functionality
