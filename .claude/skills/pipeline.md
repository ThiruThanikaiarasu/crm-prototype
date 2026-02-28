# Pipeline Feature — Route-by-Route Guide

**Base path:** `/api/v1/pipeline`
**Files:** `routes/pipeline.route.js` · `controllers/pipeline.controller.js` · `services/pipeline.service.js` · `repositories/pipeline.repository.js` · `models/pipeline.model.js` · `validators/pipeline.validator.js` · `middlewares/fileUpload.middleware.js` · `services/s3.service.js`

---

## Data Model

`{tenantId}_pipelines` fields:
- `company` (ref → CompanyLead) — required, one pipeline per company
- `opportunityStage` — enum of sales stages
- `estimatedValue` — number
- `probability` — number (percentage)
- `expectedRevnue` — number (note: typo in codebase, keep as-is)
- `nextStep` — string
- `followUp` — date
- `remarks` — string
- `proposalNumber` — string (**ADMIN/SUPER_ADMIN only**)
- `proposalDocument` — `{ originalname, size, mimetype, s3Url }` (**ADMIN/SUPER_ADMIN only**)
- `createdBy` (ref → User)
- `deleted` — soft delete subdoc

**Constraint:** one pipeline per company (unique on `company` field for non-deleted pipelines)

---

## Routes

> `/search/company` must be declared **before** `/:id` routes.

---

### GET `/search/company` — Search Companies for Pipeline
**Auth:** `verifyUser`
**Controller:** `searchCompanyForPipelineHandler` → `services/pipeline.service.js → searchCompanyForPipeline`

**Query params:** `search` (optional name filter — currently not passed from controller; controller calls `searchCompanyForPipeline(tenantId)` with no search arg)

**Logic:**
- Queries `{tenantId}_companyleads` (not deleted)
- Filters to companies that have at least one lead with status in `['promoted_to_meeting', 'conversion_in_progress']` (the `activeLeads` lookup)
- Joins `{tenantId}_pipelines` to check if company already has a (possibly archived) pipeline
- Adds `isArchived: true` flag if any pipeline for that company has `deleted.isDeleted: true`
- Projects: `_id`, `name`, `activeLeads`, `isArchived`

**Use case:** Populate company dropdown when creating a pipeline. Frontend can show `isArchived` indicator.

**Response:** array of companies — 200

---

### POST `/` — Create Pipeline
**Auth:** `verifyUser`
**Middleware:** `upload.single('proposalDocument')` (Multer; PDF/DOC/DOCX only)
**Validator:** `validateCreatePipelinePayload`
**Controller:** `create` → `services/pipeline.service.js → createPipeline`

**Body (multipart/form-data):**
```
company: ObjectId (required)
opportunityStage: string
estimatedValue: number
probability: number
expectedRevnue: number
nextStep: string
followUp: ISO date
remarks: string
proposalNumber: string  ← ADMIN/SUPER_ADMIN only
proposalDocument: file  ← ADMIN/SUPER_ADMIN only (PDF, DOC, DOCX)
```

**Logic (transaction + S3):**
1. **Role check:** if `proposalNumber` or `proposalDocument` present and role is not ADMIN/SUPER_ADMIN → `ConflictError(403, INSUFFICIENT_PERMISSIONS)`
2. Check uniqueness: `Pipeline.findOne({ company, deleted.isDeleted: false })` → `ConflictError(409, PIPELINE_ALREADY_EXISTS)`
3. Verify company exists in `CompanyLead` and is not deleted → `NotFoundError(404)`
4. If file uploaded: validates MIME type, uploads to S3 via `uploadToS3()`, stores `{ originalname, size, mimetype, s3Url }`
5. Creates `Pipeline` doc inside transaction
6. **S3 rollback:** if transaction fails after S3 upload, `deleteFromS3(uploadedS3Key)` is called in catch
7. Returns enriched result: pipeline with company joined via aggregation

**Response:** pipeline with company details — 201

---

### GET `/` — Get All Pipelines (Paginated)
**Auth:** `verifyUser`
**Controller:** `getAll` → `services/pipeline.service.js → getAllPipelines`

**Query params:** `opportunityStage`, `owner` (ObjectId), `company` (ObjectId), `page`, `limit`, `sort`, `order`

