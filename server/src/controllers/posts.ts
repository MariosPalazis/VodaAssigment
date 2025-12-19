import { Request, Response } from "express";
import { validationResult } from "express-validator";
import mongoose from "mongoose";
import { postsModel } from "../models/posts";
import jwt from "jsonwebtoken";
import { likesModel } from "../models/likes";


// If your authMiddleware attaches user info differently, adjust this type.
type AuthedRequest = Request & {
    user?: { _id: string } | string;   // common patterns
    userId?: string;                   // another common pattern
};

// helper to read userId from req (supports multiple middleware styles)
function getUserId(req: AuthedRequest): string | null {
    if (typeof req.user === "string") return req.user;
    if (req.user && typeof req.user === "object" && "_id" in req.user) return req.user._id;
    if (req.userId) return req.userId;
    return null;
}

export const createPost = async (req: AuthedRequest, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userId = getUserId(req);
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { title, body } = req.body;

        const post = await postsModel.create({
            userId,
            title,
            body,
        });

        return res.status(201).json(post);
    } catch (err) {
        console.error("createPost error:", err);
        return res.status(500).json({ message: "Failed to create post" });
    }
};

export const deletePost = async (req: AuthedRequest, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userId = getUserId(req);
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { postId } = req.params;

        // Ownership check: delete only if post belongs to this user
        const deleted = await postsModel.findOneAndDelete({
            _id: postId,
            userId: userId,
        });

        if (!deleted) {
            return res.status(404).json({
                message: "Post not found or you do not have permission to delete it",
            });
        }

        return res.status(200).json({ message: "Post deleted successfully" });
    } catch (err) {
        console.error("deletePost error:", err);
        return res.status(500).json({ message: "Failed to delete post" });
    }
};


// Extract userId from Authorization header if token is valid.
// If missing/invalid => return null (endpoint stays public).
function tryGetUserIdFromAuth(req: Request): string | null {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return null;

    const token = header.slice(7);
    try {
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET as string) as any;

        // Adjust depending on what you put in JWT payload (common: { userId: "..." })
        const userId = decoded?._id;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return null;

        return String(userId);
    } catch {
        return null;
    }
}


export const listPosts = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const page = Number(req.query.page) > 0 ? Math.floor(Number(req.query.page)) : 1;
        const limit = Number(req.query.limit) > 0 ? Math.floor(Number(req.query.limit)) : 10;
        const skip = (page - 1) * limit;

        const rawSearch =
            typeof req.body.search === "string"
                ? req.body.search
                : "";

        const search = rawSearch.trim();



        const filter: any = {};
        if (search) {
            const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // escape regex special chars
            filter.$or = [
                { title: { $regex: safe, $options: "i" } },
            ];
        }

        // ✅ If token exists and valid, we'll attach liked: boolean
        const userId = tryGetUserIdFromAuth(req);

        const [itemsRaw, total] = await Promise.all([
            postsModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            postsModel.countDocuments(filter),
        ]);

        // Default: no liked flags
        let items = itemsRaw.map((p) => ({ ...p, liked: false }));

        // Enrich with liked=true only if we have a valid userId
        if (userId && itemsRaw.length > 0) {
            const postIds = itemsRaw.map((p: any) => p._id);

            const likes = await likesModel
                .find({ userId, postId: { $in: postIds } })
                .select("postId")
                .lean();

            const likedSet = new Set(likes.map((l: any) => String(l.postId)));

            items = itemsRaw.map((p: any) => ({
                ...p,
                liked: likedSet.has(String(p._id)),
            }));
        }

        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            items,
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            search: search || null,
            likedEnabled: Boolean(userId), // helpful for frontend
        });
    } catch (err) {
        console.error("listPosts error:", err);
        return res.status(500).json({ message: "Failed to fetch posts" });
    }
};