# Product Requirements Document (PRD)

> **PRD = WHAT + WHY** | Technical details (HOW) belong in the TDD

## 1. Overview

- Feature summary: A note-taking feature that allows users to create and format notes containing text, numbers, and special characters, with options to apply bold and underline formatting.
- Problem/Pain point: Users need a simple way to quickly record important information in an organized and readable format.
- Objective: Provide a clean, user-friendly note creation experience where users can write formatted notes and save them with unique names for easy identification.

## 2. Scope

### In Scope

- Creation of notes with text, numbers, and special characters.
- Formatting options including bold and underline.
- Save flow with a pop-up for entering a note name.
- Validation for note name length, duplication, and empty inputs.
- Display of saved notes under the "My Notes" list with metadata (name, created by, created on).
- Edit existing notes with updated content and formatting.
- Delete notes with confirmation dialog.
- Soft delete implementation (optimistic UI with backend sync).
- UI based on provided design link.

### Out of Scope

- Note sharing.
- Multi-device sync.
- Rich text editor beyond bold and underline.
- Folder organization.
- Voice notes.
- Image attachments.

### Future Considerations

- Additional formatting options such as italics or highlighting.
- Tagging and categorization.
- Cloud backup.
- Search and filtering of notes.

## 5. User Stories + Acceptance Criteria

### User Story 1

**As a** user
**I want to** create and format notes containing text, numbers, and symbols
**So that** I can save important information in an organized and readable way.

**Acceptance Criteria:**

- User can type alphabets, numbers, and special characters (up to 500 characters).
- Bold and underline formatting can be applied to selected text.
- Tapping Save opens a pop-up requiring a note name.
- Empty name shows: “Please enter a name before saving.”
- Duplicate names show: “A note with this name already exists. Please choose another name.”
- Name > 50 characters shows validation error.
- Successful save shows: “Note saved successfully.”
- Saved note appears with: note name, created by, created on date/time.

**Priority:** High

### User Story 2

**As a** user
**I want to** delete notes I no longer need
**So that** I can keep my notes list clean and organized.

**Acceptance Criteria:**

- User can long-press or swipe on a note card to reveal delete option.
- Tapping delete shows confirmation dialog: "Are you sure you want to delete this note?"
- Confirmation dialog has two buttons: "Cancel" and "Delete"
- Tapping "Cancel" closes dialog without deleting.
- Tapping "Delete" removes note from list immediately.
- Success message shows: "Note deleted successfully."
- If offline, note is marked for deletion and synced when online.
- Deleted note disappears from "My Notes" list.
- If all notes are deleted, empty state is shown.

**Priority:** High

## 6. Impact Analysis

### User Impact

- Affected Users: All demo users.
- Impact Level: Medium
- Change Management: Users need to understand formatting + save flow.
- Communication Plan: Basic onboarding (TBD).

### Business Impact

- Stakeholders: Product team, UI/UX team, demo clients.
- Process Changes: Notes accessible via My Notes.
- Training Needs: Minimal.

### Technical Impact

- Affected Systems: Notes module, storage layer.
- Data Impact: Storage of note content + metadata.
- Integration Impact: None.
- Backward Compatibility: No breaking changes.

## 7. Functional Requirements

### Feature 1: Note Creation and Formatting

**Description:** Users can enter text, numbers, and symbols into a note and apply bold or underline formatting.

**Requirements:**

- FR1.1: System must allow entry of alphabets, numbers, and special characters.
- FR1.2: System must allow formatting text with bold and underline.
- FR1.3: System must restrict note content to a maximum of 500 characters.
- FR1.4: System must prevent saving if note is empty.

**Business Rules:**

- Notes cannot exceed 500 characters.
- Formatting applies only to selected text.

### RBAC

| Role | Permission |
|------|------------|
| Inspector | Create, view & delete notes |
| Associate | Create, view & delete notes |
| Project Admin | Full access (create, view, edit, delete) |
| System Admin | Full access (create, view, edit, delete) |

### Feature 2: Save Note with Validation

**Description:** Users can save notes by entering a unique name.

**Requirements:**

