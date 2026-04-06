const { body, validationResult } = require('express-validator');

// General validation error handler (must accept next)
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next(); 
};

//  rules for registration
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['viewer', 'analyst', 'admin']).withMessage('Invalid role'),
  handleValidationErrors, 
];

// rules for financial records
const recordValidation = [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('category').notEmpty().withMessage('Category is required'),
  body('date').optional().isISO8601().toDate(),
  body('description').optional().trim(),
  handleValidationErrors,
];

module.exports = {
  registerValidation,
  recordValidation,
};