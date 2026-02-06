import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

if (!serviceAccount) {
  console.error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required");
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

async function seed() {
  try {
    console.log("Starting seed...");

    // Create a course
    const courseRef = db.collection("courses").doc();
    const courseId = courseRef.id;

    await courseRef.set({
      title: "Introduction to UK BPO Operations",
      description:
        "Learn the fundamentals of UK Business Process Outsourcing operations, including best practices, compliance requirements, and industry standards.",
    });

    console.log(`Created course: ${courseId}`);

    // Create modules
    const modules = [
      {
        title: "Understanding BPO Fundamentals",
        order: 1,
        bunnyEmbedUrl:
          "https://iframe.mediadelivery.net/embed/12345/video-id-1", // Replace with actual Bunny embed URL
        mcq: [
          {
            id: "q1",
            question: "What does BPO stand for?",
            options: [
              "Business Process Outsourcing",
              "Business Product Operations",
              "Business Process Operations",
              "Business Product Outsourcing",
            ],
            correctAnswer: 0,
          },
          {
            id: "q2",
            question: "Which of the following is a key benefit of BPO?",
            options: [
              "Increased costs",
              "Reduced operational efficiency",
              "Cost savings and focus on core business",
              "Decreased scalability",
            ],
            correctAnswer: 2,
          },
          {
            id: "q3",
            question: "What is essential for successful BPO operations?",
            options: [
              "Poor communication",
              "Clear processes and communication",
              "No documentation",
              "Minimal oversight",
            ],
            correctAnswer: 1,
          },
        ],
      },
      {
        title: "UK Compliance and Regulations",
        order: 2,
        bunnyEmbedUrl:
          "https://iframe.mediadelivery.net/embed/12345/video-id-2", // Replace with actual Bunny embed URL
        mcq: [
          {
            id: "q1",
            question: "Which regulation governs data protection in the UK?",
            options: [
              "GDPR",
              "CCPA",
              "HIPAA",
              "SOX",
            ],
            correctAnswer: 0,
          },
          {
            id: "q2",
            question: "What is the maximum fine for GDPR violations?",
            options: [
              "€10 million",
              "€20 million or 4% of annual turnover",
              "€5 million",
              "€50 million",
            ],
            correctAnswer: 1,
          },
          {
            id: "q3",
            question: "When handling UK customer data, what is required?",
            options: [
              "No consent needed",
              "Explicit consent and proper data handling",
              "Only verbal consent",
              "Consent is optional",
            ],
            correctAnswer: 1,
          },
        ],
      },
      {
        title: "Customer Service Excellence",
        order: 3,
        bunnyEmbedUrl:
          "https://iframe.mediadelivery.net/embed/12345/video-id-3", // Replace with actual Bunny embed URL
        mcq: [
          {
            id: "q1",
            question: "What is the first step in excellent customer service?",
            options: [
              "Ignore customer concerns",
              "Listen actively to understand needs",
              "Assume customer requirements",
              "Respond slowly",
            ],
            correctAnswer: 1,
          },
          {
            id: "q2",
            question: "What should you do when a customer is upset?",
            options: [
              "Argue with them",
              "Empathize, apologize, and find a solution",
              "Transfer immediately",
              "Ignore the issue",
            ],
            correctAnswer: 1,
          },
          {
            id: "q3",
            question: "What is the goal of customer service?",
            options: [
              "Minimize interaction",
              "Resolve issues and ensure customer satisfaction",
              "End calls quickly",
              "Avoid follow-up",
            ],
            correctAnswer: 1,
          },
        ],
      },
    ];

    for (const module of modules) {
      const moduleRef = db
        .collection("courses")
        .doc(courseId)
        .collection("modules")
        .doc();
      await moduleRef.set(module);
      console.log(`Created module: ${moduleRef.id} - ${module.title}`);
    }

    console.log("Seed completed successfully!");
    console.log(`Course ID: ${courseId}`);
    console.log("You can now use this course ID in your application.");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
