# tasks.md — Fix: Super Admin unable to retrieve archived data

Source docs: specs/001-evolve-5eadac030bdd49c18ab15eac/plan.md, specs/001-evolve-5eadac030bdd49c18ab15eac/spec.md
Feature dir: specs/001-evolve-5eadac030bdd49c18ab15eac

## Phase 1 — Setup
- [x] T001 Record approval for the bounded backend fix in specs/001-evolve-5eadac030bdd49c18ab15eac/approval.md (approver, date, scope).
- [x] T002 Update test script in package.json: set scripts.test to jest and add jest config at jest.config.js with testEnvironment: node.
- [x] T003 Add dev dependency supertest and ensure npm test runs: modify package.json and record install step in the PR.
- [x] T004 Create test helper app at tests/helpers/createTestApp.js to mount routes/archive.route.js with injectable stubs for verifyUser and allowRoles.

## Phase 2 — Foundational
- [x] T005 Ensure prerequisite helper exists: .specify/scripts/python/check_prerequisites.py prints FEATURE_DIR and AVAILABLE_DOCS.
- [x] T006 [P] Add static guard test in tests/static/route-param-check.test.js to fail on route param segments missing ':' (e.g., '/leads:id').

## Phase 3 — User Stories (priority order)

### User Story 1 (US1, P1) — Archived lead detail works with strict id validation
Goal: As a Super Admin, I can GET /api/v1/archive/leads/:id and receive 200 when found, 404 when not found, and 400 for invalid id.
Independent test criteria: supertest covers 400 (invalid id), 404 (not found), 200 (found); service not invoked on 400.

- [x] T007 [US1] Add param validator to route: apply validateObjectIdParam('id') in routes/archive.route.js for '/leads/:id'.
- [x] T008 [US1] Handle validation errors in controller: at top of controllers/archive.controller.js#getArchivedLead, call validationResult(request) and return 400 with error body when invalid.
- [x] T009 [US1] Repro test for invalid id → 400 in tests/archive/getLeadById.returns-400-on-invalid-objectid.test.js using GET /api/v1/archive/leads/abc; assert service not called.
- [x] T010 [US1] Not-found test → 404 in tests/archive/getLeadById.returns-404-when-not-found.test.js with valid 24-hex id and mocked aggregate → [].
- [x] T011 [US1] Success test → 200 in tests/archive/getLeadById.returns-200-when-found.test.js with mocked aggregate → [doc].
- [x] T012 [US1] Router inventory test in tests/archive/router-inventory.test.js asserts '/api/v1/archive/leads/:id' is registered and '/api/v1/archive/leads:id' is not.

### User Story 2 (US2, P2) — Docs & contract alignment
Goal: Swagger documents the single-item endpoint with canonical base and matches the OpenAPI fragment.
Independent test criteria: contract-sync test fails if path or parameter is missing/mismatched.

- [x] T013 [P] [US2] Add Swagger for GET /api/v1/archive/leads/{id} in docs/swagger/archive.swagger.js (tag: Archive, security: bearerAuth, path param id required, 200/404 responses).
- [x] T014 [US2] Contract sync test in tests/docs/contract-sync.test.js compares docs/swagger/archive.swagger.js with specs/001-evolve-5eadac030bdd49c18ab15eac/contracts/archive.getArchivedLead.openapi.yaml; fail if GET /archive/leads/{id} (fragment) or canonical example '/api/v1/archive/leads/{id}' missing.

## Final Phase — Polish & Verification
- [x] T015 [P] Update quickstart with 400/404/200 examples in specs/001-evolve-5eadac030bdd49c18ab15eac/quickstart.md and add curl for invalid id returning 400.
- [x] T016 Add verification checklist to specs/001-evolve-5eadac030bdd49c18ab15eac/verification.md (new): how to run tests; manual spot-check; acceptance criteria recap.
- [x] T017 [P] Documentation impact decision: README unaffected; update only docs/swagger/archive.swagger.js and quickstart. Record note in specs/001-evolve-5eadac030bdd49c18ab15eac/analysis.md.

