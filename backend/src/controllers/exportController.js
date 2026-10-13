const exportService = require('../services/exportService');

/**
 * Helper to build an export filename based on the current date
 * @param {string} extension
 * @returns {string}
 */
const getExportFilename = (extension) => {
  const todayStr = new Date().toISOString().split('T')[0];
  return `moodtrack-export-${todayStr}.${extension}`;
};

/**
 * Export authenticated user's mood entries as JSON
 * GET /api/export/json
 */
const exportJson = async (req, res, next) => {
  try {
    const entries = await exportService.getUserMoodEntries(req.userId);
    const jsonPayload = exportService.formatJsonExport(entries);

    const filename = getExportFilename('json');

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(JSON.stringify(jsonPayload, null, 2));
  } catch (error) {
    next(error);
  }
};

/**
 * Export authenticated user's mood entries as CSV
 * GET /api/export/csv
 */
const exportCsv = async (req, res, next) => {
  try {
    const entries = await exportService.getUserMoodEntries(req.userId);
    const csvPayload = exportService.formatCsvExport(entries);

    const filename = getExportFilename('csv');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvPayload);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  exportJson,
  exportCsv
};
