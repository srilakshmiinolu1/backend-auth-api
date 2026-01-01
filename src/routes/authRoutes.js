const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Protected profile route",
    user: req.user
  });
});
router.get("/dashboard", authMiddleware, (req, res) => {
  res.json({
    message: "Dashboard access granted",
    user: req.user
  });
});


module.exports = router;
