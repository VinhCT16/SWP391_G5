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
      return res.status(400).json({ message: "Tên, email và mật khẩu là bắt buộc" });
    }

    // Validate role
    const validRoles = ["customer", "manager", "staff", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Vai trò không hợp lệ" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email đã được sử dụng" });
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
    console.error("Registration error:", err);
    // Return specific error message if it's a validation error
    if (err.message && (err.message.includes('required') || err.message.includes('must be one of'))) {
      return res.status(400).json({ message: err.message });
    }
    // Check for duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({ 
        message: `${field === 'email' ? 'Email' : field === 'employeeId' ? 'Mã nhân viên' : 'Mã quản trị'} đã được sử dụng` 
      });
    }
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email và mật khẩu là bắt buộc" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Thông tin đăng nhập không hợp lệ" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Thông tin đăng nhập không hợp lệ" });
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
      sameSite: isProd ? "strict" : "lax",
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
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
});

router.post("/logout", (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
  });
  return res.json({ message: "Đã đăng xuất" });
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.userId).select("name email role phone");
  if (!user) return res.status(404).json({ message: "Không tìm thấy" });
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
      return res.status(400).json({ message: "Tên là bắt buộc" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
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
      message: "Cập nhật hồ sơ thành công",
      user: safeUser 
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
});

// Change password
router.put("/password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Cần nhập mật khẩu hiện tại và mật khẩu mới" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Verify current password
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;

    await user.save();

    return res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    console.error("Error changing password:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
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
      return res.status(409).json({ message: "Hồ sơ quản lý đã tồn tại" });
    }
    
    const manager = await Manager.create({
      userId: req.userId,
      employeeId,
      department,
      permissions: permissions || []
    });
    
    return res.status(201).json({ manager });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
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
      return res.status(409).json({ message: "Hồ sơ nhân viên đã tồn tại" });
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
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
});

// Create Admin Profile (requires admin role)
router.post("/create-admin", auth, require("../utils/authMiddleware").requireAdmin, async (req, res) => {
  try {
    const Admin = require("../models/Admin");
    const { adminId, department, permissions } = req.body;
    
    // Check if admin profile already exists
    const existingAdmin = await Admin.findOne({ userId: req.userId });
    if (existingAdmin) {
      return res.status(409).json({ message: "Hồ sơ quản trị đã tồn tại" });
    }
    
    const admin = await Admin.create({
      userId: req.userId,
      adminId,
      department,
      permissions: permissions || {
        userManagement: {
          canViewUsers: true,
          canCreateUsers: true,
          canUpdateUsers: true,
          canDeleteUsers: true,
          canLockUnlockUsers: true
        },
        staffManagement: {
          canManageStaff: true,
          canAssignRoles: true,
          canViewStaffPerformance: true
        },
        systemManagement: {
          canViewSystemLogs: true,
          canManageSystemSettings: true
        }
      }
    });
    
    return res.status(201).json({ admin });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
});

module.exports = router;


