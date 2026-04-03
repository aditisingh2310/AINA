const express = require('express');
const {
  getDashboardStats,
  getAllIncidents,
  getIncidentPatterns,
  getSOSAlerts,
  refreshStats
} = require('../controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// All admin routes require authentication
router.use(authenticate);

// Dashboard stats
router.get('/stats', getDashboardStats);

// All incidents for map view
router.get('/incidents', getAllIncidents);

// Incident patterns and trends
router.get('/patterns', getIncidentPatterns);

// SOS alerts
router.get('/sos-alerts', getSOSAlerts);

// Force refresh stats
router.post('/refresh-stats', refreshStats);

module.exports = router;