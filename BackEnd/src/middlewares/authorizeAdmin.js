// middlewares/authorizeAdmin.js
module.exports = function (req, res, next) {
  try {
    // Cek apakah user login
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: "Silakan login terlebih dahulu.",
      });
    }

    // Cek apakah user admin
    if (req.session.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Fitur ini hanya untuk admin.",
      });
    }

    next();
  } catch (error) {
    console.error("Error in authorizeAdmin middleware:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan otorisasi.",
    });
  }
};
