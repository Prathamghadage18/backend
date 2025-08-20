import { USER_ROLES } from "../config/constants.js";

// Middleware to check if user is admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === USER_ROLES.ADMIN) {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized as an admin");
  }
};

export default admin;
