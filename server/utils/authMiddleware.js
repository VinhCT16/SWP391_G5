const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Basic authentication middleware
module.exports = function auth(req, res, next) {
  try {
    // Check for token in cookies
    const token = req.cookies && req.cookies["access_token"];
    
    // Debug logging in development
    if (!token && process.env.NODE_ENV !== 'production') {
      console.log('Auth Debug:', {
        url: req.url,
        method: req.method,
        hasCookies: !!req.cookies,
        cookieNames: req.cookies ? Object.keys(req.cookies) : [],
        cookieHeader: req.headers.cookie ? req.headers.cookie.substring(0, 100) : 'none',
        allCookies: req.cookies
      });
    }
    
    if (!token) {
      console.error('Authentication error: No token found in cookies', { 
        url: req.url,
        method: req.method,
        hasCookies: !!req.cookies,
        cookieNames: req.cookies ? Object.keys(req.cookies) : [],
        cookieHeader: req.headers.cookie ? req.headers.cookie.substring(0, 100) : 'none'
      });
      return res.status(401).json({ 
        message: "Unauthorized: No authentication token found. Please login again." 
      });
    }
    
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = payload.sub;
      req.userRole = payload.role;
      return next();
    } catch (verifyErr) {
      console.error('Authentication error: Invalid token', { 
        error: verifyErr.message,
        tokenExpired: verifyErr.name === 'TokenExpiredError',
        url: req.url,
        method: req.method
      });
      
      if (verifyErr.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: "Session expired. Please login again." 
        });
      }
      
      return res.status(401).json({ 
        message: "Invalid authentication token. Please login again." 
      });
    }
  } catch (err) {
    console.error('Authentication middleware error:', err);
    return res.status(401).json({ 
      message: "Authentication error. Please login again." 
    });
  }
};

// Role-based authorization middleware
module.exports.requireRole = function(roles) {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        console.error('Authorization error: userId not found in request', {
          url: req.url,
          method: req.method,
          tokenRole: req.userRole
        });
        return res.status(401).json({ message: "User ID not found. Please login again." });
      }

      const user = await User.findById(req.userId);
      if (!user) {
        console.error('Authorization error: User not found in database', { 
          userId: req.userId,
          url: req.url,
          method: req.method,
          tokenRole: req.userRole
        });
        return res.status(401).json({ message: "User not found. Please login again." });
      }
      
      // Check both database role and token role for debugging
      const dbRole = user.role;
      const tokenRole = req.userRole;
      
      if (!roles.includes(dbRole)) {
        console.error('Authorization error: Insufficient permissions', { 
          userId: req.userId,
          url: req.url,
          method: req.method,
          dbRole: dbRole,
          tokenRole: tokenRole,
          requiredRoles: roles,
          userActive: user.isActive
        });
        
        // If token role matches but DB role doesn't, provide a more helpful message
        if (tokenRole && roles.includes(tokenRole) && dbRole !== tokenRole) {
          return res.status(403).json({ 
            message: `Role mismatch detected. Your account shows as "${dbRole}" in the database, but your session indicates "${tokenRole}". Please contact an administrator to update your account role, or try logging out and logging back in.` 
          });
        }
        
        return res.status(403).json({ 
          message: `Access denied. You are logged in as "${dbRole}", but this action requires one of: ${roles.join(", ")}. Please contact an administrator if you believe this is an error.` 
        });
      }
      
      req.user = user;
      next();
    } catch (err) {
      console.error('Authorization error:', err, {
        userId: req.userId,
        url: req.url,
        method: req.method,
        tokenRole: req.userRole
      });
      return res.status(500).json({ 
        message: "Authorization error",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
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


