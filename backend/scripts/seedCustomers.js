const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cleaning-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function seedCustomers() {
  try {
    console.log('🌱 Starting to seed customers...');

    // Clear existing customers
    await Customer.deleteMany({});
    console.log('🗑️ Cleared existing customers');

    // Sample customers
    const sampleCustomers = [
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+1-555-0101',
        address: '123 Oak Street',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        company: '',
        customerType: 'Residential',
        status: 'Active',
        preferredContactMethod: 'Email',
        notes: 'Prefers eco-friendly cleaning products. Has two cats.',
        registrationDate: new Date('2023-01-15'),
        lastServiceDate: new Date('2024-01-10'),
        totalContracts: 2,
        totalRevenue: 1200,
        emergencyContact: {
          name: 'Mike Johnson',
          relationship: 'Spouse',
          phone: '+1-555-0102'
        },
        billingAddress: {
          address: '123 Oak Street',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          sameAsService: true
        },
        paymentInfo: {
          preferredMethod: 'Credit Card',
          billingCycle: 'Monthly',
          autoPayEnabled: true
        },
        servicePreferences: {
          timePreference: 'Morning',
          dayPreference: ['Tuesday', 'Thursday'],
          specialInstructions: 'Please be gentle with antique furniture',
          keyAccess: true,
          petInstructions: 'Two cats - Whiskers and Mittens. They are friendly but may hide.'
        },
        referralSource: 'Google Search',
        tags: ['VIP Customer', 'Pet Owner', 'Key Access']
      },
      {
        firstName: 'Robert',
        lastName: 'Smith',
        email: 'robert.smith@company.com',
        phone: '+1-555-0201',
        address: '456 Business Plaza',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62702',
        company: 'Smith & Associates Law Firm',
        customerType: 'Commercial',
        status: 'Active',
        preferredContactMethod: 'Phone',
        notes: 'Large office space requiring weekly deep cleaning.',
        registrationDate: new Date('2022-08-20'),
        lastServiceDate: new Date('2024-01-08'),
        totalContracts: 5,
        totalRevenue: 8500,
        billingAddress: {
          address: '456 Business Plaza',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62702',
          sameAsService: true
        },
        paymentInfo: {
          preferredMethod: 'Bank Transfer',
          billingCycle: 'Monthly',
          autoPayEnabled: true
        },
        servicePreferences: {
          timePreference: 'Evening',
          dayPreference: ['Friday', 'Saturday'],
          specialInstructions: 'After business hours only. Security code: 1234',
          keyAccess: false
        },
        referralSource: 'Referral from Friend',
        tags: ['Corporate Account', 'High Value']
      },
      {
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily.davis@email.com',
        phone: '+1-555-0301',
        address: '789 Maple Avenue',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62703',
        customerType: 'Residential',
        status: 'Pending',
        preferredContactMethod: 'Text',
        notes: 'New customer interested in bi-weekly service.',
        registrationDate: new Date('2024-01-01'),
        totalContracts: 0,
        totalRevenue: 0,
        paymentInfo: {
          preferredMethod: 'Credit Card',
          billingCycle: 'Bi-weekly',
          autoPayEnabled: false
        },
        servicePreferences: {
          timePreference: 'Flexible',
          dayPreference: ['Monday', 'Wednesday', 'Friday'],
          specialInstructions: 'Please call before arrival',
          keyAccess: false
        },
        referralSource: 'Social Media',
        tags: ['New Customer']
      },
      {
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@techcorp.com',
        phone: '+1-555-0401',
        address: '321 Tech Drive',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        company: 'TechCorp Solutions',
        customerType: 'Commercial',
        status: 'Active',
        preferredContactMethod: 'Email',
        notes: 'Modern office space with high-tech equipment requiring careful handling.',
        registrationDate: new Date('2023-06-10'),
        lastServiceDate: new Date('2024-01-12'),
        totalContracts: 3,
        totalRevenue: 4200,
        paymentInfo: {
          preferredMethod: 'Bank Transfer',
          billingCycle: 'Monthly',
          autoPayEnabled: true
        },
        servicePreferences: {
          timePreference: 'Evening',
          dayPreference: ['Sunday'],
          specialInstructions: 'Handle electronics with care. Use anti-static cleaning supplies.',
          keyAccess: true
        },
        referralSource: 'Website',
        tags: ['Corporate Account', 'Special Requirements']
      },
      {
        firstName: 'Jennifer',
        lastName: 'Wilson',
        email: 'jennifer.wilson@gmail.com',
        phone: '+1-555-0501',
        address: '654 Elm Street',
        city: 'Aurora',
        state: 'IL',
        zipCode: '60502',
        customerType: 'Residential',
        status: 'Active',
        preferredContactMethod: 'Phone',
        notes: 'Elderly customer, requires gentle and thorough service.',
        registrationDate: new Date('2023-03-22'),
        lastServiceDate: new Date('2024-01-05'),
        totalContracts: 1,
        totalRevenue: 800,
        emergencyContact: {
          name: 'David Wilson',
          relationship: 'Son',
          phone: '+1-555-0502'
        },
        paymentInfo: {
          preferredMethod: 'Check',
          billingCycle: 'Monthly',
          autoPayEnabled: false
        },
        servicePreferences: {
          timePreference: 'Morning',
          dayPreference: ['Wednesday'],
          specialInstructions: 'Please be extra careful with delicate items.',
          keyAccess: false
        },
        referralSource: 'Flyers/Advertisements',
        tags: ['Elderly Client', 'Special Requirements']
      }
    ];

    // Insert sample customers
    const createdCustomers = await Customer.insertMany(sampleCustomers);
    console.log(`✅ Created ${createdCustomers.length} customers`);

    // Display created customers
    createdCustomers.forEach((customer, index) => {
      console.log(`👤 Customer ${index + 1}:`);
      console.log(`   Name: ${customer.fullName}`);
      console.log(`   Email: ${customer.email}`);
      console.log(`   Type: ${customer.customerType}`);
      console.log(`   Status: ${customer.status}`);
      console.log(`   MongoDB ID: ${customer._id}`);
    });

    console.log('🎉 Customers seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding customers:', error);
    process.exit(1);
  }
}

seedCustomers(); 