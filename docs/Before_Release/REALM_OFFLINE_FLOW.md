# Realm Database & Offline Flow Guide

> **Reference this BEFORE creating TDD for any feature with data persistence or offline support**

---

## Quick Decision Tree: Do I Need Offline Support?

```
Does your feature involve:
├─ Storing data locally? → YES, need Realm
├─ Working offline? → YES, need offline flow
├─ Reading data later? → YES, need Realm
├─ Syncing data to backend? → YES, need sync strategy
└─ Real-time updates only? → NO, maybe skip Realm
```

---

## 1. Realm Overview

### What is Realm?

- **Local encrypted database** on device
- **Offline-first** storage
- **Automatic sync** when online
- **Type-safe** with schema definitions

### Realm File Location

```
/src/utils/realmConstants.js    # Schema definitions
/src/utils/realmApiHelper.js    # CRUD operations
```

### Why Use Realm?

✅ Offline support - users can work without internet
✅ Cache data - faster load times
✅ Sync later - queue changes, upload when online
✅ Encrypted - secure local storage
✅ Query-able - filter, search local data

---

## 2. Realm Schema Structure

### View Current Schemas

**Location:** `/src/utils/realmConstants.js`

**Current Models:**

```javascript
// Example from project
const PROJECTS = {
  name: 'PROJECTS',
  properties: {
    id: 'string',
    name: 'string',
    agency: 'string',
    status: 'string',           // 'active', 'completed', 'archived'
    createdAt: 'date',
    updatedAt: 'date'
  },
  primaryKey: 'id'
};

const INSPECTION_REMARKS = {
  name: 'INSPECTION_REMARKS',
  properties: {
    id: 'string',
    eqcId: 'string',
    projectId: 'string',
    remark: 'string',
    status: 'string?',          // optional field
    isSynced: { type: 'bool', default: false }  // sync marker
  },
  primaryKey: 'id'
};
```

### Key Fields in Schema

| Field | Purpose | Example |
|-------|---------|---------|
| `id` | Unique identifier | UUID or backend ID |
| `isSynced` | Sync status | `false` = pending, `true` = synced |
| `createdAt` | Creation timestamp | For sorting |
| `updatedAt` | Last update timestamp | For tracking changes |
| `syncError` | Error message if sync failed | Helps debugging |

---

## 3. Realm CRUD Operations

### Location

**File:** `/src/utils/realmApiHelper.js`

### Common CRUD Functions

#### **READ: Get data from Realm**

```javascript
import { getRealm } from '../utils/realmApiHelper';

// Get all records
const realm = getRealm();
const allProjects = realm.objects('PROJECTS');

// Filter by status
const activeProjects = realm.objects('PROJECTS')
  .filtered('status = "active"');

// Filter by multiple conditions
const syncedProjects = realm.objects('PROJECTS')
  .filtered('status = "active" AND isSynced = true');

// Get single record by ID
const project = realm.objectForPrimaryKey('PROJECTS', projectId);
```

#### **CREATE: Add data to Realm**

```javascript
import { getRealm } from '../utils/realmApiHelper';

const realm = getRealm();
realm.write(() => {
  realm.create('PROJECTS', {
    id: '123',
    name: 'Project A',
    agency: 'Agency X',
    status: 'active',
    createdAt: new Date(),
    isSynced: true
  });
});
```

#### **UPDATE: Modify existing data**

```javascript
const realm = getRealm();
realm.write(() => {
  // Method 1: create() with 'modified' flag (upsert)
  realm.create('PROJECTS', {
    id: '123',
    name: 'Updated Name',
    agency: 'Agency X'
  }, 'modified');

  // Method 2: Direct property update
  const project = realm.objectForPrimaryKey('PROJECTS', '123');
  if (project) {
    project.status = 'completed';
    project.isSynced = false;  // Mark as pending sync
  }
});
```

#### **DELETE: Remove data**

```javascript
const realm = getRealm();
realm.write(() => {
  const project = realm.objectForPrimaryKey('PROJECTS', '123');
  if (project) {
    realm.delete(project);
  }
});
```

#### **DELETE ALL: Clear collection**

```javascript
const realm = getRealm();
realm.write(() => {
  realm.delete(realm.objects('PROJECTS'));
});
```

---

