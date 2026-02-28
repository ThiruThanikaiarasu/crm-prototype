# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start dev server with nodemon (auto-reload)
npm run format     # Format all JS/JSX/JSON/MD files with Prettier
npm run format:check  # Check formatting without modifying files
```

No test suite is implemented yet. Jest is installed but the test script is a placeholder.

## Code Style

Enforced via `.prettierrc`: single quotes, 4-space indentation, no semicolons, no tabs.

## Architecture Overview

**Stack:** Node.js + Express 5, MongoDB + Mongoose 9, CommonJS modules

**Entry:** `server.js` → `app.js` (registers routes at `/api/v1/*`)

**Layer structure** (always flow top-to-bottom, never skip layers):
```
routes/ → middlewares/ → validators/ → controllers/ → services/ → repositories/ → models/
```

### Multi-Tenancy

Every request is scoped to a tenant. The JWT payload carries `{ userId, tenantId, role }` and is populated onto `request.user` by `verifyUser` middleware.

Models are **tenant-scoped factories**: calling `leadModel(tenantId)` returns (or creates) a Mongoose model bound to the collection `{tenantId}_leads`. Every model file exports a factory function — never the model directly.

```js
// Example usage in service/repository
const Lead = leadModel(tenantId)
const CompanyLead = companyLeadModel(tenantId)
```

Collections follow the naming pattern `{tenantId}_{collectionname}` (e.g. `abc123_calllogs`).

### Authentication & Authorization

- `verifyUser` — validates the `AccessToken` cookie (JWT), rejects with 401 if missing/expired/invalid
- `allowRoles(...roles)` — middleware factory for role-based access; use after `verifyUser`
- `getRefreshToken` — validates the `RefreshToken` cookie; tokens are single-use (deleted on use)

Roles: `super_admin`, `admin`, `employee` — defined in `constants/role.constant.js`.

### Request Handling Pattern

Controllers always follow this structure:
1. Run `validationResult(request)` — return 400 if errors
2. Call service method with `(payload, tenantId, userId)`
3. Return success via `setResponseBody(message, errorCode, null, data)`
4. Catch errors: `response.status(error.statusCode || 500).send(setResponseBody(...))`

`setResponseBody` is from `utils/` and produces `{ message, errorCode, error, data }`.

### Error Handling

Throw custom errors from `errors/` in service/repository layers — controllers catch them:
- `BadRequestError` (400), `ConflictError` (409), `NotFoundError` (404), `ForbiddenError` (403), `ValidationError`, `UploadError`

All errors carry `{ statusCode, message, errorCode, errorType }`. Error codes are numeric strings defined in `constants/error.constant.js`.

### Repository & Aggregation Pattern

Repositories use Mongoose aggregation pipelines for complex queries. Reusable pipeline stages live in `repositories/aggregate.repository.js`:
- `companyLookupStage()`, `contactLookupStage()` — join related documents
- `paginationFacetStage()` / `formatPaginationResult()` — standard pagination via `$facet`
- `deletedFilterStage()` — filter soft-deleted records

### Soft Delete

Entities are never hard-deleted. They carry a `deleted` subdocument:
```js
{ isDeleted: Boolean, at: Date, by: ObjectId }
```
Queries filter with `'deleted.isDeleted': false`. Restore operations flip `isDeleted` back to `false`.

### Database Transactions

Complex multi-document writes (creating leads with company + contact, converting prospectus to lead, etc.) use Mongoose sessions:
```js
const session = await mongoose.startSession()
session.startTransaction()
// ...
await session.commitTransaction()  // or abortTransaction() in catch
session.endSession()
```

### Key Domain Relationships

- **Lead** = `Lead` record (status, source, etc.) + `CompanyLead` + optional `ContactLead`
- **Prospectus** = pre-lead entity; converting to `qualified` status triggers `_convertProspectusToLead` which creates the Lead/CompanyLead/ContactLead records
- **Pipeline** has stages and companies; archived companies are excluded from pipeline dropdowns
- **CallLog** supports owner filtering (super admin only)

### File Uploads

Files (PDF/DOC/DOCX) are uploaded to AWS S3. Multer is configured in `middlewares/fileUpload.middleware.js`. S3 client is in `configurations/s3.config.js`.

### Environment Variables

Required (validated at startup in `configurations/env.config.js`):
`DB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`, `EMAIL_USER`, `EMAIL_PASS`, `CORS_ORIGIN_URL`

Optional: `PORT` (default 3500), `BUCKET_NAME`, `BUCKET_REGION`, `BUCKET_ACCESS_KEY`, `BUCKET_SECRET_KEY`, `SERVER_URL`, `ENVIRONMENT`
