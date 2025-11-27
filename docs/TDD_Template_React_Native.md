# Technical Design Document (TDD) — React Native (Mobile Only)

> **TDD = HOW we will build the feature (Architecture, Data, API, Sync, UI Flow).**
> Refer to the PRD for WHAT + WHY.

---

## 1. Overview

- **Feature Summary:** 1–2 lines
- **Purpose:** Link to PRD reason
- **Affected Screens/Modules:**
- **Dependencies:** APIs / sync worker / libraries
- **Assumptions:** Logged in, project selected, etc.

---

## 2. Technical Flow

### High-Level Flow

```
UI → Component → Store/Service → API → Realm/MMKV → Sync (if offline) → UI update
```

### Step Flow

1. User action
2. Validate inputs
3. Fetch/store data (online/offline)
4. Sync workflow (if applicable)
5. UI update

---

## 3. Screens & Components

### New Screens

| Screen | Purpose | Route | Stack |
|--------|---------|-------|-------|

### Modified Screens

| Screen | Change | File Path |
|--------|--------|-----------|

### Components

| Component | New/Modified | Reusable? | Location |
|-----------|--------------|-----------|----------|

### UI/UX Design Reference

**Design Link:** [Insert design link from PRD]

**Note:** All screens and components listed above must follow the design specifications provided in the link. Refer to the design mockups for visual styling, layout, spacing, colors, typography, and interaction patterns.

---

## 4. Navigation

- Stacks/tabs affected
- Params passed between screens
- Redirect rules

---

## 5. API Contracts (Feature-Specific Only)

### Endpoint(s)

| Endpoint | Method | Request | Response | Auth |
|----------|--------|---------|----------|------|

### Request / Response (Only fields used by THIS feature)

```json
{
  "id": "...",
  "title": "...",
  "status": "..."
}
```

---

## 6. Data & Offline Sync

### Realm/MMKV Schema (Minimal fields only)

```typescript
class Model {
  id: string;
  fieldA: string;
  isSynced: boolean;
}
```

### Offline Strategy

- **Read:** local-first or API-first
- **Write:** optimistic or queue
- **Sync Rules:** when sync runs, retry count, conflict strategy

---

## 7. State Management

- Global store slices affected
- Local component state
- Derived state logic (if any)

---

## 8. Validation & Error Handling

### Validation Rules

- Field rules
- Disabled states

### API Error Handling

- HTTP → UI mapping
- Retry rules

### UI States

- Loading
- Error
- Empty

### Edge Cases (Only relevant ones)

- Offline
- Timeout
- Invalid params
- Sync conflict

---

## 9. Platform-Specific Behavior (Only if required)

- iOS-specific
- Android-specific
- Permissions required

---

## 10. Performance (Feature-specific only)

- List optimizations (if list used)
- Image optimizations (if images used)
- Memoization (if needed)

---

## 11. Testing Requirements

### Unit Tests

- Components
- Utils

### Integration Tests

- Navigation
- API + DB

### Manual Testing (minimal)

- Android 10+
- iOS 14+
- Offline/online tests
