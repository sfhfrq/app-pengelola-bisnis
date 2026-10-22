const bcrypt = require("bcrypt");

const password = "budi123";

bcrypt.hash(password, 10)
    .then((hash) => {
        console.log(hash);
    });