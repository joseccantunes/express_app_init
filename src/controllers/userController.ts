import express from 'express';

import { User } from '../models';
import { AppRequest } from '../types/types';
import { protect } from '../utility/authorization';
import { getOne } from '../utility/handlerFactory';

export class UserController {
    path = '/users';
    router = express.Router();

    constructor() {
        this.initRoutes();
    }

    initRoutes() {
        this.router.use(protect);
        this.router.get('/me', this.getMe, this.getUser);
    }

    private getMe = (req: AppRequest, resp: express.Response, next: express.NextFunction) => {
        req.params.id = req.user.id;
        next();
    };

    private getUser = getOne(User);
}
