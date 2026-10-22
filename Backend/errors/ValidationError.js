// Error yang kita "lempar sendiri" = kesalahan PENGGUNA (400),
// bukan kerusakan SERVER (500). Perbedaan ini fundamental di API profesional.
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
        this.statusCode = 400;
    }
}

module.exports = ValidationError;