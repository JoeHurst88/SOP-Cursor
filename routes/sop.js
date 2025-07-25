const express = require('express');
const router = express.Router();
const sopController = require('../controllers/sopController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', sopController.createSOP);
router.get('/', sopController.getSOPs);
router.get('/:id', sopController.getSOPById);
router.put('/:id', sopController.updateSOP);
router.delete('/:id', sopController.deleteSOP);
router.get('/:id/export', sopController.exportSOPtoPDF);

module.exports = router; 