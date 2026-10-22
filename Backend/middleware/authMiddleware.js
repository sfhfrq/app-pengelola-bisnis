const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                pesan: "Format token tidak valid. Gunakan: Bearer <token>"
            });
        }

        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        next();
    } catch (error) {
        const pesan =
            error.name === "TokenExpiredError"
                ? "Token sudah expired, silakan login ulang"
                : "Token tidak valid";

        return res.status(401).json({ pesan });
    }
};

module.exports = authMiddleware;