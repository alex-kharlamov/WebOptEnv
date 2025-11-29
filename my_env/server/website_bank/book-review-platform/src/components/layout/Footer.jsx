import { Link } from 'react-router-dom';
import { FiBook, FiGithub, FiTwitter, FiInstagram } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <FiBook className="text-3xl text-indigo-500" />
              <span className="text-2xl font-bold text-white">BookHive</span>
            </div>
            <p className="text-sm text-gray-400">
              Your community for discovering, reviewing, and sharing great books.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Discover</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/explore" className="hover:text-indigo-400 transition">
                  Browse Books
                </Link>
              </li>
              <li>
                <Link to="/explore?sort=trending" className="hover:text-indigo-400 transition">
                  Trending
                </Link>
              </li>
              <li>
                <Link to="/explore?sort=new" className="hover:text-indigo-400 transition">
                  New Releases
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-white font-semibold mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-indigo-400 transition">
                  Book Clubs
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-400 transition">
                  Discussions
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-400 transition">
                  Reading Challenges
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-white font-semibold mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-indigo-400 transition">
                <FiGithub className="text-2xl" />
              </a>
              <a href="#" className="hover:text-indigo-400 transition">
                <FiTwitter className="text-2xl" />
              </a>
              <a href="#" className="hover:text-indigo-400 transition">
                <FiInstagram className="text-2xl" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2025 BookHive. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
