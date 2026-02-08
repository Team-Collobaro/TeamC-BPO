# Fix Admin Permissions Error

## 🔴 Error Message
```
FirebaseError: Missing or insufficient permissions.
```

## 🔍 Root Cause

Firestore security rules check `request.auth.token.role == 'admin'`, which requires the admin role to be set in **Firebase Auth Custom Claims**, not just in the Firestore user document.

## ✅ Solution Steps

### Step 1: Verify User Document in Firestore

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Firestore Database** → `users` collection
3. Find your user document (by UID or email)
4. Verify it has:
   ```json
   {
     "role": "admin",
     "email": "your-email@example.com",
     ...
   }
   ```

### Step 2: Check Custom Claims

1. Go to **Authentication** → **Users**
2. Find your user account
3. Click on the user to view details
4. Scroll down to **Custom claims** section
5. Check if it shows:
   ```json
   {
     "role": "admin"
   }
   ```

### Step 3: Set Custom Claims (If Missing)

#### Option A: Using Cloud Function (Automatic)

If you have a Cloud Function `onUserCreated` or similar, it should automatically set custom claims when:
- A user document is created/updated with `role: 'admin'`
- The function runs (usually within a few seconds)

**To trigger it manually:**
1. Update the user document in Firestore (change any field and change it back)
2. Wait a few seconds
3. Check custom claims again

#### Option B: Using Firebase Admin SDK (Manual)

If you don't have a Cloud Function, you can set custom claims manually:

**Create a script** (`scripts/set-admin-claims.js`):

```javascript
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Admin SDK
const serviceAccount = JSON.parse(
  readFileSync('path/to/serviceAccountKey.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Set custom claims for a user
async function setAdminClaims(userId) {
  try {
    await admin.auth().setCustomUserClaims(userId, {
      role: 'admin'
    });
    console.log(`✅ Custom claims set for user ${userId}`);
  } catch (error) {
    console.error('❌ Error setting claims:', error);
  }
}

// Replace with your user UID
const userId = 'YOUR_USER_UID_HERE';
setAdminClaims(userId);
```

**Run the script:**
```bash
node scripts/set-admin-claims.js
```

#### Option C: Using Firebase Console (Temporary - Not Recommended)

Firebase Console doesn't directly support setting custom claims, but you can:
1. Use Firebase CLI with Admin SDK
2. Or use a Cloud Function

### Step 4: Refresh Auth Token

After setting custom claims:

1. **Log out** from your application
2. **Log back in**
3. The new token with custom claims will be issued

Or use the refresh function in the app:
- The app now has a `refreshUserClaims()` function that will refresh your token

### Step 5: Verify It Works

1. After logging back in, try deleting a course again
2. Check browser console - should see no permission errors
3. If still failing, check:
   - Browser console for token details
   - Firebase Console → Authentication → Users → Your User → Custom Claims

## 🧪 Quick Test

Run this in browser console (while logged in):

```javascript
// Check current token claims
const user = firebase.auth().currentUser;
if (user) {
  user.getIdTokenResult().then(tokenResult => {
    console.log('Custom Claims:', tokenResult.claims);
    console.log('Role:', tokenResult.claims?.role);
    console.log('Is Admin:', tokenResult.claims?.role === 'admin');
  });
}
```

**Expected Output:**
```javascript
Custom Claims: { role: 'admin', ... }
Role: 'admin'
Is Admin: true
```

## 🔧 Troubleshooting

### Issue: Custom claims not updating after setting them

**Solution:**
- Log out completely
- Clear browser cache/cookies
- Log back in
- Token is cached for 1 hour, so you may need to wait or force refresh

### Issue: Cloud Function not setting claims

**Check:**
1. Cloud Function is deployed
2. Function has proper permissions
3. Function is triggered when user document changes
4. Check Cloud Function logs for errors

### Issue: Still getting permission denied

**Check:**
1. Firestore rules are deployed: `firebase deploy --only firestore:rules`
2. Rules allow `isAdmin()` to write
3. User has `role: 'admin'` in custom claims (not just Firestore document)
4. Token is refreshed (log out/in)

## 📝 Files Modified

- `src/pages/admin/AdminCoursesPage.jsx` - Added permission check and better error messages
- `firestore.rules` - Already updated to allow admin writes

## 🚀 Quick Fix Commands

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# If you have a Cloud Function for setting claims, deploy it
firebase deploy --only functions

# Check your user document
# (Do this in Firebase Console)
```

## ⚠️ Important Notes

1. **Custom Claims vs Firestore Document:**
   - Firestore rules check **custom claims** (`request.auth.token.role`)
   - Not the Firestore user document (`users/{uid}.role`)
   - Both should be set, but custom claims are what matter for security rules

2. **Token Caching:**
   - Tokens are cached for 1 hour
   - After setting custom claims, you MUST log out/in or wait for token refresh

3. **Security:**
   - Custom claims can only be set server-side (Admin SDK or Cloud Functions)
   - Client-side code cannot modify custom claims
   - This is by design for security

---

**Status**: ✅ Error handling improved, but you still need to set custom claims for the feature to work.
