import request from "supertest";
import { expect } from "chai";
import mongoose from "mongoose";

import { app } from "../app";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./helpers/testDb";
import { signToken, authHeader } from "./helpers/auth";

import { usersModel } from "../models/users";
import { postsModel } from "../models/posts";
import { likesModel } from "../models/likes";

const POSTS_LIST_URL = "/api/posts";
const POSTS_CREATE_URL = "/api/posts/create";
const LIKE_URL = (postId: string) => `/api/posts/${postId}/like`;
const CLEAR_LIKES_URL = "/api/posts/clear/likes";

describe("API: Posts + Likes (/api/posts)", function () {
  before(async () => {
    process.env.TOKEN_SECRET = process.env.TOKEN_SECRET || "test-secret";
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
      title: `Post title ${i} ${i % 2 === 0 ? "banana" : "apple"}`,
      body: `Body text ${i}`,
    }));
    await postsModel.insertMany(docs);
  }

  //
  // LIST + SEARCH
  //
  describe(`POST ${POSTS_LIST_URL} (public list & search)`, () => {
    it("1) returns paginated list with defaults (page=1, limit=10) and liked=false", async () => {
      await seedPosts(23);

      const res = await request(app)
        .post(POSTS_LIST_URL)
        .expect(200);

      expect(res.body.items).to.be.an("array");
      expect(res.body.items.length).to.equal(10);
      expect(res.body.page).to.equal(1);
      expect(res.body.limit).to.equal(10);
      expect(res.body.total).to.equal(23);
      expect(res.body.items[0].liked).to.equal(false);
    });

    it("2) supports pagination via QUERY (?page=2&limit=5)", async () => {
      await seedPosts(12);

      const res = await request(app)
        .post(`${POSTS_LIST_URL}?page=2&limit=5`)
        .send({})
        .expect(200);

      expect(res.body.items.length).to.equal(5);
      expect(res.body.page).to.equal(2);
      expect(res.body.limit).to.equal(5);
      expect(res.body.total).to.equal(12);
    });

    it("3) validates page/limit via QUERY (page>0, limit 1..1000)", async () => {
      await seedPosts(5);

      await request(app).post(`${POSTS_LIST_URL}?page=0`).expect(400);
      await request(app).post(`${POSTS_LIST_URL}?limit=0`).expect(400);
      await request(app).post(`${POSTS_LIST_URL}?page=-1`).expect(400);
      await request(app).post(`${POSTS_LIST_URL}?limit=1001`).expect(400);
    });

    it("4) returns empty list when there are no posts", async () => {
      const res = await request(app)
        .post(POSTS_LIST_URL)
        .expect(200);

      expect(res.body.items).to.be.an("array");
      expect(res.body.items.length).to.equal(0);
      expect(res.body.total).to.equal(0);
    });

    it("5) supports search via BODY on TITLE ONLY (contains)", async () => {
      await seedPosts(20);

      const res = await request(app)
        .post(POSTS_LIST_URL)
        .send({ search: "banana" })
        .expect(200);

      expect(res.body.items.length).to.be.greaterThan(0);

      for (const p of res.body.items) {
        const t = String(p.title).toLowerCase();
        expect(t.includes("banana")).to.equal(true);
      }
    });

    it("6) search with no matches returns empty array", async () => {
      await seedPosts(10);

      const res = await request(app)
        .post(POSTS_LIST_URL)
        .send({ search: "THISWILLNOTMATCHANYTHING" })
        .expect(200);

      expect(res.body.items).to.be.an("array");
      expect(res.body.items.length).to.equal(0);
      expect(res.body.total).to.equal(0);
    });

    it("7) pagination beyond last page returns empty items", async () => {
      await seedPosts(8);

      const res = await request(app)
        .post(`${POSTS_LIST_URL}?page=5&limit=5`)
        .send({})
        .expect(200);

      expect(res.body.items.length).to.equal(0);
      expect(res.body.page).to.equal(5);
      expect(res.body.total).to.equal(8);
    });

    it("8) optionally enriches liked=true when valid token", async () => {
      const user = await createUser("u@u.com", "User");
      const token = signToken(String(user._id));

      const [p1, p2, p3] = await postsModel.create([
        { userId: user._id, title: "A banana", body: "A body" },
        { userId: user._id, title: "B banana", body: "B body" },
        { userId: user._id, title: "C banana", body: "C body" },
      ]);

      await likesModel.create({ userId: user._id, postId: p2._id });

      const res = await request(app)
        .post(POSTS_LIST_URL)
        .set("Authorization", authHeader(token))
        .send({})
        .expect(200);

      expect(res.body.likedEnabled).to.equal(true);

      const likedMap = new Map(res.body.items.map((x: any) => [String(x._id), x.liked]));

      expect(likedMap.get(String(p1._id))).to.equal(false);
      expect(likedMap.get(String(p2._id))).to.equal(true);
      expect(likedMap.get(String(p3._id))).to.equal(false);
    });

    it("9) invalid token should not break public endpoint", async () => {
      await seedPosts(5);

      const res = await request(app)
        .post(POSTS_LIST_URL)
        .set("Authorization", "Bearer wrong")
        .send({})
        .expect(200);

      expect(res.body.likedEnabled).to.equal(false);
      expect(res.body.items[0].liked).to.equal(false);
    });
  });

  //
  // CREATE POST
  //
  describe(`POST ${POSTS_CREATE_URL}`, () => {
    it("10) rejects unauthenticated", async () => {
      await request(app)
        .post(POSTS_CREATE_URL)
        .send({ title: "Hi", body: "Body" })
        .expect(401);
    });

    it("11) rejects missing fields", async () => {
      const user = await createUser("c@c.com", "Creator");
      const token = signToken(String(user._id));

      await request(app)
        .post(POSTS_CREATE_URL)
        .set("Authorization", authHeader(token))
        .send({ title: "", body: "Body" })
        .expect(400);

      await request(app)
        .post(POSTS_CREATE_URL)
        .set("Authorization", authHeader(token))
        .send({ title: "Title", body: "" })
        .expect(400);
    });

    it("12) creates post for authenticated user", async () => {
      const user = await createUser("c2@c2.com", "Creator2");
      const token = signToken(String(user._id));

      const res = await request(app)
        .post(POSTS_CREATE_URL)
        .set("Authorization", authHeader(token))
        .send({ title: "My title", body: "My body" })
        .expect(201);

      expect(res.body.title).to.equal("My title");
      expect(res.body.body).to.equal("My body");
      expect(String(res.body.userId)).to.equal(String(user._id));

      const inDb = await postsModel.findById(res.body._id).lean();
      expect(inDb).to.not.equal(null);
    });
  });

  //
  // DELETE POST
  //
  describe("DELETE /api/posts/:postId", () => {
    it("13) rejects unauthenticated delete", async () => {
      const post = await postsModel.create({
        userId: new mongoose.Types.ObjectId(),
        title: "T",
        body: "B",
      });

      await request(app).delete(`/api/posts/${post._id}`).expect(401);
    });

    it("14) invalid postId returns 400", async () => {
      const user = await createUser("del@x.com", "Del");
      const token = signToken(String(user._id));

      await request(app)
        .delete(`/api/posts/not-a-valid-id`)
        .set("Authorization", authHeader(token))
        .expect(400);
    });

    it("15) cannot delete another user's post (expects 404 / not found)", async () => {
      const owner = await createUser("owner@x.com", "Owner");
      const attacker = await createUser("attacker@x.com", "Attacker");
      const token = signToken(String(attacker._id));

      const post = await postsModel.create({
        userId: owner._id,
        title: "Owner post",
        body: "Owner body",
      });

      const res = await request(app)
        .delete(`/api/posts/${post._id}`)
        .set("Authorization", authHeader(token))
        .expect(404);

      expect(res.body.message).to.match(/not found|permission/i);

      const stillThere = await postsModel.findById(post._id).lean();
      expect(stillThere).to.not.equal(null);
    });

    it("16) can delete own post", async () => {
      const user = await createUser("self@x.com", "Self");
      const token = signToken(String(user._id));

      const post = await postsModel.create({
        userId: user._id,
        title: "My post",
        body: "My body",
      });

      await request(app)
        .delete(`/api/posts/${post._id}`)
        .set("Authorization", authHeader(token))
        .expect(200);

      const gone = await postsModel.findById(post._id).lean();
      expect(gone).to.equal(null);
    });
  });

  //
  // LIKES
  //
  describe("POST/DELETE /api/posts/:postId/like", () => {
    it("17) rejects like/unlike when unauthenticated", async () => {
      const post = await postsModel.create({
        userId: new mongoose.Types.ObjectId(),
        title: "T",
        body: "B",
      });

      await request(app).post(LIKE_URL(String(post._id))).expect(401);
      await request(app).delete(LIKE_URL(String(post._id))).expect(401);
    });

    it("18) liking non-existing post returns 404", async () => {
      const user = await createUser("l@x.com", "Liker");
      const token = signToken(String(user._id));
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .post(LIKE_URL(String(fakeId)))
        .set("Authorization", authHeader(token))
        .expect(404);
    });

    it("19) liking twice creates only one like, second returns 200, then unlike removes it", async () => {
      const user = await createUser("l2@x.com", "Liker2");
      const token = signToken(String(user._id));

      const post = await postsModel.create({
        userId: user._id,
        title: "P",
        body: "B",
      });

      // first like
      await request(app)
        .post(LIKE_URL(String(post._id)))
        .set("Authorization", authHeader(token))
        .expect(201);

      // second like (idempotent / 200, no new doc)
      await request(app)
        .post(LIKE_URL(String(post._id)))
        .set("Authorization", authHeader(token))
        .expect(200);

      const count = await likesModel.countDocuments({ userId: user._id, postId: post._id });
      expect(count).to.equal(1);

      // unlike
      await request(app)
        .delete(LIKE_URL(String(post._id)))
        .set("Authorization", authHeader(token))
        .expect(200);

      const after = await likesModel.countDocuments({ userId: user._id, postId: post._id });
      expect(after).to.equal(0);
    });
  });

  //
  // CLEAR LIKES
  //
  describe(`DELETE ${CLEAR_LIKES_URL}`, () => {
    it("20) clears only the authenticated user's likes", async () => {
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

      const res1 = await request(app)
        .delete(CLEAR_LIKES_URL)
        .set("Authorization", authHeader(t1))
        .expect(200);

      expect(res1.body.deletedCount).to.equal(2);

      const u1LikesAfter = await likesModel.countDocuments({ userId: u1._id });
      const u2LikesAfter = await likesModel.countDocuments({ userId: u2._id });

      expect(u1LikesAfter).to.equal(0);
      expect(u2LikesAfter).to.equal(1);

      const res2 = await request(app)
        .delete(CLEAR_LIKES_URL)
        .set("Authorization", authHeader(t2))
        .expect(200);

      expect(res2.body.deletedCount).to.equal(1);
    });
  });
});
