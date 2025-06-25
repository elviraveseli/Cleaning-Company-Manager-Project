import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerContractService } from '../../services/customer-contract.service';
import { CustomerContract } from '../../models/customer-contract.model';
import SignaturePad from 'signature_pad';

@Component({
  selector: 'app-contract-signature',
  template: `
    <div class="signature-page" *ngIf="contract">
      <div class="header">
        <h1>Contract Signature</h1>
        <p>Please review and sign your cleaning service contract</p>
      </div>
      
      <div class="contract-details">
        <h3>Contract #{{contract.contractNumber}}</h3>
        <p><strong>Customer:</strong> {{contract.customer.name}}</p>
        <p><strong>Email:</strong> {{contract.customer.email}}</p>
        <p><strong>Total Amount:</strong> {{contract.totalAmount | currency:'EUR'}}</p>
        <p><strong>Start Date:</strong> {{contract.startDate | date}}</p>
      </div>
      
             <div class="signature-section">
         <h3>Digital Signature</h3>
         <div class="signature-form">
           <p>Please draw your signature in the box below:</p>
           <div class="signature-pad-container">
             <canvas #signatureCanvas class="signature-canvas"></canvas>
             <div class="signature-controls">
               <button type="button" (click)="clearSignature()" class="clear-btn">Clear</button>
               <button type="button" (click)="downloadSignedPDF()" class="sign-btn">
                 Sign Contract & Download PDF
               </button>
             </div>
           </div>
           <input type="text" placeholder="Type your full name" [(ngModel)]="digitalSignature" class="name-input">
         </div>
       </div>
      
      <div class="success-message" *ngIf="signed">
        <h3>✅ Contract Signed Successfully!</h3>
        <p>Thank you for signing the contract. We'll be in touch soon!</p>
      </div>
    </div>
    
    <div *ngIf="!contract && !loading" class="error">
      <h3>Contract Not Found</h3>
      <p>The contract you're looking for doesn't exist or has been removed.</p>
    </div>
  `,
  styles: [`
    .signature-page {
      max-width: 600px;
      margin: 50px auto;
      padding: 30px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-family: Arial, sans-serif;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #3b82f6;
      margin-bottom: 10px;
    }
    .contract-details {
      background: #f8fafc;
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 30px;
    }
    .signature-section {
      border-top: 2px solid #3b82f6;
      padding-top: 20px;
    }
         .signature-pad-container {
       border: 2px solid #ddd;
       border-radius: 8px;
       padding: 10px;
       margin: 15px 0;
       background: white;
     }
     .signature-canvas {
       border: 2px solid #007bff;
       border-radius: 8px;
       cursor: crosshair;
       display: block;
       margin: 0 auto;
       background: white;
       touch-action: none;
       user-select: none;
       width: 500px;
       height: 200px;
     }
     .signature-controls {
       display: flex;
       gap: 10px;
       margin-top: 10px;
       justify-content: center;
     }
     .clear-btn {
       background: #dc2626;
       color: white;
       padding: 10px 20px;
       border: none;
       border-radius: 4px;
       cursor: pointer;
     }
     .name-input {
       width: 100%;
       padding: 12px;
       border: 2px solid #ddd;
       border-radius: 4px;
       margin-top: 15px;
       font-size: 16px;
     }
    .sign-btn {
      background: #059669;
      color: white;
      padding: 15px 30px;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      width: 100%;
    }
    .sign-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .success-message {
      background: #d1fae5;
      border: 2px solid #059669;
      border-radius: 6px;
      padding: 20px;
      text-align: center;
      color: #065f46;
    }
    .error {
      text-align: center;
      color: #dc2626;
    }
  `]
})
export class ContractSignatureComponent implements OnInit, AfterViewInit {
  @ViewChild('signatureCanvas') canvasEl!: ElementRef<HTMLCanvasElement>;
  signaturePad!: SignaturePad;
  
