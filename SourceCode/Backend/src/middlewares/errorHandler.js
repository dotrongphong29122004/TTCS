const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  if (err.code === 'EREQUEST' || err.code === 'ECONNREFUSED')
    return res.status(503).json({ success: false, message: 'Lỗi kết nối cơ sở dữ liệu' });
  if (err.name === 'JsonWebTokenError')
    return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
  if (err.name === 'TokenExpiredError')
    return res.status(401).json({ success: false, message: 'Token đã hết hạn, vui lòng đăng nhập lại' });
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Lỗi hệ thống, vui lòng thử lại',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;