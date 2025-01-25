import express, { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import { IUser, User } from '../models';
import { AppRequest, JwtPayload } from '../types/types';
import AppError from '../utility/appError';
import catchAsync from '../utility/catchAsync';

export class AuthController {
    path = '/auth';
    router = express.Router();

    constructor() {
        this.initRoutes();
    }

    initRoutes() {
        this.router.post('/signup', this.signup);
        this.router.post('/login', this.login);
        this.router.post('/logout', this.logout);

        this.router.post('/forgotPassword', this.forgotPassword);
        this.router.patch('/resetPassword/:token', this.resetPassword);

        this.router.patch('/updatePassword', this.updatePassword);
        this.router.post('/refresh-token', this.refreshToken);

    }

    createSendToken = (user: Partial<IUser>, statusCode: number, resp: Response) => {
        const cookieOptions: Record<string, any> = {
            httpOnly: true,
            secure: false, // Set to true in production
            sameSite: 'strict',
        };

        if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

        const token = jwt.sign({ id: user.id } as JwtPayload, process.env.AUTH_ACCESS_TOKEN_SECRET, {
            expiresIn: process.env.AUTH_ACCESS_TOKEN_EXPIRES_IN,
        });

        const refreshToken = jwt.sign({ id: user.id } as JwtPayload, process.env.AUTH_REFRESH_TOKEN_SECRET, {
            expiresIn: process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN,
        });

        // Send tokens as HTTP-only cookies
        resp.cookie('refreshToken', refreshToken, {
            ...cookieOptions,
            path: '/api/auth/refresh-token', // Only sent to this endpoint
        });

        // Remove password from output
        user.password = undefined;

        resp.status(statusCode).json({
            status: 'success',
            token,
            data: {
                user,
            },
        });
    };

    signup = catchAsync(async (req: AppRequest, resp: Response, next: NextFunction) => {
        await User.init();

        const newUser = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm,
        });

        const url = `${req.protocol}://${req.get('host')}/me`;
        //await new Email(newUser, url).sendWelcome();

        this.createSendToken(newUser, 201, resp);
    });

    login = catchAsync(async (req: AppRequest, resp: Response, next: NextFunction) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new AppError('Please provide email and password!', 400));
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.correctPassword(password, user.password))) {
            return next(new AppError('Incorrect email or password', 401));
        }

        this.createSendToken(user, 200, resp);
    });

    logout = (req: Request, resp: Response) => {
        resp.cookie('refreshToken', 'loggedout', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true,
        });
        resp.status(200).json({ status: 'success' });
    };

    forgotPassword = catchAsync(async (req: Request, resp: Response, next: NextFunction) => {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return next(new AppError('There is no user with email address.', 404));
        }

        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        try {
            const resetURL = `${req.protocol}://${req.get('host')}/api/auth/resetPassword/${resetToken}`;
            console.log(resetURL);
            //await new Email(user, resetURL).sendPasswordReset();

            resp.status(200).json({
                status: 'success',
                message: 'Token sent to email!',
            });
        } catch (err) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });

            return next(new AppError('There was an error sending the email. Try again later!', 500));
        }
    });

    resetPassword = catchAsync(async (req: Request, resp: Response, next: NextFunction) => {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!user) {
            return next(new AppError('Token is invalid or has expired', 400));
        }

        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        this.createSendToken(user, 200, resp);
    });

    updatePassword = catchAsync(async (req: AppRequest, resp: Response, next: NextFunction) => {
        const user = await User.findById(req.user.id).select('+password');

        if (!(await user.correctPassword(req.body.oldPassword, user.password))) {
            return next(new AppError('Your current password is wrong.', 401));
        }

        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        await user.save();

        this.createSendToken(user, 200, resp);
    });

    refreshToken = catchAsync(async (req: Request, resp: Response, next: NextFunction) => {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return next(new AppError('No refresh token provided', 401));
        }

        const decoded = jwt.verify(refreshToken, process.env.AUTH_REFRESH_TOKEN_SECRET) as JwtPayload;

        const user = await User.findById(decoded.id);

        if (!user) {
            return next(new AppError('User no longer exists', 401));
        }

        this.createSendToken(user, 200, resp);
    });
}
