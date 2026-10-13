const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const moodRoutes = require('./moodRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const reminderRoutes = require('./reminderRoutes');
const insightsRoutes = require('./insightsRoutes');
const exportRoutes = require('./exportRoutes');

const router = express.Router();

// Mount individual route modules
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/moods', moodRoutes);
router.use('/mood', moodRoutes); // Alias for backward compatibility
router.use('/analytics', analyticsRoutes);
router.use('/reminders', reminderRoutes);
router.use('/reminder', reminderRoutes); // Alias for backward compatibility
router.use('/insights', insightsRoutes);
router.use('/analytics/insights', insightsRoutes); // Alias
router.use('/export', exportRoutes);

module.exports = router;
