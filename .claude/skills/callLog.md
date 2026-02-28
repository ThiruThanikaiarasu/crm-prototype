# CallLog Feature — Route-by-Route Guide

**Base path:** `/api/v1/call-logs`
**Files:** `routes/callLog.route.js` · `controllers/callLog.controller.js` · `services/callLog.service.js` · `repositories/callLog.repository.js` · `models/callLog.model.js` · `validators/callLog.validator.js`

---

## Data Model

`{tenantId}_calllogs` fields:
- `lead` (ref → Lead) — required
- `outcome` — the call result; **also synced to `lead.status`** on create/update
- `followUp` — date
- `remarks` — string
- `callStartTime` — datetime
- `callDuration` — number (seconds, non-negative)
- `createdBy` (ref → User)
- `deleted` — soft delete subdoc

**Important:** Creating or updating a call log's `outcome` **mutates the linked lead's `status`** in the same transaction.

---

## Routes

> Search routes are declared **before** `/:id` routes to avoid Express matching `/search/company` as an ID.

---

### GET `/search/company` — Search Companies for Call Log
**Auth:** `verifyUser`
**Controller:** `searchCompaniesHandler` → `services/callLog.service.js → searchCompanies`

**Query params:** `search` (name), `page`, `limit`

**Logic:**
- Queries `{tenantId}_companyleads` (not deleted)
- Filters to companies that have **at least one eligible lead** — status NOT in `['new', 'dropped']`
- Returns paginated companies with `{ companies, info }` via `$facet`

**Use case:** Populate company dropdown when creating a call log

**Response:** `{ companies: [...], info: { total, page, limit, totalPages, hasMoreRecords } }` — 200

---

### GET `/search/leads/:companyId` — Search Leads by Company
**Auth:** `verifyUser`
**Validator:** `validateObjectIdParam('companyId')`
**Controller:** `searchLeadsForCallLogHandler` → `services/callLog.service.js → searchLeads`

**Logic:**
- Queries `{tenantId}_leads` where `company === companyId`, not deleted, `status NOT IN ['new', 'dropped']`
- Joins contact (`{tenantId}_contactleads`) and company (`{tenantId}_companyleads`)
- Adds `name`, `email`, `phone` fields from contact to lead object
- Returns `null` if no matching leads

**Response:** array of enriched leads (or null message) — 200

---

### POST `/` — Create Call Log
**Auth:** `validateCreateCallLogPayload` (runs **before** `verifyUser` in route order — note the middleware sequence)
**Controller:** `create` → `services/callLog.service.js → createCallLog`

**Body:**
```json
{
  "lead": "ObjectId",
  "outcome": "called|interested|promoted_to_meeting|conversion_in_progress|dropped",
  "followUp": "ISO date",
  "remarks": "string",
  "callStartTime": "ISO datetime",
  "callDuration": 120,
  "droppedReason": "string (required if outcome=dropped)"
}
```

**Logic (transaction):**
1. Validates `lead` exists and is not deleted → `NotFoundError(404)`
2. Validates `outcome` is present → `ValidationError(400)`
3. Updates `existingLead.status = outcome`
4. If `outcome === 'dropped'`: requires `droppedReason`, sets it on lead; else clears it
5. Syncs `followUp` to lead if provided
6. Saves lead
7. Creates `CallLog` doc
8. Returns enriched call log via aggregation (joins lead → company → contact + sibling leads)

**Response:** enriched call log — 201

---

### GET `/:leadId/previous` — Get Previous Call Log for a Lead
**Auth:** `verifyUser`
**Validator:** `validateObjectIdParam('leadId')`
**Controller:** `getPreviousCallLog` → `services/callLog.service.js → getPreviousCallLogDetails`

**Logic:**
- Aggregates all call logs for the given `leadId` sorted by `createdAt: -1`
- Joins lead → contact, and call log's `createdBy` → user
- Returns all call logs for that lead (used for history display)
- Throws `NotFoundError(404, PREVIOUS_CALL_LOG_NOT_FOUND)` if none found

**Response:** array of call logs with lead + user details — 200

---

