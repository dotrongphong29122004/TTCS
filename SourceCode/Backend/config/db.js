const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  server:   process.env.DB_SERVER || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME   || 'NoiThatDB',
  user:     process.env.DB_USER   || 'sa',
  password: process.env.DB_PASSWORD,
  options: {
    encrypt:                process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort:       true,
  },
  pool: { max: 10, min: 2, idleTimeoutMillis: 30000 },
  connectionTimeout: 30000,
  requestTimeout:    30000,
};

let pool = null;

const connectDB = async () => {
  try {
    if (pool && pool.connected) return pool;
    console.log(' Đang kết nối SQL Server...');
    pool = await sql.connect(dbConfig);
    console.log(` Kết nối thành công! DB: ${dbConfig.database}`);
    pool.on('error', (err) => { console.error(' Pool error:', err.message); pool = null; });
    return pool;
  } catch (err) {
    console.error(' Kết nối thất bại:', err.message);
    process.exit(1);
  }
};

const getPool = () => {
  if (!pool || !pool.connected)
    throw new Error('Database chưa kết nối. Gọi connectDB() trước.');
  return pool;
};

const closeDB = async () => {
  if (pool) { await pool.close(); pool = null; console.log('🔌 Đã đóng kết nối'); }
};

const query = async (sqlString, params = {}) => {
  const req = getPool().request();
  for (const [key, param] of Object.entries(params)) {
    if (param && typeof param === 'object' && 'type' in param)
      req.input(key, param.type, param.value);
    else
      req.input(key, param);
  }
  return await req.query(sqlString);
};

const execute = async (procedureName, params = {}) => {
  const req = getPool().request();
  for (const [key, param] of Object.entries(params)) {
    if (param && typeof param === 'object' && 'type' in param)
      req.input(key, param.type, param.value);
    else
      req.input(key, param);
  }
  return await req.execute(procedureName);
};

const beginTransaction = async () => {
  const transaction = new sql.Transaction(getPool());
  await transaction.begin();
  return transaction;
};

module.exports = { sql, connectDB, getPool, closeDB, query, execute, beginTransaction };