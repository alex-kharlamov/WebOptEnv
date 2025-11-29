import BookCard from './BookCard';

const BookGrid = ({ books, loading = false }) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading books...</p>
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No books found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
};

export default BookGrid;
