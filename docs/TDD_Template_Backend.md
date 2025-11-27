# Backend Technical Design Document (TDD)

> **TDD = HOW we will build the backend feature (Routes, Controllers, DB schema, Validation, RBAC).**
> Refer to the PRD for WHAT + WHY.

---

## 1. Overview

- **Feature Summary:** 1–2 lines
- **Purpose:** Link to PRD reason
- **Affected Modules:** Routes, Controllers, Services, Repository, Tables
- **Dependencies:** Auth, RBAC, Logging
- **Assumptions:** User authenticated, TenantId in request, migrations available

---

## 2. Architecture

### Request Flow

```
Request → Middleware (Auth/Tenant) → Validation → Controller → Service → Repository → DB → Response
```

---

## 3. API Endpoints

| Endpoint | Method | Description | Auth | RBAC |
|----------|--------|-------------|------|------|
| `/api/...` | GET | Fetch items | Yes | Required |
| `/api/...` | POST | Create item | Yes | Required |
| `/api/.../:id` | PUT | Update item | Yes | Required |
| `/api/.../:id` | DELETE | Delete item | Yes | Required |

### Request Schema

```json
{
  "title": "Example",
  "status": "pending",
  "projectId": "P123"
}
```

### Response Schema

```json
{
  "id": "123",
  "title": "Example",
  "status": "pending",
  "updatedAt": "2025-01-01T10:00:00Z"
}
```

### Error Response

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid input"
}
```

---

## 4. Validation

- Field rules (min/max length, required fields)
- Use Joi or Zod
- Validation middleware before controller
- Error mapping: ValidationError → 400

---

## 5. Authorization (RBAC)

| Role | Permissions |
|------|-------------|
| Inspector | Read + Update own data |
| Associate | Read only |
| Admin | Full access |

**Checks:**

- User role permission
- Tenant ownership
- Data ownership (if applicable)

---

## 6. Database Schema

### Tables to Create/Modify

| Table | Action | Details |
|-------|--------|---------|
| `inspections` | Create/Update | New table or schema changes |
| (others) | | |

### Schema Changes

```sql
ALTER TABLE inspections ADD COLUMN status VARCHAR(20);
ALTER TABLE inspections ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
```

### Indexes (Performance)

```sql
CREATE INDEX idx_inspections_project ON inspections(project_id);
CREATE INDEX idx_inspections_status ON inspections(status);
```

---

## 7. Service Layer (Business Logic)

**File:** `/services/inspectionService.js`

**Key functions:**

- `createInspection(data, user)` - Create with permission check
- `getInspections(filters, user)` - List with tenant isolation
- `updateInspection(id, data, user)` - Update with validation
- `deleteInspection(id, user)` - Delete with permission check

---

## 8. Repository Layer (Data Access)

**File:** `/repositories/inspectionRepository.js`

**Key functions:**

- `create(data)` - Insert record
- `getById(id)` - Fetch by ID
- `list(filters)` - List with pagination
- `update(id, data)` - Update record
- `delete(id)` - Delete record

---

## 9. Error Handling

| Error Type | HTTP Code |
|------------|-----------|
| ValidationError | 400 |
| AuthError | 401 |
| ForbiddenError | 403 |
| NotFoundError | 404 |
| ServerError | 500 |

Use global error handler for consistent response format.

---

## 10. Background Jobs (If Required)

**Queue:** BullMQ / RabbitMQ

**Use cases:**

- Offline sync processing
- Heavy computations

**Retry Policy:** Max 3 attempts, exponential backoff

---

## 11. Testing

### Unit Tests

- Service functions
- Validation schemas
- Repository queries

### Integration Tests

- API endpoints + DB
- RBAC permission checks
- Error scenarios

### Test Data

- Sample records
- Different user roles
- Multi-tenant scenarios
