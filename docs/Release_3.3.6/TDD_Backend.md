# Backend Technical Design Document (TDD)

> **TDD = HOW we will build the backend feature (Routes, Controllers, DB schema, Validation, RBAC).**
> Refer to the PRD for WHAT + WHY.

---

## 1. Overview

- **Feature Summary:** Simple note-taking application backend API that allows users to create, read, update, and soft-delete notes with rich text formatting support
- **Purpose:** Provide RESTful API endpoints to persist notes with metadata (creator, timestamps) and support duplicate name prevention, character limits, and validation
- **Base URL:** `https://note-taker-backend-c193.onrender.com`
- **Affected Modules:** Routes (/api/notes), Controllers (notesController.js), Services (Not Available), Repository (Note Model), Tables (notes collection)
- **Dependencies:** Express 4.x, MongoDB 6.x, Mongoose ODM, express-validator, CORS middleware, express-rate-limit, express-mongo-sanitize, xss-clean
- **Assumptions:** User authenticated (currently defaults to "Anonymous User"), MongoDB connection available, migrations not needed (schemaless), environment variables configured

---

## 2. Architecture

### Request Flow

Request flows through the following pipeline:

1. Client sends HTTP request
2. CORS middleware validates origin
3. JSON body parser processes request body
4. Rate limiting middleware checks request limits
5. Validation middleware validates input fields
6. Controller processes business logic
7. Mongoose Model interacts with MongoDB
8. Database performs operation and returns data
9. Controller formats response
10. Global error handler catches any errors
11. Response sent back to client

---

## 3. API Endpoints

**Base URL:** `https://note-taker-backend-c193.onrender.com`

| Endpoint                 | Method | Description               | Auth             | RBAC          |
| ------------------------ | ------ | ------------------------- | ---------------- | ------------- |
| `/api/notes/create`      | POST   | Create a new note         | No (future: Yes) | Not Available |
| `/api/notes/:id`         | GET    | Get single note by ID     | No (future: Yes) | Not Available |
| `/api/notes`             | GET    | Get all non-deleted notes | No (future: Yes) | Not Available |
| `/api/notes/:id/title`   | PATCH  | Update note title         | No (future: Yes) | Not Available |
| `/api/notes/:id/content` | PATCH  | Update note content       | No (future: Yes) | Not Available |
| `/api/notes/:id/delete`  | DELETE | Soft-delete a note        | No (future: Yes) | Not Available |

### Request Schema

**POST /api/notes/create** (Create Note)

```json
{
  "name": "Meeting Notes",
  "content": "Plain text content of the note",
  "formattedContent": "<b>HTML</b> formatted content with <u>tags</u>"
}
```

**PATCH /api/notes/:id/title** (Update Note Title)

```json
{
  "title": "Updated Meeting Notes"
}
```

**PATCH /api/notes/:id/content** (Update Note Content)

```json
{
  "content": "Updated plain text content",
  "formattedContent": "<b>Updated HTML</b> formatted content"
}
```

### Response Schema

**Success Response (POST/PATCH/GET single note)**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Meeting Notes",
    "content": "Plain text content of the note",
    "formattedContent": "<b>HTML</b> formatted content with <u>tags</u>",
    "createdBy": "Anonymous User",
    "createdAt": "2025-11-25T10:00:00.000Z",
    "updatedAt": "2025-11-25T10:00:00.000Z",
    "isDeleted": false
  },
  "message": "Note saved successfully."
}
```

**Success Response (GET /api/notes)** (List All)

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Meeting Notes",
      "content": "Plain text content",
      "formattedContent": "<b>HTML</b> formatted content",
      "createdBy": "Anonymous User",
      "createdAt": "2025-11-25T10:00:00.000Z",
      "updatedAt": "2025-11-25T10:00:00.000Z",
      "isDeleted": false
    }
  ],
  "count": 1
}
```

**Success Response (DELETE)**

```json
{
  "success": true,
  "message": "Note deleted successfully"
}
```

### Error Response

**Validation Error (400)**

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
      },
      {
        "field": "content",
        "message": "Content cannot exceed 500 characters."
      }
    ]
  }
}
```

**Duplicate Name Error (409)**

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_NAME",
    "message": "A note with this name already exists. Please choose another name."
  }
}
```

