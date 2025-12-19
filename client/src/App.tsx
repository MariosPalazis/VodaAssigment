import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/layout/Navbar";
import Landing from "./pages/Landing";
import Likes from "./pages/Likes";
import AuthModal from "./modals/AuthModal";

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const openAuthModal = (mode: "login" | "register") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => setShowAuthModal(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onAuthClick={openAuthModal} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/likes" element={<Likes />} />
        </Routes>
      </main>

      <AuthModal open={showAuthModal} mode={authMode} onClose={closeAuthModal} />
    </div>
  );
}

export default App;
