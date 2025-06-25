const EmployeeContract = require('../models/EmployeeContract');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');
const emailService = require('../services/emailService');

// Get all employee contracts (list)
exports.getEmployeeContracts = async (req, res) => {
  try {
    const { page, limit, search, status, contractType } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { contractNumber: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (contractType) {
      query.contractType = contractType;
    }
    
    // If pagination parameters are provided, use pagination
    if (page && limit) {
      const contracts = await EmployeeContract.find(query)
        .populate('employee', 'firstName lastName email phone')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });
      
      const total = await EmployeeContract.countDocuments(query);
      
      res.json({
        contracts,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } else {
      // Return all contracts without pagination (for frontend compatibility)
      const contracts = await EmployeeContract.find(query)
        .populate('employee', 'firstName lastName email phone')
        .sort({ createdAt: -1 });
      res.json(contracts);
    }
  } catch (error) {
    console.error('Error fetching employee contracts:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single employee contract (details)
exports.getEmployeeContract = async (req, res) => {
  try {
    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid contract ID format' });
    }
    
    const contract = await EmployeeContract.findById(req.params.id)
      .populate('employee', 'firstName lastName email phone address');
    if (!contract) {
      return res.status(404).json({ message: 'Employee contract not found' });
    }
    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new employee contract
exports.createEmployeeContract = async (req, res) => {
  try {
    console.log('📥 Received employee contract data:', req.body);
    
    // If employeeId is provided but employee ObjectId is not, find the employee
    if (req.body.employeeId && !req.body.employee) {
      const employee = await Employee.findById(req.body.employeeId);
      if (!employee) {
        return res.status(400).json({ message: 'Employee not found with the provided employeeId' });
      }
      req.body.employee = employee._id;
    }
    
    // Generate contract number if not provided
    if (!req.body.contractNumber) {
      const contractCount = await EmployeeContract.countDocuments();
      req.body.contractNumber = `EMP-${new Date().getFullYear()}-${String(contractCount + 1).padStart(3, '0')}`;
    }
    
    const contract = new EmployeeContract(req.body);
    const newContract = await contract.save();
    const populatedContract = await EmployeeContract.findById(newContract._id)
      .populate('employee', 'firstName lastName email phone');
    
    console.log('✅ Employee contract created successfully for employee:', req.body.employeeId, 'ID:', newContract._id);
    res.status(201).json(populatedContract);
  } catch (error) {
    console.error('❌ Error creating employee contract:', error);
    console.error('🔍 Validation errors:', error.errors);
    res.status(400).json({ 
      message: error.message,
      errors: error.errors
    });
  }
};

// Update employee contract
exports.updateEmployeeContract = async (req, res) => {
  try {
    console.log('🔄 Updating employee contract ID:', req.params.id);
    console.log('📥 Update data:', req.body);
    
    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid contract ID format' });
    }
    
    // If employeeId is provided but employee ObjectId is not, find the employee
    if (req.body.employeeId && !req.body.employee) {
      const employee = await Employee.findById(req.body.employeeId);
      if (!employee) {
        return res.status(400).json({ message: 'Employee not found with the provided employeeId' });
      }
      req.body.employee = employee._id;
    }
    
    const contract = await EmployeeContract.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('employee', 'firstName lastName email phone');
    
    if (!contract) {
      console.log('❌ Employee contract not found:', req.params.id);
      return res.status(404).json({ message: 'Employee contract not found' });
    }
    
    console.log('✅ Employee contract updated successfully for employee:', contract.employeeId);
    res.json(contract);
  } catch (error) {
    console.error('❌ Error updating employee contract:', error);
    console.error('🔍 Validation errors:', error.errors);
    res.status(400).json({ 
      message: error.message,
      errors: error.errors
    });
  }
};

// Delete employee contract
exports.deleteEmployeeContract = async (req, res) => {
  try {
    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid contract ID format' });
    }
    
    const contract = await EmployeeContract.findByIdAndDelete(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: 'Employee contract not found' });
    }
    res.json({ message: 'Employee contract deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get contracts by employee
exports.getContractsByEmployee = async (req, res) => {
  try {
    // Try to find by both employee ObjectId and employeeId string for compatibility
    const contracts = await EmployeeContract.find({
      $or: [
        { employee: req.params.employeeId },
        { employeeId: req.params.employeeId }
      ]
    })
      .populate('employee', 'firstName lastName email')
      .sort({ startDate: -1 });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send employee contract email
exports.sendEmployeeContractEmail = async (req, res) => {
  try {
    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid contract ID format' });
    }

    // Find the contract with employee details
    const contract = await EmployeeContract.findById(req.params.id)
      .populate('employee', 'firstName lastName email phone personalNumber address');
    
    if (!contract) {
      return res.status(404).json({ message: 'Employee contract not found' });
    }

    // Get employee data
    const employee = contract.employee;
    if (!employee || !employee.email) {
      return res.status(400).json({ message: 'Employee email not found' });
    }

    console.log('📧 Sending employee contract email to:', employee.email);

    try {
      // Generate email content
      const emailData = {
        to: employee.email,
        subject: `Employment Contract - ${contract.contractType}`,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        contractType: contract.contractType,
        contractNumber: contract.contractNumber || `EMP-${contract._id.toString().slice(-6)}`,
        startDate: contract.startDate,
        endDate: contract.endDate,
        salary: contract.salary,
        paymentFrequency: contract.paymentFrequency,
        workingHours: contract.workingHours,
        benefits: contract.benefits,
        leaveEntitlement: contract.leaveEntitlement,
        terms: contract.terms
      };

      // Generate HTML email content
      const htmlContent = generateEmployeeContractEmailHTML(emailData, contract, employee);

      // Try to send email via email service
      const emailResult = await emailService.sendEmployeeContractEmail({
        to: employee.email,
        subject: emailData.subject,
        html: htmlContent,
        contractData: emailData
      });

      if (emailResult.success) {
        console.log('✅ Employee contract email sent successfully via email service');
        res.json({
          success: true,
          demo: false,
          emailInfo: {
            to: employee.email,
            subject: emailData.subject,
            employeeName: emailData.employeeName,
            contractType: emailData.contractType,
            messageId: emailResult.messageId,
            htmlContent: htmlContent
          }
        });
      } else {
        throw new Error('Email service returned failure');
      }

    } catch (emailError) {
      console.log('⚠️ Email service unavailable, returning demo mode:', emailError.message);
      
      // Demo mode - return email preview
      const emailData = {
        to: employee.email,
        subject: `Employment Contract - ${contract.contractType}`,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        contractType: contract.contractType,
        contractNumber: contract.contractNumber || `EMP-${contract._id.toString().slice(-6)}`
      };

      const htmlContent = generateEmployeeContractEmailHTML(emailData, contract, employee);

      res.json({
        success: true,
        demo: true,
        emailInfo: {
          to: employee.email,
          subject: emailData.subject,
          employeeName: emailData.employeeName,
          contractType: emailData.contractType,
          htmlContent: htmlContent
        }
      });
    }

  } catch (error) {
    console.error('❌ Error sending employee contract email:', error);
    res.status(500).json({ 
      message: 'Error sending employee contract email',
      error: error.message 
    });
  }
};

// Helper function to generate employee contract email HTML
function generateEmployeeContractEmailHTML(emailData, contract, employee) {
  const currentDate = new Date().toLocaleDateString();
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employment Contract</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1f2937; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { background-color: #f9fafb; padding: 30px; }
        .greeting { font-size: 16px; margin-bottom: 20px; }
        .section { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .section-title { font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
        .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .detail-label { font-weight: bold; color: #6b7280; }
        .detail-value { color: #1f2937; }
        .benefits-list { list-style: none; padding: 0; }
        .benefits-list li { padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .benefits-list li:before { content: "✓"; color: #059669; font-weight: bold; margin-right: 8px; }
        .terms-list { padding-left: 20px; }
        .terms-list li { margin: 8px 0; }
        .cta-section { background-color: #3b82f6; color: white; padding: 25px; text-align: center; border-radius: 8px; margin: 20px 0; }
        .cta-button { display: inline-block; background-color: white; color: #3b82f6; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
        .company-info { background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Employment Contract</h1>
            <p>Professional Cleaning Services</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Dear ${emailData.employeeName},
            </div>
            
            <p>We are pleased to provide you with your employment contract details. Please review the information below and keep this email for your records.</p>
            
            <div class="section">
                <div class="section-title">Contract Information</div>
                <div class="detail-row">
                    <span class="detail-label">Contract Number:</span>
                    <span class="detail-value">${emailData.contractNumber}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Contract Type:</span>
                    <span class="detail-value">${emailData.contractType}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Start Date:</span>
                    <span class="detail-value">${new Date(emailData.startDate).toLocaleDateString()}</span>
                </div>
                ${emailData.endDate ? `
                <div class="detail-row">
                    <span class="detail-label">End Date:</span>
                    <span class="detail-value">${new Date(emailData.endDate).toLocaleDateString()}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">${contract.status || 'Active'}</span>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Compensation & Benefits</div>
                <div class="detail-row">
                    <span class="detail-label">Salary:</span>
                    <span class="detail-value">€${emailData.salary?.toLocaleString() || 'TBD'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payment Frequency:</span>
                    <span class="detail-value">${emailData.paymentFrequency || 'Monthly'}</span>
                </div>
                ${emailData.workingHours ? `
                <div class="detail-row">
                    <span class="detail-label">Weekly Hours:</span>
                    <span class="detail-value">${emailData.workingHours.weeklyHours || 'TBD'} hours</span>
                </div>
                ` : ''}
            </div>
            
            ${emailData.benefits && emailData.benefits.length > 0 ? `
            <div class="section">
                <div class="section-title">Benefits Package</div>
                <ul class="benefits-list">
                    ${emailData.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            ${emailData.leaveEntitlement ? `
            <div class="section">
                <div class="section-title">Leave Entitlement</div>
                <div class="detail-row">
                    <span class="detail-label">Annual Leave:</span>
                    <span class="detail-value">${emailData.leaveEntitlement.annualLeave || 'TBD'} days</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Sick Leave:</span>
                    <span class="detail-value">${emailData.leaveEntitlement.sickLeave || 'TBD'} days</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Paid Holidays:</span>
                    <span class="detail-value">${emailData.leaveEntitlement.paidHolidays || 'TBD'} days</span>
                </div>
            </div>
            ` : ''}
            
            <div class="cta-section">
                <h3 style="margin-top: 0;">Important Information</h3>
                <p>Please review your contract details carefully. If you have any questions or notice any discrepancies, please contact HR immediately.</p>
                <p style="margin-bottom: 0;"><strong>Welcome to the team!</strong></p>
            </div>
            
            <div class="company-info">
                <h4 style="margin-top: 0; color: #1f2937;">Contact Information</h4>
                <p style="margin: 5px 0;"><strong>HR Department:</strong> hr@cleaningcompany.com</p>
                <p style="margin: 5px 0;"><strong>Phone:</strong> +383 44 123 456</p>
                <p style="margin: 5px 0;"><strong>Address:</strong> Pristina, Kosovo</p>
            </div>
        </div>
        
        <div class="footer">
            <p>This email was sent on ${currentDate}</p>
            <p>Professional Cleaning Services - Employee Contract System</p>
            <p style="font-size: 12px; color: #9ca3af;">This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
  `;
} 