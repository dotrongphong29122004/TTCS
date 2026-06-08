const { sql, query } = require('../../config/db');

const getByProduct = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT dg.MaDG,dg.NoiDung,dg.SoSao,dg.NgayDG,nd.HoTen AS TenKH,nd.MaND
       FROM DanhGia dg JOIN NguoiDung nd ON dg.MaND=nd.MaND
       WHERE dg.MaSP=@maSP ORDER BY dg.NgayDG DESC`,
      { maSP: { type: sql.Int, value: parseInt(req.params.id) } }
    );
    const reviews = result.recordset;
    const avgRating = reviews.length
      ? Math.round(reviews.reduce((s,r) => s + r.SoSao, 0) / reviews.length * 10) / 10
      : 0;
    res.json({ success: true, data: { reviews, avgRating, totalReviews: reviews.length } });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const maSP = parseInt(req.params.id);
    const { MaND } = req.user;
    const { SoSao, NoiDung } = req.body;
    if (!SoSao || SoSao < 1 || SoSao > 5)
      return res.status(400).json({ success: false, message: 'Số sao phải từ 1 đến 5' });

    const existing = await query('SELECT MaDG FROM DanhGia WHERE MaND=@maND AND MaSP=@maSP',
      { maND:{type:sql.Int,value:MaND}, maSP:{type:sql.Int,value:maSP} });
    if (existing.recordset.length) {
      await query(`UPDATE DanhGia SET SoSao=@soSao,NoiDung=@noiDung,NgayDG=GETDATE() WHERE MaND=@maND AND MaSP=@maSP`,
        { soSao:{type:sql.Int,value:SoSao}, noiDung:{type:sql.NVarChar(sql.MAX),value:NoiDung||''},
          maND:{type:sql.Int,value:MaND}, maSP:{type:sql.Int,value:maSP} });
      return res.json({ success: true, message: 'Đã cập nhật đánh giá' });
    }
    await query(`INSERT INTO DanhGia (MaND,MaSP,SoSao,NoiDung,NgayDG) VALUES (@maND,@maSP,@soSao,@noiDung,GETDATE())`,
      { maND:{type:sql.Int,value:MaND}, maSP:{type:sql.Int,value:maSP},
        soSao:{type:sql.Int,value:SoSao}, noiDung:{type:sql.NVarChar(sql.MAX),value:NoiDung||''} });
    res.status(201).json({ success: true, message: 'Cảm ơn bạn đã đánh giá!' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const maSP = parseInt(req.params.id);
    const { MaND } = req.user;

    await query(
      'DELETE FROM DanhGia WHERE MaND = @maND AND MaSP = @maSP',
      {
        maND: { type: sql.Int, value: MaND },
        maSP: { type: sql.Int, value: maSP },
      }
    );
    res.json({ success: true, message: 'Đã xóa đánh giá' });
  } catch (err) { next(err); }
};

module.exports = { getByProduct, create, remove };
