const { sql, query } = require('../../config/db');

const findById = async (id) => {
  const result = await query(
    `SELECT sp.*,dm.TenDM AS DanhMuc FROM SanPham sp JOIN DanhMuc dm ON sp.MaDM=dm.MaDM WHERE sp.MaSP=@id`,
    { id: { type: sql.Int, value: id } }
  );
  return result.recordset[0] || null;
};

const checkStock = async (maSP, soLuong) => {
  const result = await query('SELECT SLTon FROM SanPham WHERE MaSP=@maSP',
    { maSP: { type: sql.Int, value: maSP } });
  if (!result.recordset.length) return { ok: false, reason: 'not_found' };
  if (result.recordset[0].SLTon < soLuong) return { ok: false, reason: 'insufficient' };
  return { ok: true, stock: result.recordset[0].SLTon };
};

module.exports = { findById, checkStock };