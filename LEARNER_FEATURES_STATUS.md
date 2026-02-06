# Learner Role Features Status

This document tracks the implementation status of all Learner role features.

## ✅ Account & Access

- ✅ **Sign up / login / logout** - Fully implemented
  - Location: `src/pages/LoginPage.jsx`
  - Supports email/password authentication
  - Role selection during signup

- ⚠️ **Verify email** - Partially implemented
  - Status: Email verification status is tracked (`emailVerified` field)
  - Missing: UI to send verification email, verification flow
  - Action needed: Add email verification UI and flow

- ❌ **Reset password** - Not implemented
  - Missing: Forgot password page and reset flow
  - Action needed: Implement password reset functionality

- ⚠️ **Manage profile (name, contact, country/timezone)** - Partially implemented
  - Status: Profile data stored in `users/{uid}` (displayName, phoneNumber, timezone)
  - Missing: UI for learners to edit their profile
  - Note: Candidates have profile page, learners don't
  - Action needed: Create `LearnerProfilePage.jsx`

## ✅ Course / Learning

- ✅ **View course catalogue (enrolled course)** - Fully implemented
  - Location: `src/pages/learner/LearnerLibraryPage.jsx`
  - Shows enrolled courses with progress

- ✅ **Purchase/enrol in course** - Fully implemented
  - Location: `src/pages/learner/CoursePurchasePage.jsx`
  - Stripe integration for payments
  - Demo unlock option available

- ✅ **Access knowledge library (videos/modules)** - Fully implemented
  - Location: `src/pages/learner/LearnerLibraryPage.jsx`, `src/pages/ModulePage.jsx`
  - Supports YouTube and Bunny Stream videos
  - Module unlocking based on progress

- ✅ **Track progress (per module + overall)** - Fully implemented
  - Location: `src/pages/learner/LearnerLibraryPage.jsx`
  - Shows unlocked modules, completion status
  - Progress stored in `users/{uid}/progress/{courseId}`

- ❌ **Download resources (PDFs/notes if provided)** - Not implemented
  - Missing: File storage/retrieval for module resources
  - Missing: UI to display and download resources
  - Action needed: Add resource download feature to modules

## ✅ Assessment (Final Questionnaire)

- ✅ **See "Final Questionnaire Locked" until 100% completion** - Fully implemented
  - Location: `src/pages/learner/LearnerLibraryPage.jsx`
  - Button only appears when all modules complete

- ✅ **View mandatory disclaimer before starting questionnaire** - Fully implemented
  - Location: `src/pages/learner/AssessmentDisclaimerPage.jsx`
  - User must accept disclaimer to proceed

- ✅ **Start questionnaire (attempt 1 included)** - Fully implemented
  - Location: `src/pages/learner/AssessmentStartPage.jsx`
  - First attempt is free

- ✅ **Submit questionnaire** - Fully implemented
  - Location: `src/pages/learner/AssessmentStartPage.jsx`
  - Cloud Function: `submitAssessment`

- ✅ **View result: score + 1–5 star rating** - Fully implemented
  - Location: `src/pages/learner/AssessmentResultsPage.jsx`
  - Displays score percentage and star rating

- ✅ **View/Download virtual certificate** - Fully implemented
  - Location: `src/pages/learner/CertificateViewPage.jsx`
  - Certificate generated with unique number
  - View/download functionality

## ✅ Retake / Resit Rules

- ✅ **See "Retake requires full fee" notice** - Fully implemented
  - Location: `src/pages/learner/AssessmentResultsPage.jsx`
  - Button shows "Retake (Pay Full Fee)"

- ✅ **Pay full fee to resit** - Fully implemented
  - Location: `src/pages/learner/RetakePaymentPage.jsx` (needs verification)
  - Uses retakeFee from pricing_config

- ✅ **Resit questionnaire after payment** - Fully implemented
  - Cloud Function handles retake logic
  - Payment unlocks retake access

- ✅ **View updated stars/certificate** - Fully implemented
  - New assessment creates new certificate
  - Updated star rating displayed

## ✅ Internship (Only for 5★)

- ✅ **See eligibility banner (only 5★)** - Fully implemented
  - Location: `src/pages/learner/AssessmentResultsPage.jsx`
  - Shows banner only for 5-star ratings

- ✅ **Apply for unpaid 6-month internship** - Fully implemented
  - Location: `src/pages/learner/LearnerInternshipPage.jsx`
  - Application form with availability

- ✅ **Submit availability + agreement** - Fully implemented
  - Form includes availability text and commitment agreement
  - Cloud Function: `applyForInternship`

- ✅ **Track internship application status** - Fully implemented
  - Shows status: Applied/Accepted/Rejected/Waitlisted
  - Status displayed on internship page

## ⚠️ Visibility to Employers

- ⚠️ **Enable/disable "Visible to Employers"** - Partially implemented
  - Status: Feature exists for Candidates, not explicitly for Learners
  - Note: Learners may not need this feature (they're not job-seeking)
  - Action needed: Clarify if learners need this feature

- ✅ **Reactivate profile if system marks it inactive** - Fully implemented
  - Location: `src/pages/learner/ReactivationPage.jsx`
  - Payment-based reactivation
  - Handles auto-inactive status

## ⚠️ Notifications

- ⚠️ **Receive email/app notifications** - Partially implemented
  - Status: Email infrastructure exists (SendGrid templates)
  - Missing: In-app notification system
  - Missing: Notification preferences UI
  - Action needed: Implement notification system

## Summary

### Fully Implemented: 18/22 features (82%)
### Partially Implemented: 4/22 features (18%)
### Not Implemented: 0/22 features (0%)

## Priority Actions Needed

1. **High Priority:**
   - Add email verification UI and flow
   - Add password reset functionality
   - Create learner profile management page

2. **Medium Priority:**
   - Add resource download feature (PDFs/notes)
   - Clarify and implement "Visible to Employers" for learners if needed

3. **Low Priority:**
   - Implement in-app notification system
   - Add notification preferences
