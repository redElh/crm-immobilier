import pool from '../config/db.js';
import nodemailer from 'nodemailer';

export async function getNotifications(req, res) {
  try {
    const userId = req.query.user_id;
    const userName = req.query.user_name;
    if (!userId && !userName) {
      return res.status(400).json({ error: 'user_id or user_name is required' });
    }
    await pool.query(
      `DELETE FROM notifications
       WHERE is_read = TRUE AND read_at IS NOT NULL AND read_at < NOW() - INTERVAL '1 hour'`
    );
    let result;
    if (userId && userName) {
      result = await pool.query(
        `SELECT * FROM notifications
         WHERE (user_id = $1 OR user_id = $2)
           AND (is_read = FALSE OR read_at IS NULL OR read_at >= NOW() - INTERVAL '1 hour')
         ORDER BY created_at DESC`,
        [userId, userName]
      );
    } else {
      result = await pool.query(
        `SELECT * FROM notifications
         WHERE user_id = $1
           AND (is_read = FALSE OR read_at IS NULL OR read_at >= NOW() - INTERVAL '1 hour')
         ORDER BY created_at DESC`,
        [userId || userName]
      );
    }
    res.json(result.rows.map(row => ({
      id: String(row.id),
      userId: row.user_id,
      senderName: row.sender_name,
      type: row.type,
      message: row.message,
      propertyId: row.property_id,
      propertyRef: row.property_ref,
      read: row.is_read,
      createdAt: row.created_at,
    })));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createNotification(req, res) {
  try {
    const { userId, senderName, type, message, propertyId, propertyRef } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required' });
    }
    const result = await pool.query(
      `INSERT INTO notifications (user_id, sender_name, type, message, property_id, property_ref)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, senderName || '', type || 'property_assigned', message, propertyId || '', propertyRef || '']
    );
    res.status(201).json({
      id: String(result.rows[0].id),
      userId: result.rows[0].user_id,
      senderName: result.rows[0].sender_name,
      type: result.rows[0].type,
      message: result.rows[0].message,
      propertyId: result.rows[0].property_id,
      propertyRef: result.rows[0].property_ref,
      read: result.rows[0].is_read,
      createdAt: result.rows[0].created_at,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function sendAutomatorEmail(req, res) {
  try {
    const { to, subject, html, agentName, bienTitre } = req.body;
    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'to, subject and html are required' });
    }
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    await transporter.sendMail({
      from: `"Square Meter" <${process.env.EMAIL_FROM || 'noreply@squaremeter.ma'}>`,
      to,
      subject,
      html,
    });
    console.log(`[Automator] Email sent to ${to} (${agentName || 'N/A'}) - ${subject}`);
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending automator email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
}

export async function markAllAsRead(req, res) {
  try {
    const userId = req.query.user_id;
    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }
    await pool.query(
      `UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    res.json({ message: 'All marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
