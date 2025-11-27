# Project Overview

**React Native Offline-First Application**
Architecture Foundation Document

---

## 1. High-Level Architecture

This is a mobile-first, offline-capable React Native application with local Realm database and background sync to a remote API.

```
┌─────────────────────────────────────────────────────────┐
│                  React Native Client                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   UI Layer   │  │  Navigation  │  │ MobX Stores  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              API Layer (Axios + Interceptors)           │
│  • Bearer Token Auth   • Error Handling                 │
│  • Token Refresh       • Request/Response Interceptors  │
└─────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          ▼                                  ▼
┌──────────────────────┐      ┌──────────────────────────┐
│   Remote API         │      │    Realm (Local DB)      │
│   (Server)           │◄─────┤  • Encrypted per user    │
│                      │ Sync │  • 27 schemas            │
│                      │      │  • Sync queue            │
└──────────────────────┘      └──────────────────────────┘
                                          │
                              ┌───────────┴──────────┐
                              ▼                      ▼
                         ┌─────────┐          ┌──────────┐
                         │  MMKV   │          │  Sync    │
                         │ Storage │          │  Engine  │
                         └─────────┘          └──────────┘
```

**Architecture Pattern:** Offline-first with eventual consistency
**Sync Strategy:** Queue-based background sync triggered by network state
**Data Flow:** Local Realm → Sync Queue → API → Remote Server

---

## 2. Navigation Overview

**Library:** React Navigation 7.x
**Pattern:** Drawer → Bottom Tabs → Feature Stacks

### Navigation Tree

```
RootStack
├── Onboarding/Login/ForgotPassword
├── FetchingDetails (splash/sync)
└── DrawerStack
    └── BottomTabs (4 tabs)
        ├── Dashboard Stack
        ├── Inspection Stack
        ├── Instruction Stack
        └── ToDo Stack
```

### Main Tabs

- **Dashboard:** Home, projects, notifications, sync status
- **Inspection:** EQC lists, stages, forms, PDF reports, camera
- **Instruction:** Issues, responses, contacts
- **ToDo:** Approval workflows, pending actions

### Deep Linking

- Pattern: Custom URL schemes with route parameters
- Params: `projectId`, `instructionId`, `status`
- Handler: App.js → handleOpenURL → dynamic navigation
- Triggered by: Push notifications, external links

---

## 3. API Layer Overview

### Axios Client Setup

- **Location:** `src/api.js`
- **Base URL:** Dynamic from encrypted config (Config.API_URL)
- **Timeout:** Configurable per environment

### Request Interceptors

- Bearer token injection from MMKV storage
- Tenant ID header (`x-tenant-id`)
- App version header (`x-app-version`)
- Request cancellation support (AbortController)
- Dev mode: cURL command generation

### Response Interceptors

- Network error handling
- Token refresh on 401 (jwt expired)
- Auto-logout on authentication failures
- Error codes: 401, 403, 404, 405, 603
- Subscription expiration detection
- Toast notifications for user errors

### Token Refresh Strategy

- Automatic refresh on expired JWT
- Refresh token stored in MMKV
- Queue requests during refresh
- Retry failed requests post-refresh

### API Services Folder Structure

```
src/modules/
├── Auth/api.js           # Login, logout, refresh token
├── Project/api.js        # Project CRUD, sync
├── Instruction/api.js    # Issues, responses
├── Inspection/api.js     # EQC, checklists
└── [Feature]/api.js      # Feature-specific endpoints
```

---

## 4. Data Layer & Offline/Realm Overview

### Realm Models Location

- **Schemas:** `src/utils/realmConstants.js` (27 models)
- **Init/Migration:** `src/utils/realmUtils.js`
- **CRUD Operations:** `src/utils/realmApiHelper.js`

**Key Models:** Projects, Instructions, EQC Lists (Available, InProgress, Approval), Sync Lists, Assets, Stages

### Local-First Strategy

- **Write:** Data written to Realm immediately (instant UI feedback)
- **Read:** Always read from Realm (works offline)
- **Sync:** Background sync pushes changes to server when online
- **Server Response:** Updates Realm with server timestamps/IDs

### Sync Behavior

