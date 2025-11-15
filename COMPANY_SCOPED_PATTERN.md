# Company-Scoped API Pattern

This document describes the pattern for implementing company-scoped operations across all sections of the application.

## Backend Pattern

The backend now extracts `company_id` from the JWT token (`req.user.company_id`) and:
- **Automatically filters** all `getAll()` queries by company_id
- **Automatically sets** company_id in `create()` operations from authenticated user
- **Verifies** company_id matches in `update()` and `delete()` operations

## Frontend Implementation Pattern

### 1. API Files (`src/api/*.ts`)

#### Remove `company_id` from Query Parameters

**Before:**
```typescript
async getAll(params: GetAllParams = {}): Promise<Paginated<Entity>> {
  const qp = new URLSearchParams();
  if (params.company_id) qp.append('company_id', String(params.company_id));
  // ... other params
}
```

**After:**
```typescript
async getAll(params: GetAllParams = {}): Promise<Paginated<Entity>> {
  const qp = new URLSearchParams();
  // company_id is automatically filtered by backend from JWT token, no need to send it
  // ... other params
}
```

#### Update Type Definitions

Remove `company_id` from `GetAll*Params` interfaces (or mark as deprecated with comment):
```typescript
export type GetAllEntityParams = {
  page?: number;
  limit?: number;
  search?: string;
  // company_id is automatically filtered by backend from JWT, no need to send it
  status?: number;
};
```

#### Ensure `company_id` in Create/Update

**Option 1: Use utility function (recommended)**
```typescript
import { ensureCompanyId } from '../utils/companyScopedApi';

async create(data: CreateEntityRequest | FormData): Promise<Entity> {
  const payload = ensureCompanyId(data);
  const response = await api.post('/entities', payload);
  return response.data;
}

async update(id: number, data: UpdateEntityRequest | FormData): Promise<Entity> {
  const payload = ensureCompanyId(data);
  const response = await api.patch(`/entities/${id}`, payload);
  return response.data;
}
```

**Option 2: Manual implementation**
```typescript
import { getCompanyId } from '../utils/companyId';

async create(data: CreateEntityRequest | FormData): Promise<Entity> {
  const companyId = getCompanyId();
  if (data instanceof FormData) {
    if (!data.has('company_id')) {
      data.append('company_id', String(companyId));
    }
  } else {
    (data as any).company_id = companyId;
  }
  const response = await api.post('/entities', data);
  return response.data;
}
```

### 2. Modal Components (`src/components/modals/*.tsx`)

#### Remove Hardcoded `company_id`

**Before:**
```typescript
formData.append('company_id', '1'); // ❌ Hardcoded
```

**After:**
```typescript
// company_id is automatically set by the API from authenticated user
// No need to set it manually
```

The API layer will handle setting `company_id` automatically.

### 3. Section Components (`src/components/sections/*.tsx`)

#### Remove `company_id` from Query Parameters

**Before:**
```typescript
const params = useMemo(() => ({
  page: pagination.page,
  limit: pagination.limit,
  company_id: companyFilter, // ❌ Remove this
  status: filters.status,
}), [filters, pagination, companyFilter]);
```

**After:**
```typescript
const params = useMemo(() => ({
  page: pagination.page,
  limit: pagination.limit,
  // company_id is automatically filtered by backend from JWT
  status: filters.status,
}), [filters, pagination]);
```

## Implementation Checklist

For each entity/section, follow these steps:

- [ ] **API File (`src/api/*.ts`)**:
  - [ ] Remove `company_id` from `getAll()` query parameters
  - [ ] Update `GetAll*Params` type to remove or comment out `company_id`
  - [ ] Add `ensureCompanyId()` to `create()` method
  - [ ] Add `ensureCompanyId()` to `update()` method
  - [ ] Import `ensureCompanyId` from `../utils/companyScopedApi`

- [ ] **Modal Component (`src/components/modals/*.tsx`)**:
  - [ ] Remove hardcoded `company_id` values
  - [ ] Remove `company_id` from form state if it's not user-editable
  - [ ] Add comment explaining that API handles `company_id`

- [ ] **Section Component (`src/components/sections/*.tsx`)**:
  - [ ] Remove `company_id` from query params
  - [ ] Remove company filter UI if it exists
  - [ ] Update params memoization to exclude `company_id`

## Example: Administrators (Completed)

See `src/api/administrators.ts` and `src/components/modals/AdministratorModal.tsx` for a complete reference implementation.

## Next Steps

Apply this pattern to the following sections (in order of priority):

1. ✅ Administrators (completed)
2. Users
3. Students
4. Teachers
5. Classes
6. Programs
7. Specializations
8. Levels
9. Courses
10. Modules
11. Class Rooms
12. School Years
13. School Year Periods
14. Planning Session Types
15. Planning Students
16. Student Payments
17. Student Attestations
18. Attestations
19. ... (all other entities)

## Notes

- The backend will return 404 if trying to access an entity from a different company
- The backend will prevent changing `company_id` in update operations
- All `getAll()` queries are automatically scoped to the authenticated user's company
- No frontend filtering by company is needed - backend handles it automatically

