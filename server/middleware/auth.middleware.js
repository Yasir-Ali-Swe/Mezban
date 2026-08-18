import { getAuth } from "@clerk/express";

export const requireAuth = (req, res, next) => {
  const { isAuthenticated, userId } = getAuth(req);

  if (!isAuthenticated) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  req.userId = userId;

  next();
};
