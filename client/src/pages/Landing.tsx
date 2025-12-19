import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../hooks/reduxHooks";
import { selectAuthToken } from "../features/auth/authSlice";
import {
  listPostsApi,
  likePostApi,
  unlikePostApi,
} from "../api/posts";
import type { Post } from "../api/posts";
import InfoModal from "../modals/InfoModal";

const PAGE_SIZE = 10;

interface LandingProps {
  onRequireAuth: (infoText?: string) => void;
}

const Landing: React.FC<LandingProps> = ({ onRequireAuth }) => {
  const token = useAppSelector(selectAuthToken);
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const fetchPosts = async (pageToLoad = 1, searchTerm = search) => {
    try {
      setLoading(true);
      setModalOpen(false);
      setModalMessage("");

      const data = await listPostsApi({
        page: pageToLoad,
        limit: PAGE_SIZE,
        search: searchTerm,
        token,
      });

      setPosts(data.items);
      setPage(data.page);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      console.error("Failed to load posts", err);
      setModalMessage("Failed to load posts. Please try again later.");
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts(1, search.trim());
  };

  const handleLikeToggle = async (post: Post) => {
    // If not logged in, open login modal instead of doing anything
    if (!token) {
      onRequireAuth("Login to continue");
      return;
    }

    try {
      if (post.liked) {
        await unlikePostApi(post._id, token);
        setPosts((prev) =>
          prev.map((p) =>
            p._id === post._id ? { ...p, liked: false } : p
          )
        );
      } else {
        await likePostApi(post._id, token);
        setPosts((prev) =>
          prev.map((p) =>
            p._id === post._id ? { ...p, liked: true } : p
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle like", err);
    }
  };

  const handlePrev = () => {
    if (page > 1) fetchPosts(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) fetchPosts(page + 1);
  };

  const handleCreatePostClick = () => {
    // If not logged in, open login modal instead of navigating
    if (!token) {
      onRequireAuth("Login to continue");
      return;
    }
    navigate("/create-post");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Posts</h1>

      {/* Search + Create button row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2 max-w-md flex-1"
        >
          <input
            type="text"
            className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            placeholder="Search posts by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="submit"
            className="px-3 py-2 text-sm bg-sky-600 text-white rounded-md hover:bg-sky-700"
          >
            Search
          </button>
        </form>

        {/* Create post button */}
        <button
          type="button"
          onClick={handleCreatePostClick}
          className="text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md"
        >
          Create your post
        </button>
      </div>

      {/* Posts list */}
      {loading ? (
        <div className="text-sm text-slate-600">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-sm text-slate-600">No posts found.</div>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
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
                  onClick={() => handleLikeToggle(post)}
                  className={`text-xs px-3 py-1 rounded-full border ${
                    post.liked
                      ? "bg-pink-100 border-pink-400 text-pink-700"
                      : "bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {post.liked ? "♥ Liked" : "♡ Like"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={handlePrev}
            disabled={page <= 1}
            className="px-3 py-1 text-sm border rounded-md disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-slate-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={page >= totalPages}
            className="px-3 py-1 text-sm border rounded-md disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Error modal for fetch failures */}
      <InfoModal
        open={modalOpen}
        type="error"
        title="Failed to load posts"
        message={modalMessage}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default Landing;