## Dependencies
- Phase order: Setup → Foundational → US1 → US2 → Final.
- Task edges:
  - T002 → T009–T012 (tests need jest config)
  - T003 → T009–T012 (supertest installed)
  - T004 → T009–T012 (helper app for tests)
  - T007, T008 → T009–T011 (behavior tests depend on validation and controller)
  - T013 → T014 (sync test depends on swagger authoring)

## Parallel Opportunities
- [P] T006 can run in parallel with T002–T004.
- [P] T013 can run in parallel with T007–T012 (docs independent of runtime fix).
- [P] T015–T017 can run after US1 stabilizes; T015 and T017 parallelizable.

## Phase 4 — Convergence

- [x] T018 Add 400 response to OpenAPI contract per SC-001 (missing). Contract `specs/001-evolve-5eadac030bdd49c18ab15eac/contracts/archive.getArchivedLead.openapi.yaml` currently defines 200/404/401/403/500 but spec requires 400 for invalid ObjectId; add `'400': { description: Bad Request — invalid ObjectId format, content: { application/json: { example: { message: Invalid lead id, errorCode: INVALID_OBJECT_ID, error: validation_error, data: null } } } }` aligned to validator output (partial).
  - Severity: MEDIUM · Found: OpenAPI contract missing 400 response · Evidence: specs/001-evolve-5eadac030bdd49c18ab15eac/contracts/archive.getArchivedLead.openapi.yaml lacks 400 definition · Assumed: validator message matches "Invalid lead id" from validateObjectIdParam · Guess about the spec: no · Touches: specs/001-evolve-5eadac030bdd49c18ab15eac/contracts/archive.getArchivedLead.openapi.yaml · Done when: OpenAPI contract includes 400 response with example error body and schema
  - Drift: 10/10 (suggested skip) · =10 names no requirement in the spec

- [x] T019 Add canonical path `/api/v1/archive/leads/{id}` example to Swagger JSDoc per plan decision "canonical path including /api/v1" (missing). Swagger `docs/swagger/archive.swagger.js` documents `/archive/leads/{id}` but test expects canonical `/api/v1/archive/leads/{id}` present in the file for external documentation alignment; add example URL in description or x-canonical-path field (partial).
  - Severity: MEDIUM · Found: Swagger JSDoc lacks canonical `/api/v1/archive/leads/{id}` reference · Evidence: docs/swagger/archive.swagger.js line 117 shows `/archive/leads/{id}` only; test at .referee/001-evolve-5eadac030bdd49c18ab15eac/docs.contract-sync.test.js:22 expects `/api/v1/archive/leads/{id}` pattern · Assumed: canonical form should appear in JSDoc description or metadata, not just path definition · Guess about the spec: no · Touches: docs/swagger/archive.swagger.js · Done when: Swagger JSDoc includes `/api/v1/archive/leads/{id}` in the file and contract-sync test passes
  - Drift: 10/10 (suggested skip) · =10 names no requirement in the spec

- [x] T020 Create authorization test for 401/403 scenarios per Constitution "Security" (missing). No test validates that unauthenticated requests return 401 and non-Super-Admin requests return 403 for `GET /api/v1/archive/leads/:id`; add `tests/archive/authz.test.js` with two scenarios: (1) unauthenticated request returns 401, (2) authenticated non-Super-Admin request returns 403 (partial).
  - Severity: MEDIUM · Found: Auth middleware present in route but no test validates 401/403 behavior · Evidence: routes/archive.route.js:18-27 includes verifyUser and allowRoles(ROLES.SUPER_ADMIN) but no test file explicitly tests these paths; coverage gap in C1 · Assumed: auth tests should isolate the middleware behavior without hitting service layer · Guess about the spec: no · Touches: tests/archive/authz.test.js (new file) · Done when: Tests verify 401 (missing auth) and 403 (wrong role) and pass
  - Drift: 10/10 (suggested skip) · =10 names no requirement in the spec

