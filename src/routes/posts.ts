import { Router } from "express";
import { body, param, query } from "express-validator";
import { authMiddleware } from "../middlewares/authMiddleware";
import { createPost, deletePost, listPosts } from "../controllers/posts";
import { clearAllLikes, likePost, unlikePost } from "../controllers/likes";


export const postsRoute = Router();


// GET /posts?page=1&limit=10
postsRoute.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ gt: 0 })
      .withMessage("page must be > 0"),

    query("limit")
      .optional()
      .isInt({ gt: 0, lt: 1001 }) // ✅ 1..1000
      .withMessage("limit must be between 1 and 1000"),

    query("search")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("search must be 1..100 chars"),
  ],
  listPosts
);

// CREATE (only owner)
postsRoute.post(
  "/",
  authMiddleware,
  [
    body("title").isString().trim().notEmpty().withMessage("title is required"),
    body("body").isString().trim().notEmpty().withMessage("body is required"),
  ],
  createPost
);

// DELETE (only owner)
postsRoute.delete(
  "/:postId",
  authMiddleware,
  [
    param("postId").isMongoId().withMessage("Invalid postId"),
  ],
  deletePost
);



// Like
postsRoute.post(
  "/:postId/like",
  authMiddleware,
  [param("postId").isMongoId().withMessage("Invalid postId")],
  likePost
);

// Unlike
postsRoute.delete(
  "/:postId/like",
  authMiddleware,
  [param("postId").isMongoId().withMessage("Invalid postId")],
  unlikePost
);


postsRoute.delete(
  "/clear/likes",
  authMiddleware,
  clearAllLikes
);
