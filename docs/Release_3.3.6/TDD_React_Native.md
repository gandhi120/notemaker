# Technical Design Document (TDD) — React Native (Mobile Only)

> **TDD = HOW we will build the feature (Architecture, Data, API, Sync, UI Flow).**
> Refer to the PRD for WHAT + WHY.

---

## 1. Overview

- **Feature Summary:** Note-taking feature allowing users to create formatted notes with text, numbers, special characters, and formatting options (bold/underline), with validation for note names and content length.
- **Purpose:** Enable users to quickly record important information in an organized and readable format with offline-first support, referencing PRD Section 1.
- **Affected Screens/Modules:** New Note Editor screen, My Notes list screen, Notes module API layer, Realm schema for offline storage, Navigation stack modifications.
- **Dependencies:** Backend API endpoints for notes CRUD operations, Realm database for local persistence, Rich text editor library (react-native-pell-rich-editor or similar), Axios API client with interceptors, MobX store for note state management, Toast notifications for user feedback.
- **Assumptions:** User is authenticated (currently defaults to Anonymous User), device has local storage available, Realm encryption key configured, network interceptors configured for token management.

---

## 2. Technical Flow

### High-Level Flow

```
App Launch → Check Notes in Realm → Conditional Navigation (Home/MyNotes) → UI (Note Editor) → Input Validation → NotesStore (MobX) → API Layer (Axios) → Backend API → Response → Realm Storage (offline cache) → Sync Queue (if offline) → UI Update (Toast + Navigation)
```

### Initial App Launch Flow

1. App starts and initializes Realm database
2. System checks if any notes exist in Realm using `getAllNotes()`
3. **Conditional Navigation:**
   - If `notes.length > 0`: Navigate to MyNotesScreen (Drawer → Notes Stack)
   - If `notes.length === 0`: Navigate to HomeScreen (Welcome screen)
4. From HomeScreen, user taps "Go to My Notes" button → Navigate to MyNotesScreen

### Note Creation Flow

1. User opens Note Editor screen from navigation drawer, FAB button, or My Notes screen
2. User types content with formatting (bold/underline) using rich text editor component
3. User taps Save button
4. System validates input locally (name not empty, content <= 500 chars)
5. Pop-up modal appears prompting for note name
6. User enters note name (max 50 characters)
7. System validates note name (not empty, no duplicates, length check)
8. System saves note to Realm immediately with isSynced = false (optimistic UI)
9. System attempts API call to backend POST /api/notes
10. On API success: Update Realm record with isSynced = true, show success toast, navigate to My Notes
11. On API failure (offline): Keep isSynced = false, show local save toast, queue for background sync
12. Sync service retries pending notes when network is available
13. My Notes list displays saved notes from Realm with metadata (name, created by, created on)

### Note Deletion Flow

1. User views notes in My Notes screen
2. User long-presses or swipes on a note card
3. Delete button/option appears on the card
4. User taps delete button
5. Confirmation dialog appears with title "Delete Note" and message "Are you sure you want to delete this note?"
6. Dialog shows two buttons: "Cancel" (secondary) and "Delete" (danger/red)
7. If user taps "Cancel": Dialog closes, no action taken
8. If user taps "Delete": System proceeds with deletion
9. **Optimistic UI Update (happens immediately, no loading spinner):**
   - Mark note with isDeleted = true in Realm
   - Note disappears from list instantly (filtered out by `filteredNotes` computed property)
   - Show success toast: "Note deleted successfully"
10. **Background API Call (after UI update):**
    - Mark isSynced = false in Realm
    - Attempt DELETE /api/notes/:id/delete
11. **On API Success:**
    - Permanently remove note from Realm (hard delete)
    - Note stays removed from UI
12. **On API Failure (offline/network error):**
    - Keep isDeleted = true (note stays hidden in UI)
    - Add to sync queue for retry when online
    - User sees no error (note already appears deleted)
13. **Sync Service:**
    - Retries deletion when network is available
    - After successful sync, permanently removes from Realm
14. **Edge Case - All Notes Deleted:**
    - If last note is deleted, show empty state: "No notes available"
    - "Create your first note" button visible

