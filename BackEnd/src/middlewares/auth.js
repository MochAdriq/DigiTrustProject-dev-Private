// middlewares/auth.js
module.exports = function (req, res, next) {
  try {
    // Cek apakah session valid
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: "Akses tidak sah. Silakan login terlebih dahulu.",
      });
    }

    // Tempelkan data user ke request (biar bisa dipakai middleware/route lain)
    req.user = req.session.user;

    next();
  } catch (error) {
    console.error("Error in auth middleware:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan autentikasi.",
    });
  }
};
