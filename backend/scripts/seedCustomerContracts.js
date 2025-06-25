const mongoose = require('mongoose');
const CustomerContract = require('../models/CustomerContract');
const connectDB = require('../config/database');

const seedContracts = [
  {
    contractNumber: 'CC-2024-001',
    customer: {
      name: 'ABC Corporation',
      email: 'contracts@abccorp.com',
      phone: '+1-555-0101',
      address: {
        street: '123 Business Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      }
    },
    objects: [],
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-12-31'),
    contractType: 'Long-term',
    billingFrequency: 'Monthly',
    totalAmount: 48000,
    paymentTerms: 'Net 30',
    services: [
      {
        name: 'Office Cleaning',
        description: 'Daily cleaning of office spaces',
        frequency: 'Daily',
        price: 3000
      },
      {
        name: 'Deep Cleaning',
        description: 'Monthly deep cleaning service',
        frequency: 'Monthly',
        price: 1000
      }
    ],
    specialRequirements: ['Security Clearance', '24/7 Access'],
    status: 'Active',
    terms: 'Standard commercial cleaning terms apply',
    notes: 'High-priority client requiring consistent service quality'
  },
  {
    contractNumber: 'CC-2024-002',
    customer: {
      name: 'Luxury Residential LLC',
      email: 'manager@luxuryres.com',
      phone: '+1-555-0202',
      address: {
        street: '456 Park Lane',
        city: 'Beverly Hills',
        state: 'CA',
        zipCode: '90210',
        country: 'USA'
      }
    },
    objects: [],
    startDate: new Date('2024-02-01'),
    contractType: 'Recurring',
    billingFrequency: 'Bi-weekly',
    totalAmount: 24000,
    paymentTerms: 'Net 15',
    services: [
      {
        name: 'Residential Cleaning',
        description: 'Bi-weekly residential cleaning',
        frequency: 'Bi-weekly',
        price: 1000
      }
    ],
    specialRequirements: ['Eco-friendly Products'],
    status: 'Active',
    notes: 'Premium residential complex requiring eco-friendly products only'
  },
  {
    contractNumber: 'CC-2024-003',
    customer: {
      name: 'Healthcare Partners',
      email: 'facilities@healthcarepartners.com',
      phone: '+1-555-0303',
      address: {
        street: '789 Health Street',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        country: 'USA'
      }
    },
    objects: [],
    startDate: new Date('2024-01-20'),
    endDate: new Date('2025-01-19'),
    contractType: 'Long-term',
    billingFrequency: 'Monthly',
    totalAmount: 72000,
    paymentTerms: 'Net 30',
    services: [
      {
        name: 'Medical Facility Cleaning',
        description: 'Specialized healthcare cleaning',
        frequency: 'Daily',
        price: 6000
      }
    ],
    specialRequirements: ['Special Equipment', 'Hazardous Materials'],
    status: 'Active',
    terms: 'Healthcare facility cleaning standards must be maintained',
    notes: 'Critical healthcare facility requiring certified cleaning protocols'
  },
  {
    contractNumber: 'CC-2024-004',
    customer: {
      name: 'Manufacturing Corp',
      email: 'maintenance@manufacturing.com',
      phone: '+1-555-0404',
      address: {
        street: '321 Industrial Blvd',
        city: 'Detroit',
        state: 'MI',
        zipCode: '48201',
        country: 'USA'
      }
    },
    objects: [],
    startDate: new Date('2024-01-10'),
    contractType: 'One-time',
    billingFrequency: 'Monthly',
    totalAmount: 5000,
    paymentTerms: 'Due on Receipt',
    services: [
      {
        name: 'Industrial Cleaning',
        description: 'One-time deep cleaning of manufacturing facility',
        frequency: 'As Needed',
        price: 5000
      }
    ],
    specialRequirements: ['Safety Equipment Required'],
    status: 'Expired',
    notes: 'One-time industrial facility cleaning project'
  },
  {
    contractNumber: 'CC-2024-005',
    customer: {
      name: 'Test Customer',
      email: 'fjona.braha@umib.net',
      phone: '+1-555-0555',
      address: {
        street: '456 Test Avenue',
        city: 'Test City',
        state: 'NY',
        zipCode: '10002',
        country: 'USA'
      }
    },
    objects: [],
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-12-31'),
    contractType: 'Recurring',
    billingFrequency: 'Monthly',
    totalAmount: 15000,
    paymentTerms: 'Net 30',
    services: [
      {
        name: 'House Cleaning Service',
        description: 'Professional house cleaning',
        frequency: 'Weekly',
        price: 1000
      },
      {
        name: 'Window Cleaning',
        description: 'Monthly window cleaning',
        frequency: 'Monthly',
        price: 250
      }
    ],
    specialRequirements: ['Eco-friendly products', 'Pet-safe cleaning'],
    status: 'Active',
    terms: 'Standard residential cleaning contract terms',
    notes: 'Test contract for email functionality'
  }
];

const seedCustomerContracts = async () => {
  try {
    await connectDB();
    
    console.log('Clearing existing customer contracts...');
    await CustomerContract.deleteMany({});
    
    console.log('Seeding customer contracts...');
    const contracts = await CustomerContract.insertMany(seedContracts);
    
    console.log(`Successfully seeded ${contracts.length} customer contracts`);
    
    // Log the seeded contracts
    contracts.forEach(contract => {
      console.log(`- ${contract.contractNumber}: ${contract.customer.name} (${contract.status})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding customer contracts:', error);
    process.exit(1);
  }
};

// Run the seeder
if (require.main === module) {
  seedCustomerContracts();
}

module.exports = seedCustomerContracts; 