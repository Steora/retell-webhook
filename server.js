// VideoPlus Webhook Server - v4 (AWS EC2 Optimized)
import express from "express";
import nodemailer from "nodemailer";
import cors from 'cors';

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true })); 

// --- 1. CONFIGURATION ---
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "soumik@steorasystems.com";
const PORT = process.env.PORT || 8080;

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER || "soumik@steorasystems.com",
    pass: process.env.GMAIL_APP_PASSWORD || "pras txtc bbga jsgl",
  },
  // Optimized settings for cloud hosting
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  port: 587,
  secure: false,
  tls: {
    rejectUnauthorized: false
  }
});

// --- 2. HEALTH CHECK ENDPOINT ---
app.get("/", (req, res) => {
  res.json({
    status: "healthy",
    service: "VideoPlus Webhook Server",
    version: "4.0",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// --- 3. WEBHOOK ENDPOINT ---
app.post("/retell-webhook", async (req, res) => {
  try {
    const { name, args } = req.body;
    console.log(`\n🔹 Function Triggered: ${name}`);

    let responseMessage = "";

    switch (name) {
      // CASE 1: COMPLEX ORDER FORM
      case "submit_videoplus_order":
        // A. Send Confirmation to User
        await sendEmail({
          to: args.ordering_party_email,
          subject: `Order Confirmation: ${args.style_of_cause}`,
          html: getUserOrderTemplate(args), // See template below
        });

        // B. Send Alert to Admin
        await sendEmail({
          to: ADMIN_EMAIL,
          subject: `NEW ORDER: ${args.style_of_cause}`,
          html: getAdminOrderTemplate(args), // See template below
        });

        responseMessage = `I have emailed the order confirmation to ${args.ordering_party_email}.`;
        break;

      // CASE 2: SEND WEBSITE LINK
      case "send_website_link":
        await sendEmail({
          to: args.email,
          subject: "Here is the link you requested",
          html: `<p>Hi there,</p><p>Here is the link to our website: <a href="https://yourwebsite.com">Click Here</a></p>`,
        });
        responseMessage = "I have sent the website link to your email.";
        break;

      // CASE 3: SUPPORT TICKET
      case "send_support_ticket":
        await sendEmail({
          to: ADMIN_EMAIL,
          subject: `URGENT SUPPORT TICKET: ${args.user_name}`,
          html: `<h2>New Support Request</h2>
                 <p><strong>User:</strong> ${args.user_name} (${args.user_email})</p>
                 <p><strong>Issue:</strong> ${args.issue_details}</p>`,
        });
        responseMessage = "I've created a support ticket. Our team has been notified.";
        break;

      case "end_call":
        responseMessage = "Goodbye.";
        break;

      default:
        responseMessage = "Function execution failed.";
    }

    res.json({ result: responseMessage });

  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- 3. HELPER FUNCTIONS ---

// Generic Send Wrapper
async function sendEmail({ to, subject, html }) {
  try {
    // Verify SMTP connection before sending
    await transporter.verify();
    console.log('✅ SMTP connection verified');
    
    const info = await transporter.sendMail({
      from: '"VideoPlus Court Transcription" <soumik@steorasystems.com>',
      to: to,
      subject: subject,
      html: html,
    });
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    console.error('Error code:', error.code);
    
    // Provide helpful error messages
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
      console.error('⚠️ SMTP connection timeout - Your hosting provider may be blocking SMTP ports');
      console.error('💡 Solution: Use SendGrid, Mailgun, or AWS SES instead of Gmail SMTP');
    }
    
    throw error; // Re-throw to be caught by the route handler
  }
}

// --- 4. HTML TEMPLATES (DESIGN YOUR EMAILS HERE) ---

function getUserOrderTemplate(data) {
 
  return `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5;">
      <h2 style="background-color: #d35400; color: white; padding: 10px;">New Transcript Order </h2>
      
      <h3 style="border-bottom: 2px solid #ddd; padding-bottom: 5px;">Ordering Party</h3>
      <table style="width: 100%; margin-bottom: 15px;">
        <tr><td style="width: 180px;"><strong>Name:</strong></td><td>${val(data.ordering_party_name)}</td></tr>
        <tr><td><strong>Email:</strong></td><td>${val(data.ordering_party_email)}</td></tr>
        <tr><td><strong>Phone:</strong></td><td>${val(data.ordering_party_phone)}</td></tr>
        <tr><td><strong>Relationship to Case:</strong></td><td>${val(data.ordering_party_relationship)}</td></tr>
        <tr><td><strong>Returning Customer:</strong></td><td>${val(data.returning_customer)}</td></tr>
      </table>

      <h3 style="border-bottom: 2px solid #ddd; padding-bottom: 5px;">⚖️ Case Information</h3>
      <table style="width: 100%; margin-bottom: 15px;">
        <tr><td style="width: 180px;"><strong>Style of Cause (Case Name):</strong></td><td>${val(data.style_of_cause)}</td></tr>
        <tr><td><strong>File Number:</strong></td><td>${val(data.court_file_number)}</td></tr>
        <tr><td><strong>Location:</strong></td><td>${val(data.court_location)}</td></tr>
        <tr><td><strong>Court Type:</strong></td><td>${val(data.court_type)}</td></tr>
        <tr><td><strong>Judge / Justice:</strong></td><td>${val(data.judge_name)}</td></tr>
        <tr><td><strong>Courtroom Number:</strong></td><td>${val(data.courtroom_number)}</td></tr>
        <tr><td><strong>Proceeding Dates:</strong></td><td>${val(data.proceeding_dates)}</td></tr>
      </table>

      <h3 style="border-bottom: 2px solid #ddd; padding-bottom: 5px;">Case Characteristics</h3>
      <table style="width: 100%; margin-bottom: 15px;">
        <tr><td style="width: 180px;"><strong>Is Appeal?</strong></td><td>${val(data.is_appeal)}</td></tr>
        <tr><td><strong>Is Legal Aid?</strong></td><td>${val(data.is_legal_aid)}</td></tr>
      </table>

      <h3 style="border-bottom: 2px solid #ddd; padding-bottom: 5px;">Transcript Request</h3>
      <table style="width: 100%; margin-bottom: 15px;">
        <tr><td style="width: 180px;"><strong>Content Type:</strong></td><td>${val(data.content_type)}</td></tr>
        <tr><td><strong>Description (if excerpts):</strong></td><td>${val(data.content_description)}</td></tr>
      </table>

      <h3 style="border-bottom: 2px solid #ddd; padding-bottom: 5px;">Delivery & Options</h3>
      <table style="width: 100%; margin-bottom: 15px;">
        <tr><td style="width: 180px;"><strong>Due Date:</strong></td><td><strong>${val(data.due_date)}</strong></td></tr>
        <tr><td><strong>Expedited Service:</strong></td><td style="color: ${data.expedited_service === 'yes' ? 'red' : 'inherit'}; font-weight: bold;">${val(data.expedited_service)}</td></tr>
        <tr><td><strong>Delivery Format:</strong></td><td>${val(data.delivery_format)}</td></tr>
        <tr><td><strong>Quote Required?</strong></td><td>${val(data.quote_required)}</td></tr>
        <tr><td><strong>Email Completed Form?</strong></td><td>${val(data.email_completed_form)}</td></tr>
      </table>
      
      <p style="font-size: 12px; color: #777; margin-top: 20px;">Generated automatically by Retell AI Webhook.</p>
    </div>
  `;
}

// function getAdminOrderTemplate(data) {
//   return `
//     <div style="font-family: Arial, sans-serif;">
//       <h2 style="color: #d35400;">⚠️ New Order Submitted via Voice AI</h2>
//       <ul>
//         <li><strong>Client:</strong> ${data.ordering_party_name}</li>
//         <li><strong>Email:</strong> ${data.ordering_party_email}</li>
//         <li><strong>Phone:</strong> ${data.ordering_party_phone}</li>
//         <li><strong>Returning Customer:</strong> ${data.returning_customer}</li>
//       </ul>
//       <hr>
//       <h3>Case Details</h3>
//       <ul>
//         <li><strong>Case Name:</strong> ${data.style_of_cause}</li>
//         <li><strong>File #:</strong> ${data.court_file_number}</li>
//         <li><strong>Location:</strong> ${data.court_location} (${data.court_type})</li>
//         <li><strong>Judge:</strong> ${data.judge_name}</li>
//         <li><strong>Dates:</strong> ${data.proceeding_dates}</li>
//       </ul>
//       <hr>
//       <h3>Order Specs</h3>
//       <ul>
//         <li><strong>Due Date:</strong> ${data.due_date}</li>
//         <li><strong>Expedited:</strong> ${data.expedited_service}</li>
//         <li><strong>Content:</strong> ${data.content_type}</li>
//         <li><strong>Description:</strong> ${data.content_description}</li>
//       </ul>
//     </div>
//   `;
// }


function getAdminOrderTemplate(data) {
  // Helper to handle optional/missing fields cleanly
  const val = (v) => (v ? v : '<span style="color:#999;">(Not provided)</span>');

  return `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5;">
      <h2 style="background-color: #d35400; color: white; padding: 10px;">New Transcript Order </h2>
      
      <h3 style="border-bottom: 2px solid #ddd; padding-bottom: 5px;">Ordering Party</h3>
      <table style="width: 100%; margin-bottom: 15px;">
        <tr><td style="width: 180px;"><strong>Name:</strong></td><td>${val(data.ordering_party_name)}</td></tr>
        <tr><td><strong>Email:</strong></td><td>${val(data.ordering_party_email)}</td></tr>
        <tr><td><strong>Phone:</strong></td><td>${val(data.ordering_party_phone)}</td></tr>
        <tr><td><strong>Relationship to Case:</strong></td><td>${val(data.ordering_party_relationship)}</td></tr>
        <tr><td><strong>Returning Customer:</strong></td><td>${val(data.returning_customer)}</td></tr>
      </table>

      <h3 style="border-bottom: 2px solid #ddd; padding-bottom: 5px;">⚖️ Case Information</h3>
      <table style="width: 100%; margin-bottom: 15px;">
        <tr><td style="width: 180px;"><strong>Style of Cause (Case Name):</strong></td><td>${val(data.style_of_cause)}</td></tr>
        <tr><td><strong>File Number:</strong></td><td>${val(data.court_file_number)}</td></tr>
        <tr><td><strong>Location:</strong></td><td>${val(data.court_location)}</td></tr>
        <tr><td><strong>Court Type:</strong></td><td>${val(data.court_type)}</td></tr>
        <tr><td><strong>Judge / Justice:</strong></td><td>${val(data.judge_name)}</td></tr>
        <tr><td><strong>Courtroom Number:</strong></td><td>${val(data.courtroom_number)}</td></tr>
        <tr><td><strong>Proceeding Dates:</strong></td><td>${val(data.proceeding_dates)}</td></tr>
      </table>

      <h3 style="border-bottom: 2px solid #ddd; padding-bottom: 5px;">Case Characteristics</h3>
      <table style="width: 100%; margin-bottom: 15px;">
        <tr><td style="width: 180px;"><strong>Is Appeal?</strong></td><td>${val(data.is_appeal)}</td></tr>
        <tr><td><strong>Is Legal Aid?</strong></td><td>${val(data.is_legal_aid)}</td></tr>
      </table>

      <h3 style="border-bottom: 2px solid #ddd; padding-bottom: 5px;">Transcript Request</h3>
      <table style="width: 100%; margin-bottom: 15px;">
        <tr><td style="width: 180px;"><strong>Content Type:</strong></td><td>${val(data.content_type)}</td></tr>
        <tr><td><strong>Description (if excerpts):</strong></td><td>${val(data.content_description)}</td></tr>
      </table>

      <h3 style="border-bottom: 2px solid #ddd; padding-bottom: 5px;">Delivery & Options</h3>
      <table style="width: 100%; margin-bottom: 15px;">
        <tr><td style="width: 180px;"><strong>Due Date:</strong></td><td><strong>${val(data.due_date)}</strong></td></tr>
        <tr><td><strong>Expedited Service:</strong></td><td style="color: ${data.expedited_service === 'yes' ? 'red' : 'inherit'}; font-weight: bold;">${val(data.expedited_service)}</td></tr>
        <tr><td><strong>Delivery Format:</strong></td><td>${val(data.delivery_format)}</td></tr>
        <tr><td><strong>Quote Required?</strong></td><td>${val(data.quote_required)}</td></tr>
        <tr><td><strong>Email Completed Form?</strong></td><td>${val(data.email_completed_form)}</td></tr>
      </table>
      
      <p style="font-size: 12px; color: #777; margin-top: 20px;">Generated automatically by Retell AI Webhook.</p>
    </div>
  `;
}


// --- 5. START SERVER ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ VideoPlus Webhook Server`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📧 Admin email: ${ADMIN_EMAIL}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
});