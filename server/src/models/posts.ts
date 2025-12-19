// models/User.ts
import mongoose, { Schema, SchemaTypes, model, Document, Model } from 'mongoose';


export interface Posts {
    userId: mongoose.Types.ObjectId;
    title: string;
    body: string;
}

export interface IPosts extends Posts, mongoose.Document { }


export interface IPostsModel extends mongoose.Model<IPosts> {
    findByUser(userId: string): Promise<IPosts | null>;
}

const PostsModel = new Schema<IPosts, IPostsModel>(
    {
        userId: { type: SchemaTypes.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        body: { type: String, required: true }
    },
    { timestamps: true }
);

PostsModel.index({ createdAt: -1 });

// Static: findByUser
PostsModel.statics.findByUser = function (userId: string) {
    return this.findOne({ userId });
};


export const postsModel: IPostsModel = mongoose.model<IPosts, IPostsModel>("Post", PostsModel, "posts");
