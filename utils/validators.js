import { body } from "express-validator";

export const registerValidator = [
  body("username").notEmpty(),
  body("email").isEmail(),
  body("password").isLength({ min: 6 })
];
