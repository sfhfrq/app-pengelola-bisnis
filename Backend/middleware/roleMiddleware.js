const roleMiddleware = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                pesan: "User belum login"
            });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                pesan: "Anda tidak memiliki akses"
            });
        }
        next();
    };
};

module.exports = roleMiddleware;