## 4. Offline Flow Patterns

### Pattern 1: Read-Only (Cache Strategy)

**Use Case:** Loading product list, read-only data

```
API call (online)
        ↓
Save to Realm
        ↓
Display from Realm (next time)

Offline: Show cached Realm data
```

**Implementation:**

```javascript
class ProductStore {
  @observable products = [];
  @observable isLoading = false;

  async loadProducts() {
    this.isLoading = true;
    try {
      // Try API first
      const response = await getProducts();

      // Cache locally
      response.forEach(product => {
        realm.write(() => {
          realm.create('PRODUCTS', product, 'modified');
        });
      });

      this.products = response;
    } catch (error) {
      // Offline: Load from Realm
      const cached = realm.objects('PRODUCTS');
      this.products = Array.from(cached);
      if (cached.length === 0) {
        throw error;  // No cache, show error
      }
    } finally {
      this.isLoading = false;
    }
  }
}
```

---

### Pattern 2: Write with Sync Queue (Optimistic)

**Use Case:** Create inspection remarks, update status

```
User submits form
        ↓
Save to Realm (immediately) + mark isSynced = false
        ↓
Show success to user (optimistic)
        ↓
Try API call
        ↓
✓ Success: Update isSynced = true
✗ Failure: Mark as pending, queue for retry
        ↓
Sync service: Try again when online
```

**Implementation:**

```javascript
class InspectionStore {
  async submitRemark(eqcId, remark) {
    // 1. Save to Realm immediately
    const remarkId = generateUUID();
    realm.write(() => {
      realm.create('INSPECTION_REMARKS', {
        id: remarkId,
        eqcId,
        projectId: this.projectId,
        remark,
        isSynced: false,      // Mark pending
        createdAt: new Date()
      });
    });

    // 2. Show success immediately (optimistic)
    showMessage({ message: 'Remark saved', type: 'success' });

    // 3. Try API in background
    try {
      await createRemark({
        id: remarkId,
        eqcId,
        remark
      });

      // 4. Mark as synced when API succeeds
      realm.write(() => {
        const savedRemark = realm.objectForPrimaryKey('INSPECTION_REMARKS', remarkId);
        if (savedRemark) {
          savedRemark.isSynced = true;
        }
      });
    } catch (error) {
      // Don't show error - it's already saved locally
      // Sync service will retry when online
      Logger.error('Remark sync failed', error);
    }
  }
}
```

---

### Pattern 3: Read-Write with Full Offline Support

**Use Case:** Inspection checklist, equipment data

```
Load data:
├─ Online: API + cache to Realm
└─ Offline: Load from Realm

Update data:
├─ Save to Realm immediately (isSynced = false)
├─ Try API call
├─ If success: isSynced = true
└─ If fail: Queue for sync

Sync service (background):
├─ Check items with isSynced = false
├─ Try API again
├─ Update isSynced on success
└─ Show sync status to user
```

**Implementation:**

```javascript
class ChecklistStore {
  @observable checklist = null;
  @observable points = [];
  @observable syncStatus = 'synced';  // syncing, error, synced

  // Load checklist
  async loadChecklist(checklistId) {
    try {
      const response = await getChecklist(checklistId);

      // Save to Realm
      realm.write(() => {
        realm.create('CHECKLISTS', response, 'modified');
      });

      this.checklist = response;
    } catch (error) {
      // Load from Realm if offline
      const cached = realm.objectForPrimaryKey('CHECKLISTS', checklistId);
      if (cached) {
        this.checklist = cached;
      } else {
        throw error;
      }
    }
  }

  // Update checklist point
  async updatePoint(pointId, value, remark) {
    const pointData = {
      id: pointId,
      value,
      remark,
      isSynced: false,          // Mark pending
      updatedAt: new Date()
    };

    // 1. Save to Realm immediately
    realm.write(() => {
      realm.create('CHECKLIST_POINTS', pointData, 'modified');
    });

    // 2. Try API
    try {
      await updateChecklistPoint(pointId, { value, remark });

      // 3. Mark as synced
      realm.write(() => {
        const point = realm.objectForPrimaryKey('CHECKLIST_POINTS', pointId);
        if (point) point.isSynced = true;
      });
    } catch (error) {
      // Queued for sync
      this.syncStatus = 'pending';
    }
  }
}
```

