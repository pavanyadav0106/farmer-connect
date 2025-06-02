const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

// Configure Nodemailer with your email provider
const transporter = nodemailer.createTransport({
  service: "gmail", // Change if using another service
  auth: {
    user: "your-email@gmail.com",
    pass: "your-email-password",
  },
});

// Function to generate OTP
exports.sendOtpEmail = functions.https.onCall(async (data, context) => {
  const email = data.email;
  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
  const expiresAt = Date.now() + 5 * 60 * 1000; // OTP expires in 5 minutes

  // Store OTP in Firestore
  await db.collection("otps").doc(email).set({
    otp,
    expiresAt,
  });

  // Send email
  const mailOptions = {
    from: "your-email@gmail.com",
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
  };

  await transporter.sendMail(mailOptions);
  return { success: true, message: "OTP sent to email" };
});
