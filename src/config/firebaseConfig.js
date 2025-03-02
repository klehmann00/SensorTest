// firebaseConfig.js

// Default development configuration
const devConfig = {
    apiKey: "AIzaSyC_wBOaHBmwBhrk0-OZSrQejlNE76tr33Q",
    authDomain: "sensor-display.firebaseapp.com",
    projectId: "sensor-display",
    storageBucket: "sensor-display.firebasestorage.app",
    messagingSenderId: "999834441988",
    appId: "1:999834441988:web:6c3ede4d4a379bbb1dd851",
    databaseURL: "https://sensor-display-default-rtdb.firebaseio.com"
  };
  
  // Production configuration (to be filled in when deploying)
  const prodConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "YOUR_PRODUCTION_API_KEY",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-prod-app.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "your-prod-project-id",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-prod-app.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "YOUR_PROD_MESSAGING_ID",
    appId: process.env.FIREBASE_APP_ID || "YOUR_PROD_APP_ID",
    databaseURL: process.env.FIREBASE_DATABASE_URL || "https://your-prod-database-url.firebaseio.com"
  };
  
  // Choose configuration based on environment
  const isProduction = process.env.NODE_ENV === 'production';
  const firebaseConfig = isProduction ? prodConfig : devConfig;
  
  export default firebaseConfig;