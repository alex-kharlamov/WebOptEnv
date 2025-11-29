import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import BookGrid from '../components/books/BookGrid';
import { mockBooks } from '../data/mockBooks';
import { FiSearch } from 'react-icons/fi';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query) {
      const searchResults = mockBooks.filter(book =>
        book.title.toLowerCase().includes(query.toLowerCase()) ||
        book.author.toLowerCase().includes(query.toLowerCase()) ||
        book.genre.some(g => g.toLowerCase().includes(query.toLowerCase()))
      );
      setResults(searchResults);
    }
  }, [query]);

  return (
    <PageContainer>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <FiSearch className="text-3xl text-gray-400" />
          <h1 className="text-4xl font-bold text-gray-900">
            Search Results
          </h1>
        </div>
        <p className="text-gray-600">
          {results.length} {results.length === 1 ? 'result' : 'results'} for "{query}"
        </p>
      </div>

      {results.length > 0 ? (
        <BookGrid books={results} />
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FiSearch className="mx-auto text-5xl text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600">
            Try searching with different keywords or browse our collection
          </p>
        </div>
      )}
    </PageContainer>
  );
};

export default SearchResultsPage;
