# Authentication Setup Guide

This guide will help you set up the complete authentication system for the Cleaning Management System.

## Backend Setup

### 1. Environment Variables
Create a `.env` file in the `backend` directory with the following variables:

```env
MONGODB_URI=mongodb://localhost:27017/cleaning-management
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production-2024
```

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Create Admin User
Run the seed script to create an initial admin user:
```bash
npm run seed-admin
```

This will create an admin user with:
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@cleaning.com`
- **Role**: `admin`

### 4. Start Backend Server
```bash
npm run dev
```

The backend will be available at `http://localhost:3000`

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend/cleaning-management-app
npm install
```

### 2. Start Frontend Server
```bash
ng serve
```

The frontend will be available at `http://localhost:4200`

## Features Implemented

### Backend Features
- ✅ User model with password hashing (bcrypt)
- ✅ JWT token authentication with refresh tokens
- ✅ Authentication middleware
- ✅ Role-based authorization
- ✅ Secure login/logout endpoints
- ✅ User profile management
- ✅ Password change functionality

### Frontend Features
- ✅ Login component with form validation
- ✅ Authentication service with token management
- ✅ HTTP interceptor for automatic token attachment
- ✅ Auth guard for route protection
- ✅ Automatic token refresh
- ✅ User session management
- ✅ Responsive login design

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

## Usage

### 1. Access the Application
Navigate to `http://localhost:4200` in your browser.

### 2. Login
Use the demo credentials:
- **Username**: `admin`
- **Password**: `admin123`

### 3. Protected Routes
All routes except `/login` are now protected and require authentication.

### 4. Token Management
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Tokens are automatically refreshed when needed
- Users are redirected to login when tokens expire

## Security Features

### Password Security
- Passwords are hashed using bcrypt with cost factor 12
- Minimum password length: 6 characters
- Passwords are never returned in API responses

### Token Security
- JWT tokens with short expiration times
- Refresh token rotation
- Secure token storage in localStorage
- Automatic token cleanup on logout

### Route Protection
- All routes protected with auth guard
- Automatic redirect to login for unauthenticated users
- Return URL functionality after login

## User Roles

The system supports the following roles:
- `admin` - Full system access
- `manager` - Management level access
- `supervisor` - Supervisory access
- `employee` - Basic employee access

## Troubleshooting

### Common Issues

1. **Backend not starting**
   - Check if MongoDB is running
   - Verify environment variables in `.env` file
   - Check port 3000 is not in use

2. **Frontend build errors**
   - Ensure all Angular Material modules are imported
   - Check TypeScript compilation errors
   - Verify component declarations in app.module.ts

3. **Authentication not working**
   - Check backend server is running on port 3000
   - Verify JWT secrets are set in environment variables
   - Check browser console for errors

4. **Token refresh issues**
   - Clear localStorage and login again
   - Check backend logs for token validation errors
   - Verify refresh token endpoint is working

## Development Notes

### Adding New Protected Routes
```typescript
{ path: 'new-route', component: NewComponent, canActivate: [AuthGuard] }
```

### Role-Based Access
```typescript
// In component
hasAdminAccess(): boolean {
  return this.authService.hasRole('admin');
}

// In template
<div *ngIf="hasAdminAccess()">Admin only content</div>
```

### Making Authenticated API Calls
The HTTP interceptor automatically adds authentication headers to all requests. No additional configuration needed.

## Next Steps

1. Implement user registration form
2. Add password reset functionality
3. Implement role-based UI components
4. Add user management for admins
5. Implement session timeout warnings
6. Add audit logging for authentication events

## Support

If you encounter any issues with the authentication system, please check:
1. Browser console for frontend errors
2. Backend server logs for API errors
3. MongoDB connection status
4. Environment variable configuration 

# Authentication Setup - Database Authentication

This application uses **database authentication** with JWT tokens for secure access to all features including the invoice system.

## Database Authentication Overview

The system authenticates users against a MongoDB database with the following features:

- **Password Hashing**: Uses bcrypt with salt rounds for secure password storage
- **JWT Tokens**: Access tokens (15 min) and refresh tokens (7 days)
- **Role-based Access**: Admin, Manager, Supervisor, Employee roles
- **User Management**: Registration, login, logout, profile management
- **Session Management**: Automatic token refresh and secure logout

