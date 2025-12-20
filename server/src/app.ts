// server/src/app.ts
import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import path from "path";

import { authRoute } from "./routes/authentication";
import { postsRoute } from "./routes/posts";

dotenv.config();

export const app = express();

// CORS – simple & permissive for now
app.use(
  cors({
    origin: "*",
    credentials: false,
  })
);

app.use(express.json());

// Optional extra headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// ----------------- API routes -----------------
app.use("/api/authentication", authRoute);
app.use("/api/posts", postsRoute);

const clientDistPath = path.resolve(__dirname, "..", "..", "client", "dist");

// Serve static assets (JS, CSS, images)
app.use(express.static(clientDistPath));

// SPA fallback: non-API routes -> index.html
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, "index.html"));
});
