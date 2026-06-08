const router = require('express').Router({ mergeParams: true });
const { body } = require('express-validator');
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/',  reviewController.getByProduct);                             // Public
router.post('/', verifyToken, [
  body('SoSao').isInt({ min: 1, max: 5 }).withMessage('Số sao phải từ 1 đến 5'),
  body('NoiDung').optional().isString(),
], reviewController.create);
router.delete('/', verifyToken, reviewController.remove);

module.exports = router;