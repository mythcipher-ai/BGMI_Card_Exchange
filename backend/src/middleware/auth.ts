import { NextFunction, Request, RequestHandler, Response } from "express";
import { auth } from "express-oauth2-jwt-bearer";
import { IUser, User } from "../models/User";
import { config } from "../config";

export const authMiddleware = auth({
  audience: config.auth0Audience,
  issuerBaseURL: config.auth0Issuer,
  tokenSigningAlg: "RS256"
});

export type AuthRequest = Request & {
  auth?: any;
  user?: IUser;
};

export const attachCurrentUser: RequestHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // express-oauth2-jwt-bearer v1.x puts claims in req.auth.payload
  // Some versions put them directly on req.auth
  const payload = req.auth?.payload ?? req.auth;
  const auth0Id = payload?.sub;

  if (!auth0Id) {
    res.status(401).json({ message: "Missing Auth0 identifier" });
    return;
  }

  try {
    let user = await User.findOne({ auth0Id });
    if (!user) {
      // Try to get email from token claims
      const email = payload?.email
        || payload?.["https://bgmi.app/email"]
        || undefined;
      user = await User.create({ auth0Id, email, role: "user" });
    }

    if (user.status === "blocked") {
      res.status(403).json({ message: "Your account has been suspended" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