- **Trigger:** Network state change (offline → online)
- **Type:** Queue-based with prioritization
- **Progress:** Tracked in MobX syncStore
- **Manual Sync:** Available via SyncScreen
- **Retry Logic:** Auto-retry with exponential backoff

### Conflict Resolution

- **Strategy:** Timestamp-based (server wins)
- **Fields:** `createdAt`, `updatedAt`, `syncDate`
- **UUID Tracking:** Client-generated UUIDs for optimistic updates
- **Version Field:** Optimistic locking for critical entities

### MMKV Usage

- **Library:** react-native-mmkv 3.2.0
- **Location:** `src/utils/storageUtils.js`
- **Encryption:** AES with key 'digiQCV2'
- **Used For:** Auth tokens, user preferences, session data
- **Integration:** MobX-persist backend for store persistence

---

## 5. State Management Overview

**Library:** MobX 6.x with mobx-react
**Pattern:** Observable stores with decorators
**Persistence:** MobX-persist-store + MMKV

### Global State (MobX Stores)

- `appStore` — Network status, offline mode, app lifecycle
- `userStore` — Authentication, user profile, tenant info
- `projectsStore` — Project list, current project
- `checklistStore` — Inspection checklists
- `instructionStore` — Instructions/issues
- `syncStore` — Sync progress, queue status
- `notificationStore` — Push notifications
- `codePushStore` — OTA updates
- `remoteConfigStore` — Firebase Remote Config

### Local State (Component State)

- UI interactions (modal visibility, input focus)
- Form inputs (controlled components)
- Temporary UI state (dropdown open/closed)
- Ephemeral data (search queries, filters)

### Derived Data

- Computed values using MobX `@computed`
- Reactions for side effects (`autorun`, `reaction`)
- No manual subscriptions; MobX auto-tracks dependencies

---

## 6. Folder Structure Overview

```
src/
├── api.js                    # Axios client & interceptors
├── App.js                    # Root component
├── routes.js                 # Navigation config
├── StoreManager.js           # MobX store registry
├── components/               # Reusable UI components
│   ├── Camera/
│   ├── DrawerBar/
│   ├── TabBar/
│   └── [70+ components]
├── modules/                  # Feature modules
│   ├── Auth/
│   ├── Dashboard/
│   ├── Inspection/
│   ├── Instruction/
│   ├── Project/
│   └── [Feature]/
│       ├── api.js            # Feature API services
│       ├── screens/          # Feature screens
│       └── stores/           # Feature stores (optional)
├── store/                    # Global stores
│   ├── AppStore.js
│   ├── ImageStore.js
│   └── [Store].js
├── utils/                    # Utilities
│   ├── realmUtils.js
│   ├── realmConstants.js
│   ├── realmApiHelper.js
│   ├── syncHelper.js
│   ├── storageUtils.js
│   └── helper.js
├── theme/                    # Styles, colors, typography
└── assets/                   # Images, fonts, icons
```

---

## 7. Coding Standards

### Naming Conventions

- **Components:** PascalCase (`DrawerBar.js`, `UserProfile.js`)
- **Utilities:** camelCase (`realmUtils.js`, `helper.js`)
- **Stores:** PascalCase with 'Store' suffix (`UserStore.js`)
- **Constants:** UPPER_SNAKE_CASE (`SYNC_LIST`, `API_TIMEOUT`)
- **Functions:** camelCase (`setProjects`, `handleOpenURL`)
- **MobX Observables:** camelCase with `@observable` decorator

### File Location Conventions

- **Feature-specific code:** `/modules/[Feature]/`
- **Shared components:** `/components/`
- **Global stores:** `/store/`
- **API services:** Co-located in feature modules (`/modules/[Feature]/api.js`)
- **Utilities:** `/utils/` (pure functions, helpers, Realm)
- **Module aliases:** Use Babel resolver (`@components`, `@utils`, `@auth`)

### Code Patterns

- MobX decorators: `@observable`, `@action`, `@computed`
- Async/await for API calls (no callbacks)
- Try-catch with centralized error logging (Logger, Sentry)
- Lodash for data manipulation (`get`, `isEmpty`, `map`)
- PropTypes for component validation
- HOC pattern for cross-cutting concerns (`inject`, `observer`)

---

**Document Version:** 1.0
**Last Updated:** 2025-01-21
**Purpose:** High-level architecture foundation before PRD/TDD creation