---

## 3. Screens & Components

### New Screens

| Screen | Purpose | Route | Stack |
|--------|---------|-------|-------|
| HomeScreen | Welcome screen shown when no notes exist | /home | Root (initial) |
| NoteEditorScreen | Create/edit notes with rich text formatting | /notes/editor | Drawer → Notes Stack |
| MyNotesScreen | Display list of saved notes with metadata | /notes/my-notes | Drawer → Notes Stack |
| SaveNoteModal | Pop-up for entering note name before saving | Modal overlay | N/A (Modal) |

### Modified Screens

| Screen | Change | File Path |
|--------|--------|-----------|
| DrawerBar | Add "My Notes" navigation item | src/components/DrawerBar/index.js |
| Dashboard | Add "Create Note" quick action (optional) | src/modules/Dashboard/screens/DashboardScreen.js |

### Components

| Component | New/Modified | Reusable? | Location |
|-----------|--------------|-----------|----------|
| RichTextEditor | New | Yes | src/components/RichTextEditor/index.js |
| NoteCard | New | Yes | src/components/NoteCard/index.js |
| SaveNoteModal | New | Yes | src/components/SaveNoteModal/index.js |
| ConfirmDeleteModal | New | Yes | src/components/ConfirmDeleteModal/index.js |
| FormattingToolbar | New | Yes | src/components/FormattingToolbar/index.js |
| EmptyNotesView | New | Yes | src/components/EmptyNotesView/index.js |

### UI/UX Design Reference

**Design Link:** https://v0.app/chat/note-application-ui-vNOZvL4KDVu?utm_source=jigarhathiwalaessact-3932&utm_medium=referral&utm_campaign=share_chat&ref=55SMLA

**Note:** All screens and components listed above must follow the design specifications provided in the link. Refer to the design mockups for visual styling, layout, spacing, colors, typography, and interaction patterns.

---

## 4. Navigation

- **Stacks/tabs affected:**
  - Root Stack: HomeScreen (conditional initial screen)
  - Drawer navigation: "Notes Stack" with two screens (NoteEditorScreen, MyNotesScreen)
- **Navigation hierarchy:**
  - Root → HomeScreen (if no notes) OR DrawerStack (if notes exist)
  - DrawerStack → NotesStack → [NoteEditorScreen, MyNotesScreen]
- **Initial Route Logic:**
  - Implemented in RootNavigator using `initialRouteName` prop
  - Check notes count on app launch via `NotesStore.loadNotes()` and `notesStore.notes.length`
  - If notes exist: `initialRouteName="Drawer"` → lands on MyNotesScreen
  - If no notes: `initialRouteName="Home"` → lands on HomeScreen
- **Params passed between screens:**
  - HomeScreen: No params
  - NoteEditorScreen: `noteId` (optional, for editing existing note), `mode` (create/edit)
  - MyNotesScreen: No params
  - On save success: Navigate from NoteEditorScreen to MyNotesScreen with `refresh: true` param
- **Redirect rules:**
  - App launch with notes: Skip HomeScreen, go directly to MyNotesScreen
  - App launch without notes: Show HomeScreen first
  - From HomeScreen "Go to My Notes" button: Navigate to Drawer → MyNotesScreen
  - After successful note save: Navigate to MyNotesScreen
  - After note deletion: Remain on MyNotesScreen, refresh list
  - Back button on NoteEditorScreen with unsaved changes: Show confirmation dialog

---

## 5. API Contracts (Feature-Specific Only)

**Base URL:** `https://note-taker-backend-c193.onrender.com`

### Endpoint(s)

| Endpoint                 | Method | Request                  | Response              | Auth             |
| ------------------------ | ------ | ------------------------ | --------------------- | ---------------- |
| /api/notes/create        | POST   | Note creation payload    | Note object with ID   | No (future: Yes) |
| /api/notes               | GET    | None                     | Array of note objects | No (future: Yes) |
| /api/notes/:id           | GET    | None (ID in path)        | Single note object    | No (future: Yes) |
| /api/notes/:id/title     | PATCH  | Title update payload     | Updated note object   | No (future: Yes) |
| /api/notes/:id/content   | PATCH  | Content update payload   | Updated note object   | No (future: Yes) |
| /api/notes/:id/delete    | DELETE | None (ID in path)        | Success message       | No (future: Yes) |

