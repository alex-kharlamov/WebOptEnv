import { useState, useEffect } from 'react';
import PageContainer from '../components/layout/PageContainer';
import BookGrid from '../components/books/BookGrid';
import FilterPanel from '../components/books/FilterPanel';
import { mockBooks } from '../data/mockBooks';
import { FiFilter } from 'react-icons/fi';

const ExplorePage = () => {
  const [filteredBooks, setFilteredBooks] = useState(mockBooks);
  const [filters, setFilters] = useState({ genres: [], rating: null, sortBy: 'rating' });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    applyFilters();
  }, [filters]);

  const applyFilters = () => {
    let books = [...mockBooks];

    // Filter by genres
    if (filters.genres.length > 0) {
      books = books.filter(book =>
        book.genre.some(g => filters.genres.includes(g))
      );
    }

    // Filter by rating
    if (filters.rating) {
      books = books.filter(book => book.rating >= filters.rating);
    }

    // Sort books
    switch (filters.sortBy) {
      case 'rating':
        books.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        books.sort((a, b) => b.reviewsCount - a.reviewsCount);
        break;
      case 'title':
        books.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'recent':
        books.sort((a, b) => b.publishYear - a.publishYear);
        break;
      default:
        break;
    }

    setFilteredBooks(books);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Explore Books</h1>
        <p className="text-gray-600">Discover your next favorite read from our collection</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Desktop Filters */}
        <aside className="hidden lg:block lg:w-64 flex-shrink-0">
          <FilterPanel onFilterChange={handleFilterChange} />
        </aside>

        {/* Mobile Filter Button */}
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="lg:hidden flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium mb-4"
        >
          <FiFilter />
          Filters
        </button>

        {/* Mobile Filters Modal */}
        {showMobileFilters && (
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
            <div className="bg-white h-full w-80 p-6 overflow-y-auto">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="mb-4 text-gray-600 hover:text-gray-900"
              >
                ✕ Close
              </button>
              <FilterPanel onFilterChange={handleFilterChange} isMobile={true} />
            </div>
          </div>
        )}

        {/* Books Grid */}
        <div className="flex-1">
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'}
          </div>
          <BookGrid books={filteredBooks} />
        </div>
      </div>
    </PageContainer>
  );
};

export default ExplorePage;