- [x] T021 Fix 404 test mock to return null/undefined per spec behavior (contradicts). Test `tests/archive/getLeadById.returns-404-when-not-found.test.js:37` mocks service with `archiveService.getArchivedLeadById.mockResolvedValue([])` but controller checks `if (!lead)` (line 94 of controllers/archive.controller.js) which treats empty array as truthy; service should resolve to `null` or `undefined` to trigger 404 (contradicts).
  - Severity: HIGH · Found: Test mock returns [] but controller logic expects null/undefined for 404 · Evidence: tests/archive/getLeadById.returns-404-when-not-found.test.js:37 vs. controllers/archive.controller.js:94 `if (!lead)` check · Assumed: service returns null when no record found, not empty array · Guess about the spec: no · Touches: tests/archive/getLeadById.returns-404-when-not-found.test.js · Done when: Test mocks service to return null and test passes with 404 response
  - Drift: 10/10 (suggested skip) · =10 names no requirement in the spec

- [x] T022 Align Swagger 400 response message with validator output (partial). Swagger example at docs/swagger/archive.swagger.js:168 shows `message: "Invalid lead ID format"` but `validateObjectIdParam` from `validators/common.validator.js` likely returns `"Invalid lead id"` (different casing); ensure example matches actual validator message (partial).
  - Severity: MEDIUM · Found: Swagger 400 example message may not match validator message · Evidence: docs/swagger/archive.swagger.js:168 shows "Invalid lead ID format" vs. actual validator behavior (likely lowercase "id") · Assumed: validator message is defined in validators/common.validator.js · Guess about the spec: no · Touches: docs/swagger/archive.swagger.js and verification against validators/common.validator.js · Done when: Swagger 400 example message matches actual validator message from validateObjectIdParam
  - Drift: 10/10 (suggested skip) · =10 names no requirement in the spec

## Phase 5 — Convergence (2026-10-25)

- [x] T023 Fix mock return value in 200 success test (contradicts). Test `tests/archive/getLeadById.returns-200-when-found.test.js:44` mocks `archiveService.getArchivedLeadById.mockResolvedValue([archivedLeadDoc])` (array) but service returns single object or null per line 602 of `services/archive.service.js`; controller checks `if (!lead)` which treats arrays as truthy, causing 200 to return the array instead of unwrapping the first element. Fix mock to return `archivedLeadDoc` (single object) per actual service behavior.
  - Severity: HIGH · Found: Test mock returns array but service and controller expect single object · Evidence: tests/archive/getLeadById.returns-200-when-found.test.js:44 vs. services/archive.service.js:602 `return result.length > 0 ? result[0] : null` · Assumed: service contract is stable and returns single object or null, not array · Guess about the spec: no · Touches: tests/archive/getLeadById.returns-200-when-found.test.js · Done when: Test mock returns single object and test passes with correct 200 response
  - Drift: 10/10 (suggested skip) · =10 names no requirement in the spec

- [x] T024 Align Swagger 400 errorCode with actual ERROR_CODES.VALIDATION_ERROR (partial). Swagger example at docs/swagger/archive.swagger.js:170 shows `errorCode: "INVALID_OBJECT_ID"` but controller at `controllers/archive.controller.js:82` returns `ERROR_CODES.VALIDATION_ERROR` which is `'1001'` per `constants/error.constant.js:1001`. Swagger example must reflect the actual error code returned in 400 responses to match contract and test expectations.
  - Severity: MEDIUM · Found: Swagger 400 errorCode does not match actual controller response · Evidence: docs/swagger/archive.swagger.js:170 shows "INVALID_OBJECT_ID" vs. controllers/archive.controller.js:82 uses ERROR_CODES.VALIDATION_ERROR (which is '1001') · Assumed: error codes are defined in constants/error.constant.js and must match Swagger examples · Guess about the spec: no · Touches: docs/swagger/archive.swagger.js · Done when: Swagger 400 example errorCode changed to '1001' and matches actual validator+controller output
  - Drift: 10/10 (suggested skip) · =10 names no requirement in the spec

## Phase 6: Convergence (2026-10-25)

