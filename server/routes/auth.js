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

    // Validate role
    const validRoles = ["customer", "manager", "staff"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
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
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
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

// Create Manager Profile (requires manager role)
router.post("/create-manager", auth, require("../utils/authMiddleware").requireManager, async (req, res) => {
  try {
    const Manager = require("../models/Manager");
    const { employeeId, department, permissions } = req.body;
    
    // Check if manager profile already exists
    const existingManager = await Manager.findOne({ userId: req.userId });
    if (existingManager) {
      return res.status(409).json({ message: "Manager profile already exists" });
    }
    
    const manager = await Manager.create({
      userId: req.userId,
      employeeId,
      department,
      permissions: permissions || []
    });
    
    return res.status(201).json({ manager });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Create Staff Profile (requires staff role)
router.post("/create-staff", auth, require("../utils/authMiddleware").requireStaff, async (req, res) => {
  try {
    const Staff = require("../models/Staff");
    const { employeeId, role, specialization, availability } = req.body;
    
    // Check if staff profile already exists
    const existingStaff = await Staff.findOne({ userId: req.userId });
    if (existingStaff) {
      return res.status(409).json({ message: "Staff profile already exists" });
    }
    
    const staff = await Staff.create({
      userId: req.userId,
      employeeId,
      role,
      specialization: specialization || [],
      availability: availability || {
        isAvailable: true,
        workingHours: { start: "08:00", end: "17:00" },
        workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"]
      }
    });
    
    return res.status(201).json({ staff });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;


