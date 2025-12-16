// src/utils/seedPosts.ts
import mongoose from "mongoose";
import { postsModel } from "../models/posts";

export async function seedPostsIfEmpty(): Promise<void> {
  const count = await postsModel.countDocuments();

  if (count > 0) {
    console.log(`[seed] posts already exist (${count}), skipping`);
    return;
  }

  console.log("[seed] posts empty, fetching from JSONPlaceholder…");

  const res = await fetch("https://jsonplaceholder.typicode.com/posts");

  if (!res.ok) {
    throw new Error(`Failed to fetch posts: ${res.status}`);
  }

  const data: Array<{
    userId: number;
    id: number;
    title: string;
    body: string;
  }> = await res.json();

  // Your schema requires ObjectId, JSONPlaceholder gives numbers
  const seedUserId = new mongoose.Types.ObjectId();

  const docs = data.map((p) => ({
    userId: seedUserId,
    title: p.title,
    body: p.body,
  }));

  await postsModel.insertMany(docs);

  console.log(`[seed] inserted ${docs.length} posts`);
}
