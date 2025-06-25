const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cleaning-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const generateEmployee = (index) => {
  const positions = ['Cleaner', 'Senior Cleaner', 'Team Lead', 'Supervisor', 'Specialist'];
  const statuses = ['Active', 'Inactive', 'On Leave'];
  const municipalities = [
    'Pristina',
    'Mitrovica',
    'Peja',
    'Prizren',
    'Gjilan',
    'Ferizaj',
    'Gjakova'
  ];
  const skills = [
    'General Cleaning',
    'Floor Care',
    'Window Cleaning',
    'Carpet Cleaning',
    'Pressure Washing',
    'Deep Cleaning',
    'Sanitization',
    'Equipment Operation',
    'Team Leadership',
    'Customer Service',
    'Green Cleaning',
    'HVAC Cleaning',
    'Post-Construction Cleaning',
    'Biohazard Cleaning'
  ];
  const languages = ['Albanian', 'Serbian', 'English', 'German', 'Italian'];
  const certifications = [
    'Kosovo Health & Safety',
    'First Aid & CPR',
    'Green Cleaning',
    'Biohazard Handling',
    'Equipment Operation',
    'Supervisor Training',
    'Chemical Safety',
    'Infection Control',
    'EU Safety Standards',
    'ISO Cleaning Standards'
  ];
  const departments = [
    'Residential Cleaning',
    'Commercial Cleaning',
    'Special Projects',
    'Maintenance',
    'Administration',
    'Healthcare'
  ];
  const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Seasonal'];
  const availabilityTypes = [
    'Weekdays Only',
    'Weekends Only',
    'All Days',
    'Morning Shift',
    'Afternoon Shift',
    'Evening Shift',
    'Night Shift',
    'Flexible'
  ];
  const banks = [
    'ProCredit Bank',
    'TEB Bank',
    'NLB Bank',
    'BKT Bank',
    'Raiffeisen Bank'
  ];
  const nationalities = ['Kosovo Citizen', 'EU Citizen', 'Non-EU Citizen'];
  const workPermitTypes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'Not Required'];
  const residencePermitTypes = ['Temporary', 'Permanent', 'EU Long-term', 'Not Required'];
  const healthInsuranceProviders = [
    'Kosovo Health Insurance Fund',
    'Private Insurance',
    'EU Insurance',
    'Other'
  ];

  const hireDate = new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000));
  const hourlyRate = Math.floor(Math.random() * 5) + 8; // 8-12 EUR per hour
  const selectedMunicipality = municipalities[Math.floor(Math.random() * municipalities.length)];
  const nationality = nationalities[Math.floor(Math.random() * nationalities.length)];
  const isKosovoCitizen = nationality === 'Kosovo Citizen';

  const workingDays = [
    { day: 'Monday', from: '09:00', to: '17:00', duration: 8 },
    { day: 'Tuesday', from: '09:00', to: '17:00', duration: 8 },
    { day: 'Wednesday', from: '09:00', to: '17:00', duration: 8 },
    { day: 'Thursday', from: '09:00', to: '17:00', duration: 8 },
    { day: 'Friday', from: '09:00', to: '17:00', duration: 8 }
  ];

  const documents = [
    {
      type: isKosovoCitizen ? 'Kosovo ID Card' : 'Work Permit',
      number: Math.floor(Math.random() * 9000000000 + 1000000000).toString(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }
  ];

  return {
    firstName: `Employee${index}`,
    lastName: `LastName${index}`,
    email: `employee${index}@company.com`,
    phone: `+383-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
    address: `${Math.floor(Math.random() * 999 + 1)} ${['Main', 'Oak', 'Maple', 'Cedar', 'Pine'][Math.floor(Math.random() * 5)]} Street`,
    city: selectedMunicipality,
    municipality: selectedMunicipality,
    position: positions[Math.floor(Math.random() * positions.length)],
    hireDate,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    hourlyRate,
    nationality,
    personalNumber: isKosovoCitizen ? Math.floor(Math.random() * 9000000000 + 1000000000).toString() : undefined,
    workPermit: {
      type: isKosovoCitizen ? 'Not Required' : workPermitTypes[Math.floor(Math.random() * (workPermitTypes.length - 1))],
      number: isKosovoCitizen ? undefined : `WP${Math.floor(Math.random() * 90000 + 10000)}`,
      issueDate: isKosovoCitizen ? undefined : new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      expiryDate: isKosovoCitizen ? undefined : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      issuingAuthority: 'Ministry of Internal Affairs - Kosovo'
    },
    residencePermit: {
      type: isKosovoCitizen ? 'Not Required' : residencePermitTypes[Math.floor(Math.random() * (residencePermitTypes.length - 1))],
      number: isKosovoCitizen ? undefined : `RP${Math.floor(Math.random() * 90000 + 10000)}`,
      expiryDate: isKosovoCitizen ? undefined : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    },
    availability: availabilityTypes[Math.floor(Math.random() * availabilityTypes.length)],
    workingDays,
    skills: Array.from({ length: Math.floor(Math.random() * 4) + 2 }, () => 
      skills[Math.floor(Math.random() * skills.length)]
    ),
    languages: Array.from({ length: Math.floor(Math.random() * 2) + 1 }, () =>
      languages[Math.floor(Math.random() * languages.length)]
    ),
    certifications: Array.from({ length: Math.floor(Math.random() * 3) }, () =>
      certifications[Math.floor(Math.random() * certifications.length)]
    ),
    department: departments[Math.floor(Math.random() * departments.length)],
    employmentType: employmentTypes[Math.floor(Math.random() * employmentTypes.length)],
    documents,
    notes: `Sample employee ${index} notes.`,
    emergencyContact: {
      name: `Emergency${index}`,
      relationship: ['Spouse', 'Sibling', 'Parent', 'Friend'][Math.floor(Math.random() * 4)],
      phone: `+383-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`
    },
    paymentInfo: {
      bankName: banks[Math.floor(Math.random() * banks.length)],
      accountNumber: Math.floor(Math.random() * 9000000000 + 1000000000).toString(),
      iban: `XK05${Math.floor(Math.random() * 9000 + 1000)}${Math.floor(Math.random() * 9000 + 1000)}${Math.floor(Math.random() * 9000 + 1000)}${Math.floor(Math.random() * 9000 + 1000)}`,
      accountType: Math.random() > 0.5 ? 'Checking' : 'Savings'
    },
    healthInsurance: {
      provider: healthInsuranceProviders[Math.floor(Math.random() * healthInsuranceProviders.length)],
      policyNumber: `HI${Math.floor(Math.random() * 90000 + 10000)}`,
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }
  };
};

async function seedMoreEmployees() {
  try {
    console.log('🌱 Starting to seed additional employees...');

    // Generate 15 more employees
    const additionalEmployees = Array.from({ length: 15 }, (_, i) => generateEmployee(i + 6));

    // Insert additional employees
    const createdEmployees = await Employee.insertMany(additionalEmployees);
    console.log(`✅ Created ${createdEmployees.length} additional employees`);

    // Display created employees
    createdEmployees.forEach((employee, index) => {
      console.log(`👤 Employee ${index + 1}:`);
      console.log(`   Name: ${employee.firstName} ${employee.lastName}`);
      console.log(`   Position: ${employee.position}`);
      console.log(`   Status: ${employee.status}`);
      console.log(`   Municipality: ${employee.municipality}`);
      console.log(`   Hourly Rate: €${employee.hourlyRate}`);
      console.log(`   Nationality: ${employee.nationality}`);
      console.log(`   MongoDB ID: ${employee._id}`);
    });

    console.log('🎉 Additional employees seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding additional employees:', error);
    process.exit(1);
  }
}

seedMoreEmployees(); 