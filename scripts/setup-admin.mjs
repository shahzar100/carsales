#!/usr/bin/env node

/**
 * Admin User Setup Script
 * 
 * This script creates an initial admin user in the MongoDB database.
 * Run with: node scripts/setup-admin.mjs
 * 
 * Make sure to set MONGODB_URI in your .env.local file before running.
 */

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function setupAdmin() {
  console.log('\n🔧 Admin User Setup\n');

  // Check for MongoDB URI
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ Error: MONGODB_URI is not set in environment variables.');
    console.error('Please create a .env.local file with your MongoDB connection string.\n');
    process.exit(1);
  }

  let client;
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    client = new MongoClient(mongoUri);
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('carsales');
    const adminCollection = db.collection('adminUsers');

    // Check if admin already exists
    const existingAdmin = await adminCollection.findOne({});
    if (existingAdmin) {
      console.log('⚠️  An admin user already exists in the database.');
      const overwrite = await question('Do you want to create another admin user? (yes/no): ');
      if (overwrite.toLowerCase() !== 'yes' && overwrite.toLowerCase() !== 'y') {
        console.log('Setup cancelled.\n');
        rl.close();
        await client.close();
        return;
      }
    }

    // Get username
    const username = await question('Enter admin username: ');
    if (!username || username.trim().length < 3) {
      console.error('❌ Username must be at least 3 characters long.\n');
      rl.close();
      await client.close();
      return;
    }

    // Check if username exists
    const userExists = await adminCollection.findOne({ username: username.trim() });
    if (userExists) {
      console.error('❌ This username already exists. Please choose a different username.\n');
      rl.close();
      await client.close();
      return;
    }

    // Get password
    const password = await question('Enter admin password: ');
    if (!password || password.length < 8) {
      console.error('❌ Password must be at least 8 characters long.\n');
      rl.close();
      await client.close();
      return;
    }

    // Hash password
    console.log('\n🔐 Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create admin user
    console.log('💾 Creating admin user...');
    await adminCollection.insertOne({
      username: username.trim(),
      passwordHash,
      createdAt: new Date(),
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📝 Login Details:');
    console.log(`   Username: ${username.trim()}`);
    console.log(`   Password: [hidden]`);
    console.log('\nYou can now login at: http://localhost:3000/admin/login\n');

  } catch (error) {
    console.error('\n❌ Error setting up admin user:');
    console.error(error.message);
    console.error('\nPlease check your MongoDB connection and try again.\n');
  } finally {
    rl.close();
    if (client) {
      await client.close();
    }
  }
}

setupAdmin();
