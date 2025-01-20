import { NextFunction, Request, Response } from 'express';

import AppError from '../utility/appError';

// Define the custom error interfaces
interface ErrorWithStatusCode extends Error {
    statusCode?: number;
    status?: string;
    isOperational?: boolean;
    path?: string;
    value?: string;
    code?: number;
    errors?: Record<string, { message: string }>;
}

// Error handlers
const handleCastErrorDB = (err: ErrorWithStatusCode): AppError => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: ErrorWithStatusCode): AppError => {
    const match = err.message?.match(/(["'])(\\?.)*?\1/);
    const value = match ? match[0] : 'unknown value';

    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err: ErrorWithStatusCode): AppError => {
    const errors = Object.values(err.errors || {}).map((el) => el.message);

    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = (): AppError => new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = (): AppError => new AppError('Invalid token. Please log in again', 401);

// Error responses
const sendErrorDev = (err: ErrorWithStatusCode, req: Request, res: Response): void => {
    res.status(err.statusCode || 500).json({
        status: err.status || 'error',
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

const sendErrorProd = (err: ErrorWithStatusCode, req: Request, res: Response): void => {
    if (err.isOperational) {
        res.status(err.statusCode || 500).json({
            status: err.status || 'error',
            message: err.message,
        });
        return;
    }

    // Programming or unknown error
    console.error('ERROR 💥', err);
    res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!',
    });
    return;
};

const errorMiddleware = (err: ErrorWithStatusCode, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else {
        let error = { ...err } as ErrorWithStatusCode;
        error.message = err.message;

        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, req, res);
    }
};

export default errorMiddleware;
