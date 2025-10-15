# Firebase Blood Bank Management System

## Quick Setup Guide

### Prerequisites
1. Node.js (v14 or later)
2. Firebase CLI
3. A Firebase project

### Installation Steps

1. **Install Firebase CLI globally:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase project:**
   ```bash
   firebase init
   ```
   - Select Hosting and Firestore
   - Choose your Firebase project
   - Set public directory to `public_new`
   - Configure as single-page app: Yes
   - Don't overwrite index.html

4. **Update Firebase Configuration:**
   - Go to Firebase Console > Project Settings > General
   - Copy your Firebase config object
   - Replace the config in `public_new/js/app.js`

5. **Set up Authentication:**
   - Enable Email/Password authentication in Firebase Console
   - Create an admin user in Firebase Auth
   - Add custom claims for admin privileges

6. **Deploy to Firebase:**
   ```bash
   firebase deploy
   ```

### Project Structure
```
bloodbank/
├── public_new/          # Firebase hosting files
│   ├── index.html      # Main application
│   ├── css/
│   │   └── style.css   # Styles
│   └── js/
│       └── app.js      # Firebase app logic
├── firebase.json       # Firebase configuration
├── firestore.rules     # Security rules
├── firestore.indexes.json
└── package.json
```

### Features Converted to Firebase
- ✅ Admin authentication with Firebase Auth
- ✅ Public donor registration
- ✅ Blood request submission
- ✅ Real-time data with Firestore
- ✅ Responsive design maintained
- ✅ Single-page application

### Admin Setup
1. Create admin user in Firebase Auth Console
2. Add custom claim `admin: true` to the user
3. Use the admin email/password to login

### Security
- Firestore rules restrict admin operations to authenticated admin users
- Public can only create donor registrations and blood requests
- All data is validated on both client and server side

### Next Steps
1. Customize Firebase config with your project details
2. Set up proper admin user with custom claims
3. Test the application locally with `firebase serve`
4. Deploy with `firebase deploy`