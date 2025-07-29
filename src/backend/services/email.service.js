import nodemailer from 'nodemailer';

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendAgentWelcomeEmail = async ({ email, firstName, lastName, password, loginLink }) => {
  const mailOptions = {
    from: `"Real Estate CRM" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Your Agent Account Credentials',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Our Real Estate CRM</h2>
        <p>Hello ${firstName} ${lastName},</p>
        <p>Your agent account has been created by the administrator.</p>
        
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Login Credentials:</strong></p>
          <p>Email: ${email}</p>
          <p>Password: ${password}</p>
        </div>
        
        <p>Please use these credentials to log in at:</p>
        <a href="${loginLink}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Login to Your Account
        </a>
        
        <p style="font-size: 0.9em; color: #6b7280;">
          For security reasons, we recommend changing your password after first login.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }

};