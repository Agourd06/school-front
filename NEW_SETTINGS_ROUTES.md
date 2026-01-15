# New Settings Routes - Backend Implementation Guide

## Overview
The settings page has been restructured into granular routes to enable fine-grained role-based access control. Each settings section now has its own route that can be assigned to different roles.

## Routes to Add to Database

### Main Settings Routes

1. **`/settings`** (Parent route)
   - Title: "Settings"
   - Description: "Main settings page - provides access to all settings sections"
   - Note: This is the parent route. Users with this route can access all `/settings/*` sub-routes

2. **`/settings/colors`**
   - Title: "Color Settings"
   - Description: "Manage company colors and branding"
   - Route: `/settings/colors`

3. **`/settings/access`**
   - Title: "Page Access Management"
   - Description: "Assign pages to roles and manage role-based access control"
   - Route: `/settings/access`

4. **`/settings/roles`**
   - Title: "Roles Management"
   - Description: "Create and manage user roles"
   - Route: `/settings/roles`

5. **`/settings/types`** (Parent route for types)
   - Title: "Types Settings"
   - Description: "Manage system types (link types, classroom types, planning session types)"
   - Route: `/settings/types`
   - Note: This is a parent route. Users with this route can access all `/settings/types/*` sub-routes

### Types Sub-Routes

6. **`/settings/types/link`**
   - Title: "Link Types"
   - Description: "Manage student link types"
   - Route: `/settings/types/link`

7. **`/settings/types/classroom`**
   - Title: "Classroom Types"
   - Description: "Manage classroom types"
   - Route: `/settings/types/classroom`

8. **`/settings/types/planning`**
   - Title: "Planning Session Types"
   - Description: "Manage planning session types"
   - Route: `/settings/types/planning`

## Default Admin Access

**IMPORTANT:** When creating a new admin user (first user for a company), the admin should have access to:

1. **`/settings`** - Main settings page
2. **`/settings/access`** - Page Access Management (to assign pages to roles)
3. **`/settings/roles`** - Roles Management (to create and manage roles)
4. **`/users`** - Users Management (to manage users)

**Note:** The admin should NOT automatically get:
- `/settings/colors` (unless specifically assigned)
- `/settings/types` or any of its sub-routes (unless specifically assigned)

This allows for granular control where:
- An admin can manage page access, roles, and users
- But cannot modify colors or types unless explicitly granted

## Route Hierarchy

```
/settings (parent)
├── /settings/colors
├── /settings/access
├── /settings/roles
└── /settings/types (parent)
    ├── /settings/types/link
    ├── /settings/types/classroom
    └── /settings/types/planning
```

## Frontend Route Protection Logic

The frontend `ProtectedRoute` component now supports **parent route inheritance**:

- If a user has `/settings` in `allowedPages`, they can access:
  - `/settings/colors`
  - `/settings/access`
  - `/settings/roles`
  - `/settings/types` (and all its sub-routes)

- If a user has `/settings/types` in `allowedPages`, they can access:
  - `/settings/types/link`
  - `/settings/types/classroom`
  - `/settings/types/planning`

- If a user has only `/settings/types/link` in `allowedPages`, they can ONLY access that specific route

## Backend Implementation Requirements

### 1. Create Pages in Database

All 8 routes listed above need to be created as pages in the database with:
- `title`: As specified above
- `route`: As specified above (exact match required)
- `company_id`: `null` (pages are global, not company-specific)

### 2. Update Default Admin Role Assignment

When creating the first admin user for a company, assign these pages to the admin role:
- `/settings`
- `/settings/access`
- `/users`

**DO NOT** automatically assign:
- `/settings/colors`
- `/settings/roles`
- `/settings/types` or any sub-routes

### 3. Page Creation SQL (Example)

```sql
-- Main settings routes
INSERT INTO pages (title, route, company_id, created_at, updated_at) VALUES
('Settings', '/settings', NULL, NOW(), NOW()),
('Color Settings', '/settings/colors', NULL, NOW(), NOW()),
('Page Access Management', '/settings/access', NULL, NOW(), NOW()),
('Roles Management', '/settings/roles', NULL, NOW(), NOW()),
('Types Settings', '/settings/types', NULL, NOW(), NOW()),
('Link Types', '/settings/types/link', NULL, NOW(), NOW()),
('Classroom Types', '/settings/types/classroom', NULL, NOW(), NOW()),
('Planning Session Types', '/settings/types/planning', NULL, NOW(), NOW());
```

### 4. Default Admin Role Assignment

When creating the default admin role for a new company, assign these pages:

```sql
-- Get page IDs (adjust based on your schema)
-- Assign /settings, /settings/access, /settings/roles, and /users to admin role
INSERT INTO role_pages (role_id, page_id, company_id, created_at, updated_at)
SELECT 
  admin_role_id,
  page_id,
  company_id,
  NOW(),
  NOW()
FROM pages
WHERE route IN ('/settings', '/settings/access', '/settings/roles', '/users');
```

## Testing Checklist

After backend implementation, verify:

- [ ] All 8 routes are created in the database
- [ ] New admin users get `/settings`, `/settings/access`, `/settings/roles`, and `/users` by default
- [ ] Admin can access `/settings/access` page
- [ ] Admin can access `/settings/roles` page (if assigned)
- [ ] Admin can access `/users` page
- [ ] Admin CANNOT access `/settings/types` unless explicitly assigned
- [ ] Parent route inheritance works (users with `/settings` can access `/settings/*`)
- [ ] Granular access works (users with only `/settings/types/link` can only access that route)

## Migration Notes

- **Existing admins**: May need to manually assign new routes or run a migration script
- **Backward compatibility**: The old `/settings` route should still work and grant access to all sub-routes
- **Page auto-generation**: If your system auto-generates pages from routes, ensure these routes are included

## Questions for Backend Team

1. Should we run a migration to assign `/settings/access` and `/settings/roles` to existing admin roles?
2. Do you want to keep the old `/settings` route behavior (grants all access) or make it more restrictive?
3. Should `/settings/colors` be automatically assigned to admins, or kept separate?
