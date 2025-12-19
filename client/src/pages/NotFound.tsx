const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <h1 className="text-4xl font-bold text-slate-800 mb-4">
        404 – Page Not Found
      </h1>

      <p className="text-slate-600 text-sm mb-6 max-w-sm">
        The page you are looking for doesn't exist or was moved.
      </p>

      <a
        href="/"
        className="px-4 py-2 rounded-md text-sm bg-sky-600 text-white hover:bg-sky-700"
      >
        Go back to Home
      </a>
    </div>
  );
};

export default NotFound;
