# Cleaning Management System - Backend API

A comprehensive REST API for managing cleaning company operations including employees, contracts, objects, schedules, and invoices.

## Features

- **Employee Management**: Full CRUD operations for cleaning staff
- **Employee Contracts**: Manage employment contracts and terms
- **Objects/Locations**: Track cleaning locations and their requirements
- **Customer Contracts**: Manage service agreements with customers
- **Schedules**: Plan and track cleaning assignments
- **Invoices**: Generate and manage billing

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **CORS** - Cross-origin resource sharing
- **JWT** - Authentication (ready for implementation)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/cleaning-management
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

3. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Employees
- `GET /api/employees` - Get all employees (with pagination and search)
- `GET /api/employees/stats` - Get employee statistics
- `GET /api/employees/:id` - Get employee details
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Employee Contracts
- `GET /api/employee-contracts` - Get all contracts
- `GET /api/employee-contracts/employee/:employeeId` - Get contracts by employee
- `GET /api/employee-contracts/:id` - Get contract details
- `POST /api/employee-contracts` - Create new contract
- `PUT /api/employee-contracts/:id` - Update contract
- `DELETE /api/employee-contracts/:id` - Delete contract

### Objects/Locations
- `GET /api/objects` - Get all objects
- `GET /api/objects/:id` - Get object details
- `POST /api/objects` - Create new object
- `PUT /api/objects/:id` - Update object
- `DELETE /api/objects/:id` - Delete object

### Customer Contracts
- `GET /api/customer-contracts` - Get all customer contracts
- `GET /api/customer-contracts/:id` - Get contract details
- `POST /api/customer-contracts` - Create new contract
- `PUT /api/customer-contracts/:id` - Update contract
- `DELETE /api/customer-contracts/:id` - Delete contract

### Schedules
- `GET /api/schedules` - Get all schedules
- `GET /api/schedules/:id` - Get schedule details
- `POST /api/schedules` - Create new schedule
- `PUT /api/schedules/:id` - Update schedule
- `PATCH /api/schedules/:id/status` - Update schedule status
- `DELETE /api/schedules/:id` - Delete schedule

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get invoice details
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id` - Update invoice
- `PATCH /api/invoices/:id/payment` - Update invoice payment
- `DELETE /api/invoices/:id` - Delete invoice

## Query Parameters

Most list endpoints support the following query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search term
- `status` - Filter by status
- `date` - Filter by date (schedules)
- `dateFrom`/`dateTo` - Date range (invoices)

## Database Models

### Employee
- Personal information (name, email, phone, address)
- Employment details (position, hourly rate, status)
- Documents and emergency contacts

### EmployeeContract
- Contract terms and conditions
- Salary and benefits information
- Start/end dates and status

### Object
- Location details and address
- Cleaning requirements and specifications
- Contact person information

### CustomerContract
- Customer information
- Service details and pricing
- Contract terms and billing frequency

### Schedule
- Assignment details (employees, objects, times)
- Task tracking and completion status
- Customer feedback

### Invoice
- Billing information and line items
- Payment tracking and status
- Tax and discount calculations

## Development

Run the development server with auto-reload:
```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## Production

For production deployment:
```bash
npm start
```

Make sure to:
1. Set appropriate environment variables
2. Use a production MongoDB instance
3. Configure proper security measures
4. Set up SSL/TLS certificates 