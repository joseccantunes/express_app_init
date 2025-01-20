import {IUser} from "../models";
import {Request} from "express";

export interface JwtPayload {
    id: string;
    iat: number;
}

export interface AppRequest extends Request {
    user?: IUser;
}