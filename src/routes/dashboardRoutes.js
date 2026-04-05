const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');
const { getSummary } = require('../controllers/dashboardController');
const router = express.Router();

router.get('/', protect, allowRoles('viewer', 'analyst', 'admin'), getSummary);

module.exports = router;