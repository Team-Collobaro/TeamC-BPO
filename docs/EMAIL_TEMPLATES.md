# Email Templates (SendGrid)

Transactional emails use SendGrid Dynamic Templates. Create templates in the SendGrid Dashboard and set the template IDs in Firebase Functions config (or use the default placeholders below).

## Environment variables (Firebase Functions config)

- `SENDGRID_API_KEY` – SendGrid API key (required for sending)
- `SENDGRID_FROM_EMAIL` – Sender email (e.g. noreply@yourdomain.com)
- `SENDGRID_FROM_NAME` – Sender name (e.g. UK BPO Learning)
- `APP_URL` – Base URL for links (e.g. https://yourapp.com)
- Optional: `SENDGRID_TEMPLATE_*` – Override default template IDs

## Template registry

| Event | Template key | Variables |
|-------|--------------|-----------|
| User signup | welcome | name, role, loginUrl |
| Payment success | payment_receipt | amount, type, receiptUrl |
| Course unlock | course_access | courseName, libraryUrl |
| Assessment submitted | assessment_results | score, stars, certificateUrl |
| Survey sent | survey_job_seeking | surveyUrl, deadline |
| Auto-inactive | reactivation_needed | reactivateUrl, fee |
| Reactivation success | reactivation_success | dashboardUrl |
| CV unlocked | cv_unlocked | employerName, unlockedAt |
| Internship decision | internship_decision | decision, nextSteps |
| Subscription expiring | subscription_reminder | renewUrl, expiryDate |

## Current usage in code

- **onUserCreated** (Firestore trigger): sends `welcome` email after user document is created.
- Payment success and other events can call `sendEmail()` from `functions/lib/email.js` with the appropriate template key and variables.
