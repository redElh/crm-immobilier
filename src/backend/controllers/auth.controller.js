import pool from '../config/db.js';
import { generateToken, setTokenCookie, clearTokenCookie } from '../config/auth.js';
import bcrypt from 'bcryptjs';
import { sendAgentWelcomeEmail } from '../services/email.service.js';

export const register = async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
    const { firstName, lastName, email, phone, password, role, is_active } = req.body;

    // Check if user exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await pool.query(
      `INSERT INTO users 
      (first_name, last_name, email, phone, password, role, is_active) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING id, first_name, last_name, email, role, is_active`,
      [firstName, lastName, email, phone, hashedPassword, role, is_active]
    );

    // Send welcome email with credentials
    try {
      await sendAgentWelcomeEmail({
        email,
        firstName,
        lastName,
        password, // Sending plain password only for initial setup
        loginLink: `${process.env.FRONTEND_URL}/auth/login`
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the registration if email fails
    }

    res.status(201).json({
      ...newUser.rows[0],
      message: 'Agent account created successfully. Notification email sent.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Simple validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND role = $2',
      [email, 'agent']
    );
    
    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if account is active
    if (!user.rows[0].is_active) {
      return res.status(403).json({ 
        error: 'Account disabled. Please contact your administrator.' 
      });
    }
    
    // Generate token
    const token = generateToken({
      id: user.rows[0].id,
      role: user.rows[0].role
    });
    
    // Set the token in an HTTP-only cookie
    setTokenCookie(res, token);
    
    // Don't return the password in the response
    const { password: _, ...userData } = user.rows[0];
    
    res.status(200).json({
      ...userData,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const logout = (req, res) => {
  clearTokenCookie(res);
  res.status(200).json({ message: 'Logged out successfully' });
};