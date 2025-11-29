import { FiStar } from 'react-icons/fi';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';

const Rating = ({ rating, maxRating = 5, showNumber = true, size = 'md', interactive = false, onRate }) => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= maxRating; i++) {
      if (i <= Math.floor(rating)) {
        // Full star
        stars.push(
          <FaStar 
            key={i} 
            className={`${sizes[size]} text-yellow-400 ${interactive ? 'cursor-pointer hover:scale-110 transition' : ''}`}
            onClick={() => interactive && onRate && onRate(i)}
          />
        );
      } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
        // Half star
        stars.push(
          <FaStarHalfAlt 
            key={i} 
            className={`${sizes[size]} text-yellow-400 ${interactive ? 'cursor-pointer hover:scale-110 transition' : ''}`}
            onClick={() => interactive && onRate && onRate(i)}
          />
        );
      } else {
        // Empty star
        stars.push(
          <FiStar 
            key={i} 
            className={`${sizes[size]} text-gray-300 ${interactive ? 'cursor-pointer hover:scale-110 transition' : ''}`}
            onClick={() => interactive && onRate && onRate(i)}
          />
        );
      }
    }
    return stars;
  };

  return (
    <div className="flex items-center gap-1">
      {renderStars()}
      {showNumber && (
        <span className={`ml-1 font-medium text-gray-700 ${sizes[size]}`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default Rating;
