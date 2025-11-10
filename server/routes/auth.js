const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const auth = require("../utils/authMiddleware");

const router = express.Router();

const COOKIE_NAME = "access_token";
const TOKEN_EXPIRES_IN = "15m";

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, role = "customer" } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // Public registration only allows customer role
    // Manager, staff, and admin accounts must be created by admin with proper credentials
    if (role !== "customer") {
      return res.status(403).json({ 
        message: "Only customer accounts can be created through public registration. Other roles must be created by an administrator." 
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const userData = { 
      name, 
      email: email.toLowerCase(), 
      password: hashed,
      role,
      phone: phone || null
    };
    
    const user = await User.create(userData);
    const safeUser = { 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      phone: user.phone
    };
    return res.status(201).json({ user: safeUser });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ 
      sub: user._id, 
      email: user.email, 
      name: user.name, 
      role: user.role 
    }, process.env.JWT_SECRET, {
      expiresIn: TOKEN_EXPIRES_IN,
    });

    const isProd = process.env.NODE_ENV === "production";
    
    // Clear any existing cookies first to avoid accumulation
    res.clearCookie(COOKIE_NAME);
    res.clearCookie(COOKIE_NAME, { domain: undefined });
    res.clearCookie(COOKIE_NAME, { path: '/' });
    
    // Set new cookie with minimal size
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax", // Changed from "strict" to "lax" for better compatibility
      maxAge: 15 * 60 * 1000,
      path: '/'
    });

    const safeUser = { 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      phone: user.phone
    };
    return res.json({ user: safeUser });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
  });
  return res.json({ message: "Logged out" });
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.userId).select("name email role phone");
  if (!user) return res.status(404).json({ message: "Not found" });
  return res.json({ 
    user: { 
      id: user._id, 
      name: user.name, 
      email: user.email,
      role: user.role,
      phone: user.phone
    } 
  });
});

// Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user fields
    user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    const safeUser = { 
      id: user._id, 
      name: user.name, 
      email: user.email,
      role: user.role,
      phone: user.phone
    };

    return res.json({ 
      message: "Profile updated successfully",
      user: safeUser 
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Change password
router.put("/password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;

    await user.save();

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Error changing password:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Note: Profile creation endpoints removed - role-specific data is now stored directly in User model
// Profile data should be set during user creation (by admin) or updated via profile update endpoint

module.exports = router;


