const nodemailer = require('nodemailer');

const nodemailer = require('nodemailer');

// Use different SMTP configuration that works better with hosting platforms
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendOTP = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"ZingChat" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your ZingChat OTP Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #25d366, #128c7e); padding: 20px; border-radius: 10px 10px 0 0; color: white; text-align: center;">
            <h1 style="margin: 0;">💬 ZingChat</h1>
          </div>
          <div style="background: #f5f5f5; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Email Verification</h2>
            <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
              Your OTP verification code is:
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="color: #25d366; letter-spacing: 5px; margin: 0; font-size: 32px;">${otp}</h1>
            </div>
            <p style="color: #999; font-size: 14px; margin-top: 20px;">
              This code will expire in 10 minutes.
            </p>
            <p style="color: #999; font-size: 14px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Email send error:', error);
    
    // If Gmail fails, try with a simpler configuration
    try {
      const simpleTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
      
      await simpleTransporter.sendMail(mailOptions);
      return { success: true, message: 'OTP sent successfully (fallback)' };
    } catch (fallbackError) {
      console.error('Fallback email error:', fallbackError);
      return { success: false, message: `Email service unavailable: ${error.message}` };
    }
  }
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = { sendOTP, generateOTP };