**Logic:**
- Builds `matchStage` with optional filters
- `owner` and `company` cast to `ObjectId`
- Joins `{tenantId}_companyleads` for each pipeline (non-deleted companies only, `preserveNullAndEmptyArrays: false` — pipelines without valid company are excluded)
- Manual pagination: `$sort → $skip → $limit` (not using `$facet`)
- Separate `countDocuments` call for total count

**Response:** `{ pipelines: [...], info: { total, page, limit, totalPages, hasMoreRecords } }` — 200

---

### GET `/:id` — Get Pipeline by ID
**Auth:** `verifyUser`
**Validator:** `validateObjectIdParam('id')`
**Controller:** `getAPipelineById` → `services/pipeline.service.js → getPipelineById`

**Logic:**
- Aggregation: match by `_id` + `deleted.isDeleted: false`, join company
- Returns `null` if not found → controller returns 404 directly (no thrown error)

**Response:** single pipeline with company — 200, or 404

---

### PATCH `/:id/restore` — Restore Pipeline
**Auth:** `verifyUser`
**Validator:** `validateObjectIdParam('id')`
**Controller:** `restoreAPipelineById` → `services/pipeline.service.js → restorePipelineById`

**Logic:**
- `Pipeline.updateOne` where `deleted.isDeleted: true` → flips to false, sets `restoredAt`, `restoredBy`
- Throws `NotFoundError` if `modifiedCount === 0`

**Response:** 200 with null data

---

### PATCH `/:id` — Update Pipeline
**Auth:** `verifyUser`
**Middleware:** `upload.single('proposalDocument')` (Multer)
**Validator:** `validateObjectIdParam('id')`
**Controller:** `updateAPipelineById` → `services/pipeline.service.js → updatePipelineById`

**Body (multipart/form-data, all optional):**
```
opportunityStage, estimatedValue, probability, expectedRevnue,
nextStep, followUp, remarks,
proposalNumber  ← ADMIN/SUPER_ADMIN only
proposalDocument: file  ← ADMIN/SUPER_ADMIN only
```

**Logic (transaction + S3):**
1. Finds pipeline where not deleted → `NotFoundError(404)`
2. **Role check:** `proposalNumber` or `proposalDocument` present + role not ADMIN/SUPER_ADMIN → `ConflictError(403)`
3. If new file uploaded: validates MIME, uploads to S3 (stores `newS3Key`), records old S3 key from `pipeline.proposalDocument.s3Url`
4. Updates allowed fields list: `opportunityStage`, `estimatedValue`, `probability`, `expectedRevnue`, `nextStep`, `followUp`, `remarks`, `proposalNumber`, `proposalDocument`
5. Saves, commits transaction
6. **After commit:** deletes old S3 file if it existed (fire-and-forget with catch log)
7. **S3 rollback in catch:** if transaction fails, deletes newly uploaded file
8. Returns enriched result via aggregation

**Note:** `company` field is NOT updatable — pipelines are locked to their company.

**Response:** updated pipeline with company — 200

---

### DELETE `/:id` — Soft Delete Pipeline
**Auth:** `verifyUser` + `allowRoles(SUPER_ADMIN, ADMIN)`
**Validator:** `validateObjectIdParam('id')`
**Controller:** `deleteAPipelineById` → `services/pipeline.service.js → deletePipelineById`

**Logic:**
- `Pipeline.findOne` where not deleted → `NotFoundError(404)`
- Sets `deleted.isDeleted = true`, `deleted.at`, `deleted.by`
- **Does NOT delete S3 file** when soft-deleting

**Response:** deleted pipeline doc — 200

---

## Key Business Rules
- One pipeline per company (enforced at create; checked on `deleted.isDeleted: false` pipelines only)
- `proposalNumber` and `proposalDocument` are restricted to ADMIN/SUPER_ADMIN in both create and update
- S3 file lifecycle: upload on create/update, delete old file after successful update commit, rollback new upload on transaction failure
- `company` is immutable after creation
- `searchCompanyForPipeline` only returns companies with leads in `['promoted_to_meeting', 'conversion_in_progress']` — these are companies ready to enter the pipeline
- `isArchived` flag on search results indicates the company already has a soft-deleted pipeline
- Reports for pipelines are handled separately (no dedicated route yet)
