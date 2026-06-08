const { sql, query } = require('../../config/db');

const getAll = async (req, res, next) => {
  try {
    const { category, search, sort, minPrice, maxPrice } = req.query;
    let sqlStr = `SELECT sp.MaSP, sp.TenSP, sp.GiaBan, sp.GiaGoc, sp.SLTon, sp.HinhAnh, sp.MoTa,
                         dm.TenDM AS DanhMuc
                  FROM SanPham sp JOIN DanhMuc dm ON sp.MaDM = dm.MaDM WHERE 1=1`;
    const params = {};
    if (category) { sqlStr += ' AND dm.TenDM = @category'; params.category = { type: sql.NVarChar, value: category }; }
    if (search)   { sqlStr += ' AND sp.TenSP LIKE @search COLLATE Vietnamese_CI_AI'; params.search = { type: sql.NVarChar, value: `%${search}%` }; }
    if (minPrice) { sqlStr += ' AND sp.GiaBan >= @minPrice'; params.minPrice = { type: sql.Decimal(18,2), value: +minPrice }; }
    if (maxPrice) { sqlStr += ' AND sp.GiaBan <= @maxPrice'; params.maxPrice = { type: sql.Decimal(18,2), value: +maxPrice }; }
    const sortMap = { 'price-asc': 'sp.GiaBan ASC', 'price-desc': 'sp.GiaBan DESC', 'name': 'sp.TenSP ASC' };
    sqlStr += ` ORDER BY ${sortMap[sort] || 'sp.MaSP ASC'}`;
    const result = await query(sqlStr, params);
    res.json({ success: true, data: result.recordset });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT sp.*, dm.TenDM AS DanhMuc FROM SanPham sp JOIN DanhMuc dm ON sp.MaDM = dm.MaDM WHERE sp.MaSP = @id`,
      { id: { type: sql.Int, value: parseInt(req.params.id) } }
    );
    if (!result.recordset.length)
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { TenSP, GiaBan, GiaGoc, SLTon, HinhAnh, MoTa, MaDM } = req.body;
    const result = await query(
      `INSERT INTO SanPham (TenSP, GiaBan, GiaGoc, SLTon, HinhAnh, MoTa, MaDM)
       OUTPUT INSERTED.* VALUES (@tenSP,@giaBan,@giaGoc,@slTon,@hinhAnh,@moTa,@maDM)`,
      { tenSP:{type:sql.NVarChar(200),value:TenSP}, giaBan:{type:sql.Decimal(18,2),value:GiaBan},
        giaGoc:{type:sql.Decimal(18,2),value:GiaGoc||null}, slTon:{type:sql.Int,value:SLTon},
        hinhAnh:{type:sql.NVarChar(500),value:HinhAnh}, moTa:{type:sql.NVarChar(sql.MAX),value:MoTa||''},
        maDM:{type:sql.Int,value:MaDM} }
    );
    res.status(201).json({ success: true, message: 'Thêm sản phẩm thành công', data: result.recordset[0] });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { TenSP, GiaBan, GiaGoc, SLTon, HinhAnh, MoTa, MaDM } = req.body;
    await query(
      `UPDATE SanPham SET TenSP=@tenSP,GiaBan=@giaBan,GiaGoc=@giaGoc,SLTon=@slTon,
       HinhAnh=@hinhAnh,MoTa=@moTa,MaDM=@maDM WHERE MaSP=@id`,
      { tenSP:{type:sql.NVarChar(200),value:TenSP}, giaBan:{type:sql.Decimal(18,2),value:GiaBan},
        giaGoc:{type:sql.Decimal(18,2),value:GiaGoc||null}, slTon:{type:sql.Int,value:SLTon},
        hinhAnh:{type:sql.NVarChar(500),value:HinhAnh}, moTa:{type:sql.NVarChar(sql.MAX),value:MoTa||''},
        maDM:{type:sql.Int,value:MaDM}, id:{type:sql.Int,value:parseInt(req.params.id)} }
    );
    res.json({ success: true, message: 'Cập nhật sản phẩm thành công' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await query('DELETE FROM SanPham WHERE MaSP = @id',
      { id: { type: sql.Int, value: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Xóa sản phẩm thành công' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };