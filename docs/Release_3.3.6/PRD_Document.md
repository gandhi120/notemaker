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
- **Pagination for notes list** (load 20 notes at a time, load more on scroll).
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
- Advanced search and filtering of notes.
- Customizable pagination page size.

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
| Inspector | Create & view notes |
| Associate | Create & view notes |
| Project Admin | Full access |
| System Admin | Full access |

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

## 8. Non-Functional Requirements
### Performance
- Save must complete within TBD seconds.
- My Notes list must load within TBD seconds.

### Security
- Only authorized roles can access notes.
- All fields must validate input to avoid invalid data.

### Reliability
- Notes must persist until deleted (delete feature TBD).

### Usability
- UI must provide clear visual feedback.
- Error messages must be easy to understand.

## 9. UI/UX Requirements
### User Flow
1. User opens Note Editor.
2. Types text.
3. Applies formatting.
4. Taps Save.
5. Pop-up appears.
6. Saves note.
7. Note appears in My Notes.

### Designs
Link: https://v0.app/chat/note-application-ui-vNOZvL4KDVu?utm_source=jigarhathiwalaessact-3932&utm_medium=referral&utm_campaign=share_chat&ref=55SMLA

### UI States
- Error: Toasts
- Empty: “No notes available” (TBD)
- Loading: TBD

### Navigation
- User moves between editor and My Notes.

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
