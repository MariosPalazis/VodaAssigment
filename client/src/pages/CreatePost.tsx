import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../hooks/reduxHooks";
import {
  selectAuthToken,
  selectAuthUser,
} from "../features/auth/authSlice";
import { createPostApi } from "../api/posts";
import InfoModal from "../modals/InfoModal";

const CreatePost = () => {
  const token = useAppSelector(selectAuthToken);
  const user = useAppSelector(selectAuthUser);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error">("success");
  const [modalMessage, setModalMessage] = useState("");

  const handleBack = () => {
    navigate(-1);
  };

  if (!token || !user) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleBack}
          className="text-xs px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-semibold text-slate-800">
          Create your post
        </h1>
        <p className="text-sm text-slate-600">
          You must be logged in to create a post.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setModalType("error");
      setModalMessage("Title and body are required.");
      setModalOpen(true);
      return;
    }

    try {
      setLoading(true);
      await createPostApi({ title: title.trim(), body: body.trim(), token });

      setModalType("success");
      setModalMessage("Your post has been created successfully.");
      setModalOpen(true);
      setTitle("");
      setBody("");
    } catch (err: any) {
      console.error("Failed to create post", err);
      setModalType("error");
      setModalMessage(
        "Failed to create your post. Please check your input or try again later."
      );
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleBackToLanding = () => {
    setModalOpen(false);
    navigate("/");
  };

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        type="button"
        onClick={handleBack}
        className="text-xs px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
      >
        ← Back
      </button>

      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          Create your post
        </h1>
        <p className="text-sm text-slate-600">
          Share something with the community.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Title
          </label>
          <input
            type="text"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Body
          </label>
          <textarea
            className="w-full border rounded-md px-3 py-2 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your post content here..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create post"}
        </button>
      </form>

      {/* Success/Error modal */}
      <InfoModal
        open={modalOpen}
        type={modalType}
        title={modalType === "success" ? "Post created" : "Error"}
        message={modalMessage}
        onClose={handleModalClose}
        primaryActionLabel={modalType === "success" ? "Back to landing" : undefined}
        onPrimaryAction={modalType === "success" ? handleBackToLanding : undefined}
      />
    </div>
  );
};

export default CreatePost;