### Request / Response (Only fields used by THIS feature)

**POST /api/notes/create Request:**

```json
{
  "name": "Meeting Notes",
  "content": "Discussed project timeline and deliverables",
  "formattedContent": "<p><b>Discussed</b> project timeline and <u>deliverables</u></p>"
}
```

**POST /api/notes/create Response (Success):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Meeting Notes",
    "content": "Discussed project timeline and deliverables",
    "formattedContent": "<p><b>Discussed</b> project timeline and <u>deliverables</u></p>",
    "createdBy": "Anonymous User",
    "createdAt": "2025-11-25T10:00:00.000Z",
    "updatedAt": "2025-11-25T10:00:00.000Z",
    "isDeleted": false
  },
  "message": "Note saved successfully."
}
```

**GET /api/notes Response (Success):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Meeting Notes",
      "content": "Discussed project timeline",
      "createdBy": "Anonymous User",
      "createdAt": "2025-11-25T10:00:00.000Z",
      "updatedAt": "2025-11-25T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

**PATCH /api/notes/:id/title Request:**

```json
{
  "title": "Updated Meeting Notes"
}
```

**PATCH /api/notes/:id/title Response (Success):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Updated Meeting Notes",
    "content": "Discussed project timeline and deliverables",
    "formattedContent": "<p><b>Discussed</b> project timeline and <u>deliverables</u></p>",
    "createdBy": "Anonymous User",
    "createdAt": "2025-11-25T10:00:00.000Z",
    "updatedAt": "2025-11-25T11:00:00.000Z",
    "isDeleted": false
  },
  "message": "Note title updated successfully."
}
```

**PATCH /api/notes/:id/content Request:**

```json
{
  "content": "Updated plain text content",
  "formattedContent": "<p><b>Updated</b> HTML formatted content</p>"
}
```

**PATCH /api/notes/:id/content Response (Success):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Meeting Notes",
    "content": "Updated plain text content",
    "formattedContent": "<p><b>Updated</b> HTML formatted content</p>",
    "createdBy": "Anonymous User",
    "createdAt": "2025-11-25T10:00:00.000Z",
    "updatedAt": "2025-11-25T11:30:00.000Z",
    "isDeleted": false
  },
  "message": "Note content updated successfully."
}
```

**Error Response (400 - Validation):**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Please enter a name before saving."
      }
    ]
  }
}
```

