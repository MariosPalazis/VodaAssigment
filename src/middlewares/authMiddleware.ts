
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';



export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
  };
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded:any = jwt.verify(token, String(process.env.TOKEN_SECRET)) as { _id: string };
    req.user = { _id:  decoded._id };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
};
