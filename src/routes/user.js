const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

router.get('/dashboard', auth, userController.dashboard);
router.get('/transactions', auth, userController.transactionsPage);
router.get('/send-money', auth, userController.sendMoneyPage);
router.get('/search-users', auth, userController.searchUsers);

// Delete account routes
router.get('/delete-account', auth, userController.deleteAccountPage);
router.post('/delete-account', auth, userController.deleteAccount);

module.exports = router;