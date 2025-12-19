import jwt from "jsonwebtoken";

/**
 * MUST match what your authMiddleware expects.
 * Most common: payload has userId
 */
export function signToken(userId: string) {
  return jwt.sign(
    { _id: userId },
    String(process.env.TOKEN_SECRET)
  );
}

export function authHeader(token: string) {
  return `Bearer ${token}`;
}
