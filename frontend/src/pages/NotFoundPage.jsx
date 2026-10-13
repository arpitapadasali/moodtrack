import React from 'react';
import { Link } from 'react-router-dom';

/**
 * 404 Not Found Page for frontend routes
 */
export default function NotFoundPage() {
  return (
    <div className="text-center py-16 space-y-4">
      <h1 className="text-6xl font-extrabold text-brand-600">404</h1>
      <h2 className="text-2xl font-bold text-slate-800">Page Not Found</h2>
      <p className="text-slate-600 max-w-md mx-auto">
        The page you are looking for does not exist or has been moved.
      </p>
      <div>
        <Link
          to="/"
          className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2 rounded-lg transition"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
