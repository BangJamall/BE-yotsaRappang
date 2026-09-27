const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Cek apakah header Authorization ada dan berformat "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token tidak ditemukan.' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rahasia_super_aman');
    req.user = decoded; // Menyimpan data admin (id & username) ke req.user
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Token tidak valid atau sudah kedaluwarsa!' 
    });
  }
};

module.exports = verifyToken;