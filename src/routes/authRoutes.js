const express = require('express');
const { register, login } = require('../controllers/authController');
const { registerValidation } = require('../middleware/validationMiddleware');
const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', login);

module.exports = router;