## Default Admin User

An admin user is automatically created when you run the seed script:

**Credentials:**
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@cleaning.com`
- **Role**: `admin`

## Getting Started

### 1. Create Admin User (if not exists)
```bash
cd backend
node scripts/seedAdmin.js
```

### 2. Start Backend Server
```bash
cd backend
npm run dev
```
Server will run on `http://localhost:3000`

### 3. Start Frontend Application
```bash
cd frontend/cleaning-management-app
ng serve
```
Application will run on `http://localhost:4200`

### 4. Login to the Application
1. Navigate to `http://localhost:4200`
2. You'll be redirected to the login page
3. Enter the admin credentials:
   - **Username**: `admin`
   - **Password**: `admin123`
4. Click "Login"

## Authentication Flow

### Login Process
1. User enters username/password
2. Frontend sends credentials to `/api/auth/login`
3. Backend validates against database
4. If valid, returns access token + refresh token
5. Frontend stores tokens and user data in localStorage
6. User is redirected to dashboard

### Protected Routes
All API endpoints require authentication:
- **Invoices**: `/api/invoices/*` 
- **Customers**: `/api/customers/*`
- **Contracts**: `/api/customer-contracts/*`
- **Schedules**: `/api/schedules/*`
- **Objects**: `/api/objects/*`
- **Employees**: `/api/employees/*`

### Token Management
- **Access Token**: 15 minutes expiry, sent with each API request
- **Refresh Token**: 7 days expiry, used to get new access tokens
- **Auto-refresh**: Frontend automatically refreshes expired tokens
- **Logout**: Clears all tokens and redirects to login

## User Roles and Permissions

### Admin
- Full access to all modules
- User management capabilities
- System configuration

### Manager
- Access to all business modules
- Cannot manage users
- Can view all data

### Supervisor
- Limited access to assigned areas
- Can manage schedules and employees
- Restricted customer access

### Employee
- Basic access to assigned tasks
- View own schedules
- Limited data access

## Creating Additional Users

### Via API (requires admin token)
```bash
POST /api/auth/register
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "employee"
}
```

### Via Database Script
Create a script similar to `seedAdmin.js` for bulk user creation.

## Invoice System Authentication

The invoice system is fully integrated with database authentication:

### Frontend Authentication
- All invoice API calls include JWT tokens
- Automatic token refresh on expiry
- Redirects to login if unauthorized

### Backend Authentication
- All invoice endpoints protected with `authenticateToken` middleware
- User context available in controllers via `req.user`
- Audit trail tracks who created/modified invoices

### Customer & Contract Integration
- Invoices can only access customers/contracts the user has permission for
- Role-based filtering applied automatically
- Audit logs track all invoice operations

## Troubleshooting

### Connection Refused Error
If you see `ERR_CONNECTION_REFUSED`:
1. Ensure backend server is running on port 3000
2. Check MongoDB is running and accessible
3. Verify environment variables are set correctly

### Authentication Errors
If login fails:
1. Verify admin user exists (run `node scripts/seedAdmin.js`)
2. Check MongoDB connection
3. Verify JWT_SECRET is set in environment variables
4. Check browser console for detailed error messages

### Token Issues
If getting unauthorized errors:
1. Clear browser localStorage
2. Login again with fresh credentials
3. Check token expiry settings
4. Verify backend authentication middleware

## Environment Variables

Ensure these variables are set in `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/cleaning-management
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
PORT=3000
NODE_ENV=development
```

## Security Best Practices

1. **Change Default Password**: Change admin password after first login
2. **Strong JWT Secrets**: Use long, random strings for JWT secrets
3. **HTTPS in Production**: Always use HTTPS in production
4. **Regular Updates**: Keep dependencies updated
5. **Environment Variables**: Never commit secrets to version control
6. **Token Rotation**: Refresh tokens are automatically rotated
7. **Session Timeout**: Tokens expire to limit exposure

## API Authentication Examples

### Login Request
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### Authenticated Invoice Request
```bash
GET http://localhost:3000/api/invoices
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Refresh Token Request
```bash
POST http://localhost:3000/api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

The authentication system is now fully functional with database integration. All invoice operations and other modules require proper authentication through the database user system. 