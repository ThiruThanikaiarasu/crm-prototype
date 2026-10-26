# Data Model — Archived Lead Retrieval (focused excerpt)

## Entities

- Lead
  - Key fields used:
    - `_id: ObjectId`
    - `company: ObjectId`
    - `contact: ObjectId | null`
    - `owner: ObjectId | null`
    - `deleted: { isDeleted: boolean, at: Date, by: ObjectId }`
  - Lookups (service layer):
    - Join `company` details from `${tenantId}_companyleads`
    - Join `contact` details from `${tenantId}_contactleads`
    - Join `owner` and `deleted.by` user details from `${tenantId}_users`
    - Join other archived leads for the same company (excluding current)

- User (for owner and deleted.by projections)
  - `_id, firstName, lastName, email, role`

- Company (for grouping and context)
  - `_id, name, website, phone, socialProfile`

## Validation Rules (implied)
- `id` must be a valid MongoDB ObjectId
- Only documents with `deleted.isDeleted = true` are returned
- Tenant isolation enforced by `tenantId` context in model selection

## State Transitions
- No state changes in this endpoint; read-only over soft-deleted records

