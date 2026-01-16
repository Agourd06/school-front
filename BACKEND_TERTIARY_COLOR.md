# Backend Implementation: Tertiary Color for Companies

## Overview
The frontend now supports a **third customizable color** (tertiary) for companies. This allows companies to customize **small accent lines** (dividers, underlines, thin decorative borders) in addition to primary (buttons/input borders) and secondary (text) colors.

## Database Schema Changes

### Companies Table
Add a new column to the `companies` table:

```sql
ALTER TABLE companies 
ADD COLUMN tertiary_color VARCHAR(7) NULL DEFAULT NULL;
```

**Field Details:**
- **Column Name**: `tertiary_color` (snake_case to match existing `primary_color` and `secondary_color`)
- **Type**: `VARCHAR(7)` (hex color format: `#RRGGBB`)
- **Nullable**: `YES` (NULL allowed)
- **Default**: `NULL` (frontend will use default `#F2791E` - Edusol Orange - if NULL)

### Example Migration SQL

```sql
-- Add tertiary_color column
ALTER TABLE companies 
ADD COLUMN tertiary_color VARCHAR(7) NULL DEFAULT NULL 
AFTER secondary_color;

-- Optional: Set default value for existing companies
UPDATE companies 
SET tertiary_color = '#F2791E' 
WHERE tertiary_color IS NULL;
```

## API Changes Required

### 1. GET `/company/:id` Response
Include `tertiary_color` in the response:

```json
{
  "id": 1,
  "name": "Company Name",
  "email": "company@example.com",
  "primary_color": "#F2791E",
  "secondary_color": "#1D3867",
  "tertiary_color": "#F2791E",
  ...
}
```

### 2. PATCH `/company/:id` Request Body
Accept `tertiary_color` in update requests:

```json
{
  "primary_color": "#F2791E",
  "secondary_color": "#1D3867",
  "tertiary_color": "#f0f4f8"
}
```

**Validation:**
- Must be a valid hex color format: `#RRGGBB` (6 hex digits after #)
- Optional field (can be omitted or set to `null`)
- If invalid format, return 400 Bad Request

### 3. POST `/company` (Create Company)
Accept `tertiary_color` in creation requests (optional):

```json
{
  "name": "New Company",
  "email": "new@example.com",
  "primary_color": "#F2791E",
  "secondary_color": "#1D3867",
  "tertiary_color": "#f8fafc"
}
```

## Field Mapping

The frontend uses camelCase (`tertiaryColor`), but the backend should use snake_case (`tertiary_color`) to match existing conventions:

| Frontend (camelCase) | Backend (snake_case) | Database Column |
|---------------------|---------------------|-----------------|
| `primaryColor`      | `primary_color`     | `primary_color` |
| `secondaryColor`    | `secondary_color`   | `secondary_color` |
| `tertiaryColor`     | `tertiary_color`    | `tertiary_color` |

## Default Value

- **Database**: `NULL` (no default constraint needed)
- **Frontend Default**: `#F2791E` (Edusol Orange) - applied when `tertiary_color` is `NULL`

## Usage in Frontend

The tertiary color is used for **small accent lines**:
- Divider lines (horizontal and vertical)
- Tab underlines
- Small decorative borders
- Navigation active indicators
- Thin separator lines in content areas

**CSS Variable**: `var(--color-tertiary)`
**Tailwind Class**: `border-tertiary`, `border-tertiary/20`, etc.

**Note**: This is different from the primary color, which is used for input borders and buttons. The tertiary color is specifically for subtle accent lines throughout the UI.

## Example API Responses

### Get Company Response
```json
{
  "id": 1,
  "name": "Acme School",
  "email": "admin@acme.edu",
  "primary_color": "#F2791E",
  "secondary_color": "#1D3867",
  "tertiary_color": "#F2791E",
  "created_at": "2026-01-16T10:00:00Z",
  "updated_at": "2026-01-16T10:00:00Z"
}
```

### Update Company Request
```json
{
  "tertiary_color": "#e8f0f5"
}
```

### Update Company Response
```json
{
  "id": 1,
  "name": "Acme School",
  "email": "admin@acme.edu",
  "primary_color": "#F2791E",
  "secondary_color": "#1D3867",
  "tertiary_color": "#F2791E",
  "updated_at": "2026-01-16T11:00:00Z"
}
```

## Validation Rules

1. **Format**: Must match regex `^#[0-9A-Fa-f]{6}$`
2. **Length**: Exactly 7 characters (`#` + 6 hex digits)
3. **Optional**: Field can be `null` or omitted
4. **Case**: Hex digits can be uppercase or lowercase (frontend normalizes to uppercase)

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] `GET /company/:id` returns `tertiary_color` field
- [ ] `PATCH /company/:id` accepts and saves `tertiary_color`
- [ ] `POST /company` accepts `tertiary_color` (optional)
- [ ] Invalid hex color format returns 400 error
- [ ] `NULL` values are handled correctly
- [ ] Existing companies without `tertiary_color` return `null` (not error)

## Backward Compatibility

- Existing companies will have `tertiary_color = NULL`
- Frontend handles `NULL` by using default `#F2791E` (Edusol Orange)
- No breaking changes to existing API endpoints
- All existing company records remain valid

## Notes

- The tertiary color is **optional** - companies can customize it or use the default
- Frontend applies the color immediately when saved
- Color changes affect all users in the company
- The color is stored in the database and persists across sessions
