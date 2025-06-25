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

const generateCustomer = (index) => {
  const customerTypes = [
    'Residential',
    'Individual Business',
    'Limited Liability Company',
    'Joint Stock Company'
  ];
  const statuses = ['Active', 'Pending', 'Inactive'];
  const municipalities = [
    'Pristina',
    'Mitrovica',
    'Peja',
    'Prizren',
    'Gjilan',
    'Ferizaj',
    'Gjakova'
  ];
  const companies = ['Tech Solutions', 'Legal Services', 'Medical Center', 'Retail Store', 'Restaurant', 'Hotel', 'Office Building'];
  const timePreferences = ['Morning', 'Afternoon', 'Evening', 'Flexible'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const paymentMethods = [
    'Bank Transfer',
    'Cash',
    'ProCredit Bank',
    'TEB Bank',
    'NLB Bank',
    'BKT Bank',
    'Raiffeisen Bank'
  ];
  const referralSources = ['Email', 'Phone', 'Text', 'WhatsApp'];
  const banks = [
    'ProCredit Bank',
    'TEB Bank',
    'NLB Bank',
    'BKT Bank',
    'Raiffeisen Bank'
  ];

  const isCommercial = Math.random() > 0.6;
  const customerType = isCommercial ? 
    customerTypes[Math.floor(Math.random() * (customerTypes.length - 1)) + 1] : 
    'Residential';
  const registrationDate = new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000));
  const lastServiceDate = new Date(registrationDate.getTime() + Math.floor(Math.random() * (Date.now() - registrationDate.getTime())));
  const selectedMunicipality = municipalities[Math.floor(Math.random() * municipalities.length)];

  return {
    firstName: `Customer${index}`,
    lastName: `LastName${index}`,
    email: `customer${index}@example.com`,
    phone: `+383-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
    address: `${Math.floor(Math.random() * 999 + 1)} ${['Main', 'Oak', 'Maple', 'Cedar', 'Pine'][Math.floor(Math.random() * 5)]} Street`,
    city: selectedMunicipality,
    municipality: selectedMunicipality,
    company: isCommercial ? companies[Math.floor(Math.random() * companies.length)] : '',
    nipt: isCommercial ? Math.floor(Math.random() * 900000000 + 100000000).toString() : undefined,
    customerType,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    preferredContactMethod: referralSources[Math.floor(Math.random() * referralSources.length)],
    notes: `Sample customer ${index} notes.`,
    registrationDate,
    lastServiceDate,
    totalContracts: Math.floor(Math.random() * 5),
    totalRevenue: Math.floor(Math.random() * 10000),
    emergencyContact: !isCommercial ? {
      name: `Emergency${index}`,
      relationship: ['Spouse', 'Sibling', 'Parent', 'Friend'][Math.floor(Math.random() * 4)],
      phone: `+383-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`
    } : null,
    billingAddress: {
      address: `${Math.floor(Math.random() * 999 + 1)} Billing Street`,
      city: selectedMunicipality,
      municipality: selectedMunicipality,
      sameAsService: Math.random() > 0.3
    },
    paymentInfo: {
      preferredMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      billingCycle: ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly'][Math.floor(Math.random() * 4)],
      autoPayEnabled: Math.random() > 0.5,
      bankAccount: Math.random() > 0.5 ? {
        bankName: banks[Math.floor(Math.random() * banks.length)],
        accountNumber: Math.floor(Math.random() * 9000000000 + 1000000000).toString(),
        iban: `XK05${Math.floor(Math.random() * 9000 + 1000)}${Math.floor(Math.random() * 9000 + 1000)}${Math.floor(Math.random() * 9000 + 1000)}${Math.floor(Math.random() * 9000 + 1000)}`
      } : undefined
    }
  };
};

async function seedMoreCustomers() {
  try {
    console.log('🌱 Starting to seed additional customers...');

    // Generate 20 more customers
    const additionalCustomers = Array.from({ length: 20 }, (_, i) => generateCustomer(i + 6));

    // Insert additional customers
    const createdCustomers = await Customer.insertMany(additionalCustomers);
    console.log(`✅ Created ${createdCustomers.length} additional customers`);

    // Display created customers
    createdCustomers.forEach((customer, index) => {
      console.log(`👤 Customer ${index + 1}:`);
      console.log(`   Name: ${customer.firstName} ${customer.lastName}`);
      console.log(`   Email: ${customer.email}`);
      console.log(`   Type: ${customer.customerType}`);
      console.log(`   Status: ${customer.status}`);
      console.log(`   Municipality: ${customer.municipality}`);
      console.log(`   MongoDB ID: ${customer._id}`);
    });

    console.log('🎉 Additional customers seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding additional customers:', error);
    process.exit(1);
  }
}

seedMoreCustomers(); 