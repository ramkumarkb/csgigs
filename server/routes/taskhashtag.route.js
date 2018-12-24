const express = require('express');
const router = express.Router();

const taskhashtag_controller = require('../controllers/taskhashtag.controller');

router.get('/', taskhashtag_controller.taskhashtags_details);
router.post('/create', taskhashtag_controller.taskhashtag_create);

module.exports = router;
