const express = require('express');
const cors    = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.urlencoded({ extended: true }));
app.use('/api/categories', require('../src/routes/category.routes'));

app.use('/api/auth',                  require('../src/routes/auth.routes'));
app.use('/api/products',              require('../src/routes/product.routes'));
app.use('/api/products/:id/reviews',  require('../src/routes/review.routes'));
app.use('/api/orders',                require('../src/routes/order.routes'));
app.use('/api/cart',                  require('../src/routes/cart.routes'));
app.use('/api/users',                 require('../src/routes/user.routes'));

app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', message: 'NoiThat API đang chạy', timestamp: new Date() })
);

app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} không tồn tại` })
);

app.use(require('../src/middlewares/errorHandler'));

module.exports = app;