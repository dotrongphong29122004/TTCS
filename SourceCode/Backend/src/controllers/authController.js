const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { sql, query } = require('../../config/db');

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { HoTen, Email, MatKhau } = req.body;
    const existing = await query('SELECT MaND FROM NguoiDung WHERE Email = @email',
      { email: { type: sql.NVarChar, value: Email } });
    if (existing.recordset.length > 0)
      return res.status(409).json({ success: false, message: 'Email này đã được đăng ký' });

    const hashed = await bcrypt.hash(MatKhau, 10);
    const result = await query(
      `INSERT INTO NguoiDung (HoTen, Email, MatKhau, MaVaiTro)
       OUTPUT INSERTED.MaND, INSERTED.HoTen, INSERTED.Email
       VALUES (@hoTen, @email, @matKhau, 2)`,
      { hoTen: { type: sql.NVarChar(100), value: HoTen },
        email: { type: sql.NVarChar(100), value: Email },
        matKhau: { type: sql.NVarChar(255), value: hashed } }
    );
    const u = result.recordset[0];
    const token = jwt.sign({ MaND: u.MaND, Email: u.Email, MaVaiTro: 2 },
      process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    res.status(201).json({ success: true, message: 'Đăng ký thành công',
      data: { token, user: { MaND: u.MaND, HoTen: u.HoTen, Email: u.Email, isAdmin: false } } });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { Email, MatKhau } = req.body;
    const result = await query(
      `SELECT nd.MaND, nd.HoTen, nd.Email, nd.MatKhau, nd.MaVaiTro
       FROM NguoiDung nd WHERE nd.Email = @email`,
      { email: { type: sql.NVarChar, value: Email } }
    );
    if (result.recordset.length === 0)
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });

    const user = result.recordset[0];
    const isMatch = await bcrypt.compare(MatKhau, user.MatKhau);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });

    const token = jwt.sign({ MaND: user.MaND, Email: user.Email, MaVaiTro: user.MaVaiTro },
      process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    res.json({ success: true, message: 'Đăng nhập thành công',
      data: { token, user: { MaND: user.MaND, HoTen: user.HoTen, Email: user.Email, isAdmin: user.MaVaiTro === 1 } } });
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { HoTen } = req.body;
    await query('UPDATE NguoiDung SET HoTen = @hoTen WHERE MaND = @maND',
      { hoTen: { type: sql.NVarChar(100), value: HoTen }, maND: { type: sql.Int, value: req.user.MaND } });
    res.json({ success: true, message: 'Cập nhật thông tin thành công' });
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { MatKhauCu, MatKhauMoi } = req.body;
    const result = await query('SELECT MatKhau FROM NguoiDung WHERE MaND = @maND',
      { maND: { type: sql.Int, value: req.user.MaND } });
    const isMatch = await bcrypt.compare(MatKhauCu, result.recordset[0].MatKhau);
    if (!isMatch)
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    const hashed = await bcrypt.hash(MatKhauMoi, 10);
    await query('UPDATE NguoiDung SET MatKhau = @matKhau WHERE MaND = @maND',
      { matKhau: { type: sql.NVarChar(255), value: hashed }, maND: { type: sql.Int, value: req.user.MaND } });
    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (err) { next(err); }
};

module.exports = { register, login, updateProfile, changePassword };

const getMe = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT nd.MaND, nd.HoTen, nd.Email, nd.SDT, vt.TenVT AS VaiTro
       FROM NguoiDung nd
       JOIN VaiTro vt ON nd.MaVaiTro = vt.MaVT
       WHERE nd.MaND = @maND`,
      { maND: { type: sql.Int, value: req.user.MaND } }
    );
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) { next(err); }
};

module.exports = { register, login, updateProfile, changePassword, getMe };