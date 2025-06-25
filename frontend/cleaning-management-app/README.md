# Cleaning Management System - Frontend

A modern Angular application for managing cleaning company operations with a beautiful Material Design interface.

## Features

- **Employee Management**: View, add, edit, and delete employees
- **Employee Contracts**: Manage employment contracts and terms
- **Objects/Locations**: Track cleaning locations and their requirements
- **Customer Contracts**: Manage service agreements with customers
- **Schedules**: Plan and track cleaning assignments
- **Invoices**: Generate and manage billing
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Material Design**: Modern and intuitive user interface

## Tech Stack

- **Angular 16** - Frontend framework
- **Angular Material** - UI component library
- **TypeScript** - Programming language
- **SCSS** - Styling
- **RxJS** - Reactive programming

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
ng serve
```

3. Navigate to `http://localhost:4200/` in your browser.

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── employees/
│   │   │   ├── employee-list/
│   │   │   └── employee-detail/
│   │   ├── employee-contracts/
│   │   │   ├── employee-contract-list/
│   │   │   └── employee-contract-detail/
│   │   ├── objects/
│   │   │   ├── object-list/
│   │   │   └── object-detail/
│   │   ├── customer-contracts/
│   │   │   ├── customer-contract-list/
│   │   │   └── customer-contract-detail/
│   │   ├── schedules/
│   │   │   ├── schedule-list/
│   │   │   └── schedule-detail/
│   │   └── invoices/
│   │       ├── invoice-list/
│   │       └── invoice-detail/
│   ├── app.component.html
│   ├── app.component.ts
│   ├── app.component.scss
│   ├── app.module.ts
│   └── app-routing.module.ts
├── assets/
└── styles.scss
```

## Navigation

The application includes a sidebar navigation with the following modules:

- **Employees** - Manage cleaning staff
- **Employee Contracts** - Employment agreements
- **Objects** - Cleaning locations
- **Customer Contracts** - Service agreements
- **Schedules** - Cleaning assignments
- **Invoices** - Billing management

## Components

Each module includes:
- **List Component** - Displays all items in a table with search, sort, and pagination
- **Detail Component** - Shows detailed information about a specific item

## Development

### Adding New Components

```bash
ng generate component components/module-name/component-name
```

### Building for Production

```bash
ng build --prod
```

### Running Tests

```bash
ng test
```

## API Integration

The frontend is designed to work with the Node.js/Express backend API. Update the API endpoints in the service files to connect to your backend server.

## Styling

The application uses Angular Material Design components and custom SCSS styles. The main styling file is `src/styles.scss`.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
