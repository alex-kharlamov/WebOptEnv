import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { FiBookmark, FiShare2, FiBook } from 'react-icons/fi';
import PageContainer from '../components/layout/PageContainer';
import Rating from '../components/common/Rating';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import ReviewCard from '../components/reviews/ReviewCard';
import { mockBooks } from '../data/mockBooks';
import { mockReviews } from '../data/mockReviews';
import { toast } from 'react-toastify';

const BookDetailPage = () => {
  const { id } = useParams();
  const book = mockBooks.find(b => b.id === parseInt(id));
  const bookReviews = mockReviews.filter(r => r.bookId === parseInt(id));
  const [selectedShelf, setSelectedShelf] = useState(null);

  if (!book) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Book Not Found</h2>
          <p className="text-gray-600">The book you're looking for doesn't exist.</p>
        </div>
      </PageContainer>
    );
  }

  const handleAddToShelf = (shelf) => {
    setSelectedShelf(shelf);
    toast.success(`Added to ${shelf}!`);
  };

  const ratingDistribution = [
    { stars: 5, count: 856, percentage: 56 },
    { stars: 4, count: 425, percentage: 28 },
    { stars: 3, count: 167, percentage: 11 },
    { stars: 2, count: 45, percentage: 3 },
    { stars: 1, count: 30, percentage: 2 },
  ];

  return (
    <div>
      <PageContainer>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Book Cover & Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <img
                src={book.cover}
                alt={book.title}
                className="w-full rounded-lg shadow-xl mb-6"
              />
              
              <div className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleAddToShelf('Want to Read')}
                >
                  <FiBookmark className="inline mr-2" />
                  Want to Read
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleAddToShelf('Currently Reading')}
                  >
                    Reading
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAddToShelf('Read')}
                  >
                    Read
                  </Button>
                </div>

                <Button variant="ghost" className="w-full">
                  <FiShare2 className="inline mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Book Details */}
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{book.title}</h1>
            <h2 className="text-2xl text-gray-600 mb-4">by {book.author}</h2>

            <div className="flex items-center gap-4 mb-6">
              <Rating rating={book.rating} size="lg" />
              <span className="text-gray-600">
                {book.ratingsCount.toLocaleString()} ratings · {book.reviewsCount} reviews
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {book.genre.map((genre, index) => (
                <Badge key={index} variant="primary" size="md">
                  {genre}
                </Badge>
              ))}
            </div>

            {/* Book Info */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pages</p>
                  <p className="font-semibold text-gray-900">{book.pages}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Published</p>
                  <p className="font-semibold text-gray-900">{book.publishYear}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Language</p>
                  <p className="font-semibold text-gray-900">{book.language}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">ISBN</p>
                  <p className="font-semibold text-gray-900 text-xs">{book.isbn}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">About this book</h3>
              <p className="text-gray-700 leading-relaxed">{book.description}</p>
            </div>

            {/* Rating Distribution */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Rating Distribution</h3>
              <div className="space-y-2">
                {ratingDistribution.map((item) => (
                  <div key={item.stars} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-16">
                      {item.stars} stars
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-yellow-400 h-3 rounded-full transition-all"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-20 text-right">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              Reviews ({bookReviews.length})
            </h3>
            <Button variant="primary">Write a Review</Button>
          </div>

          <div className="space-y-4">
            {bookReviews.length > 0 ? (
              bookReviews.map(review => (
                <ReviewCard key={review.id} review={review} />
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <FiBook className="mx-auto text-4xl text-gray-400 mb-3" />
                <p className="text-gray-600">No reviews yet. Be the first to review!</p>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  );
};

export default BookDetailPage;
