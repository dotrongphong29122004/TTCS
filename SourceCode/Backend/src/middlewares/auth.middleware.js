const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token)
    return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để tiếp tục' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { MaND, Email, MaVaiTro }
    next();
  } catch (err) { next(err); }
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.MaVaiTro !== 1)
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này' });
    next();
  });
};

module.exports = { verifyToken, verifyAdmin };