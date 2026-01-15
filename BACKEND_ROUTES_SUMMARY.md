# Backend Routes Summary - Quick Reference

## 🎯 Action Required: Add These Routes to Database

### All Routes to Create (8 total)

| Route | Title | Description |
|-------|-------|-------------|
| `/settings` | Settings | Main settings page (parent route) |
| `/settings/colors` | Color Settings | Manage company colors |
| `/settings/access` | Page Access Management | Assign pages to roles (RBAC) |
| `/settings/roles` | Roles Management | Create and manage roles |
| `/settings/types` | Types Settings | Manage system types (parent route) |
| `/settings/types/link` | Link Types | Manage student link types |
| `/settings/types/classroom` | Classroom Types | Manage classroom types |
| `/settings/types/planning` | Planning Session Types | Manage planning session types |

## 🔐 Default Admin Access (First User for Company)

When creating the first admin user, assign these **4 routes** to the admin role:

1. ✅ **`/settings`** - Main settings page
2. ✅ **`/settings/access`** - Page Access Management (to assign pages to roles)
3. ✅ **`/settings/roles`** - Roles Management (to create and manage roles)
4. ✅ **`/users`** - Users Management

**DO NOT** automatically assign:
- ❌ `/settings/colors`
- ❌ `/settings/types` or any sub-routes

## 📋 Implementation Steps

1. **Create 8 pages** in the database with routes listed above
2. **Update admin role creation** to assign only `/settings`, `/settings/access`, and `/users`
3. **Test** that new admins can access these routes

## 🔄 Route Inheritance Logic

The frontend supports parent route inheritance:

- User with `/settings` → Can access all `/settings/*` routes
- User with `/settings/types` → Can access all `/settings/types/*` routes
- User with `/settings/types/link` → Can ONLY access that specific route

This allows granular control while maintaining flexibility.

## 📝 SQL Example

```sql
-- Insert all routes
INSERT INTO pages (title, route, company_id, created_at, updated_at) VALUES
('Settings', '/settings', NULL, NOW(), NOW()),
('Color Settings', '/settings/colors', NULL, NOW(), NOW()),
('Page Access Management', '/settings/access', NULL, NOW(), NOW()),
('Roles Management', '/settings/roles', NULL, NOW(), NOW()),
('Types Settings', '/settings/types', NULL, NOW(), NOW()),
('Link Types', '/settings/types/link', NULL, NOW(), NOW()),
('Classroom Types', '/settings/types/classroom', NULL, NOW(), NOW()),
('Planning Session Types', '/settings/types/planning', NULL, NOW(), NOW());

-- Assign to default admin role (when creating first admin)
-- Get the admin role ID and page IDs, then:
INSERT INTO role_pages (role_id, page_id, company_id, created_at, updated_at)
SELECT admin_role_id, page_id, company_id, NOW(), NOW()
FROM pages
WHERE route IN ('/settings', '/settings/access', '/settings/roles', '/users');
```

## ⚠️ Important Notes

- All pages should have `company_id = NULL` (global pages)
- Routes must match exactly (case-sensitive, with leading slash)
- Parent routes grant access to child routes automatically in frontend
- Existing admins may need manual route assignment or migration script
