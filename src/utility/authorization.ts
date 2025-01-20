import express from 'express';
import jwt from 'jsonwebtoken';

import { IUser, User } from '../models';
import { AppRequest, JwtPayload } from '../types/types';
import AppError from './appError';
import catchAsync from './catchAsync';

export const protect = catchAsync(async (req: AppRequest, resp: express.Response, next: express.NextFunction) => {
    // 1) Getting token and check of it's there
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Verification token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

    // 3) Check if user still exists
    const currentUser = (await User.findById(decoded.id)) as IUser;

    if (!currentUser) {
        return next(new AppError('The user belonging to this token does no longer exist.', 401));
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password! Please log in again.', 401));
    }

    req.user = currentUser;
    next();
});
