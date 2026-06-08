const router = require('express').Router();
const userController = require('../controllers/userController');
const { verifyAdmin } = require('../middlewares/auth.middleware');

router.use(verifyAdmin); // Chỉ Admin

router.get('/search',    userController.searchUsers); // GET /api/users/search?keyword=&role=
router.get('/',          userController.getAll);
router.delete('/:email', userController.remove);

module.exports = router;