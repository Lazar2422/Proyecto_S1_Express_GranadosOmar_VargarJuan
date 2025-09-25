import passport from "passport";

export const requireAuth = passport.authenticate("jwt", { session: false });

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ msg: "Acceso denegado" });
  }
  next();
};
