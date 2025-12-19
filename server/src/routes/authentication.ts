import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { checkValidationError } from '../middlewares/checkValidationError';
import { login, register } from '../controllers/authentication';

export const authRoute = Router();


authRoute.post('/login', [
        body('email').notEmpty().trim().isEmail().escape(),
        body('password').notEmpty().trim().isLength({ min: 8 }).escape(),
    ],
    checkValidationError,
    login
);


authRoute.post('/register', [
        body('email').notEmpty().trim().isEmail().escape(),
        body('password').notEmpty().trim().isLength({ min: 8 }).escape(),
        body('name').notEmpty().trim().isLength({ min: 2 }).escape(),
    ],
    checkValidationError,
    register
);


