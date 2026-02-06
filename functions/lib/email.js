/**
 * Transactional email via SendGrid.
 * Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL in Firebase Functions config.
 * Templates: create in SendGrid Dashboard (Dynamic Templates) and set template IDs in EMAIL_TEMPLATES or pass templateId.
 */
const sgMail = require('@sendgrid/mail');

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com';
const fromName = process.env.SENDGRID_FROM_NAME || 'UK BPO Learning';

const TEMPLATE_IDS = {
  welcome: process.env.SENDGRID_TEMPLATE_WELCOME || 'd-welcome',
  payment_receipt: process.env.SENDGRID_TEMPLATE_PAYMENT_RECEIPT || 'd-payment-receipt',
  course_access: process.env.SENDGRID_TEMPLATE_COURSE_ACCESS || 'd-course-access',
  assessment_results: process.env.SENDGRID_TEMPLATE_ASSESSMENT_RESULTS || 'd-assessment-results',
  survey_job_seeking: process.env.SENDGRID_TEMPLATE_SURVEY || 'd-survey',
  reactivation_needed: process.env.SENDGRID_TEMPLATE_REACTIVATION_NEEDED || 'd-reactivation',
  reactivation_success: process.env.SENDGRID_TEMPLATE_REACTIVATION_SUCCESS || 'd-reactivation-success',
  cv_unlocked: process.env.SENDGRID_TEMPLATE_CV_UNLOCKED || 'd-cv-unlocked',
  internship_decision: process.env.SENDGRID_TEMPLATE_INTERNSHIP_DECISION || 'd-internship-decision',
  subscription_reminder: process.env.SENDGRID_TEMPLATE_SUBSCRIPTION_REMINDER || 'd-subscription-reminder'
};

/**
 * Send a transactional email using a SendGrid dynamic template.
 * @param {Object} opts
 * @param {string} opts.to - Recipient email
 * @param {string} opts.templateId - SendGrid template ID (or key from TEMPLATE_IDS)
 * @param {Object} opts.dynamicTemplateData - Variables for the template
 * @returns {Promise<void>}
 */
async function sendEmail({ to, templateId, dynamicTemplateData = {} }) {
  if (!apiKey) {
    console.log('SendGrid not configured (SENDGRID_API_KEY missing). Skip email:', to, templateId);
    return;
  }
  sgMail.setApiKey(apiKey);
  const id = TEMPLATE_IDS[templateId] || templateId;
  try {
    await sgMail.send({
      to,
      from: { email: fromEmail, name: fromName },
      templateId: id,
      dynamicTemplateData
    });
    console.log('Email sent to', to, 'template', id);
  } catch (err) {
    console.error('SendGrid error:', err.response?.body || err.message);
    throw err;
  }
}

module.exports = { sendEmail, TEMPLATE_IDS };
