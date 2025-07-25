import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">SOP Generator</span>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-1">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/create-sop')}
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    Create SOP
                  </button>
                  <button
                    onClick={() => navigate('/view-sops')}
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    View SOPs
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center space-x-4">
                <span className="text-gray-700 font-medium">Welcome, {user?.username || 'User'}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-gray-50 border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 block px-3 py-2 rounded-lg text-base font-medium w-full text-left transition-all duration-200"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate('/create-sop')}
            className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 block px-3 py-2 rounded-lg text-base font-medium w-full text-left transition-all duration-200"
          >
            Create SOP
          </button>
          <button
            onClick={() => navigate('/view-sops')}
            className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 block px-3 py-2 rounded-lg text-base font-medium w-full text-left transition-all duration-200"
          >
            View SOPs
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white shadow mt-8">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} SOP Generator. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 