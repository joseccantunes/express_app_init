import dotenv from 'dotenv';

import { App } from './app';
import { AuthController } from './controllers/authController';
import { UserController } from './controllers/userController';

dotenv.config();
const port = process.env.PORT;
const app = new App([new AuthController(), new UserController()], parseInt(port));

app.listen();
