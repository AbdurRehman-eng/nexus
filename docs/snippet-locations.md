# Snippet Locations

This document maps each of the 7 questions to exact file names and line ranges for easy reference.

## 1. Abstraction Function (AF) and Representation Invariant (RI)

**File:** `src/models/Message.ts`  
**Snippet:** Lines 8-92

**Key sections:**
- AF documentation: Lines 8-11
- RI documentation: Lines 13-19
- RI enforcement in constructor: Lines 39-54
- Defensive copying in constructor: Lines 58, 62
- Defensive copying in getters: Lines 74-75, 90-91

**What to look for:**
- Comments explaining how internal representation maps to abstract concept (AF)
- Comments listing all invariants that must hold (RI)
- Code that validates and enforces invariants
- Defensive copying to prevent mutation

---

## 2. Declarative specification for search(query)

**File:** `src/search/SearchService.ts`  
**Snippet:** Lines 10-104

**Key sections:**
- Declarative specification comment: Lines 10-30
- search() method implementation: Lines 41-49
- match() function demonstrating replaceability: Lines 51-68
- Alternative implementations (semanticMatch, hybridMatch): Lines 78-104

**What to look for:**
- JSDoc-style specification describing WHAT the function returns
- Specification that doesn't specify HOW (implementation detail)
- Comments explaining that match() can be replaced without affecting callers
- Examples of different match implementations (keyword, semantic, hybrid)

---

## 3. Risks of mutation in message objects

**File:** `src/utils/MutationRisks.ts`  
**Snippet:** Lines 1-150 (entire file)

**Key sections:**
- Mutable timestamp risk: Lines 12-40
- Mutable embedding risk: Lines 42-70
- Mutable content risk: Lines 72-100
- Real-world threading bug: Lines 102-150

**What to look for:**
- Examples of mutable classes that cause bugs
- Demonstrations of how mutation breaks invariants
- Real-world scenarios showing actual bugs
- References to the immutable solution in Message.ts

---

## 4. Using recursion to compute thread depth

**File:** `src/utils/ThreadDepth.ts`  
**Snippet:** Lines 35-114

**Key sections:**
- getThreadDepth() recursive function: Lines 35-48
- Base case: Lines 38-40
- Recursive case: Lines 42-47
- Additional recursive examples: Lines 55-114 (getThreadMessageCount, getDeepestMessage, flattenThread)

**What to look for:**
- Base case: thread with no replies returns 0
- Recursive case: 1 + maximum depth of child threads
- Tree structure explanation
- Comments explaining why recursion is necessary

---

## 5. Assertions for debugging (e.g., checking embedding dimensions)

**File:** `src/utils/Assertions.ts`  
**Snippet:** Lines 1-150 (entire file)

**Key sections:**
- Embedding dimension assertion: Lines 12-35
- Message invariant assertions: Lines 37-75
- Search query assertions: Lines 77-90
- Thread structure assertions: Lines 92-115

**What to look for:**
- `console.assert()` calls with descriptive error messages
- Embedding dimension check (1536)
- Message RI validation
- Various assertion examples for different scenarios

---

## 6. Partition testing for addMessage()

**File:** `src/services/MessageService.ts`  
**Snippet:** Lines 11-169

**Key sections:**
- Partition documentation: Lines 11-21
- Partition test case documentation: Lines 27-58
- addMessage() implementation with partition validation: Lines 59-99
- Test case examples in comments: Lines 117-169

**What to look for:**
- Documentation of 5 partitions (content length, user validity, channel validity, thread relationship, embedding)
- Validation code for each partition
- Example test cases showing how to test each partition
- Comments explaining equivalence classes

---

## 7. Least privilege access control

**File:** `src/auth/AccessControl.ts`  
**Snippet:** Lines 1-150 (entire file)

**Key sections:**
- Permission type definitions: Lines 15-25
- requirePermission() method: Lines 35-50
- grantPermission() and revokePermission(): Lines 52-75
- Example usage comments: Lines 120-150

**What to look for:**
- Fine-grained permission types
- requirePermission() enforcing least privilege
- Default deny (empty permissions for new users)
- Examples showing users only get specific permissions, not broad access

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