  contract: CustomerContract | null = null;
  loading = true;
  digitalSignature = '';
  signed = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contractService: CustomerContractService
  ) {}

  ngOnInit(): void {
    const contractId = this.route.snapshot.paramMap.get('id');
    if (contractId) {
      this.loadContract(contractId);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const canvas = this.canvasEl.nativeElement;
      console.log('Canvas element:', canvas);
      
      // Set canvas internal size (important for drawing)
      canvas.width = 500;
      canvas.height = 200;
      
      // Initialize signature pad
      this.signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 2,
        maxWidth: 4,
        throttle: 16,
        minDistance: 5,
      });
      
      console.log('SignaturePad initialized:', this.signaturePad);
      
      // Test event listeners
      this.signaturePad.addEventListener('beginStroke', () => {
        console.log('Drawing started!');
      });
      
      this.signaturePad.addEventListener('endStroke', () => {
        console.log('Drawing ended!');
      });
      
      // Clear the canvas
      this.signaturePad.clear();
      console.log('Signature pad is ready for drawing');
    }, 200);
  }

  loadContract(id: string): void {
    this.contractService.getContract(id).subscribe({
      next: (contract) => {
        this.contract = contract;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading contract:', error);
        this.loading = false;
      }
    });
  }

  resizeCanvas(): void {
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
  }

  clearSignature(): void {
    if (this.signaturePad) {
      this.signaturePad.clear();
      console.log('Signature cleared');
    }
  }

  downloadSignedPDF(): void {
    console.log('Download button clicked!');
    console.log('Signature pad empty?', this.signaturePad?.isEmpty());
    console.log('Digital signature:', this.digitalSignature);
    console.log('Contract:', this.contract);
    
    if (!this.signaturePad) {
      alert('Signature pad not initialized');
      return;
    }
    
    if (this.signaturePad.isEmpty()) {
      alert('Please draw your signature first');
      return;
    }
    
    if (!this.digitalSignature) {
      alert('Please enter your full name');
      return;
    }
    
    if (!this.contract) {
      alert('Contract data not loaded');
      return;
    }
    
    try {
      // Get signature as base64 image
      const signatureDataURL = this.signaturePad.toDataURL();
      console.log('Signature captured:', signatureDataURL.substring(0, 50) + '...');
      
      // Generate PDF with signature
      this.generateSignedContractPDF(signatureDataURL);
      
      // Mark as signed
      this.signed = true;
      
      console.log('Contract signed by:', this.digitalSignature);
    } catch (error) {
      console.error('Error in downloadSignedPDF:', error);
      alert('Error generating PDF: ' + error);
    }
  }

  generateSignedContractPDF(signatureDataURL: string): void {
    console.log('Starting comprehensive PDF generation...');
    
    // Import jsPDF dynamically to avoid issues
    import('jspdf').then(({ default: jsPDF }) => {
      console.log('jsPDF loaded successfully');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;
      
      // Professional colors
      const primaryBlue = [41, 98, 255];
      const darkGray = [33, 37, 41];
      const lightGray = [108, 117, 125];
      const greenAccent = [40, 167, 69];
      const redAccent = [220, 53, 69];
      
      // Helper functions
      const addNewPageIfNeeded = (requiredHeight: number = 40) => {
        if (yPosition + requiredHeight > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
          return true;
        }
        return false;
      };
      
      const addSection = (title: string, color: number[] = primaryBlue) => {
        addNewPageIfNeeded(30);
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(15, yPosition - 5, pageWidth - 30, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(title, 20, yPosition + 8);
        doc.setTextColor(0, 0, 0);
        yPosition += 25;
      };
      
      // HEADER WITH COMPANY LOGO AREA
      doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('CLEANING SERVICE CONTRACT', pageWidth / 2, 25, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Digitally Signed Agreement', pageWidth / 2, 38, { align: 'center' });
      
      yPosition = 65;
      
      // CONTRACT IDENTIFICATION
      addSection('CONTRACT IDENTIFICATION');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      
      const contractInfo = [
        ['Contract Number:', this.contract!.contractNumber],
        ['Contract Type:', this.contract!.contractType],
        ['Status:', this.contract!.status],
        ['Start Date:', new Date(this.contract!.startDate).toLocaleDateString('en-US', { 
          year: 'numeric', month: 'long', day: 'numeric' 
        })],
        ['End Date:', this.contract!.endDate ? 
          new Date(this.contract!.endDate).toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric' 
          }) : 'Ongoing'],
        ['Currency:', this.contract!.currency || 'EUR'],
        ['Total Contract Value:', `€${this.contract!.totalAmount.toLocaleString()}`]
      ];
      
      contractInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 80, yPosition);
        yPosition += 12;
      });
      
      // CUSTOMER INFORMATION
      addSection('CUSTOMER INFORMATION');
      
      const customerInfo = [
        ['Full Name:', this.contract!.customer.name],
        ['Email Address:', this.contract!.customer.email],
        ['Phone Number:', this.contract!.customer.phone || 'Not provided'],
        ['Service Address:', this.formatAddress(this.contract!.customer.address)],
      ];
      
      if (this.contract!.billingAddress && !this.contract!.billingAddress.sameAsService) {
        customerInfo.push(['Billing Address:', this.formatBillingAddress(this.contract!.billingAddress)]);
      }
      
      customerInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, yPosition);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(value, pageWidth - 100);
        doc.text(lines, 80, yPosition);
        yPosition += lines.length * 6 + 6;
      });
      
      // SERVICES & PRICING
      addSection('SERVICES & PRICING DETAILS');
      
      if (this.contract!.services && this.contract!.services.length > 0) {
        // Table header
        doc.setFillColor(248, 249, 250);
        doc.rect(15, yPosition, pageWidth - 30, 15, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Service', 20, yPosition + 10);
        doc.text('Frequency', 80, yPosition + 10);
        doc.text('Price', 140, yPosition + 10);
        doc.text('Description', 170, yPosition + 10);
        yPosition += 20;
        
        let totalServices = 0;
        this.contract!.services.forEach((service, index) => {
          addNewPageIfNeeded(25);
          
          // Alternating row colors
          if (index % 2 === 0) {
            doc.setFillColor(252, 252, 252);
            doc.rect(15, yPosition - 5, pageWidth - 30, 20, 'F');
          }
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.text(`${index + 1}. ${service.name}`, 20, yPosition + 5);
          doc.text(service.frequency, 80, yPosition + 5);
          doc.text(`€${service.price.toLocaleString()}`, 140, yPosition + 5);
          
          if (service.description) {
            const descLines = doc.splitTextToSize(service.description, 25);
            doc.text(descLines, 170, yPosition + 5);
            yPosition += Math.max(15, descLines.length * 5);
          } else {
            yPosition += 15;
          }
          
          totalServices += service.price;
          
          // Working days and times
          if (service.workingDaysAndTimes && service.workingDaysAndTimes.length > 0) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
            service.workingDaysAndTimes.forEach(schedule => {
              schedule.timeSlots.forEach(slot => {
                doc.text(`${schedule.day}: ${slot.from} - ${slot.to} (${slot.duration}h)`, 25, yPosition);
                yPosition += 8;
              });
            });
            doc.setTextColor(0, 0, 0);
            yPosition += 5;
          }
        });
        
        // Services total
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`Services Subtotal: €${totalServices.toLocaleString()}`, pageWidth - 80, yPosition, { align: 'right' });
        yPosition += 15;
      }
      
      // PAYMENT CALCULATION DETAILS
      if (this.contract!.paymentCalculation) {
        addSection('PAYMENT CALCULATION DETAILS');
        
        const paymentCalc = this.contract!.paymentCalculation;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        // Payment terms and method
                 const basicPaymentInfo = [
           ['Payment Terms:', paymentCalc.paymentTermsText || 'N/A'],
           ['Payment Method:', paymentCalc.paymentMethod || 'N/A'],
           ['Quantity Hours:', (paymentCalc.quantityHours || 0).toString()],
           ['Hourly Rate:', `€${(paymentCalc.hourlyRate || 0).toFixed(2)}`],
           ['Total Amount (EUR excluding VAT):', `€${(paymentCalc.totalAmountExcludingVAT || 0).toFixed(2)}`],
           ['VAT Rate:', `${(paymentCalc.vatRate || 8.1).toFixed(1)}%`],
           ['Total Amount (EUR including VAT):', `€${(paymentCalc.totalAmountIncludingVAT || 0).toFixed(2)}`]
         ];
        
        basicPaymentInfo.forEach(([label, value]) => {
          doc.setFont('helvetica', 'bold');
          doc.text(label, 20, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(value, 100, yPosition);
          yPosition += 12;
        });
        
        // Annual calculations
        if (paymentCalc.rhythmCountByYear || paymentCalc.totalAnnualizedQuantityHours) {
          yPosition += 5;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.text('Annual Calculations:', 20, yPosition);
          yPosition += 15;
          
          doc.setFontSize(10);
                     const annualInfo = [
             ['Rhythm Count by Year:', (paymentCalc.rhythmCountByYear || 0).toString()],
             ['Total Annualized Quantity Hours:', (paymentCalc.totalAnnualizedQuantityHours || 0).toString()],
             ['Total Month Working Hours:', (paymentCalc.totalMonthWorkingHours || 0).toFixed(2)],
             ['Total Annualized Contract Value:', `€${(paymentCalc.totalAnnualizedContractValue || 0).toFixed(2)}`],
             ['Total Monthly Contract Value:', `€${(paymentCalc.totalMonthlyContractValue || 0).toFixed(2)}`]
           ];
          
          annualInfo.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label, 20, yPosition);
            doc.setFont('helvetica', 'normal');
            doc.text(value, 100, yPosition);
            yPosition += 12;
          });
        }
        
        // Employee engagement
        if (paymentCalc.employeeHoursPerEngagement || paymentCalc.numberOfEmployees) {
          yPosition += 5;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.text('Employee Engagement:', 20, yPosition);
          yPosition += 15;
          
          doc.setFontSize(10);
          const employeeInfo = [
            ['Employee Hours per Engagement:', (paymentCalc.employeeHoursPerEngagement || 0).toString()],
            ['Number of Employees:', (paymentCalc.numberOfEmployees || 1).toString()],
            ['Total Hours per Engagement:', (paymentCalc.totalHoursPerEngagement || 0).toString()]
          ];
          
          employeeInfo.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label, 20, yPosition);
            doc.setFont('helvetica', 'normal');
            doc.text(value, 100, yPosition);
            yPosition += 12;
          });
        }
        
        yPosition += 10;
      }

      // PAYMENT & BILLING TERMS
      addSection('PAYMENT & BILLING TERMS');
      
      const paymentInfo = [
        ['Billing Frequency:', this.contract!.billingFrequency],
        ['Payment Terms:', this.contract!.paymentTerms],
        ['Total Contract Amount:', `€${this.contract!.totalAmount.toLocaleString()}`]
      ];
      
      paymentInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 80, yPosition);
        yPosition += 12;
      });
      
      // SERVICE PREFERENCES & SPECIAL REQUIREMENTS
      if (this.contract!.servicePreferences || this.contract!.specialRequirements?.length > 0) {
        addSection('SERVICE PREFERENCES & SPECIAL REQUIREMENTS');
        
        if (this.contract!.servicePreferences) {
          const prefs = this.contract!.servicePreferences;
          if (prefs.keyAccess) {
            doc.text('• Key Access: Authorized', 20, yPosition);
            yPosition += 10;
          }
          if (prefs.petInstructions) {
            doc.text('• Pet Instructions:', 20, yPosition);
            const petLines = doc.splitTextToSize(prefs.petInstructions, pageWidth - 40);
            doc.text(petLines, 25, yPosition + 8);
            yPosition += petLines.length * 6 + 12;
          }
          if (prefs.accessInstructions) {
            doc.text('• Access Instructions:', 20, yPosition);
            const accessLines = doc.splitTextToSize(prefs.accessInstructions, pageWidth - 40);
            doc.text(accessLines, 25, yPosition + 8);
            yPosition += accessLines.length * 6 + 12;
          }
          if (prefs.specialRequests) {
            doc.text('• Special Requests:', 20, yPosition);
            const specialLines = doc.splitTextToSize(prefs.specialRequests, pageWidth - 40);
            doc.text(specialLines, 25, yPosition + 8);
            yPosition += specialLines.length * 6 + 12;
          }
        }
        
        if (this.contract!.specialRequirements?.length > 0) {
          doc.text('Special Requirements:', 20, yPosition);
          yPosition += 12;
          this.contract!.specialRequirements.forEach(req => {
            doc.text(`• ${req}`, 25, yPosition);
            yPosition += 10;
          });
        }
      }
      
      // TERMS & CONDITIONS
      if (this.contract!.terms) {
        addSection('TERMS & CONDITIONS');
        const termsLines = doc.splitTextToSize(this.contract!.terms, pageWidth - 40);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(termsLines, 20, yPosition);
        yPosition += termsLines.length * 6 + 15;
      }
      
      // NOTES
      if (this.contract!.notes) {
        addSection('ADDITIONAL NOTES');
        const notesLines = doc.splitTextToSize(this.contract!.notes, pageWidth - 40);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(notesLines, 20, yPosition);
        yPosition += notesLines.length * 6 + 15;
      }
      
      // SIGNATURE SECTION
      addSection('DIGITAL SIGNATURE', greenAccent);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Signed by: ${this.digitalSignature}`, 20, yPosition);
      yPosition += 12;
      doc.text(`Date & Time: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short' 
      })}`, 20, yPosition);
      yPosition += 20;
      
      // Add signature image
      try {
        addNewPageIfNeeded(60);
        doc.setFillColor(250, 250, 250);
        doc.rect(15, yPosition, 150, 50, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(15, yPosition, 150, 50, 'S');
        doc.addImage(signatureDataURL, 'PNG', 20, yPosition + 5, 140, 40);
        yPosition += 60;
      } catch (error) {
        console.error('Error adding signature to PDF:', error);
        doc.text('Digital signature applied', 20, yPosition);
        yPosition += 15;
      }
      
      // FOOTER & LEGAL
      addNewPageIfNeeded(40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('LEGAL VALIDITY', 20, yPosition);
      yPosition += 12;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      const legalText = [
        '• This document has been digitally signed and is legally binding.',
        '• Both parties agree to the terms and conditions outlined in this contract.',
        '• Any modifications to this contract must be agreed upon in writing by both parties.',
        '• This contract is governed by the laws of Kosovo.',
        `• Document generated on ${new Date().toLocaleString()}`
      ];
      
      legalText.forEach(text => {
        doc.text(text, 20, yPosition);
        yPosition += 8;
      });
      
      // COMPANY FOOTER
      yPosition = pageHeight - 30;
      doc.setFillColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.rect(0, yPosition, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Premium Cleaning Services Kosovo', pageWidth / 2, yPosition + 12, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Email: premiumcleaning.kosovo@gmail.com | Phone: +383 xx xxx xxx', pageWidth / 2, yPosition + 22, { align: 'center' });
      
      // Save the PDF
      const fileName = `Professional-Contract-${this.contract!.contractNumber}-${this.digitalSignature.replace(/\s+/g, '-')}.pdf`;
      console.log('Saving comprehensive PDF as:', fileName);
      doc.save(fileName);
      
      alert('Professional contract PDF downloaded successfully!');
    }).catch(error => {
      console.error('Error importing jsPDF:', error);
      alert('Error loading PDF library: ' + error.message);
    });
  }
  
  private formatAddress(address: any): string {
    if (!address) return 'Not provided';
    const parts = [address.street, address.city, address.municipality, address.country]
      .filter(part => part && part.trim());
    return parts.length > 0 ? parts.join(', ') : 'Not provided';
  }
  
  private formatBillingAddress(billingAddress: any): string {
    if (!billingAddress) return 'Same as service address';
    const parts = [billingAddress.address, billingAddress.city, billingAddress.municipality, billingAddress.country]
      .filter(part => part && part.trim());
    return parts.length > 0 ? parts.join(', ') : 'Same as service address';
  }

  signContract(): void {
    // This method is kept for compatibility but replaced by downloadSignedPDF
    this.downloadSignedPDF();
  }
} 