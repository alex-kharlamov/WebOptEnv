import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiMenu, FiX, FiBook, FiUser, FiBookOpen } from 'react-icons/fi';
import { currentUser } from '../../data/mockUsers';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <FiBook className="text-3xl text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900">BookHive</span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search books, authors, or genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </form>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/explore" className="text-gray-700 hover:text-indigo-600 font-medium transition">
              Explore
            </Link>
            <Link to="/my-books" className="text-gray-700 hover:text-indigo-600 font-medium transition">
              My Books
            </Link>
            <Link to={`/profile/${currentUser.username}`} className="flex items-center space-x-2">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-indigo-600 transition"
              />
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-700 hover:text-indigo-600"
          >
            {isMenuOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
          </button>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden pb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </form>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <nav className="px-4 py-4 space-y-3">
            <Link
              to="/explore"
              className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <FiBookOpen />
              <span>Explore</span>
            </Link>
            <Link
              to="/my-books"
              className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <FiBook />
              <span>My Books</span>
            </Link>
            <Link
              to={`/profile/${currentUser.username}`}
              className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <FiUser />
              <span>Profile</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
