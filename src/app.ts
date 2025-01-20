import express from "express";
import mongoose from "mongoose";
import errorMiddleware from "./middlewares/error.middleware";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import hpp from "hpp";
import AppError from "./utility/appError";
import deepSanitize from "./utility/deepSanitize";
import compression from "compression";

export class App {
  public app: express.Application;
  public port: number;

  constructor(controllers: unknown, port: number) {
    this.app = express();
    this.app.disable('x-powered-by');

    this.corsMiddleWares();
    this.initLogging();
    this.port = port;
    this.connectDB();
    this.initMiddleWares();
    this.initControllers(controllers);
    this.initErrorHandling();
  }

  private connectDB() {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };
    mongoose
      .connect(process.env.DATABASE, options)
      .then(() => console.log("MongoDB connected successfully"))
      .catch((err) => console.log(err));
  }

  private initLogging() {
    if (process.env.NODE_ENV === 'development') {
      // Middleware to log requests
      this.app.use(morgan('dev'));
    }
  }

  private initMiddleWares() {
    // Limit requests from same API
    const limiter = rateLimit({
      limit: 100,
      windowMs: 60 * 60 * 1000, //1h
      message: 'Too many requests from this IP, please try again in an hour',
    });

    this.app.use('/', limiter);
    this.app.use(express.json({ limit: '10kb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10kb' }));
    this.app.use(cookieParser());
    this.app.use(mongoSanitize());
    this.app.use(helmet());

    // Data sanitization against XSS
    this.app.use((req, res, next) => {
      req.body = deepSanitize(req.body);
      next();
    });

    // Prevent parameter pollution like multiple sort, select what makes it an array
    this.app.use(hpp());

    // Compress text sent to clients
    this.app.use(compression());
  }

  private corsMiddleWares() {
    this.app.use(cors());
  }

  // private cors() {
  //   this.app.use(function (req, res, next) {
  //     res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  //     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  //     res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  //     next();
  //   });
  // }


  private initControllers(controllers: any) {
    for (const controller of controllers) {
      this.app.use("/api/", controller.router);
    }
  }

  private initErrorHandling() {
    this.app.all('*', (req, resp, next) => {
      next(new AppError(`Can't find ${req.originalUrl} on this server`, 400));
    });

    this.app.use(errorMiddleware);
  }

  public listen() {
    this.app.listen(this.port, () => {
      console.log(`Server is now running on port ${this.port}`);
    });
  }
}
