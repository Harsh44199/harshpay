const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const adminController = require('../controllers/adminController');

router.get('/dashboard', auth, admin, adminController.dashboard);
router.get('/add-money', auth, admin, adminController.addMoneyPage);
router.post('/add-money', auth, admin, adminController.addMoney);
router.post('/delete-user', auth, admin, adminController.deleteUser);

module.exports = router;