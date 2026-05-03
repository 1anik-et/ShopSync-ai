const express = require('express');
const chatController = require('../controllers/chatController');

const router = express.Router();

router.get('/history', chatController.getHistory);
router.post('/', chatController.sendMessage);
router.delete('/', chatController.clearHistory);

module.exports = router;
