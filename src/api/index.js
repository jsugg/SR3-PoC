// API routes if needed
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Some sample stuff
router.post('/users', 
  body('username').isEmail(),
  body('password').isLength({ min: 5 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
});

module.exports = router;
