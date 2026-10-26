# Research — Archived Lead Detail Route Fix

## Decisions and Rationale

- Decision: Official project name is "CRM Prototype API Server".
  - Rationale: `configurations/swagger.config.js` titles the API "CRM Prototype API"; `package.json` name is `crm-prototype-server`.
  - Alternatives considered: keep unspecified; defer to later naming. Rejected — plan requires a concrete name.

- Decision: Use Jest for unit/regression tests.
  - Rationale: `devDependencies` include `jest`; widely used in Node back-end projects.
  - Alternatives: Mocha, Ava. Rejected — would add new deps and no baseline for them.

- Decision: Use Prettier for formatting; no ESLint enforcement for this fix.
  - Rationale: `.prettierrc` present; no ESLint config in repo. Adding ESLint is out of scope.
  - Alternatives: Add ESLint. Rejected for this bounded bugfix.

- Decision: Preserve current folder structure as baseline boundary.
  - Rationale: Repo layout includes `controllers/`, `services/`, `repositories/`, `middlewares/`, `validators/`, `routes/`, etc.; fix touches only `routes/`.
  - Alternatives: Reorganize routers. Rejected — violates parity principle for this task.

- Decision: Authorization policy remains Super Admin only for archive endpoints.
  - Rationale: Existing middlewares enforce `allowRoles(ROLES.SUPER_ADMIN)`; ticket does not request policy change.
  - Alternatives: Allow Admin. Rejected — out of scope and requires separate approval.

## Clarifications resolved
- Preferred unit test framework for JavaScript backend → Jest
- Lint/format policy and rule set → Prettier only (config in `.prettierrc`)
- Baseline path that defines folder structure to preserve → current repo root layout
- Official project name → CRM Prototype API Server

