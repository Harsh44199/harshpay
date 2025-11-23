const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');

router.get('/register', authController.registerPage);
router.get('/login', authController.loginPage);

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('full_name').trim().notEmpty(),
  body('phone').optional().trim()
], authController.register);

router.post('/login', authController.login);
router.get('/logout', authController.logout);

module.exports = router;