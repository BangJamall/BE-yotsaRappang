const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const VERIFY_TIMEOUT_MS = 5000;

const verifyTurnstile = async (req, res, next) => {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error('TURNSTILE_SECRET_KEY belum dikonfigurasi.');
    return res.status(503).json({
      success: false,
      message: 'Verifikasi login sedang tidak tersedia.',
    });
  }

  const token = req.body?.['cf-turnstile-response'];
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) {
    return res.status(400).json({
      success: false,
      message: 'Token verifikasi Turnstile tidak ada atau tidak valid.',
    });
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(`Turnstile Siteverify merespons HTTP ${response.status}.`);
      return res.status(503).json({
        success: false,
        message: 'Verifikasi login sedang tidak tersedia.',
      });
    }

    const result = await response.json();
    if (result.success !== true) {
      return res.status(403).json({
        success: false,
        message: 'Verifikasi Turnstile gagal atau kedaluwarsa. Silakan coba lagi.',
      });
    }

    return next();
  } catch (error) {
    console.error('Gagal menghubungi Cloudflare Turnstile Siteverify:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Verifikasi login sedang tidak tersedia.',
    });
  }
};

module.exports = verifyTurnstile;