### GET `/:companyId/activity` — Get Company Call Log Activity
**Auth:** `verifyUser`
**Validator:** `validateObjectIdParam('companyId')`
**Controller:** `getCompanyCallLogActivity` → `services/callLog.service.js → getCompanyCallLogActivityDetails`

**Logic:**
- Starts from all call logs (no initial match on companyId)
- Joins `lead` → then filters by `lead.company === companyId`
- Joins company, contact, and call log `createdBy` user
- Sorted by `updatedAt: -1, createdAt: -1`
- Throws `NotFoundError` if no activity found

**Response:** array of call logs for all leads under the company — 200

---

### GET `/` — Get All Call Logs (Paginated)
**Auth:** `verifyUser`
**Controller:** `getAll` → `services/callLog.service.js → getAllCallLogs` → `repositories/callLog.repository.js → getAllCallLogsWithPagination`

**Query params:** `page`, `limit`, `lead`, `outcome`, `followUp`, `remarks`, `sort`, `order`, `owner`

**Logic:**
- `userId` and `role` passed in — non-super-admin users only see their own call logs (owner filter)
- `owner` query param only honoured for `SUPER_ADMIN` role
- Pagination via repository aggregation

**Response:** `{ data: [...], info: { ... } }` — 201 (note: controller sends 201 for list, not 200)

---

### PATCH `/:id/restore` — Restore Call Log
**Auth:** `verifyUser`
**Validator:** `validateObjectIdParam('id')`
**Controller:** `restoreACallLog` → `services/callLog.service.js → restoreCallLogById`

**Logic:**
- `CallLog.updateOne` where `deleted.isDeleted: true` → flips to false, sets `restoredAt`, `restoredBy`
- Throws `NotFoundError` if matchedCount === 0

**Response:** 200 with null data

---

### GET `/:id` — Get Single Call Log
**Auth:** `verifyUser`
**Validator:** `validateObjectIdParam('id')`
**Controller:** `getACallLog` → `services/callLog.service.js → getCallLogById` → `repositories/callLog.repository.js → getCallLogByIdWithDetails`

**Response:** single enriched call log — 200

---

### PATCH `/:id` — Update Call Log
**Auth:** `verifyUser`
**Validator:** `validateObjectIdParam('id')`
**Controller:** `updateACallLog` → `services/callLog.service.js → updateCallLog`

**Body (all optional):** `outcome`, `followUp`, `remarks`, `callStartTime`, `callDuration`, `droppedReason`

**Logic (transaction):**
1. Finds call log where `deleted.isDeleted: false`
2. Validates `callDuration` is non-negative number if provided
3. Updates allowed fields: `followUp`, `remarks`, `callStartTime`, `callDuration`, `outcome`
4. If `outcome` changed: finds linked lead, updates `lead.status = outcome`
5. If new outcome is `dropped`: requires `droppedReason`; else clears it on lead
6. Returns enriched result via inline aggregation (same pipeline as create)

**Response:** updated call log — 200

---

### DELETE `/:id` — Soft Delete Call Log
**Auth:** `verifyUser` + `allowRoles(SUPER_ADMIN, ADMIN)`
**Validator:** `validateObjectIdParam('id')`
**Controller:** `deleteACallLog` → `services/callLog.service.js → deleteCallLogById`

**Logic:**
- Finds call log by ID (does NOT check `deleted.isDeleted` — note: no guard)
- Sets `deleted.isDeleted = true`, `deleted.at`, `deleted.by`
- Does NOT revert the lead's status

**Response:** deleted call log doc — 200

---

## Key Business Rules
- Call log `outcome` is always synced to the linked lead's `status` on create AND update
- `dropped` outcome requires `droppedReason` (validated in service, not just validator)
- Non-SUPER_ADMIN users are implicitly filtered to their own call logs in `getAll`
- `owner` filter in `getAll` is only respected for `SUPER_ADMIN`
- Search routes (`/search/company`, `/search/leads/:companyId`) must stay above `/:id` in the route file
- Reports route (`/api/v1/reports/call-logs`) is a separate router using `services/callLog.service.js → getCallLogReportData`
