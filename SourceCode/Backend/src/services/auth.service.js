const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { sql, query } = require('../../config/db');

const findByEmail = async (email) => {
  const result = await query(
    `SELECT nd.MaND,nd.HoTen,nd.Email,nd.MatKhau,nd.MaVaiTro,vt.TenVT
     FROM NguoiDung nd JOIN VaiTro vt ON nd.MaVaiTro=vt.MaVT WHERE nd.Email=@email`,
    { email: { type: sql.NVarChar(100), value: email } }
  );
  return result.recordset[0] || null;
};

const generateToken = (user) =>
  jwt.sign({ MaND: user.MaND, Email: user.Email, MaVaiTro: user.MaVaiTro },
    process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const formatUser = (user) =>
  ({ MaND: user.MaND, HoTen: user.HoTen, Email: user.Email, isAdmin: user.MaVaiTro === 1 });

module.exports = { findByEmail, generateToken, formatUser };