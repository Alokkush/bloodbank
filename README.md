# Blood Bank Management System

A modern, responsive web application for managing blood bank operations built with Firebase. This system allows for donor registration, blood request management, inventory tracking, and administrative oversight through a secure dashboard.

## 🏥 Project Overview

The Blood Bank Management System is a comprehensive solution designed to streamline blood bank operations. It features a public portal for donor registration and blood requests, alongside an administrative dashboard for managing donations, inventory, and requests. Built with Firebase, the application provides real-time data synchronization and secure authentication.

## 📁 File Structure

```
bloodbank/
├── public/              # Firebase hosting files
│   ├── index.html      # Main application file
│   ├── css/
│   │   └── style.css   # Application styles
│   └── js/
│       └── app.js      # Firebase app logic
├── DEPLOY_INSTRUCTIONS.md  # Deployment guide
├── FIREBASE_SETUP.md   # Firebase configuration guide
├── firebase.json       # Firebase hosting configuration
├── firestore.indexes.json  # Firestore indexes
├── firestore.rules     # Firestore security rules
├── package.json        # Project dependencies and scripts
└── .gitignore          # Git ignored files
```

### Key Files Description

- **[public/index.html](public/index.html)**: The main application file containing all HTML structure, including the login page, admin panel, and public portal.
- **[public/css/style.css](public/css/style.css)**: Comprehensive styling with modern UI elements, glass morphism effects, and responsive design.
- **[public/js/app.js](public/js/app.js)**: Firebase integration logic, authentication handling, and client-side application functionality.
- **[DEPLOY_INSTRUCTIONS.md](DEPLOY_INSTRUCTIONS.md)**: Detailed deployment guide for hosting the application on Firebase.
- **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)**: Step-by-step Firebase configuration instructions.
- **[firebase.json](firebase.json)**: Firebase hosting and Firestore configuration.
- **[firestore.indexes.json](firestore.indexes.json)**: Firestore database indexes configuration.
- **[firestore.rules](firestore.rules)**: Security rules for Firestore collections.
- **[package.json](package.json)**: Project metadata, dependencies, and npm scripts.

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- Firebase CLI
- A Firebase project

### Installation Steps

1. **Install Firebase CLI globally:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Login to Firebase:**
   ```bash
   firebase login
   ```

4. **Initialize Firebase project:**
   ```bash
   firebase init
   ```
   - Select Hosting and Firestore
   - Choose your Firebase project
   - Set public directory to `public`
   - Configure as single-page app: Yes
   - Don't overwrite index.html

5. **Update Firebase Configuration:**
   - Go to Firebase Console > Project Settings > General
   - Copy your Firebase config object
   - Replace the config in [public/js/app.js](public/js/app.js)

## 🔧 Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Framework**: Bootstrap 5 for responsive design
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Hosting**: Firebase Hosting
- **Charts**: Chart.js for data visualization
- **Icons**: Bootstrap Icons

## 🎨 Features

### Public Portal
- Donor registration
- Blood request submission
- Responsive design for all devices

### Admin Dashboard
- Secure authentication with admin privileges
- Real-time dashboard with key metrics
- Donor management
- Donation tracking
- Blood request management
- Handover records
- Inventory management
- Data visualization with charts

## 🔐 Security

- Firebase Authentication for secure login
- Role-based access control (admin vs public)
- Firestore security rules to protect data
- Admin functions require authentication
- Public can only create donors/requests
- All data is validated on both client and server side

## 📊 Firestore Collections

- `donors` - Donor registrations
- `donations` - Donation records
- `requests` - Blood requests
- `handover` - Handover records
- `inventory` - Blood inventory
- `users` - User roles and permissions

## 🚀 Deployment

### Quick Deploy Guide

1. **Prerequisites**
   - Node.js (v14+) installed
   - Firebase account
   - Firebase CLI installed globally

2. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

3. **Login to Firebase**
   ```bash
   firebase login
   ```

4. **Create a New Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Click "Create a project"
   - Name it "blood-bank-system" (or your choice)
   - Enable Google Analytics (optional)

5. **Initialize Firebase in Your Project**
   ```bash
   firebase init
   ```
   During initialization:
   - Select: `Firestore` and `Hosting`
   - Choose your Firebase project
   - Firestore Rules: Use default for now
   - Firestore Indexes: Use default
   - Public directory: `public`
   - Single-page app: `Yes`
   - Don't overwrite index.html

6. **Configure Firebase in Your App**
   - Go to Firebase Console > Project Settings > General
   - Scroll down to "Your apps" section
   - Click "Web" icon to add a web app
   - Register app with name "Blood Bank Web"
   - Copy the Firebase configuration object
   - Replace the config in [public/js/app.js](public/js/app.js)

7. **Set Up Authentication**
   - In Firebase Console, go to Authentication > Sign-in method
   - Enable "Email/Password" provider
   - Go to Authentication > Users
   - Click "Add user" and create admin account:
     - Email: admin@bloodbank.com
     - Password: (create a secure password)

8. **Set Admin Custom Claims**
   Install Firebase Admin SDK temporarily to set custom claims:
   ```bash
   npm install firebase-admin
   ```
   
   Create a temporary script `setAdmin.js`:
   ```javascript
   const admin = require('firebase-admin');
   const serviceAccount = require('./path-to-service-account-key.json');
   
   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount)
   });
   
   async function setAdminClaim(email) {
     const user = await admin.auth().getUserByEmail(email);
     await admin.auth().setCustomUserClaims(user.uid, { admin: true });
     console.log('Admin claim set for:', email);
   }
   
   setAdminClaim('admin@bloodbank.com');
   ```
   
   Run: `node setAdmin.js`

9. **Test Locally**
   ```bash
   firebase serve
   ```
   Open: http://localhost:5000

10. **Deploy to Firebase**
    ```bash
    firebase deploy
    ```
    
    Your app will be available at: `https://your-project-id.web.app`

## 📱 Usage Examples

### Admin Login
- Email: admin@bloodbank.com
- Password: (the one you created)

### Features Available
- Public donor registration
- Blood request submission
- Admin dashboard
- Real-time data updates
- Responsive design
- Secure authentication

### Customization
- Update Firebase config in [public/js/app.js](public/js/app.js)
- Modify styles in [public/css/style.css](public/css/style.css)
- Adjust Firestore rules in [firestore.rules](firestore.rules)

## 🛠 Development

### Available Scripts

- `npm run serve` - Serve the application locally
- `npm run deploy` - Deploy the application to Firebase
- `npm run build` - No build step required for static site

### Project Customization

1. **Update Firebase Configuration**
   - Replace the Firebase config object in [public/js/app.js](public/js/app.js) with your project's configuration

2. **Admin Setup**
   - Create admin user in Firebase Auth Console
   - Add custom claim `admin: true` to the user
   - Use the admin email/password to login

3. **Styling**
   - Modify styles in [public/css/style.css](public/css/style.css)
   - The CSS file includes a comprehensive design system with glass morphism effects

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## 📞 Support

For issues, check:
1. Firebase Console for errors
2. Browser console for JS errors
3. Firestore rules for permission issues

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Firebase for backend services
- Bootstrap for responsive design components
- Chart.js for data visualization
