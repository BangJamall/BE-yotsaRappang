const bcrypt = require('bcryptjs');
const db = require('../config/db');

const seedUser = async () => {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error('ADMIN_USERNAME dan ADMIN_PASSWORD wajib diatur.');
  }

  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD harus memiliki minimal 12 karakter.');
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT NOT NULL AUTO_INCREMENT,
      username VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_users_username (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT NOT NULL AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      description TEXT NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      is_best_seller TINYINT(1) NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_products_category (category),
      KEY idx_products_is_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS posters (
      id INT NOT NULL AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_posters_category (category),
      KEY idx_posters_is_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [users] = await db.query(
    'SELECT id FROM users WHERE username = ? LIMIT 1',
    [username]
  );

  if (users.length > 0) {
    console.log('User admin sudah ada; password tidak diubah.');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.query(
    'INSERT INTO users (username, password) VALUES (?, ?)',
    [username, passwordHash]
  );

  console.log('User admin berhasil dibuat.');
};

seedUser()
  .catch((error) => {
    console.error('Gagal menjalankan seed user:', error.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
