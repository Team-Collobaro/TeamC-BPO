# Admin Panel Login Guide

## How to Login to Admin Dashboard

### Step 1: Create an Admin User Manually on Firebase

Admin users cannot be created through the regular signup form. Follow these steps to create one manually:

#### Method 1: Manual Creation via Firebase Console (Recommended)

1. **Go to Firebase Console**
   - Visit: [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Select your project

2. **Create Authentication User**
   - Navigate to **Authentication** → **Users** (in the left sidebar)
   - Click **Add user** button (top right)
   - Enter:
     - **Email**: Your admin email (e.g., `admin@example.com`)
     - **Password**: A secure password (minimum 6 characters)
   - Click **Add user**
   - **IMPORTANT**: Copy the **User UID** that appears (you'll need this next)

3. **Create Firestore User Document**
   - Navigate to **Firestore Database** (in the left sidebar)
   - Click **Start collection** (if no collections exist) or navigate to `users` collection
   - Click **Add document**
   - **Document ID**: Paste the **User UID** you copied from step 2
   - **Add fields** (click "Add field" for each):
     - `email` (type: **string**): The email you used (e.g., `admin@example.com`)
     - `role` (type: **string**): `admin` (must be exactly `"admin"`)
     - `displayName` (type: **string**): Your name (e.g., `Admin User`)
     - `status` (type: **string**): `active`
     - `createdAt` (type: **timestamp**): Click the clock icon and select "now" or enter current date/time
     - `lastLoginAt` (type: **timestamp**): Same as createdAt
     - `emailVerified` (type: **boolean**): `false`
   - Click **Save**

4. **Wait for Custom Claims** (Automatic)
   - The Cloud Function `onUserCreated` will automatically set custom claims
   - This usually happens within a few seconds
   - You can verify in **Authentication** → **Users** → Click on your user → Check "Custom claims"

#### Method 2: Using Script (Alternative)

If you prefer using a script:

```bash
cd scripts
npm run create-admin
```

This will create an admin user with:
- **Email**: `admin@example.com`
- **Password**: `admin123456`

**Custom email/password:**
```bash
npm run create-admin your-email@example.com your-password "Your Name"
```

### Step 2: Login

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the login page:
   - Go to: `http://localhost:5173/login`
   - Or click "Login" from the landing page

3. Enter your admin credentials:
   - Email: `admin@example.com` (or the email you specified)
   - Password: `admin123456` (or the password you specified)

4. Click "Sign In"

5. You will be automatically redirected to `/admin/dashboard`

## Admin Dashboard Features

Once logged in, you can access:

- **Dashboard** (`/admin/dashboard`) - Overview statistics
- **Users** (`/admin/users`) - Manage all users (view, suspend, activate)
- **Courses & Library** (`/admin/courses`) - View courses and modules (tutorials)
- **Pricing & Plans** (`/admin/pricing`) - Manage pricing configuration
- **Payments & Refunds** (`/admin/payments`) - View payment transactions
- **Internship Applications** (`/admin/internships`) - Manage internship applications
- **Audit Logs** (`/admin/audit`) - View system audit logs

## Adding Tutorials/Courses

You can now add courses and modules directly from the admin panel!

### Adding a Course

1. Go to **Courses & Library** (`/admin/courses`)
2. Click **"+ Add Course"** button
3. Enter:
   - **Course Title**: e.g., "BPO Fundamentals 101"
   - **Description**: (optional) Course description
4. Click **"Create Course"**

### Adding Modules with YouTube Videos

1. Select a course from the left sidebar
2. Click **"+ Add Module"** button
3. Fill in the module details:
   - **Module Title**: e.g., "Introduction to BPO"
   - **Description**: (optional)
   - **Order**: Number (lower numbers appear first)
   - **YouTube Video URL**: Paste your YouTube URL
     - Supports public videos: `https://www.youtube.com/watch?v=VIDEO_ID`
     - Supports unlisted videos: `https://youtu.be/VIDEO_ID` or `https://www.youtube.com/watch?v=VIDEO_ID`
     - Works with any YouTube URL format
   - **Bunny Stream Embed URL**: (Alternative) If you prefer Bunny Stream
4. Click **"Add Module"**

### Editing Modules

- Click **"Edit"** next to any module to modify it
- Click **"Delete"** to remove a module (with confirmation)

### YouTube Video Support

The system now supports YouTube videos (both public and unlisted):
- ✅ Public YouTube videos
- ✅ Unlisted YouTube videos (not in search results)
- ✅ Any YouTube URL format (youtube.com/watch, youtu.be, etc.)
- ✅ Automatic conversion to embed format
- ✅ Backward compatible with existing Bunny Stream URLs

**Note**: You can use either YouTube URL or Bunny Stream URL, but not both for the same module.

## Troubleshooting

### "Invalid email or password"
- Make sure you created the admin user first using the script
- Check that the email and password are correct

### "Access Denied" or redirected to login
- Ensure the user document in Firestore has `role: 'admin'`
- The Cloud Function `onUserCreated` should automatically set custom claims
- If not, you may need to manually trigger the function or wait a few seconds

### User exists but not admin
If you already have a user account and want to make it admin:

1. Go to Firebase Console → Firestore
2. Navigate to `users/{userId}`
3. Update the `role` field to `"admin"`
4. The Cloud Function will update custom claims automatically
5. Log out and log back in

## Converting Existing User to Admin

If you already have a user account and want to make it admin:

1. Go to Firebase Console → **Firestore Database**
2. Navigate to `users` collection
3. Find the user document (by email or UID)
4. Click on the document to edit
5. Update the `role` field to `"admin"` (type: string)
6. Click **Update**
7. The Cloud Function will update custom claims automatically
8. **Important**: Log out and log back in for changes to take effect
