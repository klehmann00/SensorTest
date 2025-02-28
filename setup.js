#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=== SensorTest Setup ===\n');
console.log('This script will help you configure the SensorTest app with your Firebase credentials.');
console.log('You\'ll need to create a Firebase project first at https://console.firebase.google.com/\n');

// Create .env file from template
const createEnvFile = () => {
  if (fs.existsSync('.env')) {
    console.log('\n.env file already exists. Do you want to overwrite it? (y/n)');
    rl.question('> ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        collectFirebaseConfig();
      } else {
        console.log('\nSetup cancelled. Your existing .env file was not modified.');
        rl.close();
      }
    });
  } else {
    collectFirebaseConfig();
  }
};

// Collect Firebase configuration
const collectFirebaseConfig = () => {
  console.log('\nPlease enter your Firebase configuration:');
  
  rl.question('Firebase API Key: ', (apiKey) => {
    rl.question('Firebase Auth Domain: ', (authDomain) => {
      rl.question('Firebase Project ID: ', (projectId) => {
        rl.question('Firebase Storage Bucket: ', (storageBucket) => {
          rl.question('Firebase Messaging Sender ID: ', (messagingSenderId) => {
            rl.question('Firebase App ID: ', (appId) => {
              rl.question('Firebase Database URL: ', (databaseURL) => {
                writeEnvFile({
                  apiKey,
                  authDomain,
                  projectId,
                  storageBucket,
                  messagingSenderId,
                  appId,
                  databaseURL
                });
              });
            });
          });
        });
      });
    });
  });
};

// Write the .env file
const writeEnvFile = (config) => {
  const envContent = `# Firebase Configuration
FIREBASE_API_KEY=${config.apiKey}
FIREBASE_AUTH_DOMAIN=${config.authDomain}
FIREBASE_PROJECT_ID=${config.projectId}
FIREBASE_STORAGE_BUCKET=${config.storageBucket}
FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId}
FIREBASE_APP_ID=${config.appId}
FIREBASE_DATABASE_URL=${config.databaseURL}

# App Configuration
APP_NAME=SensorTest
APP_VERSION=1.0.0
`;

  fs.writeFileSync('.env', envContent);
  console.log('\n.env file has been created successfully!');
  
  setupComplete();
};

// Final steps
const setupComplete = () => {
  console.log('\nInstalling npm dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('\nDependencies installed successfully!');
  } catch (error) {
    console.error('\nError installing dependencies. Please run "npm install" manually.');
  }
  
  console.log('\n=== Setup Complete ===');
  console.log('\nYou can now start the app with:');
  console.log('  expo start');
  console.log('\nFor additional configuration options, please refer to the README.md file.');
  
  rl.close();
};

// Start the setup process
createEnvFile();