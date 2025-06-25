# Kosovo Cleaning Management System - Migration Guide

## Overview

This document outlines the comprehensive adaptations made to transform the cleaning management application for the Kosovo market. The changes align the system with Kosovo's business registration system (ARBK), tax identification (NIPT), employment regulations, and administrative structure.

## Key Changes Summary

### 1. Address System Transformation

**From:** US-style addresses (state + ZIP code)
**To:** Kosovo administrative structure (municipalities)

#### Backend Changes:

- **Customer.js**: Replaced `state` and `zipCode` with `municipality` enum containing all 37 Kosovo municipalities
- **Employee.js**: Updated address structure to use municipalities
- **Invoice.js**: Customer address now uses municipality instead of state/zipCode
- **Object.js**: Cleaning location addresses adapted for Kosovo format

#### Frontend Changes:

- **customer.model.ts**: Added `KOSOVO_MUNICIPALITIES` constant and updated interface
- **invoice.model.ts**: Address interfaces updated for Kosovo structure

### 2. Business Identification System

**From:** Generic business identification
**To:** Kosovo NIPT (Numri i Identifikimit të Personit Tatimor) system

#### Key Features:

- **NIPT Field**: 9-digit tax identification number for businesses
- **Validation**: Automatic validation of NIPT format
- **Business Types**: Updated to Kosovo-specific business registration types:
  - Residential
  - Individual Business
  - General Partnership
  - Limited Partnership
  - Limited Liability Company
  - Joint Stock Company

### 3. Employee Management - Kosovo Compliance

#### Legal Status Fields:

- **Nationality**: Kosovo Citizen, EU Citizen, Non-EU Citizen
- **Personal Number**: 10-digit Kosovo personal ID for citizens
- **Work Permits**: Types A-H for non-Kosovo citizens
- **Residence Permits**: Temporary, Permanent, EU Long-term

#### Document Management:

Updated document types for Kosovo system:

- Kosovo ID Card
- Kosovo Passport
- EU/Non-EU Passports
- Work Permits
- Residence Permits
- Health Insurance Card
- Criminal Background Check
- Professional Qualifications

#### Mandatory Requirements:

- **Health Insurance**: Required for all employees
- **Language Support**: Albanian, Serbian, English, German, Italian, French, Turkish, Bosnian, Croatian, Macedonian

### 4. Banking and Payment System

**From:** US banking system
**To:** Kosovo banking infrastructure

#### Supported Banks:

- ProCredit Bank
- TEB Bank
- NLB Bank
- BKT Bank
- Raiffeisen Bank

#### Features:

- **IBAN Validation**: Kosovo IBAN format (XK21 + 14 digits)
- **Euro Currency**: Default currency set to EUR
- **Payment Methods**: Adapted for Kosovo banking systems

### 5. Tax and Invoice System

#### VAT Structure:

- **0%**: Exempt items
- **8%**: Reduced rate
- **18%**: Standard rate (default)

#### Compliance Features:

- **VAT Registration**: Support for VAT-registered businesses
- **Fiscal Integration**: Prepared for Kosovo fiscal system integration
- **NIPT Integration**: Automatic tax ID inclusion in invoices

### 6. Localization Updates

#### Communication Methods:

- Added WhatsApp as preferred contact method
- Updated phone number formats for Kosovo (+383)

#### Media and Referral Sources:

- Local media: Telegrafi, Express, Koha Ditore, RTK
- Social media: Facebook, Instagram focus
- Removed US-specific sources

#### Service Standards:

- EU Standards Compliance option for special requirements
- Metric system (square meters) for measurements
- Kosovo Health & Safety certifications

## Database Migration Steps

### 1. Customer Migration

```javascript
// Update existing customers
db.customers.updateMany(
  {},
  {
    $unset: { state: "", zipCode: "" },
    $set: {
      municipality: "Pristina", // Default, will need manual update
      customerType: "Residential", // Update business customers manually
    },
  }
);
```

### 2. Employee Migration

