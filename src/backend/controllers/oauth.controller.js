import pool from '../config/db.js';
import { generateToken, setTokenCookie, generateRefreshToken, getRefreshTokenExpiry } from '../config/auth.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export const googleAuth = (req, res) => {
  console.log('[OAuth] Google auth initiated');
  const redirectUri = `${BACKEND_URL}/auth/google/callback`;
  const clientId = process.env.GOOGLE_CLIENT_ID;

  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('email profile')}&access_type=offline`;

  console.log('[OAuth] Redirecting to Google with redirect_uri:', redirectUri);
  res.redirect(url);
};

export const googleCallback = async (req, res) => {
  try {
    console.log('[OAuth] Google callback received');
    const { code } = req.query;
    if (!code) return res.redirect(`${FRONTEND_URL}/auth/login?error=oauth_failed`);

    const redirectUri = `${BACKEND_URL}/auth/google/callback`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) return res.redirect(`${FRONTEND_URL}/auth/login?error=oauth_failed`);

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userResponse.json();

    if (!userData.email) return res.redirect(`${FRONTEND_URL}/auth/login?error=no_email`);

    let user = await pool.query('SELECT * FROM users WHERE email = $1', [userData.email]);
    console.log('[OAuth] User exists:', user.rows.length > 0);

    if (user.rows.length === 0) {
      console.log('[OAuth] Creating new user with role admin');
      const nameParts = (userData.name || userData.email.split('@')[0]).split(' ');
      const newUser = await pool.query(
        `INSERT INTO users (first_name, last_name, email, password, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, first_name, last_name, email, role`,
        [nameParts[0] || 'User', nameParts.slice(1).join(' ') || 'Google', userData.email, '', 'admin', true]
      );
      user = newUser;
    } else {
      console.log('[OAuth] Updating existing user role to admin, old role:', user.rows[0].role);
      const updatedUser = await pool.query(
        `UPDATE users SET role = 'admin', reset_token = NULL, reset_token_expires = NULL WHERE id = $1
         RETURNING id, first_name, last_name, email, role`,
        [user.rows[0].id]
      );
      user = updatedUser;
    }

    console.log('[OAuth] User role after:', user.rows[0].role);
    console.log('[OAuth] Redirecting to:', `${FRONTEND_URL}/admin?oauth=success&provider=google`);

    // Generate and store refresh token
    const refreshToken = generateRefreshToken();
    await pool.query(
      'UPDATE users SET refresh_token = $1, refresh_token_expires = $2 WHERE id = $3',
      [refreshToken, getRefreshTokenExpiry(), user.rows[0].id]
    );

    const token = generateToken({ id: user.rows[0].id, role: user.rows[0].role });
    setTokenCookie(res, token);

    res.redirect(`${FRONTEND_URL}/admin?oauth=success&provider=google#token=${token}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`${FRONTEND_URL}/auth/login?error=oauth_error`);
  }
};

export const facebookAuth = (req, res) => {
  console.log('[OAuth] Facebook auth initiated');
  const redirectUri = `${BACKEND_URL}/auth/facebook/callback`;
  const clientId = process.env.FACEBOOK_CLIENT_ID;

  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('email,public_profile')}`;

  console.log('[OAuth] Redirecting to Facebook with redirect_uri:', redirectUri);
  res.redirect(url);
};

export const facebookCallback = async (req, res) => {
  try {
    console.log('[OAuth] Facebook callback received');
    const { code } = req.query;
    if (!code) return res.redirect(`${FRONTEND_URL}/auth/login?error=oauth_failed`);

    const redirectUri = `${BACKEND_URL}/auth/facebook/callback`;

    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.FACEBOOK_CLIENT_ID}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`;
    const tokenResponse = await fetch(tokenUrl);

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) return res.redirect(`${FRONTEND_URL}/auth/login?error=oauth_failed`);

    const userResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${tokenData.access_token}`
    );
    const userData = await userResponse.json();

    const email = userData.email || `${userData.id}@facebook.com`;

    let user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log('[OAuth] Facebook user exists:', user.rows.length > 0);

    if (user.rows.length === 0) {
      console.log('[OAuth] Creating new Facebook user with role admin');
      const nameParts = (userData.name || 'Facebook User').split(' ');
      const newUser = await pool.query(
        `INSERT INTO users (first_name, last_name, email, password, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, first_name, last_name, email, role`,
        [nameParts[0] || 'User', nameParts.slice(1).join(' ') || 'Facebook', email, '', 'admin', true]
      );
      user = newUser;
    } else {
      console.log('[OAuth] Updating existing Facebook user role to admin, old role:', user.rows[0].role);
      const updatedUser = await pool.query(
        `UPDATE users SET role = 'admin', reset_token = NULL, reset_token_expires = NULL WHERE id = $1
         RETURNING id, first_name, last_name, email, role`,
        [user.rows[0].id]
      );
      user = updatedUser;
    }

    console.log('[OAuth] Facebook user role after:', user.rows[0].role);
    console.log('[OAuth] Redirecting to:', `${FRONTEND_URL}/admin?oauth=success&provider=facebook`);

    // Generate and store refresh token
    const refreshToken = generateRefreshToken();
    await pool.query(
      'UPDATE users SET refresh_token = $1, refresh_token_expires = $2 WHERE id = $3',
      [refreshToken, getRefreshTokenExpiry(), user.rows[0].id]
    );

    const token = generateToken({ id: user.rows[0].id, role: user.rows[0].role });
    setTokenCookie(res, token);

    res.redirect(`${FRONTEND_URL}/admin?oauth=success&provider=facebook#token=${token}`);
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    res.redirect(`${FRONTEND_URL}/auth/login?error=oauth_error`);
  }
};
