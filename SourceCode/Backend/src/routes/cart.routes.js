const router = require('express').Router();
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middlewares/auth.middleware');

router.use(verifyToken); // Tất cả cart routes yêu cầu đăng nhập

router.get('/',              cartController.getCart);
router.post('/',             cartController.addToCart);
router.put('/:productId',    cartController.updateQuantity);
router.delete('/:productId', cartController.removeItem);
router.delete('/',           cartController.clearCart);

module.exports = router;