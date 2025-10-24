# API Integration Guide

This document outlines the complete API integration for the School Management System frontend, matching the NestJS backend API structure.

## 🔗 API Endpoints Structure

### Authentication API (`src/api/auth.ts`)
- **POST** `/auth/login` - User login
- **POST** `/auth/register` - User registration  
- **POST** `/auth/forgot-password` - Password reset request
- **POST** `/auth/reset-password?token=<token>` - Password reset with token
- **POST** `/auth/change-password` - Change password (authenticated)
- **GET** `/profile` - Get user profile (authenticated)

### Users API (`src/api/users.ts`)
- **GET** `/users` - Get all users
- **GET** `/users/:id` - Get user by ID
- **POST** `/users` - Create new user
- **PATCH** `/users/:id` - Update user
- **DELETE** `/users/:id` - Delete user

### Companies API (`src/api/company.ts`)
- **GET** `/company` - Get all companies
- **GET** `/company/:id` - Get company by ID
- **POST** `/company` - Create new company
- **PATCH** `/company/:id` - Update company
- **DELETE** `/company/:id` - Delete company

### Courses API (`src/api/course.ts`)
- **GET** `/course` - Get all courses
- **GET** `/course/:id` - Get course by ID
- **POST** `/course` - Create new course
- **PATCH** `/course/:id` - Update course
- **DELETE** `/course/:id` - Delete course
- **POST** `/course/:id/modules/:moduleId` - Add module to course
- **DELETE** `/course/:id/modules/:moduleId` - Remove module from course

### Modules API (`src/api/module.ts`)
- **GET** `/module` - Get all modules
- **GET** `/module/:id` - Get module by ID
- **POST** `/module` - Create new module
- **PATCH** `/module/:id` - Update module
- **DELETE** `/module/:id` - Delete module
- **POST** `/module/:id/courses/:courseId` - Add course to module
- **DELETE** `/module/:id/courses/:courseId` - Remove course from module

## 🎣 React Query Hooks

### Authentication Hooks
```typescript
import { useAuth } from '../hooks/useAuth';

const { user, login, register, logout, forgotPassword, resetPassword, changePassword } = useAuth();
```

### Users Hooks
```typescript
import { useUsers, useUser, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/useUsers';
```

### Companies Hooks
```typescript
import { useCompanies, useCompany, useCreateCompany, useUpdateCompany, useDeleteCompany } from '../hooks/useCompanies';
```

### Courses Hooks
```typescript
import { useCourses, useCourse, useCreateCourse, useUpdateCourse, useDeleteCourse, useAddModuleToCourse, useRemoveModuleFromCourse } from '../hooks/useCourses';
```

### Modules Hooks
```typescript
import { useModules, useModule, useCreateModule, useUpdateModule, useDeleteModule, useAddCourseToModule, useRemoveCourseFromModule } from '../hooks/useModules';
```

## 🔧 Configuration

### Environment Variables
```env
VITE_API_URL=http://localhost:3000/api
```

### Axios Configuration
- Base URL: `import.meta.env.VITE_API_URL`
- Timeout: 10 seconds
- Automatic JWT token injection
- Automatic logout on 401 responses

### React Query Configuration
- Stale time: 5 minutes
- Retry: 1 attempt
- Automatic cache invalidation on mutations

## 📊 Data Types

### User Interface
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  company_id?: number;
  created_at?: string;
  updated_at?: string;
}
```

### Company Interface
```typescript
interface Company {
  id: number;
  name: string;
  logo?: string;
  email: string;
  phone?: string;
  website?: string;
  created_at?: string;
  updated_at?: string;
}
```

### Course Interface
```typescript
interface Course {
  id: number;
  name: string;
  description: string;
  duration: number; // in minutes
  created_at?: string;
  updated_at?: string;
  modules?: Module[];
}
```

### Module Interface
```typescript
interface Module {
  id: number;
  name: string;
  description: string;
  duration: number; // in minutes
  created_at?: string;
  updated_at?: string;
  courses?: Course[];
}
```

## 🔐 Authentication Flow

1. **Login**: User provides email/password → receives JWT token
2. **Token Storage**: Token stored in localStorage
3. **Automatic Injection**: Axios automatically adds token to requests
4. **Token Expiry**: Automatic logout on 401 responses
5. **Protected Routes**: Redirect to login if not authenticated

## 🚀 Usage Examples

### Login User
```typescript
const { login } = useAuth();

try {
  await login('user@example.com', 'password123');
  // User is now logged in
} catch (error) {
  console.error('Login failed:', error);
}
```

### Fetch Users
```typescript
const { data: users, isLoading, error } = useUsers();

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;

return (
  <ul>
    {users?.map(user => (
      <li key={user.id}>{user.username}</li>
    ))}
  </ul>
);
```

### Create User
```typescript
const createUser = useCreateUser();

const handleCreate = async () => {
  try {
    await createUser.mutateAsync({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'password123',
      role: 'user'
    });
    // User created successfully
  } catch (error) {
    console.error('Failed to create user:', error);
  }
};
```

### Update User
```typescript
const updateUser = useUpdateUser();

const handleUpdate = async (userId: number) => {
  try {
    await updateUser.mutateAsync({
      id: userId,
      username: 'updateduser',
      email: 'updated@example.com'
    });
    // User updated successfully
  } catch (error) {
    console.error('Failed to update user:', error);
  }
};
```

### Delete User
```typescript
const deleteUser = useDeleteUser();

const handleDelete = async (userId: number) => {
  try {
    await deleteUser.mutateAsync(userId);
    // User deleted successfully
  } catch (error) {
    console.error('Failed to delete user:', error);
  }
};
```

## 🔄 Error Handling

All API calls include proper error handling:
- Network errors
- Authentication errors (401)
- Validation errors (400)
- Server errors (500)

## 🎯 Best Practices

1. **Use React Query hooks** for all data fetching
2. **Handle loading states** with `isLoading` from queries
3. **Handle errors** with `error` from queries/mutations
4. **Invalidate queries** after mutations for data consistency
5. **Use optimistic updates** for better UX
6. **Implement proper error boundaries** for error handling

## 📝 Notes

- All API endpoints require proper authentication except login/register
- JWT tokens are automatically managed
- React Query provides caching, background updates, and optimistic updates
- All mutations automatically invalidate related queries
- TypeScript interfaces ensure type safety across the application



