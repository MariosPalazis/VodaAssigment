import { Request, Response } from "express";
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { IUsers, usersModel } from "../models/users";
import { RequestHandler } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();


export const login: RequestHandler = async (req: Request, res: Response): Promise<any> => {
    try {
        //check if user exists
        let user: IUsers | null = await usersModel.findByEmail(req.body.email);
        if (!user) {
            res.status(401).json({
                "error": "Wrong username or password",
            });
            return;
        }

        if (user.password) {
            const validPass = await bcrypt.compare(req.body.password, user.password);
            if (!validPass) return res.status(400).send('Wrong Username / Password');
        } else {
            res.status(401).json({
                "error": "No password set for this user, propably registered with Google",
            });
            return;
        }


        //on success asign a new token
        const token = jwt.sign({ _id: user._id }, String(process.env.TOKEN_SECRET));
   
        //return the token in the response to the user + additional info
        res.status(200).send({
            token: token,
            info: {
                name: user.name
            }
        });
    } catch (err) {
        res.status(500).send("Server error: ");
    }

}



export const register: RequestHandler = async (req: Request, res: Response): Promise<any> => {
    console.log("Registering user: ", req.body.email);
    try {
        //check email exists
        let user: IUsers | null = await usersModel.findByEmail(req.body.email);
        if (user) return res.status(400).send("User Already Exists");

        const hashedPassword = await bcrypt.hash(req.body.password, 12);

        user = new usersModel({
            email: req.body.email,
            name: req.body.name,
            password: hashedPassword,
        });

        await user.save();
        const secret: string = process.env.TOKEN_SECRET || "";
        if (secret === "") return res.status(500).send("Server Error");
        //assign new token
        const token = jwt.sign({ _id: user._id }, secret);
        //and send it to user in response + additional info
        res.status(200).send({
            token: token,
            info: {
                name: user.name,
            }
        });
    } catch (err) {
        console.error("Error during registration: ", err);
        res.status(500).send("Server error ");
    }
}
