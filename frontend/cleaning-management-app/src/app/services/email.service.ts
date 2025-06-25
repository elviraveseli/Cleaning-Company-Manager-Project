import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CustomerContract } from '../models/customer-contract.model';
import { EmployeeContract } from '../models/employee-contract.model';

export interface EmailTemplate {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}

export interface ContractEmailData {
  contract: CustomerContract;
  signatureUrl?: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmailService {
  private readonly companyInfo = {
    name: 'Professional Cleaning Services',
    email: 'contracts@cleaningpro.com',
    phone: '+1 (555) 123-4567',
    address: '123 Business Avenue, Suite 100, City, State 12345',
  };

  constructor(private http: HttpClient) {}

  // Generate contract signature email template
  generateContractSignatureEmail(data: ContractEmailData): EmailTemplate {
    const { contract } = data;
    const signatureUrl =
      data.signatureUrl ||
      `${window.location.origin}/contracts/${contract._id}/sign`;

    const subject = `Contract Signature Required - ${contract.contractNumber}`;

    const htmlContent = this.generateHtmlTemplate(contract, signatureUrl, data);
    const textContent = this.generateTextTemplate(contract, signatureUrl, data);

    return {
      to: contract.customer.email,
      subject,
      htmlContent,
      textContent,
    };
  }

  // Send employee contract email
  sendEmployeeContractEmail(contract: EmployeeContract, employee: any): Observable<boolean> {
    // Call the backend API to send the actual email
    return this.http
      .post<any>(
        `/api/employee-contracts/${contract._id}/send-email`,
        { employeeId: employee._id }
      )
      .pipe(
        map((response: any) => {
          if (response.success) {
            const emailWindow = window.open(
              '',
              '_blank',
              'width=800,height=600,scrollbars=yes'
            );
            if (emailWindow) {
              if (response.demo) {
                // Demo mode - show email preview
                emailWindow.document.write(`
                  <div style="padding: 20px; font-family: Arial, sans-serif;">
                    <h2 style="color: #3b82f6;">📧 Employee Contract Email Preview (Demo Mode)</h2>
                    <p><strong>To:</strong> ${response.emailInfo.to}</p>
                    <p><strong>Subject:</strong> ${response.emailInfo.subject}</p>
                    <p><strong>Employee:</strong> ${response.emailInfo.employeeName}</p>
                    <p><strong>Contract:</strong> ${response.emailInfo.contractType}</p>
                    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="margin-top: 0; color: #92400e;">🔧 Demo Mode Active</h3>
                      <p>No email configuration found. This is a preview of what would be sent.</p>
                      <p><strong>To send real emails:</strong> Configure your Gmail credentials in the backend .env file.</p>
                    </div>
                    <hr style="margin: 20px 0;">
                    <h3>Email Content Preview:</h3>
                    ${response.emailInfo.htmlContent}
                  </div>
                `);
              } else {
                // Real email sent
                emailWindow.document.write(`
                  <div style="padding: 20px; font-family: Arial, sans-serif;">
                    <h2 style="color: #059669;">📧 Employee Contract Email Sent Successfully!</h2>
                    <p><strong>To:</strong> ${response.emailInfo.to}</p>
                    <p><strong>Subject:</strong> ${response.emailInfo.subject}</p>
                    <p><strong>Employee:</strong> ${response.emailInfo.employeeName}</p>
                    <p><strong>Message ID:</strong> ${response.emailInfo.messageId}</p>
                    <hr style="margin: 20px 0;">
                    <h3>✅ Real Email Sent!</h3>
                    <p>The employee contract email has been sent using Nodemailer.</p>
                    <p style="color: #6b7280; font-size: 14px;">
                      <em>The employee will receive a professional email with their contract details.</em>
                    </p>
                  </div>
                `);
              }
              emailWindow.document.close();
            }
            return true;
          }
          return false;
        }),
        catchError((error: any) => {
          console.error('Error sending employee contract email:', error);
          // Show error preview
          const emailWindow = window.open(
            '',
            '_blank',
            'width=800,height=600,scrollbars=yes'
          );
          if (emailWindow) {
            emailWindow.document.write(`
              <div style="padding: 20px; font-family: Arial, sans-serif;">
                <h2 style="color: #dc2626;">⚠️ Employee Contract Email Service Error</h2>
                <p><strong>Error:</strong> ${
                  error.error?.message ||
                  error.message ||
                  'Failed to send employee contract email'
                }</p>
                <p><strong>Employee:</strong> ${employee.firstName} ${employee.lastName}</p>
                <p><strong>Email:</strong> ${employee.email}</p>
                <hr style="margin: 20px 0;">
                <p style="color: #6b7280; font-size: 14px;">
                  <em>Please check your email configuration in the backend .env file.</em>
                </p>
              </div>
            `);
            emailWindow.document.close();
          }
          throw error;
        })
      );
  }

  // Send contract signature email
  sendContractSignatureEmail(contract: CustomerContract): Observable<boolean> {
    // Call the backend API to send the actual email
    return this.http
      .post<any>(
        `http://localhost:3000/api/customer-contracts/${contract._id}/send-email`,
        {}
      )
      .pipe(
        map((response: any) => {
          if (response.success) {
            const emailWindow = window.open(
              '',
              '_blank',
              'width=800,height=600,scrollbars=yes'
            );
            if (emailWindow) {
              if (response.demo) {
                // Demo mode - show email preview
                emailWindow.document.write(`
                  <div style="padding: 20px; font-family: Arial, sans-serif;">
                    <h2 style="color: #3b82f6;">📧 Email Preview (Demo Mode)</h2>
                    <p><strong>To:</strong> ${response.emailInfo.to}</p>
                    <p><strong>Subject:</strong> ${response.emailInfo.subject}</p>
                    <p><strong>Contract:</strong> ${response.emailInfo.contractNumber}</p>
                    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="margin-top: 0; color: #92400e;">🔧 Demo Mode Active</h3>
                      <p>No email configuration found. This is a preview of what would be sent.</p>
                      <p><strong>To send real emails:</strong> Configure your Gmail credentials in the backend .env file.</p>
                    </div>
                    <hr style="margin: 20px 0;">
                    <h3>Email Content Preview:</h3>
                    ${response.emailInfo.htmlContent}
                  </div>
                `);
              } else {
                // Real email sent
                emailWindow.document.write(`
                  <div style="padding: 20px; font-family: Arial, sans-serif;">
                    <h2 style="color: #059669;">📧 Email Sent Successfully!</h2>
                    <p><strong>To:</strong> ${response.emailInfo.to}</p>
                    <p><strong>Subject:</strong> ${response.emailInfo.subject}</p>
                    <p><strong>Contract:</strong> ${response.emailInfo.contractNumber}</p>
                    <p><strong>Message ID:</strong> ${response.emailInfo.messageId}</p>
                    <hr style="margin: 20px 0;">
                    <h3>✅ Real Email Sent!</h3>
                    <p>The contract signature email has been sent to the customer's email address using Nodemailer.</p>
                    <p style="color: #6b7280; font-size: 14px;">
                      <em>The customer will receive a professional email with all contract details and a digital signature link.</em>
                    </p>
                  </div>
                `);
              }
              emailWindow.document.close();
            }
            return true;
          }
          return false;
        }),
        catchError((error: any) => {
          console.error('Error sending email via backend:', error);

          // Fallback: show preview if backend email fails
          const emailData: ContractEmailData = {
            contract,
            companyName: this.companyInfo.name,
            companyEmail: this.companyInfo.email,
            companyPhone: this.companyInfo.phone,
            companyAddress: this.companyInfo.address,
          };

          const emailTemplate = this.generateContractSignatureEmail(emailData);

          const emailWindow = window.open(
            '',
            '_blank',
            'width=800,height=600,scrollbars=yes'
          );
          if (emailWindow) {
            emailWindow.document.write(`
              <div style="padding: 20px; font-family: Arial, sans-serif;">
                <h2 style="color: #dc2626;">⚠️ Email Service Error</h2>
                <p><strong>Error:</strong> ${
                  error.error?.message ||
                  error.message ||
                  'Failed to send email'
                }</p>
                <hr style="margin: 20px 0;">
                <h3>Email Preview (What would have been sent):</h3>
                <p><strong>To:</strong> ${emailTemplate.to}</p>
                <p><strong>Subject:</strong> ${emailTemplate.subject}</p>
                <hr style="margin: 20px 0;">
                ${emailTemplate.htmlContent}
                <hr style="margin: 20px 0;">
                <p style="color: #6b7280; font-size: 14px;">
                  <em>Please check your email configuration in the backend .env file.</em>
                </p>
              </div>
            `);
            emailWindow.document.close();
          }

          throw error;
        })
      );
  }

  // Generate HTML email template
  private generateHtmlTemplate(
    contract: CustomerContract,
    signatureUrl: string,
    data: ContractEmailData
  ): string {
    const servicesHtml = contract.services
      .map(
        (service) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${
          service.name
        }</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${
          service.frequency
        }</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">€${service.price.toLocaleString()}</td>
      </tr>
    `
      )
      .join('');

    const specialRequirementsHtml =
      contract.specialRequirements.length > 0
        ? contract.specialRequirements.map((req) => `<li>${req}</li>`).join('')
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
            
            <p>Thank you for choosing <strong>${
              data.companyName
            }</strong> for your cleaning needs. Your contract is now ready for your digital signature.</p>

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
                    <span class="detail-value">${new Date(
                      contract.startDate
                    ).toLocaleDateString()}</span>
                </div>
                ${
                  contract.endDate
                    ? `
                <div class="detail-row">
                    <span class="detail-label">End Date:</span>
                    <span class="detail-value">${new Date(
                      contract.endDate
                    ).toLocaleDateString()}</span>
                </div>
                `
                    : ''
                }
                <div class="detail-row">
                    <span class="detail-label">Billing Frequency:</span>
                    <span class="detail-value">${
                      contract.billingFrequency
                    }</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payment Terms:</span>
                    <span class="detail-value">${contract.paymentTerms}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Total Contract Value:</span>
                    <span class="detail-value" style="font-weight: bold; color: #059669;">€${contract.totalAmount.toLocaleString()}</span>
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
                        <td style="text-align: right; padding: 12px 8px;">€${contract.totalAmount.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>

            <!-- Special Requirements -->
            ${
              contract.specialRequirements.length > 0
                ? `
            <h3 style="color: #1f2937;">Special Requirements</h3>
            <ul class="requirements-list">
                ${specialRequirementsHtml}
            </ul>
            `
                : ''
            }

            <!-- Terms and Notes -->
            ${
              contract.terms
                ? `
            <h3 style="color: #1f2937;">Terms & Conditions</h3>
            <p style="background-color: #f8fafc; padding: 15px; border-radius: 6px; font-size: 14px;">${contract.terms}</p>
            `
                : ''
            }

            ${
              contract.notes
                ? `
            <h3 style="color: #1f2937;">Additional Notes</h3>
            <p style="background-color: #f8fafc; padding: 15px; border-radius: 6px; font-size: 14px;">${contract.notes}</p>
            `
                : ''
            }

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
            <h4 style="margin: 0 0 10px 0; color: #1f2937;">${
              data.companyName
            }</h4>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                📧 ${data.companyEmail} | 📞 ${data.companyPhone}
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                📍 ${data.companyAddress}
            </p>
            <p style="margin: 15px 0 0 0; font-size: 12px; color: #9ca3af;">
                This email was sent regarding contract ${
                  contract.contractNumber
                }. 
                If you received this email in error, please contact us immediately.
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  // Generate text email template (fallback)
  private generateTextTemplate(
    contract: CustomerContract,
    signatureUrl: string,
    data: ContractEmailData
  ): string {
    const services = contract.services
      .map(
        (service) =>
          `- ${service.name} (${
            service.frequency
          }): €${service.price.toLocaleString()}`
      )
      .join('\n');

    const specialReqs =
      contract.specialRequirements.length > 0
        ? contract.specialRequirements.map((req) => `- ${req}`).join('\n')
        : '- None specified';

    return `
CONTRACT SIGNATURE REQUIRED

Dear ${contract.customer.name},

Thank you for choosing ${
      data.companyName
    } for your cleaning needs. Your contract is now ready for your digital signature.

CONTRACT DETAILS:
- Contract Number: ${contract.contractNumber}
- Contract Type: ${contract.contractType}
- Start Date: ${new Date(contract.startDate).toLocaleDateString()}
${
  contract.endDate
    ? `- End Date: ${new Date(contract.endDate).toLocaleDateString()}`
    : ''
}
- Billing Frequency: ${contract.billingFrequency}
- Payment Terms: ${contract.paymentTerms}
 - Total Contract Value: €${contract.totalAmount.toLocaleString()}

SERVICES INCLUDED:
${services}

 Total: €${contract.totalAmount.toLocaleString()}

SPECIAL REQUIREMENTS:
${specialReqs}

${
  contract.terms
    ? `
TERMS & CONDITIONS:
${contract.terms}
`
    : ''
}

${
  contract.notes
    ? `
ADDITIONAL NOTES:
${contract.notes}
`
    : ''
}

ACTION REQUIRED:
Please review the contract details above and visit the link below to sign digitally:

${signatureUrl}

If you have any questions about this contract, please don't hesitate to contact us.

Best regards,
${data.companyName}

Contact Information:
Email: ${data.companyEmail}
Phone: ${data.companyPhone}
Address: ${data.companyAddress}

---
This email was sent regarding contract ${contract.contractNumber}.
If you received this email in error, please contact us immediately.
`;
  }

  // Preview email template (for testing/debugging)
  previewContractEmail(contract: CustomerContract): EmailTemplate {
    const emailData: ContractEmailData = {
      contract,
      companyName: this.companyInfo.name,
      companyEmail: this.companyInfo.email,
      companyPhone: this.companyInfo.phone,
      companyAddress: this.companyInfo.address,
    };

    return this.generateContractSignatureEmail(emailData);
  }

  // Get company information
  getCompanyInfo() {
    return this.companyInfo;
  }

  // Update company information
  updateCompanyInfo(info: Partial<typeof this.companyInfo>) {
    Object.assign(this.companyInfo, info);
  }

  // Debug method to show email details
  debugEmailGeneration(contract: CustomerContract): void {
    const emailData: ContractEmailData = {
      contract,
      companyName: this.companyInfo.name,
      companyEmail: this.companyInfo.email,
      companyPhone: this.companyInfo.phone,
      companyAddress: this.companyInfo.address,
    };

    const emailTemplate = this.generateContractSignatureEmail(emailData);

    console.log('=== EMAIL DEBUG INFO ===');
    console.log('Contract:', contract);
    console.log('Email Data:', emailData);
    console.log('Generated Template:', emailTemplate);
    console.log('=========================');

    alert(`Email Debug Info:
    
To: ${emailTemplate.to}
Subject: ${emailTemplate.subject}
Customer: ${contract.customer.name}
Contract: ${contract.contractNumber}
Services: ${contract.services.length} service(s)
Total Amount: $${contract.totalAmount}

Check the browser console for full details.`);
  }
}
