import mongoose from "mongoose";

export async function connectDB(uri: string) {
  const conn = await mongoose.connect(uri);
  console.log(`MongoDB connected: ${conn.connection.host}`);
  return conn;
}