- [x] T025 Correct 400 response errorCode in OpenAPI contract per actual validator output (contradicts). Contract at `specs/001-evolve-5eadac030bdd49c18ab15eac/contracts/archive.getArchivedLead.openapi.yaml:48` defines `errorCode: INVALID_OBJECT_ID` but controller returns ERROR_CODES.VALIDATION_ERROR = '1001'; align contract example to actual code behavior.
  - Severity: HIGH · Found: Contract 400 example errorCode does not match controller output · Evidence: contracts/archive.getArchivedLead.openapi.yaml:48 shows "INVALID_OBJECT_ID" vs. controllers/archive.controller.js:82 returns ERROR_CODES.VALIDATION_ERROR ('1001') · Assumed: contract must reflect actual response structure · Guess about the spec: no · Touches: specs/001-evolve-5eadac030bdd49c18ab15eac/contracts/archive.getArchivedLead.openapi.yaml · Done when: Contract 400 response example errorCode is '1001'
  - Drift: 10/10 (suggested skip) · =10 names no requirement in the spec

- [x] T026 Add missing 400 response to OpenAPI contract per SC-001 (missing). Contract `specs/001-evolve-5eadac030bdd49c18ab15eac/contracts/archive.getArchivedLead.openapi.yaml` currently defines 200/404/401/403/500 but spec requires 400 for invalid ObjectId (SC-001); add 400 response definition with example matching controller output.
  - Severity: HIGH · Found: OpenAPI contract entirely lacks 400 response despite spec requirement · Evidence: specs/001-evolve-5eadac030bdd49c18ab15eac/contracts/archive.getArchivedLead.openapi.yaml line 42 starts 404; spec.md:46 requires 400 for invalid id · Assumed: contract should document all spec requirements · Guess about the spec: no · Touches: specs/001-evolve-5eadac030bdd49c18ab15eac/contracts/archive.getArchivedLead.openapi.yaml · Done when: Contract includes 400 response with example body matching actual validator + controller output
  - Drift: 10/10 (suggested skip) · =10 names no requirement in the spec

- [x] T027 Correct 404 response errorCode in OpenAPI contract (contradicts). Contract at `specs/001-evolve-5eadac030bdd49c18ab15eac/contracts/archive.getArchivedLead.openapi.yaml:57` defines `errorCode: LEAD_NOT_FOUND` but code returns ERROR_CODES.LEAD_NOT_FOUND = '4201'; update contract example to numeric error code.
  - Severity: MEDIUM · Found: Contract 404 example errorCode is string name instead of numeric code · Evidence: contracts/archive.getArchivedLead.openapi.yaml:57 shows "LEAD_NOT_FOUND" vs. controllers/archive.controller.js:98 returns ERROR_CODES.LEAD_NOT_FOUND ('4201') · Assumed: error codes are always numeric strings in actual responses · Guess about the spec: no · Touches: specs/001-evolve-5eadac030bdd49c18ab15eac/contracts/archive.getArchivedLead.openapi.yaml · Done when: Contract 404 response errorCode example is '4201'
  - Drift: 10/10 (suggested skip) · =10 names no requirement in the spec

- [x] T028 Correct 404 response errorCode in Swagger JSDoc (contradicts). Swagger at `docs/swagger/archive.swagger.js:180` documents 404 response with `errorCode: "LEAD_NOT_FOUND"` but actual code returns ERROR_CODES.LEAD_NOT_FOUND = '4201'; update example to match.
  - Severity: MEDIUM · Found: Swagger 404 example errorCode does not match actual controller response · Evidence: docs/swagger/archive.swagger.js:180 shows "LEAD_NOT_FOUND" vs. controllers/archive.controller.js:98 uses ERROR_CODES.LEAD_NOT_FOUND ('4201') · Assumed: Swagger examples must reflect actual API behavior · Guess about the spec: no · Touches: docs/swagger/archive.swagger.js · Done when: Swagger 404 response errorCode example is '4201'
  - Drift: 10/10 (suggested skip) · =10 names no requirement in the spec

