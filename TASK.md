# Grace Daily Devotional - Development Task

You are working on Grace Daily Devotional, a React+TypeScript+Vite web app for Christian devotionals.

## Current State
- **Home**: Shows daily verse (AI generated), reading progress, explore menu ✅
- **Search**: Works with Gemini AI ✅
- **Reading**: Only shows reading plans UI, NO actual Bible text ❌
- **Profile**: Static UI, no real auth ❌

## Your Mission

Implement these features IN ORDER:

### 1. BIBLE READING (Priority 1)
- Add actual Bible text to the Reading component
- Use a free Bible API or embed ACF (Almeida Corrigida Fiel) text
- Allow navigation: Books -> Chapters -> Verses
- Show verse text beautifully formatted
- Create a BibleService for fetching/managing Bible data

### 2. FAVORITES (Priority 2)
- Add ability to save favorite verses
- Store in localStorage
- Create a Favorites view/component accessible from Home
- Allow removing favorites
- Show heart icon on favorited verses

### 3. NOTES (Priority 3)
- Add personal notes per verse
- Store in localStorage
- Show notes indicator on verses that have notes
- Allow editing/deleting notes
- Create a simple note editor modal

## Technical Guidelines
- Keep the existing beautiful sage-green design
- All UI text in Portuguese (Brazilian)
- Use TypeScript properly with types
- Follow React best practices with hooks
- Store data in localStorage for persistence

## Start Now
Read the existing code first, then implement each feature. Report progress as you complete each one.
