# Quickstart — Validate Archived Lead Detail Fix

This guide validates that `GET /api/v1/archive/leads/:id` routes correctly and returns data for archived leads.

## Prerequisites
- Node.js LTS installed
- Dependencies installed: `npm ci`
- Environment configured for app startup (see `configurations/env.config`)
- Super Admin JWT available (or session cookie) for local testing

## Automated validation (preferred)
1. Set test script to run Jest (one-time):
   - In `package.json`, change `test` to `"jest"`.
2. Run tests:
   - `npm test`
   - Expected: failing test before fix; passing after route path corrected to `'/leads/:id'`.

## Manual spot-check (post-fix)
1. Start server: `PORT=8001 npm start`
2. Test each response scenario:

### 200 — Successful retrieval
Retrieve an archived lead with valid ID (replace `<VALID_ARCHIVED_ID>` and `<JWT>`):

```bash
curl -i \
  -H "Authorization: Bearer <JWT>" \
  http://localhost:8001/api/v1/archive/leads/<VALID_ARCHIVED_ID>
```

Expected response:
```json
HTTP/1.1 200 OK
{
  "message": "Archived lead retrieved successfully",
  "errorCode": null,
  "error": "0000",
  "data": {
    "_id": "695012cde2389e938f922ea0",
    "status": "new",
    "deleted": {
      "isDeleted": true,
      "at": "2025-12-27T17:21:08.245Z",
      "by": {
        "_id": "69217fc1d26c2d434bee1ae4",
        "firstName": "Thiru",
        "lastName": "T",
        "email": "thiru9@gmail.com",
        "role": "super_admin"
      }
    }
  }
}
```

### 404 — Not found
Retrieve with valid ObjectId format but non-existent lead (replace `<NONEXISTENT_ID>` with a valid hex string like `000000000000000000000001`):

```bash
curl -i \
  -H "Authorization: Bearer <JWT>" \
  http://localhost:8001/api/v1/archive/leads/<NONEXISTENT_ID>
```

Expected response:
```json
HTTP/1.1 404 Not Found
{
  "message": "Archived lead not found",
  "errorCode": "4201",
  "error": "not_found",
  "data": null
}
```

### 400 — Invalid ObjectId
Retrieve with invalid ObjectId format (non-hex or wrong length):

```bash
curl -i \
  -H "Authorization: Bearer <JWT>" \
  http://localhost:8001/api/v1/archive/leads/abc
```

Expected response:
```json
HTTP/1.1 400 Bad Request
{
  "message": "Invalid lead id",
  "errorCode": "1001",
  "error": "validation_error",
  "data": null
}
```

## Documentation
- Add Swagger JSDoc for `GET /archive/leads/{id}` in `docs/swagger/archive.swagger.js` to align with `contracts/archive.getArchivedLead.openapi.yaml`.