- FR2.1: Save pop-up must appear with title “Save Your Note”.
- FR2.2: Input must show placeholder “Enter note name”.
- FR2.3: Name cannot be empty.
- FR2.4: Name cannot exceed 50 characters.
- FR2.5: Duplicate names must not be allowed.
- FR2.6: Correct toast messages must be shown.

**Business Rules:**

- Note names must be unique.

### Feature 3: Delete Note with Confirmation

**Description:** Users can delete notes they no longer need with confirmation to prevent accidental deletion.

**Requirements:**

- FR3.1: User can trigger delete action via long-press or swipe gesture on note card.
- FR3.2: Confirmation dialog must appear with message "Are you sure you want to delete this note?"
- FR3.3: Dialog must have "Cancel" and "Delete" buttons.
- FR3.4: Tapping "Cancel" closes dialog without deleting.
- FR3.5: Tapping "Delete" removes note from UI immediately (optimistic UI).
- FR3.6: System must attempt API call to backend DELETE endpoint.
- FR3.7: Success toast must show: "Note deleted successfully."
- FR3.8: If offline, note must be marked for deletion and synced when online.
- FR3.9: Deleted notes must not appear in My Notes list.
- FR3.10: If all notes deleted, empty state must be displayed.

**Business Rules:**

- Deleted notes are soft-deleted (marked with isDeleted flag) for sync purposes.
- Once synced, notes are permanently removed from local storage.
- Users cannot undo deletion (no restore functionality in this release).
- Delete action requires user confirmation to prevent accidental loss.

## 8. Non-Functional Requirements

### Performance

- Save must complete within TBD seconds.
- My Notes list must load within TBD seconds.

### Security

- Only authorized roles can access notes.
- All fields must validate input to avoid invalid data.

### Reliability

- Notes must persist until deleted by user.
- Deleted notes must be properly removed after sync completes.

### Usability

- UI must provide clear visual feedback.
- Error messages must be easy to understand.

## 9. UI/UX Requirements

### User Flow

#### Initial App Launch Flow

1. User opens the application
2. System checks if user has any saved notes
   - **If notes exist:** Navigate directly to "My Notes" screen (list view)
   - **If no notes exist:** Show "Welcome to NoteMaker" home screen
3. From home screen, user taps "Go to My Notes" button to enter the app

#### Note Creation Flow

1. User opens Note Editor (from drawer or FAB button)
2. Types text
3. Applies formatting (bold/underline)
4. Taps Save
5. Pop-up appears requesting note name
6. User enters name and confirms
7. Note is saved
8. User navigates to My Notes screen
9. Note appears in My Notes list

#### Note Deletion Flow

1. User views their notes in "My Notes" screen
2. User long-presses or swipes on a note card
3. Delete option appears
4. User taps delete button
5. Confirmation dialog appears: "Are you sure you want to delete this note?"
6. User taps "Delete" to confirm (or "Cancel" to abort)
7. Note is removed from UI immediately (optimistic update)
8. System attempts to delete from backend API
9. Success toast shows: "Note deleted successfully"
10. If offline, note is marked for deletion and synced later
11. If all notes deleted, empty state is displayed

### Designs

Link: <https://v0.app/chat/note-application-ui-vNOZvL4KDVu?utm_source=jigarhathiwalaessact-3932&utm_medium=referral&utm_campaign=share_chat&ref=55SMLA>

### UI States

- Error: Toasts
- Empty: “No notes available” (TBD)
- Loading: TBD

### Navigation

- On app launch: Conditional navigation based on note existence
  - No notes → Home/Welcome screen
  - Has notes → My Notes list screen
- From Welcome screen → My Notes screen (via "Go to My Notes" button)
- From My Notes → Note Editor (via FAB button or note tap for edit)
- From Note Editor → My Notes (after save or back button)

## 10. Implementation Considerations

### Impacted Modules

- Notes module
- User metadata module

### Dependencies

- Backend API: TBD
- Frontend screens: Note Editor, My Notes
- DB requirements: Store notes + metadata

### Risks

- Duplicate names → validation.
- Length overflow → limit enforcement.
- Formatting confusion → simple UI.

## Rollout Plan

- Phase 1: Demo release
- Phase 2: Limited beta
- Phase 3: Production release

## Go-Live Criteria

- All acceptance criteria met
- QA passed
- UI validated
- No critical bugs
