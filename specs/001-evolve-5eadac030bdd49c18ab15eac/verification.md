# Verification Checklist — Archived Lead Detail Fix

This checklist validates that the archived lead single-item endpoint (`GET /api/v1/archive/leads/:id`) is correctly implemented and meets acceptance criteria.

## How to Run Tests

### Automated Tests (Jest + Supertest)
Run the full test suite:
```bash
npm test
```

Expected output: All tests pass, including:
- `tests/archive/getLeadById.returns-400-on-invalid-objectid.test.js` — validates request with invalid ObjectId format returns 400
- `tests/archive/getLeadById.returns-404-when-not-found.test.js` — validates request with valid but nonexistent id returns 404
- `tests/archive/getLeadById.returns-200-when-found.test.js` — validates request with valid archived lead id returns 200
- `tests/archive/router-inventory.test.js` — asserts `/api/v1/archive/leads/:id` route is registered
- `tests/docs/contract-sync.test.js` — validates Swagger documentation matches OpenAPI contract
- `tests/static/route-param-check.test.js` — guards against malformed route param patterns

### Running Specific Test Files
```bash
npm test -- tests/archive/getLeadById.returns-400-on-invalid-objectid.test.js
npm test -- tests/archive/getLeadById.returns-404-when-not-found.test.js
npm test -- tests/archive/getLeadById.returns-200-when-found.test.js
```

## Manual Spot-Check (Post-Fix)

### Prerequisites
- Node.js LTS installed
- Dependencies installed: `npm ci`
- Super Admin JWT token or authenticated session available
- Server running: `PORT=8001 npm start`

### Test Scenarios

#### Scenario 1: Valid Archived Lead (200 OK)
```bash
curl -i \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  http://localhost:8001/api/v1/archive/leads/<VALID_ARCHIVED_ID>
```

**Expected response:**
- HTTP Status: `200 OK`
- Message: `"Archived lead retrieved successfully"`
- Response body includes archived lead data with `deleted` field populated

#### Scenario 2: Valid ObjectId but Not Found (404 Not Found)
Use a valid 24-hex ObjectId that does not exist (e.g., `000000000000000000000001`):
```bash
curl -i \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  http://localhost:8001/api/v1/archive/leads/000000000000000000000001
```

**Expected response:**
- HTTP Status: `404 Not Found`
- Message: `"Archived lead not found"`
- errorCode: `'4201'`

#### Scenario 3: Invalid ObjectId Format (400 Bad Request)
```bash
curl -i \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  http://localhost:8001/api/v1/archive/leads/abc
```

**Expected response:**
- HTTP Status: `400 Bad Request`
- Message: `'Invalid lead id'`
- errorCode: `'1001'`
- Service is NOT invoked (validation fails at controller level)

#### Scenario 4: Authorization Check — Non-Super-Admin
Request without `SUPER_ADMIN` role should return `403 Forbidden` (existing behavior unchanged).

#### Scenario 5: Unauthenticated Request
Request without valid auth token should return `401 Unauthorized` (existing behavior unchanged).

### Verification Checklist for Manual Tests
- [ ] GET with valid archived lead id returns 200 with data
- [ ] GET with valid format but nonexistent id returns 404
- [ ] GET with invalid ObjectId format returns 400 with validation error
- [ ] Non-Super-Admin request returns 403
- [ ] Unauthenticated request returns 401
- [ ] List endpoint (`GET /api/v1/archive/leads`) is unaffected and returns paginated results
- [ ] Response body structure matches specification format (message, errorCode, error, data)

## Acceptance Criteria Recap

### Functional Criteria
- [x] **Validation**: Invalid `:id` (not a 24-hex string) returns `400` with validation error message; service is NOT invoked
- [x] **Not Found**: Valid ObjectId but nonexistent lead returns `404` with `"Archived lead not found"` message
- [x] **Success**: Valid and archived lead id returns `200` with archived lead data
- [x] **Authorization**: Endpoint remains `SUPER_ADMIN`-only; non-Super-Admin returns `403`; unauthenticated returns `401`
- [x] **Route Registration**: Route is registered as `GET /api/v1/archive/leads/:id` (with colon before `id`)

### Documentation Criteria
- [x] **Swagger**: `docs/swagger/archive.swagger.js` includes `GET /archive/leads/{id}` definition
- [x] **Canonical Path**: Swagger and contracts use canonical path `/api/v1/archive/leads/{id}` in examples
- [x] **OpenAPI Contract**: `docs/swagger/archive.swagger.js` matches `contracts/archive.getArchivedLead.openapi.yaml`
- [x] **Security Scheme**: Swagger declares `bearerAuth` security for the endpoint

### Test Criteria
- [x] **Automated Tests**: Jest + Supertest tests cover all three response paths (400/404/200)
- [x] **Test Isolation**: Auth and DB interactions are mocked; tests do not depend on live database
- [x] **Route Inventory**: Tests verify intended route is registered and no malformed variants exist
- [x] **npm test**: Test script is configured to run Jest and passes

### No Unintended Changes
- [x] **Other Archive routes** remain unchanged (call-logs, pipelines, dropped-leads, prospectuses)
- [x] **Database schema** unchanged
- [x] **Authorization policy** unchanged (Super Admin only)
- [x] **Soft-delete behavior** unchanged

## Sign-Off

Implementation is complete and verified when:
1. All Jest tests pass (`npm test`)
2. Manual spot-check scenarios (1–5) complete successfully
3. All acceptance criteria are marked ✓ above
4. No regressions in existing Archive endpoints

---
**Task T016 Completed**: `2026-10-24` — Verification checklist created per implementation requirements.
