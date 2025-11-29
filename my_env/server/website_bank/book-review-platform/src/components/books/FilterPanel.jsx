import { useState } from 'react';
import { FiFilter, FiX } from 'react-icons/fi';
import Badge from '../common/Badge';

const FilterPanel = ({ onFilterChange, isMobile = false }) => {
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedRating, setSelectedRating] = useState(null);
  const [sortBy, setSortBy] = useState('rating');

  const genres = ['Fiction', 'Non-Fiction', 'Science Fiction', 'Mystery', 'Romance', 'Thriller', 'Fantasy', 'Self-Help', 'Biography', 'Psychology', 'Business', 'Finance'];
  const ratings = [5, 4, 3, 2, 1];
  const sortOptions = [
    { value: 'rating', label: 'Highest Rated' },
    { value: 'reviews', label: 'Most Reviews' },
    { value: 'recent', label: 'Recently Added' },
    { value: 'title', label: 'Title A-Z' }
  ];

  const handleGenreToggle = (genre) => {
    const newGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter(g => g !== genre)
      : [...selectedGenres, genre];
    
    setSelectedGenres(newGenres);
    applyFilters(newGenres, selectedRating, sortBy);
  };

  const handleRatingChange = (rating) => {
    const newRating = selectedRating === rating ? null : rating;
    setSelectedRating(newRating);
    applyFilters(selectedGenres, newRating, sortBy);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    applyFilters(selectedGenres, selectedRating, value);
  };

  const applyFilters = (genres, rating, sort) => {
    onFilterChange({ genres, rating, sortBy: sort });
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedRating(null);
    setSortBy('rating');
    onFilterChange({ genres: [], rating: null, sortBy: 'rating' });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <FiFilter />
          Filters
        </h3>
        <button
          onClick={clearFilters}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Clear All
        </button>
      </div>

      {/* Sort By */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">Sort By</h4>
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Genres */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">Genres</h4>
        <div className="flex flex-wrap gap-2">
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => handleGenreToggle(genre)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                selectedGenres.includes(genre)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Minimum Rating</h4>
        <div className="space-y-2">
          {ratings.map(rating => (
            <button
              key={rating}
              onClick={() => handleRatingChange(rating)}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedRating === rating
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-yellow-400">★</span>
              {rating}+ stars
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
