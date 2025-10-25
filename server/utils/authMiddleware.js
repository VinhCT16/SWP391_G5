const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Basic authentication middleware
module.exports = function auth(req, res, next) {
  try {
    const token = req.cookies && req.cookies["access_token"];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    req.userRole = payload.role;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

// Role-based authorization middleware
module.exports.requireRole = function(roles) {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      if (!roles.includes(user.role)) {
        return res.status(403).json({ 
          message: `Access denied. Required roles: ${roles.join(", ")}` 
        });
      }
      
      req.user = user;
      next();
    } catch (err) {
      return res.status(500).json({ message: "Authorization error" });
    }
  };
};

// Manager-specific middleware
module.exports.requireManager = module.exports.requireRole(["manager"]);

// Staff-specific middleware  
module.exports.requireStaff = module.exports.requireRole(["staff"]);

// Customer-specific middleware
module.exports.requireCustomer = module.exports.requireRole(["customer"]);

// Manager or Staff middleware
module.exports.requireEmployee = module.exports.requireRole(["manager", "staff"]);

// Admin-specific middleware
module.exports.requireAdmin = module.exports.requireRole(["admin"]);

// Admin or Manager middleware
module.exports.requireAdminOrManager = module.exports.requireRole(["admin", "manager"]);


