import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";

import { authRoute } from "./routes/authentication";
import { postsRoute } from "./routes/posts";

dotenv.config();

export const app = express();

// CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// If you already use cors() you usually don't need this manual header middleware,
// but keeping it because you already have it:
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, POST, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Routes
app.use("/api/authentication", authRoute);
app.use("/api/posts", postsRoute);

// If you have likesRoute:
// app.use("/api/likes", likesRoute);
