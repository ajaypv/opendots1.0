#!/usr/bin/env node

/**
 * This script helps set up the necessary environment variables and configuration
 * for using Cloudflare R2 storage with the application.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🚀 Setting up Cloudflare R2 for OpenDots\n');

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

async function main() {
  console.log('This script will help you set up Cloudflare R2 for image storage.\n');
  
  // Ask for Cloudflare account ID
  const accountId = await askQuestion('Enter your Cloudflare Account ID: ');
  
  if (!accountId) {
    console.error('❌ Account ID is required. Exiting.');
    rl.close();
    return;
  }
  
  // Ask for API token
  const apiToken = await askQuestion('Enter your Cloudflare API Token (with R2 permissions): ');
  
  if (!apiToken) {
    console.error('❌ API Token is required. Exiting.');
    rl.close();
    return;
  }
  
  // Ask for application URL
  const defaultUrl = 'https://opendots-alphav1.pages.dev';
  const appUrl = await askQuestion(`Enter your application URL [${defaultUrl}]: `) || defaultUrl;
  
  // Create .env.local file
  const envContent = `# Cloudflare API Configuration
CLOUDFLARE_ACCOUNT_ID=${accountId}
CLOUDFLARE_API_TOKEN=${apiToken}

# App Configuration
NEXT_PUBLIC_APP_URL=${appUrl}
`;
  
  try {
    fs.writeFileSync(path.join(__dirname, '.env.local'), envContent);
    console.log('✅ Created .env.local file with your configuration.');
  } catch (err) {
    console.error(`❌ Failed to write .env.local file: ${err.message}`);
    rl.close();
    return;
  }
  
  // Create the R2 buckets
  console.log('\n📦 Creating R2 buckets...');
  
  try {
    // Check if wrangler is installed
    console.log('Checking for wrangler installation...');
    execSync('npx wrangler --version', { stdio: 'ignore' });
    
    // Create the main bucket
    try {
      console.log('Creating profile-images bucket...');
      execSync('npx wrangler r2 bucket create profile-images', { stdio: 'pipe' });
      console.log('✅ Created profile-images bucket');
    } catch (err) {
      console.log('⚠️ profile-images bucket may already exist or failed to create');
    }
    
    // Create the development bucket
    try {
      console.log('Creating profile-images-dev bucket...');
      execSync('npx wrangler r2 bucket create profile-images-dev', { stdio: 'pipe' });
      console.log('✅ Created profile-images-dev bucket');
    } catch (err) {
      console.log('⚠️ profile-images-dev bucket may already exist or failed to create');
    }
    
  } catch (err) {
    console.error(`❌ Failed to run wrangler commands: ${err.message}`);
    console.log('Please make sure wrangler is installed and you are logged in.');
    console.log('Run: npx wrangler login');
  }
  
  console.log('\n🎉 Setup complete!');
  console.log('\nNext steps:');
  console.log('1. Make sure you are logged in to Cloudflare: npx wrangler login');
  console.log('2. Deploy your application: pnpm deploy');
  console.log('3. Verify that image uploads are working\n');
  
  rl.close();
}

main().catch(err => {
  console.error('An unexpected error occurred:', err);
  rl.close();
}); 