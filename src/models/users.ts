// models/User.ts
import mongoose, { Schema, Types } from "mongoose";


export interface Users {
    email: string;
    password?: string;
    name: string;
}

export interface IUsers extends Users, mongoose.Document { }


export interface IUsersModel extends mongoose.Model<IUsers> {
    findByEmail(email: string): Promise<IUsers | null>;
}

const UsersModel = new Schema<IUsers, IUsersModel>(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        name: { type: String, required: true }
    },
    { timestamps: true }
);


// Static: findByEmail
UsersModel.statics.findByEmail = function (email: string) {
    return this.findOne({ email });
};


export const usersModel: IUsersModel = mongoose.model<IUsers, IUsersModel>("User", UsersModel, "users");
