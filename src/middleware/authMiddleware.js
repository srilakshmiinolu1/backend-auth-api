const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log("AUTH HEADER:", authHeader);
    console.log("JWT_SECRET IN MIDDLEWARE:", process.env.JWT_SECRET);

    if (!authHeader) {
      return res.status(401).json({ message: "No Authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("TOKEN AFTER REMOVE BEARER:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("DECODED TOKEN:", decoded);

    req.user = decoded;
    next();
  } catch (err) {
    console.log("JWT VERIFY ERROR:", err.message);
    return res.status(400).json({ message: "Invalid token" });
  }
};
