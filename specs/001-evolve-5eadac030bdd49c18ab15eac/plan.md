# Implementation Plan — Fix archived lead detail route

## Technical Context
- Router mount: `app.use('/api/v1/archive', archiveRoute)` in `app.js`.
- Defective path in `routes/archive.route.js`: `router.get('/leads:id', ...)` (missing `:` before `id`).
- Expected path: `GET /api/v1/archive/leads/:id` guarded by `verifyUser` and `allowRoles(ROLES.SUPER_ADMIN)` and handled by `getArchivedLead`.
- Controller `controllers/archive.controller.js#getArchivedLead` delegates to service `services/archive.service.js#getArchivedLeadById(tenantId, id)` which returns the archived lead or `null`.
- Role constant source: `constants/role.constant.js` (expects `SUPER_ADMIN`).
- Swagger currently documents the collection route `/archive/leads` but not the single-item route.

Unknowns captured in spec resolved in Phase 0; no DB/schema changes required.

## Constitution Check (Pre-Design)
- Back-End Scope Only: compliant — change is limited to Express routing and tests.
- Folder Structure Parity: compliant — modify only `routes/archive.route.js`; no re-org.
- Unit Tests Mandatory: compliant — add Jest tests (router introspection + behavior via supertest with mocks).
- Language/Stack Constraints: compliant — Node.js + CommonJS; no new deps expected.
- Security/Authorization: unchanged — remains Super Admin only.

## Plan Overview
1. Reproduce defect with a failing route-behavior test hitting `GET /api/v1/archive/leads/:id` → expect 404 due to route not matching.
2. Fix: change `'/leads:id'` to `'/leads/:id'` in `routes/archive.route.js`.
3. Regression tests:
   - Router-inventory test ensures `'/leads/:id'` exists and `'/leads:id'` does not.
   - Route-behavior test (supertest) asserting controller is invoked and 200/404 paths.
4. Guardrail: add a lightweight static check in tests to flag patterns `'/[a-zA-Z0-9]-?id'` without preceding `:` in route defs.
5. Docs: add Swagger JSDoc for `GET /archive/leads/{id}` (in `docs/swagger/archive.swagger.js`).

## Phase 0 Summary (see research.md)
- Official project name: CRM Prototype API Server.
- Test framework: Jest (present in devDependencies).
- Lint/format: Prettier (`.prettierrc`) — no ESLint baseline; keep Prettier-only formatting.
- Baseline folder structure preserved as per current repo layout.
- Policy on who may access archived entities: unchanged — Super Admin only.

## Phase 1 Design
- Data Model: document minimal Lead archive fields and related lookups used by `getArchivedLeadById` (see data-model.md).
- Interface Contract: provide OpenAPI snippet for `GET /archive/leads/{id}` under `contracts/archive.getArchivedLead.openapi.yaml` and plan to mirror it in `docs/swagger/archive.swagger.js`.
- Quickstart: runnable validation via Jest + supertest; sample curl for manual check post-fix (see quickstart.md).

## Constitution Check (Post-Design)
- All gates remain compliant; no unresolved clarifications.

## Tasks
- Update code: fix route path.
- Tests: add router inventory + behavior tests with Jest/supertest.
- Static check: implement simple pattern test to detect missing `:` in route params.
- Docs: add Swagger definition for `GET /archive/leads/{id}`.
- Documentation impact: update `docs/swagger/archive.swagger.js`; README unaffected.

## Artifacts Produced
- `research.md`
- `data-model.md`
- `contracts/archive.getArchivedLead.openapi.yaml`
- `quickstart.md`

## Post-change Notes
- Approval for T001 has been recorded in `approval.md` to allow the bounded routing fix to proceed.
- The expected prerequisite helper `.specify/scripts/python/check_prerequisites.py` has been restored to the repository.
