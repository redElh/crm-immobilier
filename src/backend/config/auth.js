import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  cookieExpires: parseInt(process.env.JWT_COOKIE_EXPIRES) || 90, // in days
};

export const generateToken = (payload) => {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });
};

export const setTokenCookie = (res, token) => {
  const cookieOptions = {
    expires: new Date(
      Date.now() + jwtConfig.cookieExpires * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
    sameSite: 'strict', // Prevent CSRF attacks
  };

  res.cookie('token', token, cookieOptions);
};

export const clearTokenCookie = (res) => {
  res.cookie('token', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
};