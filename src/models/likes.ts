// src/models/likes.ts
import mongoose, { Schema, SchemaTypes } from "mongoose";

export interface Likes {
  userId: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
}

export interface ILikes extends Likes, mongoose.Document {}

export interface ILikesModel extends mongoose.Model<ILikes> {
  findByUserAndPost(userId: string, postId: string): Promise<ILikes | null>;
}

const LikesSchema = new Schema<ILikes, ILikesModel>(
  {
    userId: {
      type: SchemaTypes.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    postId: {
      type: SchemaTypes.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate likes
LikesSchema.index({ userId: 1, postId: 1 }, { unique: true });

// Static helper
LikesSchema.statics.findByUserAndPost = function (
  userId: string,
  postId: string
) {
  return this.findOne({ userId, postId });
};

export const likesModel = mongoose.model<ILikes, ILikesModel>(
  "Like",
  LikesSchema,
  "likes"
);
