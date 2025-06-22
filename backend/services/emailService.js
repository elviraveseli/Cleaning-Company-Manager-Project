const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Configure email transporter
    this.transporter = this.createTransporter();
    
    // Company information
    this.companyInfo = {
      name: 'Professional Cleaning Services',
      email: process.env.COMPANY_EMAIL || 'contracts@cleaningpro.com',
      phone: process.env.COMPANY_PHONE || '+1 (555) 123-4567',
      address: process.env.COMPANY_ADDRESS || '123 Business Avenue, Suite 100, City, State 12345'
    };
  }

  createTransporter() {
    // Gmail configuration (most common)
    if (process.env.EMAIL_PROVIDER === 'gmail') {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD // Use App Password, not regular password
        }
      });
    }

    // Default: Gmail configuration
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD || 'your-app-password'
      }
    });
  }

  // Generate contract signature email HTML template
  generateContractEmailHTML(contract) {
    const signatureUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/contracts/${contract._id}/sign`;
    
    const servicesHtml = contract.services.map(service => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${service.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${service.frequency}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${service.price.toLocaleString()}</td>
      </tr>
    `).join('');

    const specialRequirementsHtml = contract.specialRequirements && contract.specialRequirements.length > 0 
      ? contract.specialRequirements.map(req => `<li>${req}</li>`).join('')
      : '<li>None specified</li>';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contract Signature Required</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
        .contract-details { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .detail-label { font-weight: bold; color: #6b7280; }
        .detail-value { color: #1f2937; }
        .services-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .services-table th { background-color: #f3f4f6; padding: 12px 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
        .services-table td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        .total-row { background-color: #f8fafc; font-weight: bold; }
        .signature-button { display: inline-block; background-color: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .signature-button:hover { background-color: #047857; }
        .requirements-list { margin: 10px 0; padding-left: 20px; }
        .alert { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>Contract Signature Required</h1>
            <p>Your cleaning service contract is ready for your digital signature</p>
        </div>

        <!-- Content -->
        <div class="content">
            <p>Dear ${contract.customer.name},</p>
            
            <p>Thank you for choosing <strong>${this.companyInfo.name}</strong> for your cleaning needs. Your contract is now ready for your digital signature.</p>

            <!-- Contract Overview -->
            <div class="contract-details">
                <h3 style="margin-top: 0; color: #1f2937;">Contract Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Contract Number:</span>
                    <span class="detail-value">${contract.contractNumber}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Contract Type:</span>
                    <span class="detail-value">${contract.contractType}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Start Date:</span>
                    <span class="detail-value">${new Date(contract.startDate).toLocaleDateString()}</span>
                </div>
                ${contract.endDate ? `
                <div class="detail-row">
                    <span class="detail-label">End Date:</span>
                    <span class="detail-value">${new Date(contract.endDate).toLocaleDateString()}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                    <span class="detail-label">Billing Frequency:</span>
                    <span class="detail-value">${contract.billingFrequency}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payment Terms:</span>
                    <span class="detail-value">${contract.paymentTerms}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Total Contract Value:</span>
                    <span class="detail-value" style="font-weight: bold; color: #059669;">$${contract.totalAmount.toLocaleString()}</span>
                </div>
            </div>

            <!-- Services -->
            <h3 style="color: #1f2937;">Services Included</h3>
            <table class="services-table">
                <thead>
                    <tr>
                        <th>Service</th>
                        <th>Frequency</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${servicesHtml}
                    <tr class="total-row">
                        <td colspan="2" style="text-align: right; padding: 12px 8px;">Total:</td>
                        <td style="text-align: right; padding: 12px 8px;">$${contract.totalAmount.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>

            <!-- Special Requirements -->
            ${contract.specialRequirements && contract.specialRequirements.length > 0 ? `
            <h3 style="color: #1f2937;">Special Requirements</h3>
            <ul class="requirements-list">
                ${specialRequirementsHtml}
            </ul>
            ` : ''}

            <!-- Terms and Notes -->
            ${contract.terms ? `
            <h3 style="color: #1f2937;">Terms & Conditions</h3>
            <p style="background-color: #f8fafc; padding: 15px; border-radius: 6px; font-size: 14px;">${contract.terms}</p>
            ` : ''}

            ${contract.notes ? `
            <h3 style="color: #1f2937;">Additional Notes</h3>
            <p style="background-color: #f8fafc; padding: 15px; border-radius: 6px; font-size: 14px;">${contract.notes}</p>
            ` : ''}

            <!-- Signature Call to Action -->
            <div class="alert">
                <strong>Action Required:</strong> Please review the contract details above and click the button below to sign digitally.
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${signatureUrl}" class="signature-button">Sign Contract Digitally</a>
            </div>

            <p style="font-size: 14px; color: #6b7280;">
                If you have any questions about this contract, please don't hesitate to contact us. We look forward to providing you with exceptional cleaning services.
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <h4 style="margin: 0 0 10px 0; color: #1f2937;">${this.companyInfo.name}</h4>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                📧 ${this.companyInfo.email} | 📞 ${this.companyInfo.phone}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                📍 ${this.companyInfo.address}
            </p>
            <p style="margin: 15px 0 0 0; font-size: 12px; color: #9ca3af;">
                This email was sent regarding contract ${contract.contractNumber}. 
                If you received this email in error, please contact us immediately.
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  // Generate text version of the email (fallback)
  generateContractEmailText(contract) {
    const signatureUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/contracts/${contract._id}/sign`;
    
    const services = contract.services.map(service => 
      `- ${service.name} (${service.frequency}): $${service.price.toLocaleString()}`
    ).join('\n');

    const specialReqs = contract.specialRequirements && contract.specialRequirements.length > 0 
      ? contract.specialRequirements.map(req => `- ${req}`).join('\n')
      : '- None specified';

    return `
CONTRACT SIGNATURE REQUIRED

Dear ${contract.customer.name},

Thank you for choosing ${this.companyInfo.name} for your cleaning needs. Your contract is now ready for your digital signature.

CONTRACT DETAILS:
- Contract Number: ${contract.contractNumber}
- Contract Type: ${contract.contractType}
- Start Date: ${new Date(contract.startDate).toLocaleDateString()}
${contract.endDate ? `- End Date: ${new Date(contract.endDate).toLocaleDateString()}` : ''}
- Billing Frequency: ${contract.billingFrequency}
- Payment Terms: ${contract.paymentTerms}
- Total Contract Value: $${contract.totalAmount.toLocaleString()}

SERVICES INCLUDED:
${services}

Total: $${contract.totalAmount.toLocaleString()}

SPECIAL REQUIREMENTS:
${specialReqs}

${contract.terms ? `
TERMS & CONDITIONS:
${contract.terms}
` : ''}

${contract.notes ? `
ADDITIONAL NOTES:
${contract.notes}
` : ''}

ACTION REQUIRED:
Please review the contract details above and visit the link below to sign digitally:

${signatureUrl}

If you have any questions about this contract, please don't hesitate to contact us.

Best regards,
${this.companyInfo.name}

Contact Information:
Email: ${this.companyInfo.email}
Phone: ${this.companyInfo.phone}
Address: ${this.companyInfo.address}

---
This email was sent regarding contract ${contract.contractNumber}.
If you received this email in error, please contact us immediately.
`;
  }

  // Send contract signature email
  async sendContractSignatureEmail(contract) {
    try {
      console.log('EmailService: Starting to send contract email');
      console.log('EmailService: Contract ID:', contract._id);
      console.log('EmailService: Customer email:', contract.customer?.email);
      
      // Validate contract and customer email
      if (!contract || !contract.customer || !contract.customer.email) {
        console.log('EmailService: Validation failed');
        throw new Error('Invalid contract or missing customer email');
      }

      const subject = `Contract Signature Required - ${contract.contractNumber}`;
      console.log('EmailService: Generating HTML content');
      const htmlContent = this.generateContractEmailHTML(contract);
      console.log('EmailService: HTML content generated successfully');

      const mailOptions = {
        from: {
          name: this.companyInfo.name,
          address: process.env.EMAIL_USER || 'your-email@gmail.com'
        },
        to: {
          name: contract.customer.name,
          address: contract.customer.email
        },
        subject: subject,
        html: htmlContent,
        // Optional: Add attachments like contract PDF
        // attachments: [
        //   {
        //     filename: `contract-${contract.contractNumber}.pdf`,
        //     path: `/path/to/contract-${contract.contractNumber}.pdf`
        //   }
        // ]
      };

      // Send the email
      console.log('EmailService: Attempting to send email with transporter');
      const info = await this.transporter.sendMail(mailOptions);
      console.log('EmailService: Email sent successfully via transporter');
      
      console.log('Contract signature email sent successfully:', {
        messageId: info.messageId,
        to: contract.customer.email,
        subject: subject,
        contractNumber: contract.contractNumber
      });

      return {
        success: true,
        messageId: info.messageId,
        to: contract.customer.email,
        subject: subject
      };

    } catch (error) {
      console.error('Error sending contract signature email:', error);
      throw error;
    }
  }

  // Test email configuration
  async testEmailConfiguration() {
    try {
      await this.transporter.verify();
      console.log('Email configuration is valid');
      return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
      console.error('Email configuration error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send a test email
  async sendTestEmail(toEmail) {
    try {
      const mailOptions = {
        from: {
          name: this.companyInfo.name,
          address: process.env.EMAIL_USER || this.companyInfo.email
        },
        to: toEmail,
        subject: 'Test Email from Cleaning Management System',
        text: 'This is a test email to verify email configuration.',
        html: `
          <h2>Test Email</h2>
          <p>This is a test email to verify email configuration.</p>
          <p>If you receive this email, the email service is working correctly.</p>
          <hr>
          <p><em>Sent from ${this.companyInfo.name}</em></p>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('Test email sent successfully:', info.messageId);
      return {
        success: true,
        messageId: info.messageId,
        to: toEmail
      };

    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService(); 