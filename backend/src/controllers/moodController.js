const moodService = require('../services/moodService');

/**
 * Get today's mood entry for the authenticated user
 * @route GET /api/moods/today
 */
const getToday = async (req, res, next) => {
  try {
    const entry = await moodService.getTodayEntry(req.userId);
    res.status(200).json({
      success: true,
      data: entry
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent mood entries (latest 11 by default)
 * @route GET /api/moods/recent
 */
const getRecent = async (req, res, next) => {
  try {
    const limit = req.query.limit || 11;
    const entries = await moodService.getRecentEntries(req.userId, limit);
    res.status(200).json({
      success: true,
      data: entries
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get mood entry for a specific date
 * @route GET /api/moods/:date
 */
const getByDate = async (req, res, next) => {
  try {
    const entry = await moodService.getEntryByDate(req.userId, req.parsedDate);
    res.status(200).json({
      success: true,
      data: entry
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new mood entry
 * @route POST /api/moods
 */
const createEntry = async (req, res, next) => {
  try {
    const entry = await moodService.createMoodEntry(req.userId, req.sanitizedBody);
    res.status(201).json({
      success: true,
      message: 'Mood entry created successfully',
      data: entry
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing mood entry for a specific date
 * @route PUT /api/moods/:date
 */
const updateByDate = async (req, res, next) => {
  try {
    const updated = await moodService.updateMoodEntryByDate(
      req.userId,
      req.parsedDate,
      req.sanitizedBody
    );

    res.status(200).json({
      success: true,
      message: 'Mood entry updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a mood entry for a specific date
 * @route DELETE /api/moods/:date
 */
const deleteByDate = async (req, res, next) => {
  try {
    const result = await moodService.deleteMoodEntryByDate(req.userId, req.parsedDate);
    res.status(200).json({
      success: true,
      message: 'Mood entry deleted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get overview stats summary
 * @route GET /api/moods/summary
 */
const getSummary = async (req, res, next) => {
  try {
    const summary = await moodService.getMoodSummary(req.userId);
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getToday,
  getRecent,
  getByDate,
  createEntry,
  updateByDate,
  deleteByDate,
  getSummary
};
