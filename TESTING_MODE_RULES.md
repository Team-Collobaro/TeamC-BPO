# Firestore Testing Mode Rules

## ⚠️ WARNING

**These rules allow ANYONE to read, write, and delete ALL data in your Firestore database.**

**ONLY use these rules for:**
- Local development
- Testing
- Debugging

**NEVER deploy these rules to production!**

## 📁 Files

- `firestore.rules` - Production rules (secure)
- `firestore.rules.test` - Testing rules (allows everything)

## 🚀 Quick Setup

### Option 1: Replace Rules File (Temporary)

```bash
# Backup current rules
cp firestore.rules firestore.rules.production

# Use testing rules
cp firestore.rules.test firestore.rules

# Deploy testing rules
firebase deploy --only firestore:rules

# When done testing, restore production rules:
cp firestore.rules.production firestore.rules
firebase deploy --only firestore:rules
```

### Option 2: Direct Edit (Quick Test)

Edit `firestore.rules` and replace everything with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Then deploy:
```bash
firebase deploy --only firestore:rules
```

## 🔄 Switch Back to Production Rules

After testing, restore production rules:

```bash
# Restore from backup
cp firestore.rules.production firestore.rules

# Or restore from git
git checkout firestore.rules

# Deploy production rules
firebase deploy --only firestore:rules
```

## ✅ Verify Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Firestore Database** → **Rules**
3. Check the deployed rules
4. **Testing mode** should show: `allow read, write: if true;`
5. **Production mode** should show your secure rules

## 🧪 Testing Checklist

With testing rules enabled:
- [ ] Can create courses without authentication
- [ ] Can delete courses without authentication
- [ ] Can read all user data
- [ ] Can write to any collection
- [ ] No permission errors

## 🔒 Security Reminder

**Before deploying to production:**
1. ✅ Restore production rules
2. ✅ Deploy production rules
3. ✅ Verify rules in Firebase Console
4. ✅ Test that permission errors work correctly
5. ✅ Never commit testing rules to production branch

## 📝 Quick Commands

```bash
# Enable testing mode
cp firestore.rules.test firestore.rules && firebase deploy --only firestore:rules

# Disable testing mode (restore production)
git checkout firestore.rules && firebase deploy --only firestore:rules
```

---

**Remember**: Testing rules = No security. Use only for development!
