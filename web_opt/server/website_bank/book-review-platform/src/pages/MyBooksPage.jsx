import { useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import BookCard from '../components/books/BookCard';
import { mockBooks } from '../data/mockBooks';
import { mockBookshelves, bookshelfTypes } from '../data/mockBookshelves';

const MyBooksPage = () => {
  const [activeShelf, setActiveShelf] = useState('all');

  const shelves = [
    { id: 'all', name: 'All Books', count: mockBookshelves.length },
    { id: bookshelfTypes.READ, name: 'Read', count: mockBookshelves.filter(b => b.shelf === bookshelfTypes.READ).length },
    { id: bookshelfTypes.READING, name: 'Currently Reading', count: mockBookshelves.filter(b => b.shelf === bookshelfTypes.READING).length },
    { id: bookshelfTypes.WANT_TO_READ, name: 'Want to Read', count: mockBookshelves.filter(b => b.shelf === bookshelfTypes.WANT_TO_READ).length },
  ];

  const getFilteredBooks = () => {
    let filtered = mockBookshelves;
    if (activeShelf !== 'all') {
      filtered = filtered.filter(b => b.shelf === activeShelf);
    }
    return filtered.map(shelf => {
      const book = mockBooks.find(b => b.id === shelf.bookId);
      return { ...book, shelfInfo: shelf };
    });
  };

  const filteredBooks = getFilteredBooks();

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Books</h1>
        <p className="text-gray-600">Organize and track your reading journey</p>
      </div>

      {/* Shelf Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto">
          {shelves.map(shelf => (
            <button
              key={shelf.id}
              onClick={() => setActiveShelf(shelf.id)}
              className={`px-6 py-3 font-medium whitespace-nowrap transition ${
                activeShelf === shelf.id
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {shelf.name}
              <span className="ml-2 text-sm bg-gray-100 px-2 py-0.5 rounded-full">
                {shelf.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Books Grid */}
      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map(book => (
            <div key={book.id} className="relative">
              <BookCard book={book} />
              {book.shelfInfo?.progress && (
                <div className="absolute bottom-2 left-2 right-2 bg-white rounded p-2 shadow-md">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{book.shelfInfo.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${book.shelfInfo.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No books in this shelf yet.</p>
        </div>
      )}
    </PageContainer>
  );
};

export default MyBooksPage;
