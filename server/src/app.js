import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import env from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import notFound from "./middleware/notFound.middleware.js";
import { noStoreApi } from "./middleware/cache.middleware.js";
import { requestMetrics } from "./middleware/requestMetrics.middleware.js";
const app = express();
const corsOptions = {
  origin(origin, callback) {
    if (!origin || env.CORS_ORIGINS.includes(origin.replace(/\/$/, ""))) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
};

app.set("trust proxy", env.TRUST_PROXY_HOPS || false);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
if (env.NODE_ENV !== "test") app.use(morgan("dev"));
app.use(requestMetrics);
app.get("/health", noStoreApi, (req, res) =>
  res.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }),
);
app.use("/api", noStoreApi);
app.use("/api/v1", routes);
app.use(notFound);
app.use(errorHandler);
export default app;
