# 🚀 Quick Start Guide - UK BPO Learning

Follow these steps to get your learning platform up and running!

## ⚡ Prerequisites Checklist

- [ ] Node.js 18+ installed ([Download](https://nodejs.org/))
- [ ] Firebase CLI installed: `npm install -g firebase-tools`
- [ ] Firebase account created ([Sign Up](https://console.firebase.google.com/))
- [ ] Bunny Stream account (optional for MVP testing)

## 📋 Step-by-Step Setup

### Step 1: Create Firebase Project (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add Project"**
3. Name it: `uk-bpo-learning`
4. Disable Google Analytics (not needed for MVP)
5. Click **"Create Project"**

### Step 2: Enable Firebase Services (3 minutes)

**Enable Authentication:**
1. Left sidebar → **Authentication**
2. Click **"Get Started"**
3. Click **"Email/Password"** → Enable → Save

**Enable Firestore:**
1. Left sidebar → **Firestore Database**
2. Click **"Create Database"**
3. Choose **"Start in production mode"**
4. Select location (nearest to you)
5. Click **"Enable"**

**Upgrade to Blaze Plan (for Cloud Functions):**
1. Left sidebar → **Upgrade** (bottom left)
2. Select **"Blaze (Pay as you go)"**
3. Add billing information
4. Don't worry - Firebase has generous free tier!

### Step 3: Get Firebase Config (2 minutes)

1. Click the **gear icon** ⚙️ → **Project Settings**
2. Scroll to **"Your apps"** section
3. Click the **web icon** `</>`
4. Register app with nickname: `uk-bpo-learning-web`
5. Copy the `firebaseConfig` object

### Step 4: Setup Environment Variables (1 minute)

1. Copy the example env file:
   ```bash
   cp env.example .env.local
   ```

2. Open `.env.local` and paste your Firebase config:
   ```env
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

### Step 5: Install Dependencies (2 minutes)

```bash
# Install main project dependencies
npm install

# Install Cloud Functions dependencies
cd functions
npm install
cd ..

# Install seed script dependencies
cd scripts
npm install
cd ..
```

### Step 6: Connect to Firebase (1 minute)

```bash
# Login to Firebase
firebase login

# Connect project
firebase use --add
# Select your project from the list
# Enter alias: default
```

### Step 7: Deploy Firestore Rules & Functions (3 minutes)

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Deploy Cloud Functions
firebase deploy --only functions
```

Wait for deployment to complete (~2-3 minutes).

### Step 8: Seed the Database (1 minute)

```bash
cd scripts
npm run seed
```

You should see:
```
✅ Course created: BPO Fundamentals 101
✅ Module 1: Introduction to BPO
✅ Module 2: Effective Communication Skills
✅ Module 3: Customer Service Excellence
✅ Demo user created: learner@demo.com / password123
```

### Step 9: Run the App! (1 minute)

```bash
npm run dev
```

Open your browser to: **http://localhost:5173**

### Step 10: Login and Test (2 minutes)

1. Login with demo credentials:
   - Email: `learner@demo.com`
   - Password: `password123`

2. You'll see the dashboard with 3 modules
3. Click on **Module 1**
4. The video placeholder will show
5. Check "I watched fully" → Click "Mark video completed"
6. Take the MCQ quiz (you need 100% to pass!)
7. On pass, Module 2 unlocks!

## 🎥 Optional: Add Real Bunny Stream Videos

### Get Bunny Stream Account

1. Sign up at [Bunny Stream](https://bunny.net/stream/)
2. Create a Video Library
3. Upload your training videos

### Get Embed URLs

1. In Bunny dashboard, click on a video
2. Go to **"Embed"** tab
3. Copy the **Iframe Embed Code**
4. Extract the URL from `src="..."`

Example URL format:
```
https://iframe.mediadelivery.net/embed/123456/abcd-1234-5678?autoplay=false&preload=true
```

### Update Firestore

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Firestore Database**
3. Navigate to: `courses/bpo-fundamentals-101/modules/module-1-intro`
4. Click **"bunnyEmbedUrl"** field
5. Replace with your Bunny Stream URL
6. Click **Update**
7. Repeat for other modules

## ✅ Verification Checklist

- [ ] App runs without errors
- [ ] Can login with demo user
- [ ] Dashboard shows 3 modules
- [ ] Module 1 is unlocked, others locked
- [ ] Can mark video as complete
- [ ] MCQ appears after video completion
- [ ] MCQ validates answers (try wrong answers!)
- [ ] Module 2 unlocks after passing Module 1 MCQ
- [ ] Firestore security prevents cheating (try editing unlockedModuleOrder in console - it should fail!)

## 🎉 You're Done!

Your gated learning platform is now live!

## 🔧 Common Issues & Solutions

### "Firebase not initialized"
- Check `.env.local` file exists
- Restart dev server: `Ctrl+C` then `npm run dev`

### "Permission denied" errors
- Deploy security rules: `firebase deploy --only firestore:rules`
- Check you're logged in as demo user

### Cloud Function not working
- Check deployment: `firebase functions:log`
- Verify Blaze plan is active
- Redeploy: `firebase deploy --only functions`

### Videos not loading
- Bunny URLs are placeholders by default
- Upload videos to Bunny Stream and update URLs in Firestore

## 📚 Next Steps

1. **Customize the Course**
   - Edit module titles, descriptions in Firestore
   - Add more modules
   - Update MCQ questions

2. **Brand Your Platform**
   - Update colors in `tailwind.config.js`
   - Change app name in `index.html`
   - Add your logo

3. **Add Real Content**
   - Upload training videos to Bunny Stream
   - Update embed URLs in Firestore
   - Create additional courses

4. **Deploy to Production**
   - Build: `npm run build`
   - Deploy: `firebase deploy --only hosting`
   - Share the URL with learners!

## 🆘 Need Help?

Check the main README.md for:
- Detailed architecture documentation
- API reference
- Troubleshooting guide
- Deployment instructions

---

Happy Teaching! 🎓