**Error Response (409 - Duplicate):**

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_NAME",
    "message": "A note with this name already exists. Please choose another name."
  }
}
```

---

## 6. Data & Offline Sync

### Realm/MMKV Schema (Minimal fields only)

**NOTES Schema (Realm):**

```json
{
  "name": "NOTES",
  "properties": {
    "id": "string",
    "name": "string",
    "content": "string",
    "formattedContent": "string",
    "createdBy": "string",
    "createdAt": "date",
    "updatedAt": "date",
    "isDeleted": "bool",
    "isSynced": "bool"
  },
  "primaryKey": "id"
}
```

### Offline Strategy

- **Read Operations:**
  - Strategy: API-first with Realm cache fallback
  - Flow: Attempt GET /api/notes → On success, cache to Realm → On failure (offline), load from Realm
  - Cache duration: Until next successful API call
  - Stale data handling: Show cached notes with sync status indicator

- **Write Operations:**
  - Strategy: Optimistic with queue-based sync
  - Flow:
    1. Save to Realm immediately with isSynced = false
    2. Show success message to user (optimistic)
    3. Attempt POST /api/notes in background
    4. On success: Update Realm record with isSynced = true, update note ID from server
    5. On failure: Keep isSynced = false, add to sync queue
  - Validation: Client-side validation before Realm write (name length, content length, duplicate name check in Realm)

- **Sync Rules:**
  - Trigger: Network state change (offline → online), manual sync button in My Notes
  - Retry mechanism: Exponential backoff (30s, 60s, 120s)
  - Max retries: 3 attempts
  - Conflict resolution: Server wins (last write wins based on updatedAt timestamp)
  - Sync queue: Process notes with isSynced = false in order of createdAt (oldest first)
  - Progress indicator: Show sync badge on My Notes list item if isSynced = false
  - Sync service location: src/utils/syncHelper.js (extend existing sync worker)

- **Update Operations:**
  - Strategy: Same as write (optimistic with sync queue)
  - Flow: Update Realm → Mark isSynced = false → Try PUT /api/notes/:id → Update on success

- **Delete Operations:**
  - Strategy: Optimistic UI with soft delete and sync
  - Flow (Best Practice - Optimistic Update):
    1. User confirms deletion in UI
    2. **Immediately** mark isDeleted = true in Realm (optimistic UI update)
    3. **Remove from UI immediately** (filter out deleted notes in computed property)
    4. Show success toast: "Note deleted successfully"
    5. In background, mark isSynced = false
    6. Attempt DELETE /api/notes/:id/delete API call
    7. On API success: Permanently remove from Realm (hard delete)
    8. On API failure (offline): Keep isDeleted = true, add to sync queue for retry
  - Offline handling: Note appears deleted in UI immediately, actual deletion synced when online
  - Rollback: If API fails 3 times, mark as sync error (do NOT restore note, keep deleted in UI)
  - Why optimistic? Better UX - user sees instant feedback, no waiting for API response

---

## 7. State Management

- **Global store slices affected:**
  - New NotesStore (MobX):
    - `@observable notes: []` - Array of note objects from API/Realm
    - `@observable currentNote: null` - Currently editing note
    - `@observable isLoading: boolean` - API call in progress
    - `@observable syncStatus: string` - 'synced' | 'syncing' | 'error' | 'pending'
    - `@action loadNotes()` - Fetch notes from API or Realm
    - `@action createNote(data)` - Save new note
    - `@action updateNote(id, data)` - Update existing note
    - `@action deleteNote(id)` - Soft delete note
    - `@action checkDuplicateName(name)` - Validate unique name
    - `@computed pendingNotes` - Filter notes with isSynced = false

- **Local component state:**
  - NoteEditorScreen:
    - `noteContent: string` - Raw text content from editor
    - `formattedContent: string` - HTML formatted content
    - `hasUnsavedChanges: boolean` - Track unsaved changes
    - `showSaveModal: boolean` - Control save modal visibility
  - SaveNoteModal:
    - `noteName: string` - User input for note name
    - `nameError: string` - Validation error message
  - MyNotesScreen:
    - `refreshing: boolean` - Pull-to-refresh state
    - `searchQuery: string` - Filter notes by name

- **Derived state logic:**
  - `@computed filteredNotes` in NotesStore: Filter notes by search query, exclude deleted notes
  - `@computed unsyncedCount` in NotesStore: Count of notes with isSynced = false
  - Format timestamp for display: Convert ISO date to "DD MMM YYYY, HH:mm" using moment.js

---

## 8. Validation & Error Handling

### Validation Rules

- **Note Name:**
  - Required: Cannot be empty (error: "Please enter a name before saving.")
  - Max length: 50 characters (error: "Name cannot exceed 50 characters.")
  - Unique: No duplicate names in active notes (error: "A note with this name already exists. Please choose another name.")
  - Validation timing: On save button press in modal

- **Note Content:**
  - Required: Cannot be empty (error: "Please add some content before saving.")
  - Max length: 500 characters (error: "Content cannot exceed 500 characters.")
  - Character counter: Display current/max characters (e.g., "245/500")
  - Validation timing: Real-time as user types, block save if invalid

- **Formatted Content:**
  - Required: Must exist (generated from editor)
  - Max length: 1000 characters (accounting for HTML tags)

- **Disabled states:**
  - Save button disabled if: content empty, content > 500 chars
  - Save modal confirm button disabled if: name empty, name > 50 chars, duplicate name exists

### API Error Handling

- **HTTP Status → UI Mapping:**
  - 400 (Validation Error): Show specific field error in toast or modal
  - 409 (Duplicate Name): Show error message in SaveNoteModal, keep modal open, highlight name input
  - 404 (Not Found): Show toast "Note not found", navigate back to My Notes
  - 500 (Server Error): Show toast "Failed to save note. Saved locally, will sync later.", note remains in queue
  - Network timeout: Treat as offline, show "Saved locally" toast
  - No internet: Skip API call, save to Realm only, show "Saved offline" toast

- **Retry rules:**
  - Client-side retry: 1 immediate retry on network timeout (5s timeout per attempt)
  - Background sync retry: Exponential backoff (30s, 60s, 120s) for notes with isSynced = false
  - Max retries: 3 attempts, then mark as sync error and show in UI

### UI States

- **Loading:**
  - NoteEditorScreen: Show spinner overlay during save API call
  - MyNotesScreen: Show skeleton loaders while fetching notes
  - Pull-to-refresh: Show refresh spinner at top of list

- **Error:**
  - API error: Show toast with error message (bottom of screen, auto-dismiss after 3s)
  - Validation error: Show inline error text below input field (red text)
  - Network error: Show offline banner at top of screen ("You're offline. Changes will sync later.")
  - Sync error: Show warning icon on note card in My Notes with "Sync failed" tooltip

- **Empty:**
  - My Notes list empty: Show centered illustration with text "No notes available" and "Create your first note" button
  - Search results empty: Show "No notes found" with search query
  - Deleted all notes: Same as empty state

### Edge Cases (Only relevant ones)

- **Offline:**
  - User creates note while offline: Save to Realm, show "Saved offline" toast, add sync indicator
  - User returns online: Background sync automatically syncs pending notes, update UI
  - Sync fails after 3 retries: Show persistent warning on note card, allow manual retry

- **Timeout:**
  - API call times out (> 5s): Treat as offline, save locally, queue for sync
  - Multiple timeouts: After 2 consecutive timeouts, skip API calls and work offline until network improves

- **Invalid params:**
  - noteId in navigation not found in Realm: Show toast "Note not found", navigate back to My Notes
  - Corrupted formattedContent in Realm: Fall back to plain content field, regenerate formatted content

- **Sync conflict:**
  - Server has newer version (updatedAt > local updatedAt): Server wins, update local Realm with server data, show toast "Note updated from server"
  - Local has newer version: Client wins, push local changes to server
  - Both modified (rare): Server wins, discard local changes, show toast "Note synced from server"

- **Duplicate name during sync:**
  - Note saved offline with name "X", another device syncs note with same name: Sync fails with 409, append timestamp to local note name (e.g., "X (2)"), retry sync

- **Memory/storage:**
  - Realm storage full: Show error "Storage full, please free up space", prevent new note creation
  - **Pagination implemented**: Notes list loads 20 notes at a time with infinite scroll

---

## 9. Platform-Specific Behavior (Only if required)

- **iOS-specific:**
  - Keyboard behavior: Use KeyboardAvoidingView with behavior="padding" on NoteEditorScreen
  - Safe area: Respect notch/home indicator on iPhone X+, wrap screens in SafeAreaView
  - Rich text editor: Use UITextView native component for better performance

- **Android-specific:**
  - Keyboard behavior: Use KeyboardAvoidingView with behavior="height"
  - Back button handling: On NoteEditorScreen with unsaved changes, show confirmation dialog instead of immediate navigation
  - Rich text editor: Use WebView-based editor for consistent formatting

- **Permissions required:**
  - No special permissions needed for this feature
  - Storage permission: Already granted as part of app setup

---

## 10. Performance (Feature-specific only)

- **List optimizations with Pagination:**
  - My Notes list: Use FlatList with `onEndReached` for infinite scroll pagination
  - **Pagination Settings:**
    - Page size: 20 notes per page
    - Load trigger: onEndReachedThreshold={0.5} (load when 50% from bottom)
    - Loading indicator: Show spinner at list footer while loading more notes
  - **API Integration:**
    - GET /api/notes?limit=20&page=1 for first page
    - GET /api/notes?limit=20&page=2 for second page, etc.
    - Response includes pagination metadata (currentPage, totalPages, hasNextPage)
  - **Realm Integration:**
    - Initial load: Load first 20 notes from Realm (instant UI)
    - API sync: Fetch first page from API, sync to Realm
    - Load more: Fetch next page from API, append to Realm
    - Offline: Load next 20 from Realm cache
  - Memoization: Wrap NoteCard component in React.memo to prevent unnecessary re-renders
  - Key extraction: Use note ID as FlatList key for efficient diffing
  - Fixed height optimization: Use `getItemLayout` for consistent card height (100px)

- **Image optimizations:**
  - Not applicable (no images in note content for Release 3.3.6)

- **Memoization:**
  - Memoize `filteredNotes` computed value in NotesStore to avoid re-filtering on every render
  - Memoize date formatting function: Cache formatted dates by timestamp
  - Use `useMemo` for formatting logic in components:
    - Parse HTML to plain text preview (first 100 chars)
    - Format createdAt/updatedAt timestamps

- **Rich text editor performance:**
  - Debounce text input: Update state every 300ms instead of on every keystroke
  - Lazy load editor: Load RichTextEditor component only when NoteEditorScreen mounts
  - Avoid re-renders: Use `shouldComponentUpdate` or React.memo on editor wrapper

- **Realm query optimization:**
  - Index on `createdAt` field for sorted queries
  - Index on `isDeleted` field for filtering active notes
  - Use `filtered()` method instead of loading all notes and filtering in JS

---

## 11. Testing Requirements

### Unit Tests

- **Components:**
  - RichTextEditor: Test formatting button actions (bold/underline toggle)
  - SaveNoteModal: Test name input validation, duplicate check, character counter
  - NoteCard: Test display of note metadata, sync status indicator
  - FormattingToolbar: Test button states (enabled/disabled based on selection)

- **Utils:**
  - Validation functions:
    - `validateNoteName(name)` - Test empty, max length, special chars
    - `validateNoteContent(content)` - Test empty, max length
    - `checkDuplicateName(name, notes)` - Test duplicate detection
  - Formatting functions:
    - `formatTimestamp(date)` - Test various date formats
    - `stripHtmlTags(html)` - Test HTML to plain text conversion
  - Realm CRUD functions:
    - `createNoteInRealm(data)` - Test record creation
    - `getNotesFromRealm()` - Test filtering and sorting

### Integration Tests

- **Navigation:**
  - Test navigation from DrawerBar → MyNotesScreen
  - Test navigation from MyNotesScreen → NoteEditorScreen (create mode)
  - Test navigation from NoteCard tap → NoteEditorScreen (edit mode)
  - Test back navigation with unsaved changes → confirmation dialog

- **API + DB:**
  - Test full flow: Create note → API call → Realm update → UI refresh
  - Test offline flow: Create note offline → save to Realm → network comes online → sync to API
  - Test error handling: API returns 409 → show duplicate error → keep modal open
  - Test sync queue: Create 3 notes offline → go online → verify all 3 sync in order
  - Test duplicate name handling: Create note "X" → try to create another "X" → verify error

### Manual Testing (minimal)

- **Android 10+:**
  - Test on Android 10, 11, 12, 13 devices
  - Test keyboard behavior (show/hide, avoid overlap with input)
  - Test back button handling (unsaved changes dialog)
  - Test offline mode (airplane mode on/off)

- **iOS 14+:**
  - Test on iOS 14, 15, 16, 17 devices
  - Test keyboard behavior (dismiss on tap outside)
  - Test safe area handling (notch, home indicator)
  - Test offline mode (airplane mode on/off)

- **Offline/online tests:**
  - Create note while offline → verify local save → go online → verify sync
  - Create note online → go offline → edit note → go online → verify update syncs
  - Delete note while offline → verify local deletion → go online → verify server deletion
  - Test sync conflict: Edit same note on two devices offline → go online → verify server wins
  - Test sync queue: Create 10 notes offline → go online → verify all sync without errors
  - Test network timeout: Slow network (2G) → verify timeout handling → verify note queued for retry
