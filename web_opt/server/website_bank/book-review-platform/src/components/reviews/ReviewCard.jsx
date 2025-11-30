import { formatDistanceToNow } from 'date-fns';
import { FiThumbsUp, FiCheckCircle } from 'react-icons/fi';
import Avatar from '../common/Avatar';
import Rating from '../common/Rating';

const ReviewCard = ({ review }) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <div className="flex items-start gap-4">
        <Avatar src={review.user.avatar} alt={review.user.name} size="lg" />
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-semibold text-gray-900">{review.user.name}</h4>
              <p className="text-sm text-gray-500">@{review.user.username}</p>
            </div>
            <Rating rating={review.rating} size="sm" showNumber={false} />
          </div>

          <p className="text-gray-700 mb-3 leading-relaxed">{review.review}</p>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{formatDistanceToNow(new Date(review.date), { addSuffix: true })}</span>
            <button className="flex items-center gap-1 hover:text-indigo-600 transition">
              <FiThumbsUp className="text-sm" />
              <span>{review.likes}</span>
            </button>
            <span className="flex items-center gap-1">
              <FiCheckCircle className="text-sm" />
              {review.helpful} found helpful
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
