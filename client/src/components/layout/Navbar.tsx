import { NavLink } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../hooks/reduxHooks";
import { logout, selectAuthUser } from "../../features/auth/authSlice";

interface NavbarProps {
  onAuthClick: (mode: "login" | "register") => void;
  onRequireAuth: (infoText?: string) => void; // 👈 NEW
}

const Navbar: React.FC<NavbarProps> = ({ onAuthClick, onRequireAuth }) => {
  const user = useAppSelector(selectAuthUser);
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleLikesClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (!user) {
      e.preventDefault();              // stop navigation
      onRequireAuth("Login to continue"); // open login modal
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="font-bold text-xl tracking-tight text-sky-600">
          VODA
        </div>

        {/* Center: Nav links */}
        <nav className="flex gap-4">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-3 py-1 rounded-md text-sm font-medium ${
                isActive ? "bg-sky-100 text-sky-700" : "text-slate-700 hover:bg-slate-100"
              }`
            }
          >
            Landing
          </NavLink>

          <NavLink
            to="/likes"
            onClick={handleLikesClick}  // 👈 intercept
            className={({ isActive }) =>
              `px-3 py-1 rounded-md text-sm font-medium ${
                isActive ? "bg-sky-100 text-sky-700" : "text-slate-700 hover:bg-slate-100"
              }`
            }
          >
            Likes
          </NavLink>
        </nav>

        {/* Right: Auth */}
        <div className="flex items-center gap-3">
          {!user && (
            <>
              <button
                onClick={() => onAuthClick("login")}
                className="text-sm font-medium text-slate-700 hover:text-sky-600"
              >
                Login
              </button>
              <button
                onClick={() => onAuthClick("register")}
                className="text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 px-3 py-1.5 rounded-md"
              >
                Register
              </button>
            </>
          )}

          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-700">
                Hello <span className="font-semibold">{user.name}</span>
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium border border-red-500 text-red-500 px-3 py-1.5 rounded-md hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
