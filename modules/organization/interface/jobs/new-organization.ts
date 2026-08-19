/**
 * Job: Create New Organization
 * Creates a new organization account with the specified email, name, and password
 *
 * Usage:
 * yarn job:new:organization --email=org@example.com --pass=password123 --name="My Organization"
 */

import { OrganizationRepo } from '../../infrastructure/repositories/organizationRepo';

async function run() {
  const args = process.argv.slice(2);

  const emailArg = args.find(arg => arg.startsWith('--email='));
  const email = emailArg ? emailArg.split('=')[1] : null;

  const passArg = args.find(arg => arg.startsWith('--pass='));
  const password = passArg ? passArg.split('=')[1] : null;

  const nameArg = args.find(arg => arg.startsWith('--name='));
  const name = nameArg ? nameArg.split('=')[1] : null;

  if (!email || !password || !name) {
    console.error('❌ Missing required parameters:');
    console.error('   --email=<email> (required)');
    console.error('   --pass=<password> (required)');
    console.error('   --name=<organization name> (required)');
    console.error('');
    console.error('Example:');
    console.error('   yarn job:new:organization --email=org@example.com --pass=secure123 --name="My Organization"');
    process.exit(1);
  }

  try {
    const repo = new OrganizationRepo();

    const existing = await repo.findByEmail(email);
    if (existing) {
      console.error(`❌ Organization with email "${email}" already exists`);
      process.exit(1);
    }

    console.log(`👤 Creating organization "${name}"...`);
    const org = await repo.createWithPassword({
      name,
      email,
      password,
      status: 'active',
    });

    console.log('✅ Organization created successfully!');
    console.log(`   📧 Email: ${org.email}`);
    console.log(`   👤 Name: ${org.name}`);
    console.log(`   🆔 ID: ${org.organizationId}`);
    console.log(`   📅 Created: ${org.createdAt.toISOString()}`);
    console.log('');
    console.log('🔐 You can now log in with the provided email and password.');
  } catch (error) {
    console.error('❌ Failed to create organization:', error);
    process.exit(1);
  }
}

run();
