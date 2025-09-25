import passport from "passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { getDB } from "./db.js";
import dotenv from "dotenv";
dotenv.config();

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new Strategy(opts, async (jwt_payload, done) => {
    try {
      const db = getDB();
      const user = await db.collection("users").findOne({ _id: jwt_payload.id });
      if (user) return done(null, user);
      else return done(null, false);
    } catch (err) {
      return done(err, false);
    }
  })
);
