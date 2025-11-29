import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


import Header from './components/layout/Header';
import Footer from './components/layout/Footer';


import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import BookDetailPage from './pages/BookDetailPage';
import MyBooksPage from './pages/MyBooksPage';
import ProfilePage from './pages/ProfilePage';
import SearchResultsPage from './pages/SearchResultsPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/book/:id" element={<BookDetailPage />} />
            <Route path="/my-books" element={<MyBooksPage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/search" element={<SearchResultsPage />} />
          </Routes>
        </main>
        <Footer />
        <ToastContainer position="bottom-right" autoClose={3000} />
      </div>
    </Router>
  );
}

export default App;
