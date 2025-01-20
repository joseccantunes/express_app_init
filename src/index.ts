import dotenv from "dotenv";
import { App } from "./app";
import { UserController } from "./controllers/userController";
import {AuthController} from "./controllers/authController";

dotenv.config();
const port = process.env.PORT;
const app = new App([new AuthController(), new UserController()], parseInt(port));

app.listen();
