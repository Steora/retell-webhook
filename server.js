// VideoPlus Webhook Server - v4 (AWS EC2 Optimized)
import express from "express";
import nodemailer from "nodemailer";
import cors from 'cors';

// Initialize Express app
const app = express();

// CORS Configuration - Handle preflight requests
const corsOptions = {
  origin: '*', // Allow all origins (or specify: ['http://localhost:3000', 'https://yourdomain.com'])
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions)); // This handles all CORS requests including preflight
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

// Handle preflight request for webhook
app.options("/retell-webhook", cors(corsOptions));

app.post("/retell-webhook", async (req, res) => {
  try {
    let { name, args } = req.body;

    // Normalize args: Retell may send as object, string, or nested under .parameters
    if (typeof args === 'string') {
      try {
        args = JSON.parse(args);
      } catch (e) {
        console.warn('⚠️ Could not parse args as JSON:', e.message);
        args = {};
      }
    }
    args = args && typeof args === 'object' ? args : {};
    // Some flows send parameters nested
    if (args.parameters && typeof args.parameters === 'object') {
      args = args.parameters;
    }
    // If args is still empty, try using top-level body keys (excluding name and call)
    if (Object.keys(args).length === 0 && req.body && typeof req.body === 'object') {
      const { name: _n, call: _c, args: _a, ...rest } = req.body;
      if (Object.keys(rest).length > 0) {
        args = rest;
        console.log('📦 Using top-level body as args');
      }
    }

    console.log(`\n🔹 Function Triggered: ${name}`);
    console.log(`📦 Args keys:`, Object.keys(args));
    console.log(`📦 Args:`, JSON.stringify(args, null, 2));

    // Validate request body
    if (!name) {
      return res.status(400).json({ error: "Missing 'name' field in request body" });
    }

    let responseMessage = "";

    switch (name) {
      // CASE 1: COMPLEX ORDER FORM
      case "submit_videoplus_order":
        try {
          // A. Send Confirmation to User
          if (args.ordering_party_email) {
            await sendEmail({
              to: args.ordering_party_email,
              subject: `Order Confirmation: ${args.style_of_cause || 'New Order'}`,
              html: getUserOrderTemplate(args),
            });
          }

          // B. Send Alert to Admin
          await sendEmail({
            to: ADMIN_EMAIL,
            subject: `NEW ORDER: ${args.style_of_cause || 'New Order'}`,
            html: getAdminOrderTemplate(args),
          });

          responseMessage = args.ordering_party_email 
            ? `I have emailed the order confirmation to ${args.ordering_party_email}.`
            : "Order has been received and processed.";
        } catch (emailError) {
          console.error("Error in submit_videoplus_order:", emailError);
          // Still return success message even if email fails
          responseMessage = "Order has been received. We'll process it shortly.";
        }
        break;

      // CASE 2: SEND WEBSITE LINK
      case "send_website_link":
        try {
          if (!args.email) {
            responseMessage = "Email address is required to send the link.";
          } else {
            await sendEmail({
              to: args.email,
              subject: "Here is the link you requested",
              html: `<p>Hi there,</p><p>Here is the link to our website: <a href="https://myvponline.com">Click Here</a></p>`,
            });
            responseMessage = "I have sent the website link to your email.";
          }
        } catch (emailError) {
          console.error("Error in send_website_link:", emailError);
          responseMessage = "I encountered an issue sending the email, but here's the link: https://myvponline.com";
        }
        break;

      // CASE 3: SUPPORT TICKET
      case "send_support_ticket":
        try {
          await sendEmail({
            to: ADMIN_EMAIL,
            subject: `URGENT SUPPORT TICKET: ${args.user_name || 'Unknown User'}`,
            html: `<h2>New Support Request</h2>
                   <p><strong>User:</strong> ${args.user_name || 'Unknown'} (${args.user_email || 'No email'})</p>
                   <p><strong>Issue:</strong> ${args.issue_details || 'No details provided'}</p>`,
          });
          responseMessage = "I've created a support ticket. Our team has been notified.";
        } catch (emailError) {
          console.error("Error in send_support_ticket:", emailError);
          responseMessage = "I've logged your support request. Our team will be in touch soon.";
        }
        break;

      case "end_call":
        responseMessage = "Goodbye.";
        break;

      default:
        console.warn(`⚠️ Unknown function name: ${name}`);
        responseMessage = "Function execution failed.";
    }

    res.json({ result: responseMessage });

  } catch (error) {
    console.error("❌ Error in webhook handler:", error);
    console.error("Error stack:", error.stack);
    // Always return a response - don't leave the request hanging
    res.status(500).json({ 
      error: "Internal Server Error",
      message: error.message 
    });
  }
});

// --- 3. HELPER FUNCTIONS ---

// Generic Send Wrapper
async function sendEmail({ to, subject, html }) {
  try {
    // Skip verification to avoid connection issues - just send directly
    // Verification can timeout and cause server crashes
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
  data = data || {};
  // Helper to handle optional/missing fields cleanly
  const val = (v) => (v !== undefined && v !== null && v !== '' ? String(v) : '<span style="color:#999;">(Not provided)</span>');

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
        <tr><td><strong>Appeal Type:</strong></td><td>${val(data.appeal_type)}</td></tr>
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
  data = data || {};
  // Helper to handle optional/missing fields cleanly
  const val = (v) => (v !== undefined && v !== null && v !== '' ? String(v) : '<span style="color:#999;">(Not provided)</span>');

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
        <tr><td><strong>Appeal Type:</strong></td><td>${val(data.appeal_type)}</td></tr>
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


// --- 5. ERROR HANDLING ---
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process - keep the server running
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit the process - keep the server running
});

// Handle SIGTERM and SIGINT for graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// --- 6. START SERVER ---
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ VideoPlus Webhook Server`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📧 Admin email: ${ADMIN_EMAIL}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', error);
  }
});