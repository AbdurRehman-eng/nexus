# Nexus

A partial, non-working but structured implementation of a Slack-style clone called **Nexus**.

## Overview

Nexus is designed to demonstrate key software engineering concepts through code examples. This is **not a working application** - it contains structured code snippets that explicitly answer 7 specific questions about software design and implementation.

## Project Structure

```
nexus/
├── src/
│   ├── models/          # Data models (Message, User, Channel)
│   ├── services/        # Business logic (MessageService)
│   ├── utils/           # Utility functions (Assertions, ThreadDepth, MutationRisks)
│   ├── search/          # Search functionality (SearchService, semanticSearch)
│   ├── auth/            # Access control (AccessControl)
│   └── ui/              # UI components (LoginPage, ChatPage)
├── docs/
│   └── snippet-locations.md  # Maps questions to file/line numbers
└── README.md
```

## The 7 Questions

This project demonstrates answers to the following questions:

### 1. Abstraction Function (AF) and Representation Invariant (RI)
**File:** `src/models/Message.ts` (Lines 5-40)

Demonstrates how internal representation maps to abstract concepts (AF) and what invariants must hold (RI).

### 2. Declarative specification for search(query)
**File:** `src/search/SearchService.ts` (Lines 5-35)

Shows how to write declarative specifications that describe WHAT a function does without specifying HOW.

### 3. Risks of mutation in message objects
**File:** `src/utils/MutationRisks.ts` (Entire file)

Demonstrates why mutable timestamps, embeddings, and content cause bugs in message systems.

### 4. Using recursion to compute thread depth
**File:** `src/utils/ThreadDepth.ts` (Lines 1-80)

Shows recursive implementation for computing thread depth in a tree structure.

### 5. Assertions for debugging
**File:** `src/utils/Assertions.ts` (Entire file)

Examples of assertions for checking embedding dimensions, message invariants, and other debugging scenarios.

### 6. Partition testing for addMessage()
**File:** `src/services/MessageService.ts` (Lines 1-120)

Demonstrates partition testing by dividing input space into equivalence classes (content length, user validity, etc.).

### 7. Least privilege access control
**File:** `src/auth/AccessControl.ts` (Entire file)

Implements fine-grained permissions where users only get the minimum permissions necessary.

## UI Color Scheme

The UI components use the following color palette:
- **Deep Burgundy:** `#4B0908` (primary actions, headers)
- **Soft Gray:** `#E7EBF3` (backgrounds)
- **White:** `#FFFFFF` (cards, forms)
- **Black:** `#000000` (text)

See `src/ui/LoginPage.tsx` and `src/ui/ChatPage.tsx` for examples.

## Finding Code Snippets

For exact file names and line ranges for each question, see:
**`docs/snippet-locations.md`**

This document provides precise locations for taking screenshots or referencing specific code examples.

## Features (Conceptual)

Nexus includes concepts for:
- **Channels** - Communication spaces
- **Messages** - Text communications with threading support
- **User accounts** - User management
- **AI-based semantic search** - Placeholder for semanticSearch(query)
- **Keyword search** - Basic text matching
- **Message threading** - Reply chains with depth computation

## Note

This is a **partial, non-working implementation**. The code is structured to demonstrate concepts but is not intended to run as a complete application. Focus on the code structure, comments, and design patterns rather than execution.

## Technology

- **TypeScript** - Primary language
- **React** - UI framework (for UI components only)
- **No build system** - Files are standalone examples

## Usage

This project is for educational purposes. Review the code files to understand how each concept is demonstrated. Refer to `docs/snippet-locations.md` for quick navigation to specific examples.
