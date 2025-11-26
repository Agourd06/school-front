# Critical Fix: Remove company_id from Request Bodies

## Problem
The backend now **REJECTS** any request body containing `company_id` with error:
```json
{
  "statusCode": 400,
  "message": ["property company_id should not exist"],
  "error": "Bad Request"
}
```

## Solution
Remove all `ensureCompanyId()` calls from API create/update methods. The backend automatically sets `company_id` from the JWT token.

## Files That Need Fixing

All API files that use `ensureCompanyId` in their `create()` or `update()` methods:

1. ✅ `src/api/level.ts` - FIXED
2. ⚠️ `src/api/students.ts`
3. ⚠️ `src/api/module.ts`
4. ⚠️ `src/api/classes.ts`
5. ⚠️ `src/api/studentPayment.ts`
6. ⚠️ `src/api/studentLinkType.ts`
7. ⚠️ `src/api/studentDiplome.ts`
8. ⚠️ `src/api/studentContact.ts`
9. ⚠️ `src/api/specialization.ts`
10. ⚠️ `src/api/program.ts`
11. ⚠️ `src/api/planningSessionType.ts`
12. ⚠️ `src/api/levelPricing.ts`
13. ⚠️ `src/api/classStudent.ts`
14. ⚠️ `src/api/studentPresence.ts`
15. ⚠️ `src/api/planningStudent.ts`
16. ⚠️ `src/api/teachers.ts`
17. ⚠️ `src/api/course.ts`
18. ⚠️ `src/api/classRoom.ts`
19. ⚠️ `src/api/administrators.ts`
20. ⚠️ `src/api/schoolYearPeriod.ts`

## Pattern to Apply

### Before:
```typescript
import { ensureCompanyId } from '../utils/companyScopedApi';

async create(payload: CreateRequest): Promise<Entity> {
  const body = ensureCompanyId(payload);
  const { data } = await api.post('/endpoint', body);
  return data;
}

async update(id: number, payload: UpdateRequest): Promise<Entity> {
  const body = ensureCompanyId(payload);
  const { data } = await api.patch(`/endpoint/${id}`, body);
  return data;
}
```

### After:
```typescript
// Remove import: import { ensureCompanyId } from '../utils/companyScopedApi';

async create(payload: CreateRequest): Promise<Entity> {
  // company_id is automatically set by backend from authenticated user - DO NOT send it
  const { company_id: _ignored, ...rest } = payload;
  const { data } = await api.post('/endpoint', rest);
  return data;
}

async update(id: number, payload: UpdateRequest): Promise<Entity> {
  // company_id is automatically set by backend from authenticated user - DO NOT send it
  const { company_id: _ignored, ...rest } = payload;
  const { data } = await api.patch(`/endpoint/${id}`, rest);
  return data;
}
```

### For FormData:
```typescript
async create(payload: CreateRequest | FormData): Promise<Entity> {
  if (payload instanceof FormData) {
    // Remove company_id if present
    payload.delete('company_id');
  } else {
    // Remove company_id from object
    const { company_id: _ignored, ...rest } = payload;
    payload = rest as CreateRequest;
  }
  const { data } = await api.post('/endpoint', payload);
  return data;
}
```

## Status
- ✅ Level API - Fixed
- ✅ Company API - Already fixed (removes company_id)
- ✅ ClassCourse API - Already correct (doesn't use ensureCompanyId)
- ⚠️ All others - Need fixing

## Testing
After fixing, test each create/update operation to ensure:
1. No 400 errors about company_id
2. Records are created/updated successfully
3. company_id is correctly set by backend (check response)

