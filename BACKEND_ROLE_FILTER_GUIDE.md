# Backend Role Filter Implementation Guide

## Overview
This guide explains how to implement the role type filter (`is_system`) in the backend API endpoint for fetching roles.

## Backend Implementation

### 1. API Endpoint
**Endpoint:** `GET /roles`

### 2. Query Parameters
The endpoint should accept the following query parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number for pagination (default: 1) |
| `limit` | number | No | Number of items per page (default: 10) |
| `search` | string | No | Search term to filter roles by code or label |
| `is_system` | boolean | No | Filter by role type:<br>- `true`: Returns only system roles<br>- `false`: Returns only custom roles<br>- `undefined` or not provided: Returns all roles |

### 3. Backend Implementation Example (NestJS)

```typescript
// roles.controller.ts
@Get()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
async findAll(
  @Query('page') page?: number,
  @Query('limit') limit?: number,
  @Query('search') search?: string,
  @Query('is_system') is_system?: string, // Comes as string from query params
): Promise<PaginatedResponse<Role>> {
  const pageNum = page ? Number(page) : 1;
  const limitNum = limit ? Number(limit) : 10;
  const searchTerm = search?.trim() || undefined;
  
  // Convert string to boolean if provided
  // IMPORTANT: Handle both 'true' and 'false' strings from query params
  let isSystemFilter: boolean | undefined = undefined;
  if (is_system !== undefined && is_system !== null) {
    // Query params come as strings, so 'true' becomes true, 'false' becomes false
    if (is_system === 'true' || is_system === true) {
      isSystemFilter = true;
    } else if (is_system === 'false' || is_system === false) {
      isSystemFilter = false;
    }
  }

  return this.rolesService.findAll({
    page: pageNum,
    limit: limitNum,
    search: searchTerm,
    is_system: isSystemFilter,
  });
}
```

```typescript
// roles.service.ts
async findAll(params: {
  page?: number;
  limit?: number;
  search?: string;
  is_system?: boolean;
}): Promise<PaginatedResponse<Role>> {
  const { page = 1, limit = 10, search, is_system } = params;
  
  const queryBuilder = this.roleRepository.createQueryBuilder('role');

  // Apply search filter
  if (search) {
    queryBuilder.where(
      '(role.code ILIKE :search OR role.label ILIKE :search)',
      { search: `%${search}%` }
    );
  }

  // Apply is_system filter
  if (is_system !== undefined) {
    if (search) {
      queryBuilder.andWhere('role.is_system = :is_system', { is_system });
    } else {
      queryBuilder.where('role.is_system = :is_system', { is_system });
    }
  }

  // Exclude deprecated 'prof' role
  queryBuilder.andWhere('role.code != :profCode', { profCode: 'prof' });

  // Apply pagination
  const skip = (page - 1) * limit;
  queryBuilder.skip(skip).take(limit);

  // Get total count before pagination
  const total = await queryBuilder.getCount();

  // Get paginated results
  const roles = await queryBuilder.getMany();

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / limit);

  return {
    data: roles,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}
```

### 4. DTO Validation (Optional but Recommended)

```typescript
// get-roles.dto.ts
import { IsOptional, IsBoolean, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetRolesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_system?: boolean;
}
```

### 5. API Response Format

The endpoint should return a paginated response:

```json
{
  "data": [
    {
      "id": 1,
      "code": "admin",
      "label": "Administrator",
      "company_id": null,
      "is_system": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

## API Usage Examples

### Get all roles
```
GET /roles?page=1&limit=10
```

### Get only system roles
```
GET /roles?page=1&limit=10&is_system=true
```

### Get only custom roles
```
GET /roles?page=1&limit=10&is_system=false
```

### Get all roles with search
```
GET /roles?page=1&limit=10&search=admin
```

### Get custom roles with search
```
GET /roles?page=1&limit=10&is_system=false&search=manager
```

## Testing Checklist

- [ ] `GET /roles` returns all roles when `is_system` is not provided
- [ ] `GET /roles?is_system=true` returns only system roles
- [ ] `GET /roles?is_system=false` returns only custom roles
- [ ] Pagination works correctly with the filter
- [ ] Search works correctly with the filter
- [ ] The deprecated 'prof' role is excluded from results
- [ ] Response includes correct pagination metadata

## Notes

1. **Query Parameter Type**: The `is_system` parameter comes as a string from the URL query string (`"true"` or `"false"`), so you need to convert it to a boolean in your backend.

2. **Filter Logic**: 
   - When `is_system` is `undefined` or not provided → return all roles
   - When `is_system` is `true` → return only system roles (`is_system = true`)
   - When `is_system` is `false` → return only custom roles (`is_system = false`)

3. **Combining Filters**: The filter should work in combination with search and pagination parameters.

4. **Performance**: Consider adding a database index on the `is_system` column if you have many roles.