```javascript
// Update existing employees
db.employees.updateMany(
  {},
  {
    $unset: { state: "", zipCode: "", routingNumber: "" },
    $set: {
      municipality: "Pristina", // Default, will need manual update
      nationality: "Kosovo Citizen", // Default, update foreign employees manually
      "paymentInfo.iban": "", // Will need manual update
    },
  }
);
```

### 3. Invoice Migration

```javascript
// Update existing invoices
db.invoices.updateMany(
  {},
  {
    $unset: { "customer.address.state": "", "customer.address.zipCode": "" },
    $set: {
      currency: "EUR",
      taxRate: 18, // Standard Kosovo VAT
      "customer.address.municipality": "Pristina", // Default
      "customer.address.country": "Kosovo",
    },
  }
);
```

### 4. Object Migration

```javascript
// Update cleaning locations
db.objects.updateMany(
  {},
  {
    $unset: { "address.state": "", "address.zipCode": "" },
    $set: {
      "address.municipality": "Pristina", // Default
      "address.country": "Kosovo",
      "size.unit": "sqm", // Convert to metric
    },
  }
);
```

## Frontend Component Updates Required

### 1. Form Components

- Update address forms to use municipality dropdowns
- Add NIPT input fields for business customers
- Update employee forms with work permit/residence permit fields
- Add health insurance requirement fields

### 2. Display Components

- Update address display format
- Add Euro currency formatting
- Display Kosovo VAT rates in invoice forms
- Update payment method displays

### 3. Validation Updates

- NIPT format validation (9 digits)
- Kosovo IBAN validation
- Personal number validation (10 digits)
- Work permit expiry date warnings

## Configuration Updates

### 1. Environment Variables

```javascript
// Update environment files
CURRENCY = EUR;
DEFAULT_VAT_RATE = 18;
DEFAULT_COUNTRY = Kosovo;
TIMEZONE = Europe / Belgrade;
```

### 2. Backend Configuration

```javascript
// Update database connection
const db = {
  name: "cleaning_kosovo",
  locale: "sq-XK", // Albanian (Kosovo)
  currency: "EUR",
};
```

## Testing Checklist

### Customer Management

- [ ] Create residential customer without NIPT
- [ ] Create business customer with NIPT
- [ ] Validate municipality dropdown
- [ ] Test address display format

### Employee Management

- [ ] Create Kosovo citizen employee
- [ ] Create foreign employee with work permit
- [ ] Test health insurance requirement
- [ ] Validate IBAN format

### Invoice System

- [ ] Generate invoice with Kosovo VAT
- [ ] Test Euro currency display
- [ ] Validate NIPT inclusion
- [ ] Test payment method selection

### Reporting

- [ ] Revenue by municipality reports
- [ ] VAT collection reports
- [ ] Employee work permit expiry alerts

## Post-Migration Tasks

### 1. Data Cleanup

- Manually update municipality assignments based on actual addresses
- Review and correct business customer types
- Update employee nationalities and work permit status
- Convert area measurements from sq ft to sq m

### 2. User Training

- Train staff on Kosovo business types
- Educate on NIPT requirements
- Update procedures for foreign employee documentation
- Training on Kosovo banking system

### 3. Integration Setup

- Configure Kosovo fiscal system integration (when available)
- Set up automated VAT reporting
- Implement work permit expiry notifications
- Configure local bank payment processing

## Compliance Notes

### Legal Requirements

- All businesses must register with ARBK (Kosovo Business Registration Agency)
- VAT registration required above threshold
- Work permits mandatory for non-Kosovo citizens
- Health insurance mandatory for all employees

### Best Practices

- Keep NIPT records for VAT-registered customers
- Monitor work permit expiry dates
- Maintain proper documentation for foreign employees
- Regular VAT return submissions

## Support and Resources

### Government Agencies

- ARBK (Business Registration): arbk.rks-gov.net
- Tax Administration of Kosovo: atk-ks.org
- Ministry of Internal Affairs (Work permits)

### Banking

- Central Bank of Kosovo: bqk-kos.org
- Kosovo Banking Association

This migration ensures full compliance with Kosovo business regulations while maintaining the application's functionality and user experience.
