import express from "express";
import {RequestValidation} from "../utility/request-validator";
import {UserService} from "../services";
import {APP_ERROR_MESSAGE, HTTP_RESPONSE_CODE} from "../constants/constant";
import {IUser, User} from "../models";
import {AppRequest} from "../types/types";
import {getOne} from "../utility/handlerFactory";
import {protect} from "../utility/authorization";

export class UserController {
    path = "/users";
    router = express.Router();

    constructor() {
        this.initRoutes();
    }

    initRoutes() {
        this.router.use(protect);
        this.router.get(this.path + "/me", this.getMe, this.getUser);
    }

    private getMe= (req: AppRequest, resp: express.Response, next: express.NextFunction) => {
        req.params.id = req.user.id;
        next();
    }

    private getUser = getOne(User);

}
