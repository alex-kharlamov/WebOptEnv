import { Link } from 'react-router-dom';
import { FiBookmark, FiBookOpen } from 'react-icons/fi';
import Card from '../common/Card';
import Rating from '../common/Rating';
import Badge from '../common/Badge';

const BookCard = ({ book }) => {
  return (
    <Card hover={true}>
      <Link to={`/book/${book.id}`}>
        <div className="relative">
          <img
            src={book.cover}
            alt={book.title}
            className="w-full h-64 object-cover"
          />
          <div className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition cursor-pointer">
            <FiBookmark className="text-indigo-600" />
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-1">
            {book.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3">{book.author}</p>
          
          <div className="flex items-center justify-between mb-3">
            <Rating rating={book.rating} size="sm" />
            <span className="text-xs text-gray-500">
              {book.ratingsCount} ratings
            </span>
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            {book.genre.slice(0, 2).map((genre, index) => (
              <Badge key={index} variant="primary" size="sm">
                {genre}
              </Badge>
            ))}
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {book.description}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <FiBookOpen />
              {book.pages} pages
            </span>
            <span>{book.publishYear}</span>
          </div>
        </div>
      </Link>
    </Card>
  );
};

export default BookCard;
