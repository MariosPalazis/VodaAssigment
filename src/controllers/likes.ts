// controllers/routes/likes.ts
import { Request, Response } from "express";
import { validationResult } from "express-validator";
import mongoose from "mongoose";
import { postsModel } from "../models/posts";
import { likesModel } from "../models/likes";
// adjust this to match YOUR authMiddleware attachment
type AuthedRequest = Request & {
  user?: { _id: string } | string;
  userId?: string;
};

function getUserId(req: AuthedRequest): string | null {
  if (typeof req.user === "string") return req.user;
  if (req.user && typeof req.user === "object" && "_id" in req.user) return req.user._id;
  if (req.userId) return req.userId;
  return null;
}

export const likePost = async (req: AuthedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const userId = getUserId(req);
    const { postId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // optional: ensure post exists
    const post = await postsModel.findById(postId).select("_id").lean();
    if (!post) return res.status(404).json({ message: "Post not found" });

    // create like (unique index prevents duplicates)
    try {
      await likesModel.create({ userId, postId });
    } catch (e: any) {
      // duplicate key => already liked
      if (e?.code === 11000) {
        return res.status(200).json({ liked: true, message: "Already liked" });
      }
      throw e;
    }

    return res.status(201).json({ liked: true, postId });
  } catch (err) {
    console.error("likePost error:", err);
    return res.status(500).json({ message: "Failed to like post" });
  }
};

export const unlikePost = async (req: AuthedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const userId = getUserId(req);
    const { postId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const deleted = await likesModel.findOneAndDelete({ userId, postId }).lean();

    // returning 200 either way is fine; you can also return 404 if you prefer
    return res.status(200).json({ liked: false, removed: Boolean(deleted), postId });
  } catch (err) {
    console.error("unlikePost error:", err);
    return res.status(500).json({ message: "Failed to unlike post" });
  }
};

export const clearAllLikes = async (req: AuthedRequest, res: Response) => {
  try {
    const userId = getUserId(req);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await likesModel.deleteMany({ userId });

    return res.status(200).json({
      message: "All likes cleared",
      deletedCount: result.deletedCount ?? 0,
    });
  } catch (err) {
    console.error("clearMyLikes error:", err);
    return res.status(500).json({ message: "Failed to clear likes" });
  }
};
