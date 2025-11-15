const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Use environment variables for email configuration
  // For development, you can use Gmail or other SMTP services
  // For production, use a proper email service like SendGrid, AWS SES, etc.
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
    }
  });

  return transporter;
};

// Send approval email with contract PDF
const sendApprovalEmail = async (customerEmail, customerName, request, contract, pdfBuffer) => {
  try {
    const transporter = createTransporter();
    
    // Generate contract confirmation link with email verification
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    // Include email in query string for verification (optional - can be used for public access)
    const emailParam = customerEmail ? `?email=${encodeURIComponent(customerEmail)}` : '';
    const contractConfirmationLink = `${frontendUrl}/contracts/${contract._id}${emailParam}`;
    
    const mailOptions = {
      from: `"Moving Service" <${process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@movingservice.com'}>`,
      to: customerEmail,
      subject: `✅ Request Approved - Contract #${contract.contractId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 14px 28px; background: #4caf50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; font-size: 16px; text-align: center; }
            .button:hover { background: #45a049; }
            .button-container { text-align: center; margin: 30px 0; }
            .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #4caf50; }
            .highlight-box { background: #e8f5e9; padding: 20px; margin: 20px 0; border-radius: 5px; border: 2px solid #4caf50; text-align: center; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Request Approved!</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              
              <p>We are pleased to inform you that your moving request <strong>#${request.requestId}</strong> has been <strong>approved</strong>!</p>
              
              <div class="info-box">
                <h3>📋 Contract Details</h3>
                <p><strong>Contract ID:</strong> ${contract.contractId}</p>
                <p><strong>Service Type:</strong> ${contract.moveDetails?.serviceType || 'N/A'}</p>
                <p><strong>Move Date:</strong> ${new Date(contract.moveDetails?.moveDate).toLocaleDateString()}</p>
                <p><strong>Total Price:</strong> ${contract.pricing?.totalPrice?.toLocaleString('vi-VN') || '0'} VND</p>
              </div>
              
              <p>Please find attached the contract document containing:</p>
              <ul>
                <li>Complete terms and conditions</li>
                <li>Policies and liability coverage</li>
                <li>List of items for transportation</li>
                <li>Payment details and schedule</li>
              </ul>
              
              <div class="highlight-box">
                <h3 style="margin-top: 0; color: #2e7d32;">📝 Confirm Your Contract</h3>
                <p style="margin-bottom: 20px;">Please review and confirm your contract by clicking the button below:</p>
                <div class="button-container">
                  <a href="${contractConfirmationLink}" class="button">
                    ✅ Confirm Contract
                  </a>
                </div>
                <p style="font-size: 12px; color: #666; margin-top: 15px; margin-bottom: 0;">
                  Or copy and paste this link into your browser:<br>
                  <a href="${contractConfirmationLink}" style="color: #4caf50; word-break: break-all;">${contractConfirmationLink}</a>
                </p>
              </div>
              
              <p>Please review the contract carefully before confirming. If you have any questions or concerns, please contact our customer support team.</p>
              
              <div class="info-box">
                <h3>📞 Contact Information</h3>
                <p><strong>Phone:</strong> ${process.env.SUPPORT_PHONE || '1900-XXXX'}</p>
                <p><strong>Email:</strong> ${process.env.SUPPORT_EMAIL || 'support@movingservice.com'}</p>
                <p><strong>Business Hours:</strong> Monday - Friday, 8:00 AM - 6:00 PM</p>
              </div>
              
              <p>Thank you for choosing our moving service!</p>
              
              <p>Best regards,<br>
              Moving Service Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `Contract_${contract.contractId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Approval email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending approval email:', error);
    throw error;
  }
};

// Send rejection email
const sendRejectionEmail = async (customerEmail, customerName, request, rejectionReason) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Moving Service" <${process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@movingservice.com'}>`,
      to: customerEmail,
      subject: `❌ Request Status Update - Request #${request.requestId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #f44336; }
            .support-box { background: #e3f2fd; padding: 20px; margin: 20px 0; border-radius: 5px; border: 2px solid #2196f3; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Request Status Update</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              
              <p>We regret to inform you that your moving request <strong>#${request.requestId}</strong> has been <strong>denied</strong>.</p>
              
              <div class="info-box">
                <h3>📋 Request Details</h3>
                <p><strong>Request ID:</strong> ${request.requestId}</p>
                <p><strong>From:</strong> ${request.moveDetails?.fromAddress || 'N/A'}</p>
                <p><strong>To:</strong> ${request.moveDetails?.toAddress || 'N/A'}</p>
                <p><strong>Move Date:</strong> ${new Date(request.moveDetails?.moveDate).toLocaleDateString()}</p>
              </div>
              
              <div class="info-box">
                <h3>❌ Reason for Denial</h3>
                <p>${rejectionReason || 'No specific reason provided.'}</p>
              </div>
              
              <p>We understand this may be disappointing. If you believe this decision was made in error, or if you would like to discuss alternative options, please contact our customer support team.</p>
              
              <div class="support-box">
                <h3>📞 Contact Customer Support</h3>
                <p>Our team is here to help you:</p>
                <ul>
                  <li><strong>Phone:</strong> ${process.env.SUPPORT_PHONE || '1900-XXXX'}</li>
                  <li><strong>Email:</strong> ${process.env.SUPPORT_EMAIL || 'support@movingservice.com'}</li>
                  <li><strong>Business Hours:</strong> Monday - Friday, 8:00 AM - 6:00 PM</li>
                </ul>
                <p>You can also visit our office at:</p>
                <p>${process.env.SUPPORT_ADDRESS || '123 Main Street, City, Country'}</p>
              </div>
              
              <p>We appreciate your understanding and look forward to serving you in the future.</p>
              
              <p>Best regards,<br>
              Moving Service Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Rejection email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending rejection email:', error);
    throw error;
  }
};

module.exports = {
  sendApprovalEmail,
  sendRejectionEmail,
  createTransporter
};

