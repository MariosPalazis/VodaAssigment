import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/layout/Navbar";
import Landing from "./pages/Landing";
import Likes from "./pages/Likes";
import CreatePost from "./pages/CreatePost";
import AuthModal from "./modals/AuthModal";
import NotFound from "./pages/NotFound";

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authInfoText, setAuthInfoText] = useState<string>("");

  const openAuthModal = (mode: "login" | "register", infoText?: string) => {
    setAuthMode(mode);
    setAuthInfoText(infoText || "");
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAuthInfoText("");
  };

  // Used by Navbar buttons (plain login/register)
  const handleNavbarAuthClick = (mode: "login" | "register") => {
    openAuthModal(mode);
  };

  // Used by actions that *require* auth (likes, create, etc.)
  const handleRequireAuth = (infoText = "Login to continue") => {
    openAuthModal("login", infoText);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        onAuthClick={handleNavbarAuthClick}
        onRequireAuth={handleRequireAuth}  // 👈 pass it to Navbar
      />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <Routes>
          <Route
            path="/"
            element={<Landing onRequireAuth={handleRequireAuth} />}
          />
          <Route path="/likes" element={<Likes />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <AuthModal
        open={showAuthModal}
        mode={authMode}
        onClose={closeAuthModal}
        infoText={authInfoText}
      />
    </div>
  );
}

export default App;
