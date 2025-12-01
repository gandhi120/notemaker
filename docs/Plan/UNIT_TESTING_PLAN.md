# Unit Testing Plan for NoteMaker App (Phase 1 - 6.5)

**Project:** NoteMaker React Native App
**Created:** 2025-11-27
**Coverage Target:** 85%+ (Strict Enforcement)
**Total Test Suites:** 22
**Total Test Cases:** ~240+

---

## Table of Contents

1. [Overview](#overview)
2. [Testing Stack & Setup](#testing-stack--setup)
3. [Phase 1: Utility Functions & Helpers](#phase-1-utility-functions--helpers)
4. [Phase 2: View Models](#phase-2-view-models)
5. [Phase 3: Components](#phase-3-components)
6. [Phase 4: Stores](#phase-4-stores)
7. [Phase 5: Screens](#phase-5-screens)
8. [Phase 6: Navigation](#phase-6-navigation)
9. [Phase 6.5: Integration Tests](#phase-65-integration-tests)
10. [Testing Best Practices](#testing-best-practices)
11. [Implementation Order](#implementation-order)
12. [Quick Start Checklist](#quick-start-checklist)
13. [Files to Create/Modify](#files-to-createmodify)

---

## Overview

This plan outlines a comprehensive unit testing strategy for all components, screens, view models, and utilities in the NoteMaker React Native application up to Phase 6.5.

### Key Principles

- **Bottom-Up Approach:** Start with utilities, then view models, stores, components, screens
- **Strict Coverage:** 85%+ enforced by Jest (tests will fail if below threshold)
- **Incremental Mocks:** Build mocks as needed, not all upfront
- **User Behavior Focus:** Test what users do, not implementation details
- **Fast & Reliable:** All tests should run in < 30 seconds, no flaky tests

---

## Testing Stack & Setup

### Installation Strategy

**Install all testing dependencies upfront** before starting any test implementation.

### Required Dependencies

**Install using npm:**

```bash
npm install --save-dev @testing-library/react-native@^12.4.0 @testing-library/jest-native@^5.4.3
```

**Already installed:**

- `jest@^29.6.3`
- `react-test-renderer@19.0.0`
- `@types/jest@^29.5.13`

### Jest Configuration

**Update `jest.config.js` with:**

```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-.*|@react-native-community|react-native-pell-rich-editor|react-native-webview|react-native-toast-message)/)',
  ],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/styles.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 85,
      branches: 85,
      functions: 85,
      lines: 85,
    },
  },
};
```

### Jest Setup File

**Create `jest.setup.js` at project root:**

```javascript
import '@testing-library/jest-native/extend-expect';

// Mock console warnings/errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
```

### Mock Setup Strategy

**Build mocks incrementally** as needed for each phase:

- **Phase 1:** Basic mocks (Realm helper, Toast)
- **Phase 2:** MobX store mocks, fake timers
- **Phase 3-5:** Component-specific mocks (Navigation, RichTextEditor)
- **Phase 6.5:** Integration test mocks

This approach keeps initial setup minimal and creates mocks only when needed.

---

## Phase 1: Utility Functions & Helpers

**Priority:** HIGH (Foundational logic layer)

### 1.1 Validation Utilities

**File:** `src/utils/__tests__/validation.test.ts`
**Testing:** `src/utils/validation.ts`
**Estimated Test Cases:** 15

#### Test Cases

##### `validateNoteTitle()`

- ✓ Valid title (1-50 chars)
- ✓ Empty title (should fail)
- ✓ Title with only whitespace (should fail)
- ✓ Title exactly 50 chars (should pass)
- ✓ Title over 50 chars (should fail)
- ✓ Returns correct error messages

##### `validateNoteContent()`

- ✓ Valid HTML content
- ✓ Empty content (should fail)
- ✓ Content with only HTML tags (should fail)
- ✓ Content exactly 500 chars plain text (should pass)
- ✓ Content over 500 chars plain text (should fail)
- ✓ HTML tags not counted in character limit
- ✓ Returns correct error messages

##### `getContentCharacterCount()`

- ✓ Correctly strips HTML tags
- ✓ Handles nested HTML
- ✓ Handles empty string
- ✓ Handles plain text

##### `isContentEmpty()`

- ✓ Returns true for empty string
- ✓ Returns true for HTML with no text
- ✓ Returns false for content with text

**Coverage Target:** 90%+

---

### 1.2 Realm Helper

**File:** `src/utils/__tests__/realmHelper.test.ts`
**Testing:** `src/utils/realmHelper.ts`
**Estimated Test Cases:** 30
**Mock Strategy:** Mock Realm database with in-memory objects

#### Test Cases

##### `mapRealmNoteToState()`

- ✓ Correctly maps all fields
- ✓ Maps `name` → `title`
- ✓ Maps `formattedContent` → `content`
- ✓ Preserves timestamps

##### `getAllNotes()`

- ✓ Returns all non-deleted notes
- ✓ Sorts by createdAt (newest first)
- ✓ Filters out deleted notes
- ✓ Returns empty array when no notes

##### `getNoteById()`

- ✓ Returns correct note when found
- ✓ Returns null when not found
- ✓ Returns null for deleted note

##### `createNote()`

- ✓ Creates note with all required fields
- ✓ Generates unique ID
- ✓ Sets timestamps correctly
- ✓ Sets isSynced to false by default
- ✓ Handles errors gracefully

##### `updateNote()`

- ✓ Updates title correctly
- ✓ Updates content and formattedContent
- ✓ Updates updatedAt timestamp
- ✓ Returns null for non-existent note

##### `deleteNote()`

- ✓ Sets isDeleted flag to true
- ✓ Doesn't actually delete from DB (soft delete)
- ✓ Handles non-existent note

##### `checkDuplicateName()`

- ✓ Detects duplicate titles (case-insensitive)
- ✓ Excludes specified noteId from check
- ✓ Returns false for unique titles

##### `getUnsyncedNotes()` & `markNoteAsSynced()`

- ✓ Returns only unsynced notes
- ✓ Marks note as synced correctly

**Coverage Target:** 90%+

---

### 1.3 Toast Configuration

**File:** `src/config/__tests__/toast.test.ts`
**Testing:** `src/config/toast.tsx`
**Estimated Test Cases:** 6

#### Test Cases

##### `showSuccessToast()`

- ✓ Calls Toast.show with correct type
- ✓ Uses correct styling (green border)
- ✓ Includes message and description

##### `showErrorToast()`

- ✓ Calls Toast.show with error styling (red border)
- ✓ Uses longer visibility (4s)

##### `showInfoToast()`

- ✓ Calls Toast.show with info styling (blue border)

**Coverage Target:** 80%+

---

## Phase 2: View Models

**Priority:** HIGH (Business logic & state management)

### 2.1 NoteEditorViewModel

**File:** `src/viewmodels/__tests__/NoteEditorViewModel.test.ts`
**Testing:** `src/viewmodels/NoteEditorViewModel.ts`
**Estimated Test Cases:** 20
**Mock Strategy:** Mock NotesStore with MobX observables

#### Test Cases

##### Initialization

- ✓ Initializes with empty content/title for new note
- ✓ Loads existing note content when editing
- ✓ Sets `isEditing` correctly based on noteId

##### Content Management

- ✓ `handleContentChange()` updates content
- ✓ Sets `hasUnsavedChanges` to true on content change
- ✓ `characterCount` computed property strips HTML
- ✓ `canSave` returns false when content empty
- ✓ `canSave` returns false when over 500 chars
- ✓ `canSave` returns true for valid content

##### Save Operations

- ✓ `handleSavePress()` shows modal when validation passes
- ✓ `handleSavePress()` shows error toast for invalid content
- ✓ `saveNote()` validates title (required, max 50 chars)
- ✓ `saveNote()` checks for duplicate titles
- ✓ `saveNote()` excludes current note from duplicate check
- ✓ `saveNote()` creates note when not editing
- ✓ `saveNote()` updates note when editing
- ✓ `saveNote()` shows success toast on save
- ✓ `saveNote()` shows error toast on failure
- ✓ `saveNote()` resets unsaved changes on success
- ✓ `saveNote()` hides modal on success

##### Cleanup

- ✓ `cleanup()` resets all state
- ✓ `resetUnsavedChanges()` clears flag

**Coverage Target:** 90%+

---

### 2.2 MyNotesViewModel

**File:** `src/viewmodels/__tests__/MyNotesViewModel.test.ts`
**Testing:** `src/viewmodels/MyNotesViewModel.ts`
**Estimated Test Cases:** 25
**Mock Strategy:** Mock NotesStore, use fake timers for debounce

#### Test Cases

##### Initialization

- ✓ Loads notes on `initialize()`
- ✓ Sets loading state correctly

##### Search & Filtering

- ✓ `setSearchQuery()` updates searchQuery immediately
- ✓ `debouncedSearchQuery` updates after 300ms
- ✓ Debounce cancels previous timer on rapid input
- ✓ `filteredNotes` filters by title (case-insensitive)
- ✓ `filteredNotes` filters by content (case-insensitive)
- ✓ `filteredNotes` returns all notes when query empty
- ✓ `clearSearch()` resets query

##### Computed Properties

- ✓ `unsyncedCount` returns correct count
- ✓ `hasNotes` returns true when notes exist
- ✓ `hasSearchResults` returns false for no matches

##### Data Operations

- ✓ `refreshNotes()` sets isRefreshing flag
- ✓ `refreshNotes()` loads notes from store
- ✓ `deleteNote()` calls store deleteNote
- ✓ `getNoteById()` returns correct note

##### Utility Methods

- ✓ `formatDate()` formats today as time (h:mm A)
- ✓ `formatDate()` formats yesterday correctly
- ✓ `formatDate()` formats within week as weekday
- ✓ `formatDate()` formats older as full date
- ✓ `getPreviewText()` strips HTML
- ✓ `getPreviewText()` truncates to 100 chars

##### Cleanup

- ✓ `cleanup()` clears debounce timer

**Coverage Target:** 90%+

---

## Phase 3: Components

**Priority:** MEDIUM (UI components with React Testing Library)

### 3.1 EmptyNotesView

**File:** `src/components/EmptyNotesView/__tests__/EmptyNotesView.test.tsx`
**Testing:** `src/components/EmptyNotesView/index.tsx`
**Estimated Test Cases:** 4

#### Test Cases

- ✓ Renders with default message
- ✓ Renders with custom message prop
- ✓ Displays emoji (📝)
- ✓ Applies correct styles

**Coverage Target:** 80%+
**Priority:** LOW (simple presentational)

---

### 3.2 ConfirmDeleteModal

**File:** `src/components/ConfirmDeleteModal/__tests__/ConfirmDeleteModal.test.tsx`
**Testing:** `src/components/ConfirmDeleteModal/index.tsx`
**Estimated Test Cases:** 6

#### Test Cases

- ✓ Renders when visible prop is true
- ✓ Doesn't render when visible is false
- ✓ Displays note title in message
- ✓ Calls `onCancel` when Cancel pressed
- ✓ Calls `onConfirm` when Delete pressed
- ✓ Shows warning message "This action cannot be undone"

**Coverage Target:** 80%+

---

### 3.3 SaveNoteModal

**File:** `src/components/SaveNoteModal/__tests__/SaveNoteModal.test.tsx`
**Testing:** `src/components/SaveNoteModal/index.tsx`
**Estimated Test Cases:** 12

#### Test Cases

- ✓ Renders when visible prop is true
- ✓ Displays initial title in input
- ✓ Updates title on text change
- ✓ Save button disabled when title empty
- ✓ Save button enabled when title has text
- ✓ Calls `onSave` with trimmed title
- ✓ Calls `onCancel` when Cancel pressed
- ✓ Resets title on cancel
- ✓ Clears title after save
- ✓ Syncs initialTitle via useEffect
- ✓ Auto-focuses input when opened
- ✓ Handles async onSave

**Coverage Target:** 85%+

---

### 3.4 NoteCard

**File:** `src/components/NoteCard/__tests__/NoteCard.test.tsx`
**Testing:** `src/components/NoteCard/index.tsx`
**Estimated Test Cases:** 20

#### Test Cases

##### Rendering

- ✓ Renders note title
- ✓ Renders preview (stripped HTML)
- ✓ Truncates preview to 100 chars
- ✓ Shows unsynced indicator when isSynced false
- ✓ Hides unsynced indicator when isSynced true
- ✓ Shows delete button when onDelete provided
- ✓ Hides delete button when onDelete not provided
- ✓ Has correct testIDs

##### Interactions

- ✓ Calls `onPress` when card tapped
- ✓ Calls `onDelete` when delete button tapped
- ✓ Delete stops event propagation

##### Date Formatting

- ✓ Shows time for today (h:mm A)
- ✓ Shows "Yesterday" for yesterday
- ✓ Shows weekday for within 7 days
- ✓ Shows full date for older notes (MMM D, YYYY)

##### HTML Stripping

- ✓ Strips HTML tags from content
- ✓ Handles nested HTML
- ✓ Handles empty content

**Coverage Target:** 85%+
**Priority:** HIGH (complex logic)

---

### 3.5 RichTextEditor

**File:** `src/components/RichTextEditor/__tests__/RichTextEditor.test.tsx`
**Testing:** `src/components/RichTextEditor/index.tsx`
**Estimated Test Cases:** 6
**Mock Strategy:** Mock `react-native-pell-rich-editor`

#### Test Cases

- ✓ Renders with placeholder
- ✓ Renders with initial content
- ✓ Calls `onContentChange` when content changes
- ✓ Renders all toolbar actions (10 total)
- ✓ Has correct testID
- ✓ Auto-focuses editor

**Coverage Target:** 70%+
**Priority:** MEDIUM (mostly integration)

---

## Phase 4: Stores

**Priority:** HIGH (MobX state management)

### 4.1 NotesStore

**File:** `src/stores/__tests__/NotesStore.test.ts`
**Testing:** `src/stores/NotesStore.ts`
**Estimated Test Cases:** 20
**Mock Strategy:** Mock realmHelper functions

#### Test Cases

##### Initialization

- ✓ Initializes with empty notes array
- ✓ `isLoading` starts as false
- ✓ `error` starts as null

##### CRUD Operations

- ✓ `loadNotes()` fetches from realm and updates notes
- ✓ `loadNotes()` sets isLoading state
- ✓ `loadNotes()` handles errors
- ✓ `createNote()` calls realmHelper.createNote
- ✓ `createNote()` reloads notes after create
- ✓ `updateNoteData()` calls realmHelper.updateNote
- ✓ `updateNoteData()` reloads notes after update
- ✓ `deleteNoteData()` calls realmHelper.deleteNote
- ✓ `deleteNoteData()` reloads notes after delete

##### Computed Properties

- ✓ `selectedNote` returns correct note
- ✓ `selectedNote` returns undefined when not selected
- ✓ `syncedNotesCount` counts synced notes
- ✓ `unsyncedNotesCount` counts unsynced notes

##### Utility Methods

- ✓ `selectNote()` sets selectedNoteId
- ✓ `checkDuplicateName()` calls realmHelper
- ✓ `clearError()` clears error message
- ✓ `reset()` resets to initial state

**Coverage Target:** 90%+

---

### 4.2 RootStore

**File:** `src/stores/__tests__/RootStore.test.ts`
**Testing:** `src/stores/RootStore.ts`
**Estimated Test Cases:** 4

#### Test Cases

- ✓ Contains notesStore instance
- ✓ `reset()` calls reset on all child stores
- ✓ `getRootStore()` returns singleton instance
- ✓ `resetRootStore()` creates new instance

**Coverage Target:** 80%+
**Priority:** LOW (simple orchestration)

---

## Phase 5: Screens

**Priority:** HIGH (Screen components with navigation)

### 5.1 HomeScreen

**File:** `src/views/screens/__tests__/HomeScreen.test.tsx`
**Testing:** `src/views/screens/HomeScreen.tsx`
**Estimated Test Cases:** 5
**Mock Strategy:** Mock navigation

#### Test Cases

- ✓ Renders welcome title
- ✓ Renders subtitle
- ✓ Renders "Go to My Notes" button
- ✓ Navigates to Drawer > NotesStack > MyNotes on button press
- ✓ Applies correct styles

**Coverage Target:** 80%+
**Priority:** LOW (simple navigation)

---

### 5.2 MyNotesScreen

**File:** `src/views/screens/__tests__/MyNotesScreen.test.tsx`
**Testing:** `src/views/screens/MyNotesScreen.tsx`
**Estimated Test Cases:** 15
**Mock Strategy:** Mock MyNotesViewModel, navigation, stores

#### Test Cases

##### Rendering

- ✓ Renders search input
- ✓ Renders notes list (FlatList)
- ✓ Renders FAB button
- ✓ Shows EmptyNotesView when no notes
- ✓ Shows "No results" when search has no matches
- ✓ Shows unsynced badge with count

##### Interactions

- ✓ Updates search on text input
- ✓ Navigates to NoteEditor on FAB press
- ✓ Navigates to NoteEditor with noteId on card press
- ✓ Opens delete modal on card delete press
- ✓ Calls deleteNote on confirm delete
- ✓ Shows toast on successful delete
- ✓ Closes modal on cancel

##### Lifecycle

- ✓ Initializes ViewModel on mount
- ✓ Reloads notes on focus (useFocusEffect)
- ✓ Cleans up ViewModel on unmount

##### Pull to Refresh

- ✓ Triggers refreshNotes on pull down
- ✓ Shows RefreshControl while refreshing

**Coverage Target:** 85%+

---

### 5.3 NoteEditorScreen

**File:** `src/views/screens/__tests__/NoteEditorScreen.test.tsx`
**Testing:** `src/views/screens/NoteEditorScreen.tsx`
**Estimated Test Cases:** 12
**Mock Strategy:** Mock NoteEditorViewModel, navigation, Alert

#### Test Cases

##### Rendering

- ✓ Renders RichTextEditor
- ✓ Renders character counter
- ✓ Shows "Save" button for new note
- ✓ Shows "Update" button for editing
- ✓ Disables save when canSave is false

##### Interactions

- ✓ Updates content on editor change
- ✓ Opens save modal on save button press
- ✓ Calls saveNote on modal save
- ✓ Shows alert on back with unsaved changes
- ✓ Navigates back without alert when no changes

##### Lifecycle

- ✓ Initializes ViewModel on mount
- ✓ Loads note data when editing
- ✓ Cleans up ViewModel on unmount
- ✓ Adds back button listener
- ✓ Removes listener on unmount

**Coverage Target:** 85%+

---

## Phase 6: Navigation

**Priority:** LOW (Navigation configuration)

### 6.1 Navigation Type Safety

**File:** `src/navigation/__tests__/types.test.ts`
**Testing:** `src/navigation/types.ts`
**Estimated Test Cases:** 2

#### Test Cases

- ✓ Type definitions compile correctly
- ✓ Route param types are correct

**Coverage Target:** N/A (TypeScript checks)

---

### 6.2 NotesStack

**File:** `src/navigation/__tests__/NotesStack.test.tsx`
**Testing:** `src/navigation/NotesStack.tsx`
**Estimated Test Cases:** 5

#### Test Cases

- ✓ Renders Stack.Navigator
- ✓ Contains MyNotes screen
- ✓ Contains NoteEditor screen
- ✓ MyNotes is initial route
- ✓ Applies correct header styling

**Coverage Target:** 70%+

---

## Phase 6.5: Integration Tests

**Priority:** MEDIUM (End-to-end flows)

### 6.5.1 Note Creation Flow

**File:** `__tests__/integration/NoteCreationFlow.test.tsx`
**Estimated Test Cases:** 3

#### Test Cases

- ✓ Full flow: Open editor → Type content → Save → See in list
- ✓ Validation prevents saving invalid notes
- ✓ Duplicate title detection works end-to-end

---

### 6.5.2 Note Editing Flow

**File:** `__tests__/integration/NoteEditingFlow.test.tsx`
**Estimated Test Cases:** 2

#### Test Cases

- ✓ Full flow: Select note → Edit content → Update → See changes
- ✓ Unsaved changes alert appears on back navigation

---

### 6.5.3 Search & Filter Flow

**File:** `__tests__/integration/SearchFlow.test.tsx`
**Estimated Test Cases:** 3

#### Test Cases

- ✓ Search filters notes correctly
- ✓ Debounce works as expected (300ms)
- ✓ Clear search shows all notes

---

## Testing Best Practices

### 1. Test Organization

```
src/
  components/
    NoteCard/
      __tests__/
        NoteCard.test.tsx
      index.tsx
      styles.ts
```

### 2. Test Structure (AAA Pattern)

```typescript
describe('ComponentName', () => {
  it('should do something when condition', () => {
    // Arrange: Setup test data and mocks
    const mockData = { ... };

    // Act: Perform the action
    const result = functionToTest(mockData);

    // Assert: Verify the result
    expect(result).toBe(expectedValue);
  });
});
```

### 3. Mock Guidelines

- Mock external dependencies (Realm, Navigation, Toast)
- Use real MobX reactions where possible
- Mock timers for debounce tests (`jest.useFakeTimers()`)
- Snapshot tests only for stable UI
- Keep mocks simple and maintainable

### 4. Coverage Targets (STRICT ENFORCEMENT)

| Category | Target | Enforcement |
|----------|--------|-------------|
| **Overall** | 85%+ | ✅ Jest enforced |
| **View Models** | 90%+ | Critical business logic |
| **Utilities** | 90%+ | Pure functions |
| **Components** | 80%+ | UI components |
| **Stores** | 90%+ | State management |
| **Screens** | 85%+ | User-facing screens |

**Note:** Jest will **fail** if global coverage drops below 85% for statements, branches, functions, or lines.

---

## Implementation Order

Following the **bottom-up approach**:

### 1. Phase 1: Utilities (Week 1)

- **validation.ts** - Input validation logic
- **realmHelper.ts** - Database operations
- **toast.tsx** - Notification helpers
- **Mocks needed:** Realm database, Toast

### 2. Phase 2: View Models (Week 2)

- **NoteEditorViewModel** - Editor business logic
- **MyNotesViewModel** - List and search logic
- **Mocks needed:** NotesStore, fake timers for debounce

### 3. Phase 4: Stores (Week 3)

- **NotesStore** - MobX state management
- **RootStore** - Store orchestration
- **Mocks needed:** realmHelper functions

### 4. Phase 3: Components (Week 4)

- **NoteCard** - Note list item
- **SaveNoteModal** - Title entry modal
- **ConfirmDeleteModal** - Delete confirmation
- **EmptyNotesView** - Empty state
- **RichTextEditor** - Rich text editor
- **Mocks needed:** react-native-pell-rich-editor, moment.js

### 5. Phase 5: Screens (Week 5)

- **HomeScreen** - Welcome screen
- **MyNotesScreen** - Notes list screen
- **NoteEditorScreen** - Note editor screen
- **Mocks needed:** Navigation, Alert

### 6. Phase 6: Navigation (Week 6)

- **types.test.ts** - Type safety
- **NotesStack** - Stack navigation
- **Mocks needed:** @react-navigation

### 7. Phase 6.5: Integration (Week 7)

- **Note Creation Flow** - E2E creation
- **Note Editing Flow** - E2E editing
- **Search Flow** - E2E search
- **Mocks needed:** Full integration mocks

---

## Quick Start Checklist

### Setup Phase

- [ ] **Step 1:** Install dependencies

  ```bash
  npm install --save-dev @testing-library/react-native@^12.4.0 @testing-library/jest-native@^5.4.3
  ```

- [ ] **Step 2:** Update `jest.config.js`
  - Replace content with configuration from this plan

- [ ] **Step 3:** Create `jest.setup.js`
  - Add at project root with setup code from this plan

- [ ] **Step 4:** Create file mock

  ```bash
  mkdir -p __mocks__
  ```

  - Create `__mocks__/fileMock.js`:

    ```javascript
    module.exports = 'test-file-stub';
    ```

- [ ] **Step 5:** Verify setup

  ```bash
  npm test -- --version
  npm test -- --listTests
  ```

### Phase 1: Utilities (Start Here)

- [ ] Create `src/utils/__tests__/` directory
- [ ] Write `validation.test.ts` (15 test cases)
- [ ] Create Realm mocks for realmHelper tests
- [ ] Write `realmHelper.test.ts` (30 test cases)
- [ ] Write `toast.test.ts` (6 test cases)
- [ ] Run tests: `npm test src/utils`
- [ ] Check coverage: `npm test -- --coverage src/utils`
- [ ] Update `TESTING_PROGRESS.md`

### Phase 2: View Models

- [ ] Create `src/viewmodels/__tests__/` directory
- [ ] Mock NotesStore for ViewModel tests
- [ ] Write `NoteEditorViewModel.test.ts` (20 test cases)
- [ ] Setup fake timers for MyNotesViewModel
- [ ] Write `MyNotesViewModel.test.ts` (25 test cases)
- [ ] Run tests: `npm test src/viewmodels`
- [ ] Check coverage: `npm test -- --coverage src/viewmodels`
- [ ] Update `TESTING_PROGRESS.md`

### Continue with Remaining Phases

- [ ] Phase 4: Stores
- [ ] Phase 3: Components
- [ ] Phase 5: Screens
- [ ] Phase 6: Navigation
- [ ] Phase 6.5: Integration

---

## Files to Create/Modify

### New Test Files (22 total)

1. `jest.setup.js` - Jest configuration
2. `__mocks__/fileMock.js` - Asset mock
3. `src/utils/__tests__/validation.test.ts`
4. `src/utils/__tests__/realmHelper.test.ts`
5. `src/config/__tests__/toast.test.ts`
6. `src/viewmodels/__tests__/NoteEditorViewModel.test.ts`
7. `src/viewmodels/__tests__/MyNotesViewModel.test.ts`
8. `src/stores/__tests__/NotesStore.test.ts`
9. `src/stores/__tests__/RootStore.test.ts`
10. `src/components/EmptyNotesView/__tests__/EmptyNotesView.test.tsx`
11. `src/components/ConfirmDeleteModal/__tests__/ConfirmDeleteModal.test.tsx`
12. `src/components/SaveNoteModal/__tests__/SaveNoteModal.test.tsx`
13. `src/components/NoteCard/__tests__/NoteCard.test.tsx`
14. `src/components/RichTextEditor/__tests__/RichTextEditor.test.tsx`
15. `src/views/screens/__tests__/HomeScreen.test.tsx`
16. `src/views/screens/__tests__/MyNotesScreen.test.tsx`
17. `src/views/screens/__tests__/NoteEditorScreen.test.tsx`
18. `src/navigation/__tests__/types.test.ts`
19. `src/navigation/__tests__/NotesStack.test.tsx`
20. `__tests__/integration/NoteCreationFlow.test.tsx`
21. `__tests__/integration/NoteEditingFlow.test.tsx`
22. `__tests__/integration/SearchFlow.test.tsx`

### Modified Files

1. `jest.config.js` - Update with strict coverage configuration
2. `TESTING_PROGRESS.md` - Update after each test suite completion

### Mock Files (Created Incrementally)

- Created as needed per phase
- See Mock Setup Strategy above

---

## Success Criteria

- ✅ All unit tests pass in CI/CD
- ✅ Code coverage meets 85%+ threshold (enforced)
- ✅ Tests run in < 30 seconds
- ✅ No flaky tests (consistent results)
- ✅ Tests serve as documentation
- ✅ Mocks are maintainable and realistic

---

## Useful Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test validation.test.ts

# Run tests for specific directory
npm test src/utils

# Check coverage
npm test -- --coverage

# Check coverage for specific directory
npm test -- --coverage src/viewmodels

# List all test files
npm test -- --listTests

# Run tests with verbose output
npm test -- --verbose

# Update snapshots
npm test -- -u
```

---

## Notes & Tips

- ✓ Use `jest.useFakeTimers()` for debounce tests
- ✓ Mock Realm with simple in-memory objects
- ✓ Use `@testing-library/react-native` queries (getByTestId, getByText)
- ✓ Test user behavior, not implementation details
- ✓ Keep tests independent (no shared state between tests)
- ✓ Run `npm test -- --coverage` frequently to check progress
- ✓ Update `TESTING_PROGRESS.md` after completing each test suite
- ✓ All components already have testIDs - use them!
- ✓ Focus on observable behavior, not internal state
- ✓ If a test is flaky, fix it immediately - don't skip it

---

**Last Updated:** 2025-11-27
**Version:** 1.0
**Status:** Ready to implement
