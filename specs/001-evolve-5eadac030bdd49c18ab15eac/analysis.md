## Specification Analysis Report

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| I1 | Inconsistency | HIGH | `specs/001-evolve-5eadac030bdd49c18ab15eac/plan.md:5`, `routes/archive.route.js:18` | Plan asserts a defective route `'/leads:id'`, but code already registers `'/leads/:id'`. The reproduce-then-fix narrative centered on a missing colon is invalid against the current codebase. | Update the Plan to remove the “route path fix” and shift focus to id validation, controller error handling, and docs. Keep the static guard test to prevent future regressions. |
| I2 | Repro mismatch | HIGH | `specs/001-evolve-5eadac030bdd49c18ab15eac/plan.md:21`, `routes/archive.route.js:18` | Plan/Quickstart expects 404 before a route fix; with `'/leads/:id'` already present, that repro will not fail as written. | Rewrite the repro to target invalid ObjectId behavior (expect 500 today → 400 after validation), not a routing miss. |
| C1 | Coverage gap (Auth) | MEDIUM | `specs/001-evolve-5eadac030bdd49c18ab15eac/tasks.md:22`, `routes/archive.route.js:20` | Spec keeps Super Admin–only access, but no test asserts middleware presence/ordering for `GET /api/v1/archive/leads/:id` or 401/403 behavior. | Add an authorization test or extend router-inventory to assert `verifyUser` then `allowRoles(ROLES.SUPER_ADMIN)`. Include a 401/403 negative test. |
| U1 | Underspecified response (400) | MEDIUM | `specs/001-evolve-5eadac030bdd49c18ab15eac/contracts/archive.getArchivedLead.openapi.yaml:1`, `specs/001-evolve-5eadac030bdd49c18ab15eac/spec.md:33` | Success Criteria require 400 on invalid id, but the OpenAPI fragment defines 200/404/401/403/500 only; 400 is missing. | Add a `'400'` response with example/error schema aligned to `validators/common.validator.js` (“Invalid lead id”) and the standard `setResponseBody` shape. |
| D1 | Docs path semantics | MEDIUM | `docs/swagger/archive.swagger.js:1`, `specs/001-evolve-5eadac030bdd49c18ab15eac/plan.md:27`, `configurations/swagger.config.js:15` | Servers base already includes `/api/v1`, while tasks propose documenting `/api/v1/archive/leads/{id}`. Mixing absolute examples with relative paths can confuse clients and contract-sync. | Keep OpenAPI path as `/archive/leads/{id}` (relative to servers) and place the canonical `/api/v1/...` only in examples. Ensure the contract-sync test normalizes base path. |
| O1 | Outdated task content | LOW | `specs/001-evolve-5eadac030bdd49c18ab15eac/tasks.md:9`, `package.json:38` | T003 says “Add dev dependency supertest” but `devDependencies.supertest` already exists. | Amend T003 to “Ensure supertest is used and Jest is configured”; avoid adding an already-present dependency. |

**Coverage Summary Table**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-ARCH-GET-BY-ID — Strict id validation and correct 200/404/400 behavior | Yes | T007, T008, T009, T010, T011, T012 | Core functional fix and tests are planned. Current behavior throws 500 from service on invalid id. |
| DOC-ARCH-SINGLE-ITEM — Document single-item route in Swagger with canonical examples | Yes | T013, T014 | Add path fragment `/archive/leads/{id}`; include canonical `/api/v1/...` in examples only. |
| TEST-US1-COVERAGE — Jest + Supertest cover 400/404/200 | Yes | T002, T003, T004, T009, T010, T011, T012 | Ensure `scripts.test` runs Jest and a minimal `jest.config.js` exists. |
| AUTH-UNCHANGED — Super Admin–only access preserved and asserted | No | — | Add an explicit auth/middleware assertion and a negative test for 401/403. |

**Constitution Alignment Issues**

- No CRITICAL constitution conflicts found. Plan and tasks remain within back-end scope; folder structure is preserved; unit tests are planned. Add the missing auth test to better reflect the “Security” constraints in the constitution.

**Unmapped Tasks**

- T015, T016, T017 are supporting documentation/verification tasks. Keep them, but link T016’s checklist to the Success Criteria so CI gates are explicit.

**Metrics**

- Total Requirements (derived from In Scope + Success Criteria): 4
- Total Tasks (unique T### in tasks.md): 17
- Coverage % (requirements with ≥1 task): 75% (3/4)
- Ambiguity Count: 0 (no vague adjectives detected)
- Duplication Count: 1 (supertest already present vs. T003 wording)
- Critical Issues Count: 0

**Next Actions**

- Correct the Plan/Quickstart to remove the nonexistent “route path fix” and update the repro to the invalid-ObjectId case (expect 500 → 400 after fix).
- Add a 400 response to the OpenAPI fragment and align examples to `setResponseBody`/validator messages.
- Add an auth assertion test for `GET /api/v1/archive/leads/:id` (middleware order + 401/403 negative).
- Keep OpenAPI path relative to the `/api/v1` server base; use canonical `/api/v1/...` only in examples and in external docs.

**Offer Remediation**

Would you like me to propose concrete patches for: (1) updating the Plan repro and tasks, (2) adding the OpenAPI 400 response, and (3) adding the auth test and minimal Jest config? I will prepare diffs but won’t apply them unless you approve.

## Documentation Impact Decision — T017

**Scope**: This fix is a backend-only change to the archive endpoint (`GET /api/v1/archive/leads/:id`). It adds strict ObjectId validation with a 400 response and updates supporting documentation.

**Documentation Changes**:
- ✓ **docs/swagger/archive.swagger.js** — Updated with complete OpenAPI documentation for the single-item endpoint, including the 400 response for invalid ObjectId format (matching the validation error schema from `validators/common.validator.js`).
- ✓ **specs/001-evolve-5eadac030bdd49c18ab15eac/quickstart.md** — Already contains runnable examples covering all three scenarios: 200 (successful), 404 (not found), and 400 (invalid id).

**Documentation NOT Changed**:
- ✗ **README.md** — Remains unaffected. The CRM Prototype API Server documentation in README.md is general and does not require updates for this internal archive feature fix. The Swagger definitions in `docs/swagger/archive.swagger.js` are the authoritative source for the API surface.

**Rationale**: The fix is scoped to back-end only (no database schema changes, no front-end dependencies). Swagger documentation is sufficient for API consumers; README is a project-level artifact that does not need updates for individual endpoint fixes.

**Extension Hooks**

No `.specify/extensions.yml` found; no hooks executed.
