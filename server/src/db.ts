import mongoose from "mongoose";
import { seedPostsIfEmpty } from "./utils/seedPosts";

export async function connectDB(uri: string) {
  const conn = await mongoose.connect(uri);
  console.log(`MongoDB connected: ${conn.connection.host}`);
  await seedPostsIfEmpty();
  return conn;
}