---

## 5. Sync Service (Background Sync)

### Location

**File:** `/src/utils/syncHelper.js` (or dedicated sync module)

### Sync Worker Flow

```
Timer (every 30 seconds or on network change)
        ↓
Check items with isSynced = false
        ↓
Try API for each item
        ↓
Success: Update isSynced = true
        ↓
Failure: Retry count++, show error if max retries exceeded
        ↓
Update sync status (synced, syncing, error)
```

### Implementation Example

```javascript
class SyncService {
  async syncPendingData() {
    const realm = getRealm();

    // Get all items pending sync
    const pendingRemarks = realm.objects('INSPECTION_REMARKS')
      .filtered('isSynced = false');

    const pendingPoints = realm.objects('CHECKLIST_POINTS')
      .filtered('isSynced = false');

    let syncedCount = 0;
    let failedCount = 0;

    // Sync remarks
    for (const remark of pendingRemarks) {
      try {
        await createRemark({
          id: remark.id,
          eqcId: remark.eqcId,
          remark: remark.remark
        });

        realm.write(() => {
          remark.isSynced = true;
        });
        syncedCount++;
      } catch (error) {
        failedCount++;
        Logger.error(`Failed to sync remark ${remark.id}`, error);
      }
    }

    // Similar for points...

    return {
      syncedCount,
      failedCount,
      status: failedCount === 0 ? 'synced' : 'partial'
    };
  }
}
```

---

## 6. Offline Strategy Decision Matrix

### Choose your offline strategy based on these questions

| Feature | Read-Only? | Writable? | Must Sync? | Strategy | Example |
|---------|-----------|-----------|-----------|----------|---------|
| View project list | Yes | No | No | Cache | Dashboard |
| View inspection checklist | Yes | No | No | Cache | Display checklist |
| Update checklist | No | Yes | Yes | Optimistic + Sync | Mark as complete |
| Add inspection remark | No | Yes | Yes | Queue + Sync | Add note to equipment |
| Upload photo | No | Yes | Yes | Queue + Sync | Attach image |
| Change password | No | Yes | Yes | Queue only | Auth change |

---

## 7. Implementing Offline Strategy in TDD

### When creating TDD, include

```markdown
## Data & Offline Sync

### Offline Strategy for THIS Feature

**Read Operations:**
- [ ] Load from API first
- [ ] Cache to Realm
- [ ] Fallback to Realm if offline

**Write Operations:**
- [ ] Save to Realm immediately (optimistic)
- [ ] Try API call
- [ ] Mark as synced on success
- [ ] Queue for sync on failure

### Realm Schema (New Models Needed)

```typescript
class [MODEL_NAME] {
  id: string;              // Primary key
  fieldA: string;
  fieldB: string;
  isSynced: bool;          // Sync status
  createdAt: date;
  updatedAt: date;
}
```

### Sync Rules

- Retry mechanism: Exponential backoff
- Max retries: 3 attempts
- Conflict resolution: Last write wins
- Sync trigger: Every 30 seconds or on network change

### Example Data Flow

**Online:**

```
User inputs → Save to Realm → Try API → Mark synced
```

**Offline:**

```
User inputs → Save to Realm → Show success → Queue for sync
```

**Sync:**

```
Sync service → Check pending → Try API again → Update status
```

```

---

## 8. Common Realm Models in Project

### PROJECTS
```javascript
{
  id: 'string',
  name: 'string',
  agency: 'string',
  status: 'string',         // active, completed, archived
  createdAt: 'date',
  updatedAt: 'date'
}
```

**Use for:** Storing project metadata locally

---

### INSPECTION_REMARKS

```javascript
{
  id: 'string',
  projectId: 'string',
  eqcId: 'string',
  remark: 'string',
  isSynced: 'bool',        // false = pending upload
  createdAt: 'date',
  syncError: 'string?'     // Error message if sync failed
}
```

**Use for:** Offline inspection comments

---

### INSPECTION_APPROVALS

```javascript
{
  id: 'string',
  inspectionId: 'string',
  approvedBy: 'string',
  status: 'string',        // approved, rejected, pending
  isSynced: 'bool',
  createdAt: 'date'
}
```

**Use for:** Track approval status offline

---

