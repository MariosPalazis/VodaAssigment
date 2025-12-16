import * as dotenv from "dotenv";
dotenv.config();

import { app } from "./app";
import { connectDB } from "./db";

const port = Number(process.env.PORT) || 5000;

async function start() {
  try {
    await connectDB(process.env.MONGO_URL as string);

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

start();
