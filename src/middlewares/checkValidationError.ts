import {Request,Response,NextFunction}  from "express";
import { validationResult } from 'express-validator';




export const checkValidationError = (req: Request, res: Response, next:NextFunction) =>{

    // var waitTill = new Date(new Date().getTime() + (5 * 1000));
    // while(waitTill > new Date()){}
    let result: any = validationResult(req);

    if (!result.isEmpty()) {
        //returning first validation error
        res.status(400).json(
            {
                "error": result.array()[0].msg,
                "field": result.array()[0].param
            });
        return;
    } else{
        next();
    }
    
}
