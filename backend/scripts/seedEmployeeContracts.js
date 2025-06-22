const mongoose = require('mongoose');
const EmployeeContract = require('../models/EmployeeContract');
const Employee = require('../models/Employee');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cleaning-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function seedEmployeeContracts() {
  try {
    console.log('🌱 Starting to seed employee contracts...');

    // Clear existing contracts
    await EmployeeContract.deleteMany({});
    console.log('🗑️ Cleared existing employee contracts');

    // Get existing employees
    const employees = await Employee.find({});
    console.log(`👥 Found ${employees.length} employees`);

    if (employees.length === 0) {
      console.log('❌ No employees found. Please run seedAdmin.js first to create employees.');
      process.exit(1);
    }

    // Sample employee contracts
    const sampleContracts = [
      {
        employee: employees[0]._id,
        employeeId: employees[0]._id.toString(),
        contractNumber: 'EMP-2024-001',
        contractType: 'Full-time',
        startDate: new Date('2024-01-15'),
        endDate: undefined,
        salary: 45000,
        paymentFrequency: 'Monthly',
        benefits: ['Health Insurance', 'Dental Coverage', 'Paid Time Off', '401k Matching'],
        workingHours: {
          weeklyHours: 40,
          scheduleType: 'Fixed'
        },
        leaveEntitlement: {
          annualLeave: 20,
          sickLeave: 12,
          paidHolidays: 10
        },
        probationPeriod: {
          duration: 3,
          endDate: new Date('2024-04-15')
        },
        documents: [
          {
            type: 'Contract Agreement',
            name: 'Employment_Contract_2024.pdf',
            url: '/documents/contract_1.pdf',
            uploadDate: new Date('2024-01-15')
          }
        ],
        terms: [
          'Maintain confidentiality of company information',
          'Adhere to company policies and procedures',
          'Provide 2 weeks notice for resignation',
          'Complete assigned duties in a timely manner'
        ],
        status: 'Active'
      }
    ];

    // Add contracts for additional employees if they exist
    if (employees.length > 1) {
      sampleContracts.push({
        employee: employees[1]._id,
        employeeId: employees[1]._id.toString(),
        contractNumber: 'EMP-2024-002',
        contractType: 'Part-time',
        startDate: new Date('2024-02-01'),
        endDate: undefined,
        salary: 25000,
        paymentFrequency: 'Bi-weekly',
        benefits: ['Health Insurance', 'Paid Time Off'],
        workingHours: {
          weeklyHours: 25,
          scheduleType: 'Flexible'
        },
        leaveEntitlement: {
          annualLeave: 15,
          sickLeave: 8,
          paidHolidays: 6
        },
        probationPeriod: {
          duration: 2,
          endDate: new Date('2024-04-01')
        },
        documents: [
          {
            type: 'Contract Agreement',
            name: 'Part_Time_Contract_2024.pdf',
            url: '/documents/contract_2.pdf',
            uploadDate: new Date('2024-02-01')
          }
        ],
        terms: [
          'Maintain confidentiality of company information',
          'Flexible working hours as agreed',
          'Provide 1 week notice for resignation'
        ],
        status: 'Active'
      });
    }

    if (employees.length > 2) {
      sampleContracts.push({
        employee: employees[2]._id,
        employeeId: employees[2]._id.toString(),
        contractNumber: 'EMP-2024-003',
        contractType: 'Temporary',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-08-31'),
        salary: 35000,
        paymentFrequency: 'Monthly',
        benefits: ['Health Insurance'],
        workingHours: {
          weeklyHours: 40,
          scheduleType: 'Fixed'
        },
        leaveEntitlement: {
          annualLeave: 10,
          sickLeave: 5,
          paidHolidays: 4
        },
        probationPeriod: {
          duration: 1,
          endDate: new Date('2024-04-01')
        },
        documents: [
          {
            type: 'Contract Agreement',
            name: 'Temporary_Contract_2024.pdf',
            url: '/documents/contract_3.pdf',
            uploadDate: new Date('2024-03-01')
          }
        ],
        terms: [
          'Fixed-term contract until August 31, 2024',
          'Maintain confidentiality of company information',
          'Complete project deliverables as assigned'
        ],
        status: 'Active'
      });
    }

    // Insert sample contracts
    const createdContracts = await EmployeeContract.insertMany(sampleContracts);
    console.log(`✅ Created ${createdContracts.length} employee contracts`);

    // Display created contracts
    createdContracts.forEach((contract, index) => {
      console.log(`📄 Contract ${index + 1}:`);
      console.log(`   Employee ID: ${contract.employeeId}`);
      console.log(`   Type: ${contract.contractType}`);
      console.log(`   Salary: $${contract.salary}`);
      console.log(`   Status: ${contract.status}`);
      console.log(`   MongoDB ID: ${contract._id}`);
    });

    console.log('🎉 Employee contracts seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding employee contracts:', error);
    process.exit(1);
  }
}

seedEmployeeContracts(); 