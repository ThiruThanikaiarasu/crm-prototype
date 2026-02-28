# Prospectus Feature — Route-by-Route Guide

**Base path:** `/api/v1/prospectus`
**Files:** `routes/prospectus.route.js` · `controllers/prospectus.controller.js` · `services/prospectus.service.js` · `repositories/prospectus.repository.js` · `models/prospectus.model.js` · `models/companyProspectus.model.js` · `models/contactProspectus.model.js` · `validators/prospectus.validator.js`

---

## Data Model

Prospectus is a **pre-lead** entity — potential companies before they qualify as leads. Same 3-collection split as leads:
- `{tenantId}_prospectuses` — core record (status, source, followUp, priority, benificiary, convertedToLead, createdBy, deleted)
- `{tenantId}_companyprospectuses` — company info
- `{tenantId}_contactprospectuses` — contact info

**Prospectus statuses:** `new` · `contacted` · `interested` · `not_interested` · `qualified` (→ triggers lead conversion)

**`convertedToLead`** subdoc: `{ isConverted: Boolean, companyLeadId: ObjectId, at: Date }`

---

## Routes

### POST `/` — Create Single Prospectus
**Auth:** `verifyUser`
**Validator:** `validateCreateANewProspectusPayload`
**Controller:** `createANewProspectus` → `services/prospectus.service.js → createProspectus → _createSingleProspectus`

**Body:**
```json
{
  "company": { "name", "phone", ... },
  "leads": [
    {
      "contact": { "name", "email", "phone", "department", "remarks" },
      "status", "source", "followUp", "priority", "benificiary"
    }
  ]
}
```

**Logic (transaction):**
1. Company uniqueness check by name OR phone → `ConflictError(409, PROSPECTUS_COMPANY_ALREADY_EXISTS)`
2. Creates `CompanyProspectus`
3. For each lead in `leads` array: contact uniqueness check by email OR phone → `ConflictError(409, PROSPECTUS_ALREADY_EXISTS)`
4. Creates `ContactProspectus` docs (strips lead-level fields)
5. Creates `Prospectus` docs linking company + contact
6. If `leads` empty: creates blank Prospectus with `contact: null`, `status: 'new'`
7. `createdBy` populated with user's firstName/lastName/email

**Response:** `{ company, prospectuses: [...] }` — 201

---

### POST `/bulk` — Bulk Create Prospectuses
**Auth:** `verifyUser`
**Validator:** `validateBulkCreateProspectusPayload`
**Controller:** `bulkCreateProspectuses` → `services/prospectus.service.js → bulkCreateProspectus`

**Body:** Array of single prospectus payloads (same shape as POST `/`)

**Logic:**
- Wraps all in a **single transaction**
- Iterates and calls `_createSingleProspectus` for each item
- If any one fails (duplicate etc.), entire batch rolls back

**Response:** Array of `{ company, prospectuses }` — 201

---

### GET `/` — Get All Prospectuses (Paginated)
**Auth:** `verifyUser`
**Validator:** `validateGetAllProspectusQuery`
**Controller:** `getAll` → `services/prospectus.service.js → getAllProspectus` → `repositories/prospectus.repository.js → getAllProspectusWithPagination`

**Query params:** `page`, `limit`, `company`, `contact`, `status`, `source`, `sort`, `order`, `followUp`, `serviceType` (array), `owner`

**Logic:**
- Aggregation with lookups for company, contact, createdBy user
- `serviceType` normalized to array
- Deleted filtered out
- Pagination via `$facet`

**Response:** `{ data: [...], info: { total, page, limit, totalPages, hasMoreRecords } }` — 200

---

### GET `/:id` — Get Prospectus by ID
**Auth:** `verifyUser`
**Validator:** `validateObjectIdParam('id')`
**Controller:** `getAProspectusById` → `services/prospectus.service.js → getAProspectusById` → `repositories/prospectus.repository.js → getProspectusById`

**Logic:**
- Aggregation joining company, contact, user
- Throws `NotFoundError(404)` if not found

**Response:** single prospectus object — 200

---

### PATCH `/:id` — Update Prospectus
**Auth:** `verifyUser`
**Validator:** `validateObjectIdParam('id')`
**Controller:** `updateAProspectusById` → `services/prospectus.service.js → updateProspectusById`

**Body (all optional):**
```json
{
  "company": { ...partial fields },
  "contact": { "name", "email", "phone", "department", "remarks" },
  "leads": [ { "contact": { ... }, "status", "source", "followUp", "priority", "benificiary" } ],
  "status", "source", "followUp", "priority", "benificiary"
}
```

**Logic (all in transaction):**
1. Update `CompanyProspectus` via dot-notation `$set`
2. Update `ContactProspectus`; create new contact if none exists yet
3. `leads` array = add new contacts to same company (dedup by email/phone)
4. Update prospectus-level fields
5. **Special case: `status === 'qualified'`**
   - Checks `convertedToLead.isConverted` → throws `BadRequestError(400, PROSPECTUS_ALREADY_CONVERTED)` if already converted
   - Calls `_convertProspectusToLead()` which:
     - Loads `CompanyProspectus` → checks if company already exists in `CompanyLead` (by name/phone) → reuses or creates
     - Loads `ContactProspectus` → creates new `ContactLead`
     - Creates a `Lead` record with source/followUp/priority/benificiary from prospectus
     - Returns `companyLead._id`
   - Sets `convertedToLead: { isConverted: true, companyLeadId, at: new Date() }`
6. Returns fresh `getAProspectusById` result after save

**Response:** updated prospectus — 200

---

### DELETE `/:id` — Soft Delete Prospectus
**Auth:** `verifyUser` + `allowRoles(SUPER_ADMIN, ADMIN)`
**Validator:** `validateObjectIdParam('id')`
**Controller:** `deleteAProspectusById` → `services/prospectus.service.js → deleteProspectusById`

**Logic (transaction):**
1. Finds prospectus where `deleted.isDeleted: false`
2. Sets `deleted: { isDeleted: true, at, by }` on Prospectus
3. If has contact, soft-deletes `ContactProspectus` too

**Response:** 200 with null data

---

### PATCH `/:id/restore` — Restore Prospectus
**Auth:** `verifyUser`
**Validator:** `validateObjectIdParam('id')`
**Controller:** `restoreAProspectusById` → `services/prospectus.service.js → restoreProspectusById`

**Logic (transaction):**
1. `Prospectus.updateOne` where `deleted.isDeleted: true` → flips to false, sets `restoredAt`, `restoredBy`
2. Throws `NotFoundError` if matchedCount === 0
3. Fetches via aggregation to find contact
4. Restores `ContactProspectus` if present

**Response:** 200 with null data

---

## Key Business Rules
- `qualified` status is the **only trigger** for lead conversion — one-way, irreversible
- Bulk create is atomic: any single failure rolls back the whole batch
- `_createSingleProspectus` is a shared private function used by both single and bulk create
- CompanyProspectus → CompanyLead reuse logic: if company name/phone matches an existing `CompanyLead`, it reuses that doc (does NOT create a duplicate)
- Prospectus contact dedup uses same email/phone check as leads
