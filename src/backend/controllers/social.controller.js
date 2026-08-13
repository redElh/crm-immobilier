import bufferService from '../services/buffer.service.js';

export async function getProfiles(req, res, next) {
  try {
    const profiles = await bufferService.getProfiles();
    res.json({ success: true, data: profiles });
  } catch (err) {
    next(err);
  }
}

export async function createPost(req, res, next) {
  try {
    const { profileIds, text, mediaUrls, scheduledAt, postType, platform } = req.body;
    if (!profileIds || !profileIds.length || !text) {
      return res.status(400).json({ success: false, error: 'profileIds and text are required' });
    }
    const result = await bufferService.createUpdate({ profileIds, text, mediaUrls, scheduledAt, postType, platform });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getPostStatus(req, res, next) {
  try {
    const { updateId } = req.params;
    const result = await bufferService.getUpdate(updateId);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getProfileUpdates(req, res, next) {
  try {
    const { profileId } = req.params;
    const { limit, status } = req.query;
    const updates = await bufferService.getProfileUpdates(profileId, { limit, status });
    res.json({ success: true, data: updates });
  } catch (err) {
    next(err);
  }
}

export async function uploadMedia(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    const result = await bufferService.uploadMedia(req.file.buffer, req.file.originalname);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
