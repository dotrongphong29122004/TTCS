const router = require('express').Router();
const orderController = require('../controllers/orderController');
const { verifyToken, verifyAdmin } = require('../middlewares/auth.middleware');


router.get('/stats', verifyAdmin, orderController.getStats);
router.post('/',           verifyToken, orderController.createOrder);   // Đặt hàng
router.get('/my',          verifyToken, orderController.getMyOrders);   // Lịch sử của tôi
router.get('/',            verifyAdmin, orderController.getAllOrders);   // Tất cả [Admin]
router.get('/revenue/overview',      verifyAdmin, orderController.getRevenueOverview);
router.get('/revenue/week',          verifyAdmin, orderController.getRevenueByWeek);
router.get('/revenue/month',         verifyAdmin, orderController.getRevenueByMonth);
router.get('/revenue/year',          verifyAdmin, orderController.getRevenueByYear);
router.get('/revenue/top-customers', verifyAdmin, orderController.getTopCustomers);
router.get('/revenue/top-products', verifyAdmin, orderController.getTopProducts);
router.put('/:id/status',  verifyAdmin, orderController.updateStatus);  // Cập nhật trạng thái [Admin]
router.get('/:id', verifyToken, orderController.getOrderById);


module.exports = router;