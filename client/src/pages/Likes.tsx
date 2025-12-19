import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../hooks/reduxHooks";
import {
  selectAuthToken,
  selectAuthUser,
} from "../features/auth/authSlice";
import {
  listPostsApi,
  likePostApi,
  unlikePostApi,
  clearLikesApi,
} from "../api/posts";
import type { Post } from "../api/posts";


const Likes = () => {
  const token = useAppSelector(selectAuthToken);
  const user = useAppSelector(selectAuthUser);
  const navigate = useNavigate();

  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLiked = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      // get many posts, then filter by liked
      const data = await listPostsApi({
        page: 1,
        limit: 1000,
        search: "",
        token,
      });

      const liked = data.items.filter((p) => p.liked);
      setLikedPosts(liked);
    } catch (err) {
      setError("Failed to load liked posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchLiked();
  }, [token]);

  const handleUnlike = async (postId: string) => {
    if (!token) return;
    try {
      await unlikePostApi(postId, token);
      setLikedPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error("Failed to unlike", err);
    }
  };

  const handleClearAll = async () => {
    if (!token) return;
    if (!confirm("Clear all your likes?")) return;

    try {
      await clearLikesApi(token);
      setLikedPosts([]);
    } catch (err) {
      console.error("Failed to clear likes", err);
    }
  };

  if (!token || !user) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-800">Likes</h1>
        <p className="text-sm text-slate-600">
          You need to be logged in to view your liked posts.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-2 text-sm px-3 py-1.5 rounded-md border border-sky-500 text-sky-600 hover:bg-sky-50"
        >
          Go to Landing
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            {user.name}&apos;s Likes
          </h1>
          <p className="text-sm text-slate-600">
            These are posts you&apos;ve liked.
          </p>
        </div>
        {likedPosts.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-sm px-3 py-1.5 rounded-md border border-red-500 text-red-600 hover:bg-red-50"
          >
            Clear all likes
          </button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-600">Loading liked posts...</div>
      ) : likedPosts.length === 0 ? (
        <div className="text-sm text-slate-600">
          You have no liked posts yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {likedPosts.map((post) => (
            <li
              key={post._id}
              className="bg-white rounded-lg shadow-sm border px-4 py-3 flex justify-between gap-4"
            >
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  {post.title}
                </h2>
                <p className="text-sm text-slate-600 whitespace-pre-line">
                  {post.body}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => handleUnlike(post._id)}
                  className="text-xs px-3 py-1 rounded-full border bg-pink-50 border-pink-300 text-pink-700 hover:bg-pink-100"
                >
                  Remove like
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Likes;
