const router = require('express').Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/register', [
  body('HoTen').notEmpty().withMessage('Họ tên không được để trống'),
  body('Email').isEmail().withMessage('Email không hợp lệ'),
  body('MatKhau').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
], authController.register);

router.post('/login', [
  body('Email').isEmail().withMessage('Email không hợp lệ'),
  body('MatKhau').notEmpty().withMessage('Mật khẩu không được để trống'),
], authController.login);

router.put('/profile', verifyToken, [
  body('HoTen').notEmpty().withMessage('Họ tên không được để trống'),
], authController.updateProfile);

router.put('/change-password', verifyToken, [
  body('MatKhauCu').notEmpty().withMessage('Mật khẩu cũ không được để trống'),
  body('MatKhauMoi').isLength({ min: 6 }).withMessage('Mật khẩu mới tối thiểu 6 ký tự'),
], authController.changePassword);

router.get('/me', verifyToken, authController.getMe);

module.exports = router;
