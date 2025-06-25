# Email Setup Guide for Contract Signature Emails

This guide will help you set up email functionality to send contract signature emails to customers using Nodemailer.

## 📧 Email Features

- **Professional Email Templates**: Beautiful HTML emails with contract details
- **Real Email Sending**: Uses Nodemailer to send actual emails
- **Multiple Email Providers**: Supports Gmail, Outlook, custom SMTP, and SendGrid
- **Contract Details**: Includes all contract information, services, pricing, and terms
- **Digital Signature Link**: Direct link for customers to sign contracts
- **Error Handling**: Graceful fallback with email preview if sending fails

## 🚀 Quick Setup (Gmail)

### 1. Create Gmail App Password

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (enable if not already)
3. Go to **App passwords**
4. Generate an app password for "Mail"
5. Copy the 16-character app password

### 2. Configure Environment Variables

Create or update your `.env` file in the backend directory:

```env
# Email Configuration
EMAIL_PROVIDER=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-16-character-app-password

# Company Information (appears in emails)
COMPANY_EMAIL=contracts@yourcompany.com
COMPANY_PHONE=+1 (555) 123-4567
COMPANY_ADDRESS=123 Business Ave, Suite 100, City, State 12345

# Frontend URL (for signature links)
FRONTEND_URL=http://localhost:4200
```

### 3. Test Email Configuration

1. Start your backend server: `npm start`
2. Test the configuration: `GET /api/customer-contracts/test/email-config`
3. Or use curl:
   ```bash
   curl http://localhost:5000/api/customer-contracts/test/email-config
   ```

## 📨 How to Send Contract Emails

### From Frontend
1. Navigate to a customer contract
2. Click the **"Send Email"** button
3. Confirm sending in the dialog
4. Email will be sent to the customer's email address

### API Endpoint
```http
POST /api/customer-contracts/{contractId}/send-email
```

**Response:**
```json
{
  "success": true,
  "message": "Contract signature email sent successfully to customer@email.com",
  "emailInfo": {
    "to": "customer@email.com",
    "subject": "Contract Signature Required - CC-2024-001",
    "messageId": "<message-id@gmail.com>",
    "contractNumber": "CC-2024-001"
  }
}
```

## 🔧 Alternative Email Providers

### Outlook/Hotmail
```env
EMAIL_PROVIDER=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Custom SMTP
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-password
```

### SendGrid
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
```

## 📋 Email Template Content

The email includes:
- **Professional header** with company branding
- **Contract details** (number, type, dates, billing)
- **Services table** with pricing
- **Special requirements**
- **Terms and conditions**
- **Digital signature button**
- **Company contact information**

## 🛠️ Troubleshooting

### Common Issues

1. **"Invalid login" error with Gmail**
   - Make sure you're using an App Password, not your regular password
   - Ensure 2-Step Verification is enabled

2. **"Connection timeout" error**
   - Check your internet connection
   - Verify SMTP settings for custom providers

3. **Email not received**
   - Check spam/junk folder
   - Verify customer email address is correct
   - Check email service logs

### Testing Email Configuration

```bash
# Test email configuration
curl http://localhost:5000/api/customer-contracts/test/email-config

# Send test email (replace {contractId} with actual ID)
curl -X POST http://localhost:5000/api/customer-contracts/{contractId}/send-email
```

## 🔐 Security Best Practices

1. **Never commit email credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Use App Passwords** instead of regular passwords
4. **Enable 2FA** on email accounts
5. **Regularly rotate** email passwords/API keys

## 📱 Frontend Integration

The frontend automatically:
- Calls the backend API to send emails
- Shows success/error messages
- Displays email preview if sending fails
- Handles error gracefully with fallback

## 🎯 Production Deployment

For production:
1. Use a dedicated email service (SendGrid, AWS SES, etc.)
2. Set up proper DNS records (SPF, DKIM, DMARC)
3. Monitor email delivery rates
4. Implement email logging and analytics
5. Set up email bounce handling

## 📞 Support

If you encounter issues:
1. Check the backend console logs
2. Verify environment variables are set correctly
3. Test email configuration endpoint
4. Check email provider documentation

---

**Note**: The email functionality is now fully integrated with Nodemailer and will send real emails to customers when properly configured! 