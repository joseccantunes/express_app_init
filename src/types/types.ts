import { Request } from 'express';
import { IResult } from 'ua-parser-js';

import { IUser } from '../models';

export interface JwtPayload {
    id: string;
    iat: number;
    exp: number;
}

export interface IDevice extends IResult {
    deviceId: string | string[];
    ip: string;
}

export interface AppRequest extends Request {
    user?: IUser;
    deviceInfo?: IDevice;
}
