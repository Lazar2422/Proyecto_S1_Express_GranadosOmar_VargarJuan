// config/passport.js
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import User from "../models/User.js";

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || "dev-secret-change-me",
};

passport.use(new JwtStrategy(opts, async (payload, done) => {
  try {
    const user = await User.findById(payload.sub).select("_id name email");
    if (!user) return done(null, false);
    return done(null, user);
  } catch (err) {
    return done(err, false);
  }
}));

export default passport;
