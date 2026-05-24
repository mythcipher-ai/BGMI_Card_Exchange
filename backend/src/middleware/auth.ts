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

// Pulls profile fields out of the access-token payload, tolerant of custom
// Auth0 claim namespaces (e.g. "https://bgmi.app/email") since access tokens
// don't carry OIDC profile claims unless explicitly added via a rule/action.
function claimsFromToken(payload: any): { email?: string; name?: string; picture?: string } {
  if (!payload) return {};
  const NS = "https://bgmi.app/";
  return {
    email: (payload.email || payload[NS + "email"] || "").toString().trim().toLowerCase() || undefined,
    name: payload.name || payload[NS + "name"] || undefined,
    picture: payload.picture || payload[NS + "picture"] || undefined
  };
}

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
    const claims = claimsFromToken(payload);

    let user = await User.findOne({ auth0Id });
    if (!user) {
      user = await User.create({
        auth0Id,
        email: claims.email,
        name: claims.name,
        picture: claims.picture,
        role: "user"
      });
      console.log("[auth] new user created", { auth0Id, email: claims.email ?? "(none in token)" });
    } else {
      // Backfill any field that's missing from the stored record. This rescues
      // accounts created before the email scope was requested and keeps stored
      // profile data fresh if the IdP updates it.
      const patch: Record<string, string> = {};
      if (!user.email && claims.email) patch.email = claims.email;
      if (!user.name && claims.name) patch.name = claims.name;
      if (!user.picture && claims.picture) patch.picture = claims.picture;
      if (Object.keys(patch).length > 0) {
        Object.assign(user, patch);
        await user.save();
        console.log("[auth] backfilled user fields from token", { userId: user.id, fields: Object.keys(patch) });
      }
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
