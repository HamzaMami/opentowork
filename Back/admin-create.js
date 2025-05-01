// Script to create an admin user
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import connectDB from './config/db.js';

// Load environment variables
dotenv.config();

// Admin user configuration
const adminUser = {
  name: 'Admin User',
  username: 'admin',
  email: 'admin@opentowork.com',
  password: 'Admin@123',
  role: 'admin'
};

// Connect to database and create admin user
const createAdminUser = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminUser.email });
    
    if (existingAdmin) {
      console.log('Admin user already exists with email:', existingAdmin.email);
      
      // Update the admin's password for testing purposes
      existingAdmin.password = adminUser.password;
      await existingAdmin.save();
      console.log('Admin password reset to:', adminUser.password);
      
      process.exit(0);
    }
    
    // Create the admin user - let the User model handle password hashing with pre-save hook
    const newAdmin = new User({
      name: adminUser.name,
      username: adminUser.username,
      email: adminUser.email,
      password: adminUser.password,
      role: adminUser.role
    });
    
    await newAdmin.save();
    console.log('Admin user created successfully:');
    console.log(`Name: ${adminUser.name}`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Username: ${adminUser.username}`);
    console.log(`Password: ${adminUser.password} (unhashed version for login)`);
    console.log(`Role: ${adminUser.role}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

// Run the function
createAdminUser();