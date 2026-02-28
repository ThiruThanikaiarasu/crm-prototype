# Lead Feature — Route-by-Route Guide

**Base path:** `/api/v1/leads`
**Files:** `routes/lead.route.js` · `controllers/lead.controller.js` · `services/lead.service.js` · `repositories/lead.repository.js` · `models/lead.model.js` · `models/companyLead.model.js` · `models/contactLead.model.js` · `validators/lead.validator.js`

---

## Data Model

A "lead" is split across 3 collections:
- `{tenantId}_leads` — the core record (status, source, followUp, priority, droppedReason, benificiary, createdBy, dropped, deleted)
- `{tenantId}_companyleads` — company info (name, phone, address, industry, etc.)
- `{tenantId}_contactleads` — contact info (name, email, phone, department, remarks)

One company can have **multiple leads** (one per contact). A lead with no contact is allowed (contact: null).

**Lead statuses:** `new` → `called` → `interested` → `promoted_to_meeting` → `conversion_in_progress` → `dropped`

---

## Routes

### POST `/` — Create Lead
**Auth:** `verifyUser`
**Validator:** `validateCreateANewLeadLeadPayload`
**Controller:** `createANewLead` → `services/lead.service.js → createLead`

**Body:**
```json
{
  "company": { "name", "phone", "address", "industry", ... },
  "leads": [
    { "name", "email", "phone", "department", "remarks", "status", "source", "followUp", "priority", "benificiary" }
  ]
}
```

**Logic:**
1. Checks company uniqueness by name (case-insensitive) OR phone number → throws `ConflictError(409)` if exists
2. Creates `CompanyLead` doc
3. For each lead: checks contact uniqueness by email OR phone → throws `ConflictError(409)` if exists
4. Creates `ContactLead` docs (strips lead-level fields: status, source, followUp, priority, benificiary)
5. Creates `Lead` docs linking company + contact
6. If `leads` array is empty: creates a blank Lead with `contact: null`, `status: 'new'`
7. All in a **Mongoose transaction**

**Response:** `{ company, leads: [...] }` — 201

---

### GET `/` — Get All Leads (Paginated)
**Auth:** `verifyUser`
**Validator:** `validateGetAllLeadsQuery`
**Controller:** `getAll` → `services/lead.service.js → getAllLeads` → `repositories/lead.repository.js → getAllLeadsWithPagination`

**Query params:** `page`, `limit`, `company` (name search), `contact` (name search), `status`, `source`, `sort`, `order`, `followUp`, `serviceType` (array), `owner`

**Logic:**
- Aggregation pipeline with `$lookup` for company, contact, user (createdBy)
- `serviceType` is always cast to array before passing to repository
- `role` passed through for future role-based field visibility (proposal fields etc.)
- Pagination via `$facet` stage from `repositories/aggregate.repository.js`
- Deleted leads filtered out (`'deleted.isDeleted': false`)

**Response:** `{ data: [...], info: { total, page, limit, totalPages, hasMoreRecords } }` — 200

---

### GET `/:id` — Get Lead by ID
**Auth:** `verifyUser`
**Validator:** `validateObjectIdParam('id')`
**Controller:** `getALeadById` → `services/lead.service.js → getLeadById` → `repositories/lead.repository.js → getLeadByIdWithDetails`

**Logic:**
- Aggregation: joins company, contact, user (createdBy), and sibling leads of same company
- `role` passed for proposal field gating
- Throws `NotFoundError(404)` if not found

**Response:** single lead object — 200

---

### PATCH `/:id` — Update Lead
**Auth:** `verifyUser`
**Validator:** `validateObjectIdParam('id')`
**Controller:** `updateALeadById` → `services/lead.service.js → updateLeadById`

**Body (all optional):**
```json
{
  "company": { ...partial company fields },
  "leads": [ { ...new contacts to add } ],
  "name", "email", "phone", "department", "remarks",
  "status", "source", "followUp", "priority", "droppedReason", "benificiary"
}
```

**Logic (all in transaction):**
1. Update `CompanyLead` fields using dot-notation (`$set`) for nested phone/address
2. Update `ContactLead` fields on the existing contact; if no contact yet, creates one
3. `leads` array = **add new contacts** to same company (dedup by email/phone, skips existing)
4. Update lead-level fields directly on the doc
5. If `status === 'dropped'`: sets `droppedReason` + `dropped: { by, at }` subdoc
6. If status changes away from dropped: clears `droppedReason` and `dropped`
7. Returns fresh `getLeadById` result after save

**Response:** updated lead — 200

---

### DELETE `/:id` — Soft Delete Lead
**Auth:** `verifyUser` + `allowRoles(SUPER_ADMIN, ADMIN)`
**Validator:** `validateObjectIdParam('id')`
**Controller:** `deleteALeadById` → `services/lead.service.js → deleteLeadById`

**Logic (transaction):**
1. Finds lead where `deleted.isDeleted: false`
2. Sets `deleted: { isDeleted: true, at, by: userId }` on Lead
3. If lead has a contact, soft-deletes the `ContactLead` too

**Response:** 200 with null data

---

### PATCH `/:id/restore` — Restore Soft-Deleted Lead
**Auth:** `verifyUser`
**Validator:** `validateObjectIdParam('id')`
**Controller:** `restoreALeadById` → `services/lead.service.js → restoreLeadById`

**Logic (transaction):**
1. `Lead.updateOne` where `deleted.isDeleted: true` → sets `isDeleted: false`, `restoredAt`, `restoredBy`
2. Throws `NotFoundError` if matchedCount === 0
3. Fetches the lead doc via aggregation to check if it has a contact
4. If contact exists, restores `ContactLead` too

**Response:** 200 with null data

---

## Key Business Rules
- Company uniqueness checked by name (case-insensitive regex) OR phone number
- Contact uniqueness checked by email OR phone number
- Dropped leads require `droppedReason`; clearing dropped status clears `droppedReason`
- `company` field on a lead is always a reference to `CompanyLead._id`
- Sibling leads (same company) are always returned when fetching a single lead
- Delete cascades to ContactLead; Restore also restores ContactLead
