const { query } = require('../../config/db');

const getAll = async (req, res, next) => {
  try {
    const result = await query(`SELECT * FROM DanhMuc ORDER BY MaDM`);
    res.json({ success: true, data: result.recordset });
  } catch (err) { next(err); }
};

module.exports = { getAll };