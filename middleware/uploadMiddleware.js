const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const sharp = require('sharp');

const uploadDir = path.join(__dirname, '../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const allowedFormats = new Map([
  ['image/jpeg', 'jpeg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.');
      error.statusCode = 400;
      return cb(error);
    }

    return cb(null, true);
  },
});

const processImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  let metadata;
  try {
    metadata = await sharp(req.file.buffer, {
      limitInputPixels: 40_000_000,
      failOn: 'error',
    }).metadata();
  } catch (error) {
    const invalidImageError = new Error('File bukan gambar yang valid atau gambarnya rusak.');
    invalidImageError.statusCode = 400;
    return next(invalidImageError);
  }

  if (allowedFormats.get(req.file.mimetype) !== metadata.format) {
    const mismatchError = new Error('Tipe gambar tidak sesuai dengan isi file.');
    mismatchError.statusCode = 400;
    return next(mismatchError);
  }

  const filename = `${randomUUID()}.webp`;
  const outputPath = path.join(uploadDir, filename);

  try {
    const result = await sharp(req.file.buffer, {
      limitInputPixels: 40_000_000,
      failOn: 'error',
    })
      .rotate()
      .resize({
        width: 1920,
        height: 1920,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 4 })
      .toFile(outputPath);

    req.file.filename = filename;
    req.file.path = outputPath;
    req.file.destination = uploadDir;
    req.file.mimetype = 'image/webp';
    req.file.size = result.size;
    delete req.file.buffer;
    return next();
  } catch (error) {
    try {
      await fs.promises.unlink(outputPath);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') {
        console.error('Gagal membersihkan file gambar sementara:', cleanupError);
      }
    }

    if (!error.code || error.code.startsWith('ERR_')) {
      error.statusCode = 400;
      error.message = 'Gambar tidak dapat diproses. Pastikan file gambar valid.';
    }

    return next(error);
  }
};

module.exports = { upload, processImage };
