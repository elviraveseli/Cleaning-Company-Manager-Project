# Cleaning Management System

A comprehensive full-stack application for managing cleaning services, built with Angular frontend and Node.js/Express backend with MongoDB database.

## Features Overview

### Core Modules
- **Dashboard** - Overview and analytics
- **Customers** - Customer management
- **Employees** - Employee management and profiles
- **Objects** - Cleaning locations and properties
- **Contracts** - Customer and employee contracts
- **Schedules** - Cleaning schedules and assignments
- **Invoices** - Billing and payment management

## Invoice System with Foreign Key Relationships

### Database Schema Relationships

The invoice system is fully integrated with other modules through comprehensive foreign key relationships:

#### Invoice Model Foreign Keys:
- `customerContract` → CustomerContract._id (Optional)
- `customer.customerId` → Customer._id (Optional)
- `relatedSchedules[]` → Schedule._id[]
- `relatedObjects[]` → Object._id[]
- `createdBy` → User._id
- `lastModifiedBy` → User._id

#### Service Line Items:
- `services[].relatedObject` → Object._id
- `services[].relatedSchedule` → Schedule._id

### Invoice Features

#### Core Functionality:
- **Invoice Management**: Create, read, update, delete invoices
- **Auto-numbering**: Automatic invoice number generation (INV-YYYY-XXXX)
- **Customer Integration**: Link invoices to existing customers or enter manually
- **Contract Integration**: Create invoices from customer contracts
- **Schedule Integration**: Add services from related schedules
- **Object Integration**: Link services to specific cleaning locations

#### Advanced Features:
- **Payment Tracking**: Track payments, partial payments, and outstanding balances
- **Status Management**: Draft, Sent, Paid, Overdue, Cancelled, Partially Paid
- **Tax Calculations**: Configurable tax rates with automatic calculations
- **Discounts**: Apply discounts to invoices
- **Email Integration**: Send invoices via email (ready for email service integration)
- **Recurring Invoices**: Support for recurring billing cycles
- **File Attachments**: Attach documents to invoices
- **Audit Trail**: Track who created/modified invoices

#### Frontend Features:
- **Modern UI**: Responsive design with Material Design components
- **Real-time Calculations**: Automatic totals, tax, and balance calculations
- **Dynamic Forms**: Add/remove service line items dynamically
- **Customer/Contract Selection**: Dropdown selection with filtering
- **Service Templates**: Auto-populate services from contracts
- **Schedule Integration**: Add services from existing schedules
- **Statistics Dashboard**: Overview of invoice metrics and trends
- **Advanced Filtering**: Filter by status, customer, date range, amount
- **Pagination**: Efficient data loading for large datasets

### API Endpoints

#### Invoice CRUD:
- `GET /api/invoices` - List invoices with filtering and pagination
- `GET /api/invoices/:id` - Get single invoice with populated references
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

#### Utility Endpoints:
- `GET /api/invoices/stats` - Get dashboard statistics
- `GET /api/invoices/generate-number` - Generate new invoice number
- `POST /api/invoices/:id/mark-paid` - Mark invoice as paid
- `POST /api/invoices/:id/send-email` - Send invoice via email

#### Relationship Endpoints:
- `GET /api/invoices/customer/:customerId` - Get invoices by customer
- `GET /api/invoices/contract/:contractId` - Get invoices by contract

### Integration Examples

#### Creating Invoice from Contract:
```typescript
// Frontend automatically populates:
// - Customer information from contract
// - Related objects from contract
// - Related schedules from contract
// - Service templates from contract
```

#### Adding Services from Schedules:
```typescript
// Button click adds services for all schedules related to selected contract
// Each service includes:
// - Description with object name and date
// - Duration from schedule
// - Default pricing
```

#### Customer Relationship:
```typescript
// Invoices can be linked to customers in two ways:
// 1. Through customer contract (indirect relationship)
// 2. Direct customer ID (direct relationship)
// Both methods maintain referential integrity
```

### Database Indexes

Optimized for performance with indexes on:
- Invoice number (unique)
- Customer contract reference
- Customer ID
- Issue/due dates
- Status
- Customer email
- Total amount
- Creation date
- Recurring invoice settings

### Virtual Fields

Calculated fields for enhanced functionality:
- `remainingBalance` - Total amount minus paid amount
- `isOverdue` - Boolean indicating if invoice is past due
- `daysOverdue` - Number of days past due date

### Middleware & Validation

- **Pre-save middleware**: Automatic balance calculation and status updates
- **Validation**: Comprehensive field validation with custom error messages
- **Authentication**: All endpoints protected with JWT authentication
- **Authorization**: User-based access control

## Technology Stack

### Frontend:
- **Angular 15+** - Framework
- **Angular Material** - UI Components
- **TypeScript** - Type safety
- **RxJS** - Reactive programming
- **SCSS** - Styling with modern CSS features

### Backend:
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM with schema validation
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Development Tools:
- **Angular CLI** - Development server and build tools
- **Nodemon** - Backend development server
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Getting Started

### Prerequisites:
- Node.js 16+
- MongoDB 4.4+
- Angular CLI

### Installation:

1. **Clone the repository**
```bash
git clone <repository-url>
cd cleaning-management-system
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend/cleaning-management-app
npm install
ng serve
```

4. **Database Setup**
```bash
cd backend
node scripts/seedAdmin.js      # Create admin user
node scripts/seedCustomers.js  # Seed sample customers
node scripts/seedObjects.js    # Seed sample objects
node scripts/seedCustomerContracts.js  # Seed sample contracts
```

### Environment Variables:

Create `.env` file in backend directory:
```env
MONGODB_URI=mongodb://localhost:27017/cleaning-management
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
NODE_ENV=development
PORT=3000
```

## Usage

### Creating Invoices:

1. **From Scratch**: Create invoice with manual customer entry
2. **From Customer**: Select existing customer and populate details
3. **From Contract**: Select contract to auto-populate customer, objects, and services
4. **From Schedules**: Add services based on completed schedules

### Managing Payments:

1. **Mark as Paid**: Record full payment with method and reference
2. **Partial Payments**: Record partial payments with running balance
3. **Payment Tracking**: View payment history and outstanding amounts

### Email Integration:

Ready for email service integration. Current implementation tracks email status and recipients. To enable actual email sending, integrate with services like:
- SendGrid
- AWS SES
- Mailgun
- Nodemailer with SMTP

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the repository or contact the development team. 