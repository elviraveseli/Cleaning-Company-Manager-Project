# 📄 Invoice Automation for Schedules

## Overview
Sistemi i ri krijon automatikisht invoice (fatura) për çdo schedule që kompletohet. Kjo siguron që të gjitha shërbimet e kryera faturohen në mënyrë të saktë dhe në kohë.

## ✨ Features

### 1. Automatic Invoice Creation
- Kur një schedule ndryshohet në status "Completed", automatikisht krijohet një invoice
- Invoice-i përfshin të gjitha detajet e nevojshme për pagesë

### 2. Manual Invoice Creation
- Buton "Create Invoice" 📄 shfaqet për schedule-t e kompletuar
- Mund të krijoni invoice manualisht nëse është e nevojshme

### 3. Professional Invoice Content
- **Invoice Number**: Automatik (INV-2025-0001 format)
- **Customer Information**: Nga customer contract
- **Service Details**: Përshkrimi i shërbimit dhe lokacioni
- **Pricing**: Bazuar në orët e punës dhe tarifën orare (46€/orë)
- **Kosovo VAT**: 18% tatim automatikisht i shtuar
- **Due Date**: 30 ditë nga data e faturës

## 🔧 Technical Implementation

### Backend Changes
1. **Schedule Controller**: Shtuar logjika për të krijuar invoice kur schedule kompletohet
2. **Invoice Creation Function**: Funksion i specializuar për të krijuar invoice nga schedule
3. **API Endpoint**: `POST /api/schedules/:id/invoice` për krijimin manual

### Frontend Changes
1. **Invoice Button**: Buton i ri në schedule list për schedule-t e kompletuar
2. **Toast Notifications**: Mesazhe profesionale për sukses/gabime
3. **Schedule Service**: Metodë e re për të krijuar invoice

## 💰 Pricing Calculation
- **Hourly Rate**: 46€ (mund të konfigurojnë)
- **Duration**: Merr `actualDuration` ose `estimatedDuration`
- **Subtotal**: Duration × Hourly Rate
- **VAT (18%)**: Subtotal × 0.18
- **Total**: Subtotal + VAT

## 📋 Invoice Information
```
Invoice Number: INV-2025-0001
Customer: [Customer Name]
Service: Cleaning service at [Object Name]
Quantity: [Duration] hours
Unit Price: 46.00 EUR
Subtotal: [Calculated]
VAT (18%): [Calculated]
Total: [Calculated]
Due Date: [Issue Date + 30 days]
```

## 🚀 How to Use

### Automatic Creation
1. Kryeni një schedule
2. Ndryshoni statusin në "Completed"
3. Invoice krijohet automatikisht në background

### Manual Creation
1. Shkoni te Schedule List
2. Gjeni një schedule të kompletuar
3. Klikoni butonin 📄 "Create Invoice"
4. Konfirmoni krijimin

## 📱 User Interface
- **Green Button**: 📄 për schedule-t e kompletuar
- **Toast Notifications**: Mesazhe për sukses/gabime
- **Hover Effects**: Buton më i madh kur hover

## 🔍 Monitoring
- Console logs për debugging
- Error handling për probleme
- Success messages për konfirmim

## 🛠️ Configuration
Në `backend/controllers/scheduleController.js`:
```javascript
const hourlyRate = 46; // EUR - mund të ndryshohet
const vatRate = 18; // Kosovo VAT rate
const dueDays = 30; // Days until due
```

## 📊 Benefits
1. **Automatizim**: Nuk ka nevojë për krijim manual
2. **Saktësi**: Eliminon gabimet e krijimit manual
3. **Kohë**: Kursen kohë për stafin
4. **Profesionalizëm**: Fatura të standardizuara
5. **Compliance**: Përmbush kërkesat e Kosovës për VAT

## 🔄 Workflow
```
Schedule Created → Work Performed → Status: Completed → Invoice Auto-Created → Customer Billed
```

## 📧 Next Steps
- Integrim me email service për dërgim automatik
- PDF generation për invoice
- Payment tracking integration
- Recurring invoice për contract të rregullta 