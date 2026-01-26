# Frontend Role Filter Update

## Summary
The frontend has been updated to use backend filtering instead of client-side filtering for role types (system/custom).

## Changes Made

### 1. Updated `src/components/sections/RolesSection.tsx`

**Before:** Client-side filtering
- Fetched all roles (or 1000 roles when filtering)
- Applied filter in JavaScript
- Applied client-side pagination

**After:** Backend filtering
- Sends `is_system` parameter to API
- Backend handles filtering and pagination
- Uses API response directly

### 2. API Parameter Mapping

The frontend now maps the filter selection to the backend API parameter:

| Filter Selection | API Parameter Value |
|-----------------|---------------------|
| "all" | `is_system: undefined` (not sent) |
| "system" | `is_system: true` |
| "custom" | `is_system: false` |

## Code Changes

### Updated Params Logic
```typescript
const params = useMemo(
  () => ({
    page: pagination.page,
    limit: pagination.limit,
    search: filters.search.trim() || undefined,
    // Convert filter to backend is_system parameter
    is_system: roleTypeFilter === 'all' 
      ? undefined 
      : roleTypeFilter === 'system' 
      ? true 
      : false,
  }),
  [filters, pagination, roleTypeFilter]
);
```

### Simplified Data Processing
```typescript
// Filter out 'prof' role - it's deprecated, use 'teacher' instead
// Note: Ideally, this should also be filtered on the backend
const roles = (rolesResp?.data ?? []).filter(role => role.code !== 'prof');
const meta = rolesResp?.meta ?? { ...EMPTY_META, page: pagination.page, limit: pagination.limit };
```

## Benefits

1. **Better Performance**: Backend filtering reduces data transfer
2. **Proper Pagination**: Server-side pagination works correctly with filters
3. **Scalability**: Works efficiently even with thousands of roles
4. **Consistency**: Filtering logic is centralized on the backend

## Backend Requirements

The backend must support the `is_system` query parameter as documented in `BACKEND_ROLE_FILTER_GUIDE.md`.

## Testing

After backend implementation, test:
1. ✅ Filter "All" returns all roles
2. ✅ Filter "Default" (system) returns only system roles
3. ✅ Filter "Custom" returns only custom roles
4. ✅ Pagination works correctly with each filter
5. ✅ Search works correctly with each filter
6. ✅ Filter changes reset pagination to page 1

## Notes

- The 'prof' role filtering is still done client-side. Consider moving this to the backend as well.
- The filter automatically resets pagination to page 1 when changed (already implemented).
