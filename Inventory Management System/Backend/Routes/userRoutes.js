/*This handles basic user management. 
'/register' = registers new users without 2FA setup
'/login' - authenticates users and issues a JWT
'/protected' - a test route to show how authentication works using authMiddleware */

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../Models/User"); // Ensure this path matches your project structure
const verifyToken = require("../middleware/authMiddleware"); // Middleware for protected routes
const AuthController = require("../Controllers/authController");

const router = express.Router();

// Route: Register a new user
router.post("/register", AuthController.registerUser);

// Route: Login user
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      "yourSecretKey", // Replace with an environment variable in production
      { expiresIn: "1h" }
    );

    res
      .status(200)
      .json({ success: true, token, message: "Login successful." });
  } catch (error) {
    console.error("Error during login:", error);
    res
      .status(500)
      .json({ success: false, message: "Login failed. Please try again." });
  }
});

// Route: Example of a protected route
router.get("/protected", verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the protected route!",
    user: req.user,
  });
});

module.exports = router;
