import { Request, Response, NextFunction } from 'express';
import {AppRequest} from "../types/types";

const asyncHandler = (fn: (req: AppRequest, resp: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, resp: Response, next: NextFunction) => {
    fn(req, resp, next).catch((err: any) => next(err));
  };
};

export default asyncHandler;
