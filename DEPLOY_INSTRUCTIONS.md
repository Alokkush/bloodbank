# Firebase Deployment Instructions

## 🚀 Quick Deploy Guide

### 1. Prerequisites
- Node.js (v14+) installed
- Firebase account
- Firebase CLI installed globally

### 2. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 3. Login to Firebase
```bash
firebase login
```

### 4. Create a New Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Name it "blood-bank-system" (or your choice)
4. Enable Google Analytics (optional)

### 5. Initialize Firebase in Your Project
```bash
cd bloodbank
firebase init
```

**During initialization:**
- Select: `Firestore` and `Hosting`
- Choose your Firebase project
- Firestore Rules: Use default for now
- Firestore Indexes: Use default
- Public directory: `public` (already configured)
- Single-page app: `Yes`
- Don't overwrite index.html

### 6. Configure Firebase in Your App
1. Go to Firebase Console > Project Settings > General
2. Scroll down to "Your apps" section
3. Click "Web" icon to add a web app
4. Register app with name "Blood Bank Web"
5. Copy the Firebase configuration object
6. Replace the config in `public/js/app.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 7. Set Up Authentication
1. In Firebase Console, go to Authentication > Sign-in method
2. Enable "Email/Password" provider
3. Go to Authentication > Users
4. Click "Add user" and create admin account:
   - Email: admin@bloodbank.com
   - Password: (create a secure password)

### 8. Set Admin Custom Claims
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

### 9. Test Locally
```bash
firebase serve
```
Open: http://localhost:5000

### 10. Deploy to Firebase
```bash
firebase deploy
```

Your app will be available at: `https://your-project-id.web.app`

## 🔐 Admin Login
- Email: admin@bloodbank.com
- Password: (the one you created)

## 📱 Features Available
- ✅ Public donor registration
- ✅ Blood request submission
- ✅ Admin dashboard
- ✅ Real-time data updates
- ✅ Responsive design
- ✅ Secure authentication

## 🛠 Customization
- Update Firebase config in `public/js/app.js`
- Modify styles in `public/css/style.css`
- Adjust Firestore rules in `firestore.rules`

## 📊 Firestore Collections
- `donors` - Donor registrations
- `donations` - Donation records
- `requests` - Blood requests
- `handover` - Handover records
- `inventory` - Blood inventory

## 🔒 Security
- Admin functions require authentication
- Public can only create donors/requests
- Firestore rules enforce security
- All data is validated

## 📞 Support
For issues, check:
1. Firebase Console for errors
2. Browser console for JS errors
3. Firestore rules for permission issues

---
**🎉 Your Blood Bank Management System is now ready for Firebase!**