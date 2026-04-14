import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background dark:bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-40 left-10 w-80 h-80 bg-primary/20 dark:bg-primary/10 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-violet-600/20 dark:bg-violet-600/10 rounded-full blur-3xl opacity-50"></div>

      <div className="relative z-10 text-center max-w-md">
        <div className="text-8xl font-bold gradient-text mb-4">404</div>
        <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
        <p className="text-foreground/60 mb-8">
          The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>
        <Link
          to="/"
          className="inline-block px-8 py-3 bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-primary-500/50 dark:hover:shadow-primary-400/30 transition-all active:scale-95"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
