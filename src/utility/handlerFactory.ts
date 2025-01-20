import { NextFunction, Request, Response } from 'express';
import { Document, Model } from 'mongoose';

import APIFeatures from './apiFeatures';
import AppError from './appError';
import catchAsync from './catchAsync';

// Generic function for getting a single document by ID with optional population
export const getOne = (Model: Model<Document>, popOptions?: string) =>
    catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        let query = Model.findById(req.params.id);
        if (popOptions) {
            query = query.populate(popOptions);
        }

        const doc = await query;

        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: doc,
        });
    });

// Generic function for deleting a document by ID
export const deleteOne = (Model: Model<Document>) =>
    catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const doc = await Model.findByIdAndDelete(req.params.id);

        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }

        res.status(204).json({
            status: 'success',
            data: null,
        });
    });

// Generic function for updating a document by ID
export const updateOne = (Model: Model<Document>) =>
    catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                data: doc,
            },
        });
    });

// Generic function for creating a new document
export const createOne = (Model: Model<Document>) =>
    catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const doc = await Model.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                data: doc,
            },
        });
    });

// Generic function for getting all documents with query features
export const getAll = (Model: Model<Document>) =>
    catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        let filter: Record<string, unknown> = {};
        if (req.params.tourId) filter = { tour: req.params.tourId };

        const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().paginate();

        const doc = await features.query;

        res.status(200).json({
            status: 'success',
            results: doc.length,
            data: {
                data: doc,
            },
        });
    });
