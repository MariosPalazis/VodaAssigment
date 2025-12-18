import { Router } from "express";
import { body, param, query } from "express-validator";
import { authMiddleware } from "../middlewares/authMiddleware";
import { createPost, deletePost, listPosts } from "../controllers/posts";
import { clearAllLikes, likePost, unlikePost } from "../controllers/likes";
import { checkValidationError } from "../middlewares/checkValidationError";


export const postsRoute = Router();



postsRoute.post(
  "/",
  [
    query("page")
      .optional()
      .isInt({ gt: 0 })
      .withMessage("page must be > 0"),

    query("limit")
      .optional()
      .isInt({ gt: 0, lt: 1001 })
      .withMessage("limit must be between 1 and 1000"),

    body("search")
      .optional({ checkFalsy: true }) // allows "", null
      .isString()
      .escape()
      .trim()
      .isLength({ max: 200 })
      .withMessage("search must be at most 200 chars"),
  ],
  listPosts
);


// CREATE (only owner)
postsRoute.post(
  "/create",
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
  checkValidationError,
  deletePost
);



// Like
postsRoute.post(
  "/:postId/like",
  authMiddleware,
  [param("postId").isMongoId().withMessage("Invalid postId")],
  checkValidationError, 
  likePost
);

// Unlike
postsRoute.delete(
  "/:postId/like",
  authMiddleware,
  [param("postId").isMongoId().withMessage("Invalid postId")],
  checkValidationError,
  unlikePost
);


postsRoute.delete(
  "/clear/likes",
  authMiddleware,
  checkValidationError,
  clearAllLikes
);
