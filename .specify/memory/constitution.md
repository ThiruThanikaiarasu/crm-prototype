<!--
Sync Impact Report
Version: (none) -> 1.0.0
Modified Principles: (new document)
Added Sections: Core Principles; Additional Constraints & Stack; Development Workflow & Quality Gates; Governance
Removed Sections: none
Follow-up TODOs:
- [NEEDS CLARIFICATION: Official project name]
- [NEEDS CLARIFICATION: Preferred unit test framework for JavaScript backend]
- [NEEDS CLARIFICATION: Lint/format policy (ESLint/Prettier) and rule set]
- [NEEDS CLARIFICATION: Baseline path that defines the folder structure to preserve]
-->

# [NEEDS CLARIFICATION: Official project name] Constitution
<!-- Example: Spec Constitution, TaskFlow Constitution, etc. -->

## Core Principles

### JavaScript First, SOLID, YAGNI
<!-- Example: I. Library-First -->
- All new back-end code is modern JavaScript (Node.js LTS runtime).
- Apply SOLID principles strictly: single responsibility, explicit dependencies, clear interfaces.
- Follow YAGNI: build only what current requirements demand; prefer deletion over premature generalization.
- No TypeScript is introduced unless ratified by an amendment.
<!-- Example: Every feature starts as a standalone library; Libraries must be self-contained, independently testable, documented; Clear purpose required - no organizational-only libraries -->

### Folder Structure Parity
<!-- Example: II. CLI Interface -->
- Preserve the legacy high-level folder layout and module boundaries.
- Keep layers and names: controllers, services, repositories, middleware, validators, configs, constants, utils.
- No cross-layer coupling: controllers do not access repositories directly; services own orchestration.
- Any re-organization requires an ADR and a MINOR or MAJOR constitution amendment.
<!-- Example: Every library exposes functionality via CLI; Text in/out protocol: stdin/args → stdout, errors → stderr; Support JSON + human-readable formats -->

### Unit Tests Are Mandatory
<!-- Example: III. Test-First (NON-NEGOTIABLE) -->
- Every exported function or class MUST have unit tests.
- Write tests alongside code; keep fast and hermetic; no real network, file, or DB I/O.
- Aim for meaningful coverage per module; critical paths MUST be covered.
- Flaky tests are not allowed; tests define behavior and guard regressions.
<!-- Example: TDD mandatory: Tests written → User approved → Tests fail → Then implement; Red-Green-Refactor cycle strictly enforced -->

### Database Actions Are Frozen
<!-- Example: IV. Integration Testing -->
- Do not modify existing DB actions, migrations, or stored behavior.
- Introduce adapters or facades if new access patterns are needed; do not change DB contracts.
- Back-end logic MUST treat the DB layer as an external, stable dependency.
<!-- Example: Focus areas requiring integration tests: New library contract tests, Contract changes, Inter-service communication, Shared schemas -->

### Back-End Scope Only
<!-- Example: V. Observability, VI. Versioning & Breaking Changes, VII. Simplicity -->
- In scope: back-end application logic, APIs, services, and internal libraries.
- Out of scope: front-end, database schema/actions, and infrastructure.
- Changes that cross the boundary require separate specs and governance.
<!-- Example: Text I/O ensures debuggability; Structured logging required; Or: MAJOR.MINOR.BUILD format; Or: Start simple, YAGNI principles -->

## Additional Constraints & Stack
<!-- Example: Additional Constraints, Security Requirements, Performance Standards, etc. -->

- Language: JavaScript (ES modules where practical) on Node.js LTS.
- Dependencies: prefer standard library and small, battle-tested packages; justify new deps.
- Error model: throw typed errors (e.g., BadRequestError, ForbiddenError) and map to HTTP.
- Logging: structured logs at service boundaries; no secrets in logs.
- Configuration: environment-driven; no hardcoded secrets; twelve-factor compatible.
- Validation: validators enforce inputs before service execution.
- Performance & limits: batch and paginate list endpoints; avoid N+1 calls.
- Security: authentication/authorization enforced in middleware and services as per legacy rules.
- Inter-service I/O: text-first interfaces; JSON as the interchange format.
<!-- Example: Technology stack requirements, compliance standards, deployment policies, etc. -->

## Development Workflow & Quality Gates
<!-- Example: Development Workflow, Review Process, Quality Gates, etc. -->

- Definition of Done: code + unit tests + docs in the same change.
- Reviews: at least one reviewer approves; rationale recorded when deviating from principles.
- Style: consistent naming and small modules; prefer pure functions; side effects isolated.
- ADRs: record significant decisions (new deps, cross-boundary changes) in /docs/adrs.
- CI: run tests and linters on each change; main branch remains green.
- Versioning: API changes follow semantic versioning at the service boundary.
<!-- Example: Code review requirements, testing gates, deployment approval process, etc. -->

## Governance
<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

- This constitution governs back-end design and delivery.
- Amendments: propose via PR updating this file with bump rationale; reviewers enforce policy.
- Versioning Policy: MAJOR for breaking governance changes; MINOR for new principles/sections; PATCH for clarifications.
- Compliance: code review MUST check adherence; non-compliant changes are rejected or require an amendment first.
<!-- Example: All PRs/reviews must verify compliance; Complexity must be justified; Use [GUIDANCE_FILE] for runtime development guidance -->

**Version**: 1.0.0 | **Ratified**: 2026-10-17 | **Last Amended**: 2026-10-17
<!-- Example: Version: 2.1.1 | Ratified: 2025-06-13 | Last Amended: 2025-07-16 -->