### INSTRUCTION_PHOTOS

```javascript
{
  id: 'string',
  instructionId: 'string',
  photoPath: 'string',     // Local file path
  isSynced: 'bool',
  uploadedAt: 'date?',
  syncError: 'string?'
}
```

**Use for:** Queue photos for upload when online

---

## 9. Best Practices

### DO ✅

- Always mark new writes with `isSynced = false`
- Save to Realm BEFORE trying API (optimistic)
- Handle sync failures gracefully
- Show sync status to user (e.g., "Syncing..." badge)
- Test with network disabled
- Clear old/archived data periodically
- Use transactions for related updates

### DON'T ❌

- Wait for API response before saving locally
- Lose offline data
- Show errors for queued items (they'll retry)
- Use Realm for high-frequency updates (use state instead)
- Forget to test offline scenarios
- Leave orphaned data in Realm

---

## 10. Testing Offline Scenarios

### Manual Testing Checklist

```
[ ] Disable internet in device settings
[ ] Try reading data (should show cached)
[ ] Try writing data (should save locally)
[ ] Check Realm has data (isSynced = false)
[ ] Re-enable internet
[ ] Trigger sync
[ ] Verify isSynced = true in Realm
[ ] Verify backend received data
```

### Debug: Inspect Realm Data

```javascript
// In App.js or debug screen
import { getRealm } from './utils/realmApiHelper';

const realm = getRealm();
console.log('PROJECTS:', realm.objects('PROJECTS'));
console.log('Pending:', realm.objects('INSPECTION_REMARKS').filtered('isSynced = false'));
```

---

## 11. Offline Flow Example: Complete Feature

### Scenario: Add Inspection Remark (with photo)

```
┌─ User adds remark to equipment ─────────────┐
│                                             │
│  Save to Realm:                            │
│  ├─ remark record (isSynced = false)       │
│  └─ photo record (isSynced = false)        │
│                                             │
│  Show toast: "Saved locally"               │
│                                             │
│  In background:                            │
│  ├─ Try to upload remark via API           │
│  ├─ Try to upload photo via API            │
│  ├─ On success: isSynced = true            │
│  └─ On failure: Keep isSynced = false      │
│                                             │
│  Sync service (every 30 sec):              │
│  ├─ Find items with isSynced = false       │
│  ├─ Retry API call                         │
│  ├─ Show "Syncing..." badge                │
│  └─ Update when done                       │
│                                             │
└─ User sees: "Synced" when complete ────────┘
```

**TDD Template for this feature:**

```markdown
## Data & Offline Sync

### Realm Schema
- INSPECTION_REMARKS (id, projectId, eqcId, remark, isSynced, createdAt)
- INSTRUCTION_PHOTOS (id, remarkId, photoPath, isSynced)

### Offline Strategy
- Write: Optimistic (save to Realm immediately)
- Sync: Queue pending items, retry every 30 seconds
- Conflict: Last write wins (timestamp-based)

### Read Operations
- Show cached remarks while loading from API
- Display "Syncing..." if pending uploads

### Write Operations
1. User submits remark + photo
2. Save both to Realm (isSynced = false)
3. Show success to user
4. Try API in background
5. Update isSynced on success
6. Sync service retries if failed
```

---

## 12. Quick Reference Commands

### View all pending syncs

```javascript
getRealm().objects('INSPECTION_REMARKS').filtered('isSynced = false');
getRealm().objects('INSTRUCTION_PHOTOS').filtered('isSynced = false');
```

### Clear all data

```javascript
const realm = getRealm();
realm.write(() => {
  realm.delete(realm.objects('PROJECTS'));
  realm.delete(realm.objects('INSPECTION_REMARKS'));
  // ... other models
});
```

### Check sync status

```javascript
const pendingCount = getRealm().objects('INSPECTION_REMARKS')
  .filtered('isSynced = false').length;
console.log(`Pending: ${pendingCount}`);
```

---

## 13. When to Reference This Document

✅ **Before creating TDD:** Decide offline strategy
✅ **During development:** Implement CRUD operations
✅ **During code review:** Verify sync logic
✅ **Before release:** Test offline scenarios
✅ **When debugging:** Check Realm data

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-01-XX | 1.0 | Initial Realm & Offline Flow guide |
