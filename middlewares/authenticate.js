const jwt = require('jsonwebtoken');
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'KaKOBxubowtUufeXkiiao4YEBNecGK1n3bOnCeblno4cCCdRJ8TK9wkRlbHFYkaGf3BzUiMOespxUlu9PjqvYrbphykAf6wHMSSnyYKbLquAbhdHsN2C5rNpjVXvBAxhpP949FP9kfaZYTDM1qQJCBshW44VfcIbZaQ8HQBoyz2fKcCMOPuDtNgpbdEmUQDXxIaxlM8JTWTYVKrPsCfeAXISx8XebwAxXj2HHZS2WiUZOPSpY9WWP5SdUGibQP08';

module.exports = function (req, res, next) {
    const authorization = req.headers.authorization;

    if (authorization) {
        const token = authorization.split(' ')[1];

        jwt.verify(token, JWT_SECRET_KEY, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: "Unauthorized access." });
            }

            req.loggedInUser = decoded;

            return next();
        });
    }
    else {
        return res.status(401).json({ message: "No token provided." });
    }
}