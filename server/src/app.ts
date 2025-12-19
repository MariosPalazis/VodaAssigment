// server/src/app.ts
import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import path from "path";

import { authRoute } from "./routes/authentication";
import { postsRoute } from "./routes/posts";

dotenv.config();

export const app = express();

// CORS – since frontend is served from the same origin (http://localhost:5000),
// we can just allow all for simplicity in this assignment.
app.use(cors());

app.use(express.json());

// Extra headers (optional, but you already had them)
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
// If you add more APIs, keep them under /api/...

// ----------------- Serve React build -----------------
// We copied client/dist → server/src/public
const publicPath = path.join(__dirname, "public");

// Serve static assets (JS, CSS, images, etc.)
app.use(express.static(publicPath));

// SPA fallback:
// Any non-API route should return index.html so React Router can handle it.
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(publicPath, "index.html"));
});