- [x] T029 Correct 400 example message in quickstart (contradicts). Quickstart at `specs/001-evolve-5eadac030bdd49c18ab15eac/quickstart.md:89` shows message `"Invalid lead ID format"` but validator returns `"Invalid lead id"` (lowercase); update example to match validator output.
  - Severity: MEDIUM · Found: Quickstart 400 example message does not match validator message · Evidence: quickstart.md:89 shows "Invalid lead ID format" vs. validators/common.validator.js:11 uses "Invalid lead id" · Assumed: quickstart examples must match actual responses · Guess about the spec: no · Touches: specs/001-evolve-5eadac030bdd49c18ab15eac/quickstart.md · Done when: Quickstart 400 example message is 'Invalid lead id'
  - Drift: 10/10 (suggested skip) · =10 names no requirement in the spec

- [x] T030 Correct 400 example errorCode in quickstart (contradicts). Quickstart at `specs/001-evolve-5eadac030bdd49c18ab15eac/quickstart.md:90` shows `errorCode: "INVALID_OBJECT_ID"` but code returns '1001'; update example to match.
  - Severity: MEDIUM · Found: Quickstart 400 example errorCode does not match controller output · Evidence: quickstart.md:90 shows "INVALID_OBJECT_ID" vs. controllers/archive.controller.js:82 returns ERROR_CODES.VALIDATION_ERROR ('1001') · Assumed: quickstart examples must reflect actual API responses · Guess about the spec: no · Touches: specs/001-evolve-5eadac030bdd49c18ab15eac/quickstart.md · Done when: Quickstart 400 response errorCode example is '1001'
  - Drift: 10/10 (suggested skip) · =10 names no requirement in the spec

- [x] T031 Correct 404 example errorCode in quickstart (contradicts). Quickstart at `specs/001-evolve-5eadac030bdd49c18ab15eac/quickstart.md:70` shows 404 response with `errorCode: "LEAD_NOT_FOUND"` but code returns '4201'; update example.
  - Severity: MEDIUM · Found: Quickstart 404 example errorCode does not match actual controller response · Evidence: quickstart.md:70 shows "LEAD_NOT_FOUND" vs. controllers/archive.controller.js:98 returns ERROR_CODES.LEAD_NOT_FOUND ('4201') · Assumed: quickstart examples must match actual API behavior · Guess about the spec: no · Touches: specs/001-evolve-5eadac030bdd49c18ab15eac/quickstart.md · Done when: Quickstart 404 response errorCode example is '4201'
  - Drift: 10/10 (suggested skip) · =10 names no requirement in the spec

- [x] T032 Clarify 400 response expectations in verification checklist (partial). Verification at `specs/001-evolve-5eadac030bdd49c18ab15eac/verification.md:72–73` vaguely states error values as alternates (`"Invalid lead ID format" or "Invalid lead id"`, `"INVALID_OBJECT_ID" or validation error code`); tighten to exact values expected from code.
  - Severity: MEDIUM · Found: Verification expectations are vague with OR alternatives instead of exact values · Evidence: verification.md:72–73 shows alternatives instead of precise expectations · Assumed: verification should state exact values to avoid ambiguity · Guess about the spec: no · Touches: specs/001-evolve-5eadac030bdd49c18ab15eac/verification.md · Done when: Verification lines 72–73 state exact message 'Invalid lead id' and errorCode '1001' for 400 response
  - Drift: 10/10 (suggested skip) · =10 names no requirement in the spec

- [x] T033 Correct 404 errorCode expectation in verification checklist (contradicts). Verification at `specs/001-evolve-5eadac030bdd49c18ab15eac/verification.md:61` expects errorCode `"LEAD_NOT_FOUND"` but actual code returns '4201'; update expectation.
  - Severity: MEDIUM · Found: Verification 404 expectation does not match actual code output · Evidence: verification.md:61 shows "LEAD_NOT_FOUND" vs. controllers/archive.controller.js:98 returns ERROR_CODES.LEAD_NOT_FOUND ('4201') · Assumed: verification must match actual API behavior · Guess about the spec: no · Touches: specs/001-evolve-5eadac030bdd49c18ab15eac/verification.md · Done when: Verification 404 errorCode expectation is '4201'
  - Drift: 10/10 (suggested skip) · =10 names no requirement in the spec
