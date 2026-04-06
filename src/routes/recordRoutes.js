const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');
const { createRecord, getRecords, updateRecord, deleteRecord } = require('../controllers/recordController');
const { recordValidation } = require('../middleware/validationMiddleware');
const router = express.Router();

router.use(protect);

// Viewer can only GET
router.get('/', allowRoles('viewer', 'analyst', 'admin'), getRecords);


// Analyst & Admin can modify
router.post('/', allowRoles('analyst', 'admin'), recordValidation, createRecord);

router.put('/:id', allowRoles('analyst', 'admin'), recordValidation, updateRecord);

router.delete('/:id', allowRoles('analyst', 'admin'), deleteRecord);

module.exports = router;