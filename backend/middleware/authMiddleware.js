const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1]; // Get token from Authorization header

    if (!token) {
        return res.status(403).json({ message: "Token is required" });
    }

    // Verify the JWT
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or expired token" });
        }

        req.user = user; // Attach the decoded token payload to the request object
        next();
    });
};

module.exports = authenticateJWT;
