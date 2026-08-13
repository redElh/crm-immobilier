import { getLoginHistory, getLoginHistoryCount, cleanupOldHistory } from '../services/login-history.service.js';

export const listLoginHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    // Cleanup old entries older than 90 days
    await cleanupOldHistory(90);

    const history = await getLoginHistory(req.user.id, limit, offset);
    const total = await getLoginHistoryCount(req.user.id);

    res.status(200).json({ history, total, limit, offset });
  } catch (error) {
    console.error('List login history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
