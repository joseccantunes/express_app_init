import { Request } from 'express';

import { IUser } from '../models';

export interface JwtPayload {
    id: string;
    iat: number;
}

export interface AppRequest extends Request {
    user?: IUser;
}
