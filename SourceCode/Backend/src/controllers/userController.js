// ================================================================
//  Backend/src/controllers/userController.js  
// ================================================================
const { sql, query } = require('../../config/db');

const getAll = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         nd.MaND,
         nd.HoTen,
         nd.Email,
         nd.SDT,
         vt.TenVT AS VaiTro,
         (SELECT COUNT(*) FROM DonHang dh WHERE dh.MaND = nd.MaND) AS SoDonHang,
         ISNULL(
           (SELECT SUM(dh2.TongTien) FROM DonHang dh2
            WHERE dh2.MaND = nd.MaND AND dh2.TrangThai = 'completed'), 0
         ) AS TongChiTieu
       FROM NguoiDung nd
       JOIN VaiTro vt ON nd.MaVaiTro = vt.MaVT
       ORDER BY nd.MaND`
    );
    res.json({ success: true, data: result.recordset });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    if (req.params.email === 'admin@gmail.com')
      return res.status(403).json({ success: false, message: 'Không thể xóa tài khoản Admin gốc' });
    await query('DELETE FROM NguoiDung WHERE Email = @email',
      { email: { type: sql.NVarChar(100), value: req.params.email } });
    res.json({ success: true, message: 'Đã xóa tài khoản thành công' });
  } catch (err) { next(err); }
};

const searchUsers = async (req, res, next) => {
  try {
    const { keyword, role, sortBy, sortDir } = req.query;

    // các cột sort 
    const allowedSort = {
      'MaND':        'nd.MaND',
      'HoTen':       'nd.HoTen',
      'SoDonHang':   'SoDonHang',
      'TongChiTieu': 'TongChiTieu',
    };
    const sortCol = allowedSort[sortBy] || 'nd.MaND';
    const sortDir2 = sortDir === 'desc' ? 'DESC' : 'ASC';

    let sqlStr = `
      SELECT
        nd.MaND,
        nd.HoTen,
        nd.Email,
        nd.SDT,
        vt.TenVT AS VaiTro,
        (SELECT COUNT(*) FROM DonHang dh WHERE dh.MaND = nd.MaND) AS SoDonHang,
        ISNULL(
          (SELECT SUM(dh2.TongTien) FROM DonHang dh2
           WHERE dh2.MaND = nd.MaND AND dh2.TrangThai = 'completed'), 0
        ) AS TongChiTieu
      FROM NguoiDung nd
      JOIN VaiTro vt ON nd.MaVaiTro = vt.MaVT
      WHERE 1=1
    `;
    const params = {};

    if (keyword) {
      sqlStr += ` AND (
        nd.HoTen LIKE @keyword COLLATE Vietnamese_CI_AI
        OR nd.Email LIKE @keyword COLLATE Vietnamese_CI_AI
        OR nd.SDT   LIKE @keyword
      )`;
      params.keyword = { type: sql.NVarChar, value: `%${keyword}%` };
    }
    if (role === 'admin')    sqlStr += ' AND nd.MaVaiTro = 1';
    else if (role === 'customer') sqlStr += ' AND nd.MaVaiTro = 2';

    sqlStr += ` ORDER BY ${sortCol} ${sortDir2}`;

    const result = await query(sqlStr, params);
    res.json({ success: true, data: result.recordset });
  } catch (err) { next(err); }
};

module.exports = { getAll, remove, searchUsers };