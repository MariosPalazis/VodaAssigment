import request from "supertest";
import { expect } from "chai";
import mongoose from "mongoose";

import { app } from "../app";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./helpers/testDb";
import { signToken, authHeader } from "./helpers/auth";

import { usersModel } from "../models/users";
import { postsModel } from "../models/posts";
import { likesModel } from "../models/likes";

const POSTS_URL = "/api/posts";
const LIKE_URL = (postId: string) => `/api/posts/${postId}/like`;
const CLEAR_LIKES_URL = "/api/posts/clear/likes";

describe("API: Posts + Likes (/api/posts)", function () {
  before(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
    await connectTestDB();
  });

  after(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  async function createUser(email = "a@a.com", name = "A") {
    return usersModel.create({ email, password: "Password123!", name });
  }

  async function seedPosts(count = 25, userId?: mongoose.Types.ObjectId) {
    const docs = Array.from({ length: count }).map((_, i) => ({
      userId: userId ?? new mongoose.Types.ObjectId(),
      title: `Post title ${i}`,
      body: i % 2 === 0 ? `Body with banana ${i}` : `Body with apple ${i}`,
    }));
    await postsModel.insertMany(docs);
  }

  describe(`GET ${POSTS_URL} (public)`, () => {
    it("returns paginated list with defaults (page=1, limit=10) and liked=false", async () => {
      await seedPosts(23);

      const res = await request(app).get(POSTS_URL).expect(200);

      expect(res.body.items).to.be.an("array");
      expect(res.body.items.length).to.equal(10);

      expect(res.body.page).to.equal(1);
      expect(res.body.limit).to.equal(10);
      expect(res.body.total).to.equal(23);
      expect(res.body.totalPages).to.equal(Math.ceil(23 / 10));

      expect(res.body.items[0]).to.have.property("liked");
      expect(res.body.items[0].liked).to.equal(false);
    });

    it("supports pagination (?page=2&limit=5)", async () => {
      await seedPosts(12);

      const res = await request(app).get(`${POSTS_URL}?page=2&limit=5`).expect(200);

      expect(res.body.items).to.be.an("array");
      expect(res.body.items.length).to.equal(5);
      expect(res.body.page).to.equal(2);
      expect(res.body.limit).to.equal(5);
      expect(res.body.total).to.equal(12);
    });

    it("validates page/limit via express-validator (page>0, limit 1..1000)", async () => {
      await seedPosts(5);

      await request(app).get(`${POSTS_URL}?page=0`).expect(400);
      await request(app).get(`${POSTS_URL}?limit=0`).expect(400);
      await request(app).get(`${POSTS_URL}?page=-1&limit=-10`).expect(400);
      await request(app).get(`${POSTS_URL}?limit=1001`).expect(400);
    });

    it("supports search via ?search=term (title/body based on your filter)", async () => {
      await seedPosts(20);

      const res = await request(app).get(`${POSTS_URL}?search=banana&limit=1000`).expect(200);

      expect(res.body.items).to.be.an("array");
      expect(res.body.items.length).to.be.greaterThan(0);

      for (const p of res.body.items) {
        const t = String(p.title).toLowerCase();
        const b = String(p.body).toLowerCase();
        expect(t.includes("banana") || b.includes("banana")).to.equal(true);
      }
    });

    it("optionally enriches liked=true when a valid token is present", async () => {
      const user = await createUser("u@u.com", "User");
      const token = signToken(String(user._id));

      const [p1, p2, p3] = await postsModel.create([
        { userId: user._id, title: "A", body: "A body" },
        { userId: user._id, title: "B", body: "B body" },
        { userId: user._id, title: "C", body: "C body" },
      ]);

      await likesModel.create({ userId: user._id, postId: p2._id });

      const res = await request(app)
        .get(`${POSTS_URL}?limit=10`)
        .set("Authorization", authHeader(token))
        .expect(200);

      expect(res.body.likedEnabled).to.equal(true);

      const likedMap = new Map(res.body.items.map((x: any) => [String(x._id), x.liked]));
      expect(likedMap.get(String(p1._id))).to.equal(false);
      expect(likedMap.get(String(p2._id))).to.equal(true);
      expect(likedMap.get(String(p3._id))).to.equal(false);
    });

    it("invalid token should not break public endpoint (likedEnabled=false)", async () => {
      await seedPosts(5);

      const res = await request(app)
        .get(POSTS_URL)
        .set("Authorization", "Bearer invalid.token.here")
        .expect(200);

      expect(res.body.likedEnabled).to.equal(false);
      expect(res.body.items[0].liked).to.equal(false);
    });
  });

  describe(`POST ${POSTS_URL} (create post)`, () => {
    it("rejects unauthenticated (401)", async () => {
      await request(app).post(POSTS_URL).send({ title: "Hi", body: "Body" }).expect(401);
    });

    it("rejects missing title/body (400)", async () => {
      const user = await createUser("c@c.com", "Creator");
      const token = signToken(String(user._id));

      await request(app)
        .post(POSTS_URL)
        .set("Authorization", authHeader(token))
        .send({ title: "", body: "Body" })
        .expect(400);

      await request(app)
        .post(POSTS_URL)
        .set("Authorization", authHeader(token))
        .send({ title: "Title", body: "" })
        .expect(400);
    });

    it("creates post for authenticated user (201)", async () => {
      const user = await createUser("c2@c2.com", "Creator2");
      const token = signToken(String(user._id));

      const res = await request(app)
        .post(POSTS_URL)
        .set("Authorization", authHeader(token))
        .send({ title: "My title", body: "My body" })
        .expect(201);

      expect(res.body).to.have.property("_id");
      expect(res.body.title).to.equal("My title");
      expect(res.body.body).to.equal("My body");
      expect(String(res.body.userId)).to.equal(String(user._id));

      const inDb = await postsModel.findById(res.body._id).lean();
      expect(inDb).to.not.equal(null);
    });
  });

  describe(`DELETE ${POSTS_URL}/:postId (delete post)`, () => {
    it("rejects unauthenticated (401)", async () => {
      const post = await postsModel.create({
        userId: new mongoose.Types.ObjectId(),
        title: "T",
        body: "B",
      });

      await request(app).delete(`${POSTS_URL}/${post._id}`).expect(401);
    });

    it("invalid postId => 400", async () => {
      const user = await createUser("d@d.com", "Deleter");
      const token = signToken(String(user._id));

      await request(app)
        .delete(`${POSTS_URL}/not-a-mongo-id`)
        .set("Authorization", authHeader(token))
        .expect(400);
    });

    it("cannot delete someone else’s post (404 / not found or permission)", async () => {
      const owner = await createUser("owner@x.com", "Owner");
      const attacker = await createUser("attacker@x.com", "Attacker");
      const token = signToken(String(attacker._id));

      const post = await postsModel.create({
        userId: owner._id,
        title: "Owner post",
        body: "Owner body",
      });

      const res = await request(app)
        .delete(`${POSTS_URL}/${post._id}`)
        .set("Authorization", authHeader(token))
        .expect(404);

      expect(res.body.message).to.match(/not found|permission/i);

      const stillThere = await postsModel.findById(post._id).lean();
      expect(stillThere).to.not.equal(null);
    });

    it("can delete own post (200) and removes it from DB", async () => {
      const user = await createUser("self@x.com", "Self");
      const token = signToken(String(user._id));

      const post = await postsModel.create({
        userId: user._id,
        title: "My post",
        body: "My body",
      });

      await request(app)
        .delete(`${POSTS_URL}/${post._id}`)
        .set("Authorization", authHeader(token))
        .expect(200);

      const gone = await postsModel.findById(post._id).lean();
      expect(gone).to.equal(null);
    });
  });

  describe("POST/DELETE /api/posts/:postId/like", () => {
    it("rejects unauthenticated like/unlike (401)", async () => {
      const post = await postsModel.create({
        userId: new mongoose.Types.ObjectId(),
        title: "T",
        body: "B",
      });

      await request(app).post(LIKE_URL(String(post._id))).expect(401);
      await request(app).delete(LIKE_URL(String(post._id))).expect(401);
    });

    it("liking a non-existing post => 404", async () => {
      const user = await createUser("l@x.com", "Liker");
      const token = signToken(String(user._id));
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .post(LIKE_URL(String(fakeId)))
        .set("Authorization", authHeader(token))
        .expect(404);
    });

    it("likes a post (201) and stores in DB", async () => {
      const user = await createUser("l2@x.com", "Liker2");
      const token = signToken(String(user._id));

      const post = await postsModel.create({
        userId: user._id,
        title: "P",
        body: "B",
      });

      const res = await request(app)
        .post(LIKE_URL(String(post._id)))
        .set("Authorization", authHeader(token))
        .expect(201);

      expect(res.body.liked).to.equal(true);

      const like = await likesModel.findOne({ userId: user._id, postId: post._id }).lean();
      expect(like).to.not.equal(null);
    });

    it("liking twice does not duplicate (unique index), second call returns 200", async () => {
      const user = await createUser("l3@x.com", "Liker3");
      const token = signToken(String(user._id));

      const post = await postsModel.create({
        userId: user._id,
        title: "P",
        body: "B",
      });

      await request(app)
        .post(LIKE_URL(String(post._id)))
        .set("Authorization", authHeader(token))
        .expect(201);

      await request(app)
        .post(LIKE_URL(String(post._id)))
        .set("Authorization", authHeader(token))
        .expect(200);

      const count = await likesModel.countDocuments({ userId: user._id, postId: post._id });
      expect(count).to.equal(1);
    });

    it("unlikes a post and removes from DB", async () => {
      const user = await createUser("u@u2.com", "Unliker");
      const token = signToken(String(user._id));

      const post = await postsModel.create({
        userId: user._id,
        title: "P",
        body: "B",
      });

      await likesModel.create({ userId: user._id, postId: post._id });

      const res = await request(app)
        .delete(LIKE_URL(String(post._id)))
        .set("Authorization", authHeader(token))
        .expect(200);

      expect(res.body.liked).to.equal(false);

      const like = await likesModel.findOne({ userId: user._id, postId: post._id }).lean();
      expect(like).to.equal(null);
    });
  });

  describe(`DELETE ${CLEAR_LIKES_URL} (clear all likes)`, () => {
    it("rejects unauthenticated (401)", async () => {
      await request(app).delete(CLEAR_LIKES_URL).expect(401);
    });

    it("clears only the authenticated user's likes", async () => {
      const u1 = await createUser("c1@x.com", "C1");
      const u2 = await createUser("c2@x.com", "C2");
      const t1 = signToken(String(u1._id));
      const t2 = signToken(String(u2._id));

      const p1 = await postsModel.create({ userId: u1._id, title: "P1", body: "B1" });
      const p2 = await postsModel.create({ userId: u1._id, title: "P2", body: "B2" });
      const p3 = await postsModel.create({ userId: u2._id, title: "P3", body: "B3" });

      await likesModel.create({ userId: u1._id, postId: p1._id });
      await likesModel.create({ userId: u1._id, postId: p2._id });
      await likesModel.create({ userId: u2._id, postId: p3._id });

      const res = await request(app)
        .delete(CLEAR_LIKES_URL)
        .set("Authorization", authHeader(t1))
        .expect(200);

      expect(res.body.deletedCount).to.equal(2);

      const u1Likes = await likesModel.countDocuments({ userId: u1._id });
      const u2Likes = await likesModel.countDocuments({ userId: u2._id });
      expect(u1Likes).to.equal(0);
      expect(u2Likes).to.equal(1);

      const res2 = await request(app)
        .delete(CLEAR_LIKES_URL)
        .set("Authorization", authHeader(t2))
        .expect(200);

      expect(res2.body.deletedCount).to.equal(1);
    });
  });
});
