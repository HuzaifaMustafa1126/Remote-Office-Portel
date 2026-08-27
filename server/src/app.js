import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import env from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import notFound from "./middleware/notFound.middleware.js";
const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
if (env.NODE_ENV !== "test") app.use(morgan("dev"));
app.get("/health", (req, res) =>
  res.json({ success: true, message: "Remote Office Portal API is healthy" }),
);
app.use("/api/v1", routes);
app.use(notFound);
app.use(errorHandler);
export default app;