**Not Found Error (404)**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Note not found"
  }
}
```

**Server Error (500)**

```json
{
  "success": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "An error occurred while saving the note."
  }
}
```

---

## 4. Validation

- **Field Rules:**
  - `name`: Required, trim whitespace, max length 50 characters, unique within active notes
  - `content`: Required, trim whitespace, max length 500 characters
  - `formattedContent`: Required, max length 1000 characters (accounting for HTML tags)
- **Validation Library:** express-validator
- **Validation Middleware:** Applied before controller via `validateNoteCreation` middleware
- **Error Mapping:**
  - ValidationError → 400 Bad Request
  - Duplicate name (MongoDB duplicate key error code 11000) → 409 Conflict
  - Missing required fields → 400 Bad Request
  - Invalid data types → 400 Bad Request

**Validation Middleware Implementation:**

Location: backend/src/middleware/validation.js

The middleware exports an array containing:

1. Field validator for name field that:

   - Trims whitespace
   - Checks field is not empty with message "Please enter a name before saving."
   - Validates maximum length of 50 characters with message "Name cannot exceed 50 characters."

2. Field validator for content field that:

   - Trims whitespace
   - Checks field is not empty with message "Please add some content before saving."
   - Validates maximum length of 500 characters with message "Content cannot exceed 500 characters."

3. Field validator for formattedContent field that:

   - Checks field is not empty with message "Formatted content is required"

4. Validation result handler that:
   - Extracts validation errors from request
   - Returns 400 status with error array if validation fails
   - Calls next middleware if validation passes

---

## 5. Authorization (RBAC)

| Role                       | Permissions                                |
| -------------------------- | ------------------------------------------ |
| Anonymous User (Current)   | Full access (Create, Read, Update, Delete) |
| Future: Authenticated User | CRUD on own notes only                     |
| Future: Admin              | Full access to all notes                   |

**Checks:**

- User role permission: Not Available (future enhancement)
- Tenant ownership: Not Available (future enhancement)
- Data ownership: Not Available (future enhancement - will check note.createdBy === currentUser.id)

**Current Implementation:**

- No authentication or authorization implemented
- All endpoints publicly accessible
- `createdBy` field defaults to "Anonymous User"
- Future implementation will add authentication middleware and user-based access control

---

## 6. Database Schema

### Tables to Create/Modify

| Table   | Action | Details                                                         |
| ------- | ------ | --------------------------------------------------------------- |
| `notes` | Create | New MongoDB collection for storing notes with rich text content |

### Schema Changes

**MongoDB Collection: notes**

Schema definition using Mongoose ODM:

**Field: name**

- Type: String
- Required: Yes, with error message "Note name is required"
- Max Length: 50 characters with error message "Name cannot exceed 50 characters"
- Unique: Yes (enforced by MongoDB unique index)
- Trim: Yes (removes leading/trailing whitespace)
- Index: Yes (single field index for fast lookups)

**Field: content**

- Type: String
- Required: Yes, with error message "Content is required"
- Max Length: 500 characters with error message "Content cannot exceed 500 characters"

**Field: formattedContent**

- Type: String
- Required: Yes
- Max Length: 1000 characters (accounting for HTML tags)

**Field: createdBy**

- Type: String
- Default Value: "Anonymous User"

**Field: createdAt**

- Type: Date
- Default Value: Current timestamp (Date.now)

**Field: updatedAt**

- Type: Date
- Default Value: Current timestamp (Date.now)

**Field: isDeleted**

- Type: Boolean
- Default Value: false

### Indexes (Performance)

**Index 1: Unique index on name field**

- Purpose: Duplicate prevention and fast name lookups
- Type: Single field unique index
- Field: name
- Order: Ascending (1)

**Index 2: Index on createdAt field**

- Purpose: Sorted retrieval of notes (newest first)
- Type: Single field index
- Field: createdAt
- Order: Descending (-1)

**Index 3: Index on isDeleted field**

- Purpose: Filtering active vs deleted notes
- Type: Single field index
- Field: isDeleted
- Order: Ascending (1)

**Index 4: Compound index (optional optimization)**

- Purpose: Combined filtering and sorting
- Type: Compound index
- Fields: isDeleted (ascending), createdAt (descending)
- Usage: Queries that filter by deletion status and sort by date

---

## 7. Service Layer (Business Logic)

**File:** Not Available (Logic currently in controllers)

**Current Implementation:**

- Business logic is directly in controllers (backend/src/controllers/notesController.js)
- No separate service layer implemented

**Key functions that would be in service layer:**

- createNote(data, user) - Create note with permission check and duplicate validation
- getAllNotes(user) - List active notes with tenant/user isolation
- getNoteById(id, user) - Fetch single note with ownership verification
- updateNote(id, data, user) - Update note with validation and permission check
- deleteNote(id, user) - Soft delete note with permission check

**Future Enhancement:**

- Extract business logic from controllers into dedicated service layer
- Implement user context and permission checks
- Add transaction support for complex operations

---

## 8. Repository Layer (Data Access)

**File:** backend/src/models/Note.js (Mongoose Model serves as repository)

**Key functions:**

- Note.create(data) - Insert new note record into MongoDB
- Note.findById(id) - Fetch note by MongoDB ObjectId
- Note.findOne(query) - Find single note matching query criteria (used for duplicate name checks)
- Note.find(query) - List multiple notes with filtering capabilities
- Note.findByIdAndUpdate(id, data, options) - Update note record and return updated document
- Note.findByIdAndUpdate(id, updateFields, options) - Soft delete note by setting isDeleted flag

**Query Patterns:**

**Pattern 1: Get all active notes, sorted by newest first**

- Find all documents where isDeleted equals false
- Sort by createdAt field in descending order
- Exclude internal MongoDB version field from results

**Pattern 2: Check duplicate name (excluding current note in updates)**

- Find one document where:
  - name equals the specified name
  - \_id is not equal to the current note ID (when updating)
  - isDeleted equals false

**Pattern 3: Soft delete operation**

- Find note by ID and update with:
  - isDeleted set to true
  - updatedAt set to current timestamp
- Return the updated document with new:true option

---

## 9. Error Handling

| Error Type                             | HTTP Code             |
| -------------------------------------- | --------------------- |
| ValidationError (express-validator)    | 400                   |
| ValidationError (Mongoose)             | 400                   |
| AuthError                              | 401 (Not Implemented) |
| ForbiddenError                         | 403 (Not Implemented) |
| NotFoundError                          | 404                   |
| DuplicateKeyError (MongoDB code 11000) | 409                   |
| ServerError (uncaught exceptions)      | 500                   |

**Global Error Handler:**

Location: backend/src/middleware/errorHandler.js

The error handler accepts four parameters (err, req, res, next) and implements the following logic:

1. Log error stack trace to console for debugging

2. Check if error is a Mongoose ValidationError:

   - Return 400 status
   - Response contains success:false, error object with code "VALIDATION_ERROR" and error message

3. Check if error is MongoDB duplicate key error (code 11000):

   - Return 409 status
   - Response contains success:false, error object with code "DUPLICATE_NAME"
   - Message: "A note with this name already exists. Please choose another name."

4. Default case for all other errors:
   - Return 500 status
   - Response contains success:false, error object with code "SERVER_ERROR"
   - Message: "An unexpected error occurred."

**Error Handler Registration:**

- Applied as last middleware in backend/src/app.js
- Catches all unhandled errors from routes and controllers
- Provides consistent error response format across all endpoints

---

## 10. Background Jobs (If Required)

**Queue:** Not Available

**Use cases:**

- Not Available (no background jobs required for current implementation)

**Retry Policy:** Not Available

**Future Considerations:**

- If note export feature is added (PDF/TXT), use background job queue
- If email notifications are implemented, use job queue for async processing
- Recommended: BullMQ with Redis for job queue management

---

## 11. Testing

### Unit Tests

**Test Files:**

- backend/tests/unit/Note.model.test.js - Mongoose model validation
- backend/tests/unit/validation.test.js - express-validator middleware
- backend/tests/unit/notesController.test.js - Controller logic

**Coverage Areas:**

- Model validation rules (required fields, max length, unique constraint)
- Validation middleware (field rules, error messages)
- Controller business logic (duplicate checks, soft delete)

### Integration Tests

**Test File:** backend/tests/integration/notes.test.js

**Test Cases:**

1. ✅ Create note with valid text
2. ✅ Apply bold and underline formatting in formattedContent
3. ✅ Save note with numbers and special characters
4. ✅ Retrieve all notes (GET /api/notes)
5. ✅ Retrieve single note by ID (GET /api/notes/:id)
6. ✅ Update note content and name (PUT /api/notes/:id)
7. ✅ Soft delete note (DELETE /api/notes/:id/delete)
8. ❌ Reject empty content (400 error)
9. ❌ Reject empty name (400 error)
10. ❌ Reject content over 500 characters (400 error)
11. ❌ Reject name over 50 characters (400 error)
12. ⚠️ Handle long note (~500 characters)
13. ⚠️ Prevent duplicate names (409 error)
14. ⚠️ Handle duplicate name on update (exclude current note)
15. ⚠️ Handle special characters in content
16. ⚠️ Verify soft delete (isDeleted: true, not removed from DB)

**Tools:** Jest + Supertest

**Test Approach:**

Each test case sends HTTP requests to API endpoints and validates:

- Response status codes
- Response body structure
- Success/error flags
- Data integrity
- Error messages
- Business logic correctness

### Test Data

**Sample Records:**

Record 1:

```json
{
  "name": "Meeting Notes",
  "content": "Discussed project timeline",
  "formattedContent": "<p><b>Discussed</b> project timeline</p>",
  "createdBy": "Anonymous User"
}
```

Record 2:

```json
{
  "name": "Shopping List",
  "content": "Milk, Eggs, Bread",
  "formattedContent": "<p><u>Milk</u>, Eggs, Bread</p>",
  "createdBy": "Anonymous User"
}
```

**Different User Roles:**

- Not Available (single "Anonymous User" role currently)

**Multi-tenant Scenarios:**

- Not Available (no tenant isolation currently implemented)

---
