const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execPromise = util.promisify(exec);

async function runScript(scriptName) {
  try {
    console.log(`\n🚀 Running ${scriptName}...`);
    const scriptPath = path.join(__dirname, scriptName);
    const { stdout, stderr } = await execPromise(`node "${scriptPath}"`);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    return true;
  } catch (error) {
    console.error(`❌ Error running ${scriptName}:`, error);
    return false;
  }
}

async function seedAll() {
  console.log('🌱 Starting to seed all data...\n');

  const scripts = [
    'seedMoreCustomers.js',
    'seedMoreEmployees.js',
    'seedMoreObjects.js',
    'seedMoreCustomerContracts.js'
  ];

  for (const script of scripts) {
    const success = await runScript(script);
    if (!success) {
      console.error(`❌ Failed to run ${script}. Stopping.`);
      process.exit(1);
    }
  }

  console.log('\n✅ All seed scripts completed successfully!');
  process.exit(0);
}

seedAll(); 