# School Management System

A modern React application built with TypeScript, TailwindCSS, and React Query for managing school data.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling
- **React Query (TanStack Query)** for data fetching and caching
- **Context API** for global state management
- **Axios** for HTTP requests
- **React Router** for navigation

## Features

- 🔐 Authentication system (Login, Register, Forgot Password)
- 📊 Dashboard with CRUD operations
- 👥 User management
- 🎓 Student management
- 📚 Course management
- 🎨 Modern UI with TailwindCSS
- ⚡ Fast data fetching with React Query
- 🔄 Real-time data synchronization

## Project Structure

```
src/
├── api/
│   └── axios.ts              # Axios configuration
├── context/
│   └── AuthContext.tsx       # Authentication context
├── hooks/
│   ├── useAuth.ts            # Authentication hook
│   ├── useUsers.ts           # Users query hooks
│   ├── useStudents.ts        # Students query hooks
│   └── useCourses.ts         # Courses query hooks
├── components/
│   └── Navbar.tsx            # Navigation component
├── pages/
│   ├── Login.tsx             # Login page
│   ├── Register.tsx          # Registration page
│   ├── ForgotPassword.tsx    # Password reset page
│   └── Dashboard.tsx         # Main dashboard
├── App.tsx                   # Main app component
├── main.tsx                  # App entry point
└── index.css                 # Global styles
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory:
   
   **For local development:**
   ```
   VITE_API_URL=http://localhost:3000
   ```
   
   **For production (deployed backend):**
   ```
   VITE_API_URL=https://your-backend-domain.com
   ```
   
   **Note:** The `/api` prefix is automatically added by the application. Just provide the base URL (without `/api`).
   
   **Example for production:**
   ```
   VITE_API_URL=https://appedusolback.muntadaa.online
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

## API Integration

The application is configured to work with a backend API. Make sure your backend server is running on the URL specified in the `.env` file.

### Expected API Endpoints

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset
- `GET /users` - Fetch users
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `GET /students` - Fetch students
- `POST /students` - Create student
- `PUT /students/:id` - Update student
- `DELETE /students/:id` - Delete student
- `GET /courses` - Fetch courses
- `POST /courses` - Create course
- `PUT /courses/:id` - Update course
- `DELETE /courses/:id` - Delete course

## Features Overview

### Authentication
- Secure login/logout functionality
- User registration with validation
- Password reset via email
- Protected routes
- Token-based authentication

### Data Management
- Real-time data fetching with React Query
- Optimistic updates
- Error handling and retry logic
- Cache management

### UI/UX
- Responsive design with TailwindCSS
- Modern component library
- Loading states and error handling
- Intuitive navigation

## Development

The project uses modern React patterns:
- Functional components with hooks
- TypeScript for type safety
- Context API for global state
- Custom hooks for reusable logic
- React Query for server state management

## Build for Production

**Important:** The `dist` folder is not included in Git (it's in `.gitignore`). After pulling the project, you must build it:

### Step 1: Configure Backend URL

Before building, make sure your `.env` file has the correct production backend URL:

```bash
# .env file
VITE_API_URL=https://your-deployed-backend-domain.com
```

**Note:** 
- Don't include `/api` in the URL - it's added automatically
- The `.env` file is in `.gitignore` for security
- Each environment (dev/prod) should have its own `.env` file

### Step 2: Build the Application

```bash
# Build the production bundle
npm run build
```

The built files will be in the `dist` directory, ready for deployment.

### Step 3: Deploy

The `dist` folder contains all the static files needed for deployment. You can:
- Upload `dist` contents to your web server
- Use `npm start` or `npm run start:prod` to serve it with Vite preview

### Running Production Build Locally

To test the production build locally:

```bash
# Build first
npm run build

# Then serve the production build
npm run start:prod
# or
npm start
```

This will serve the built files from the `dist` directory on your configured domain/port.