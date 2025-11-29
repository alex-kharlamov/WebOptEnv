import { useParams } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import { currentUser } from '../data/mockUsers';
import { mockBookshelves } from '../data/mockBookshelves';
import { mockReviews } from '../data/mockReviews';
import { FiBook, FiStar, FiUsers, FiCalendar } from 'react-icons/fi';
import { format } from 'date-fns';

const ProfilePage = () => {
  const { username } = useParams();
  const user = currentUser; // In real app, fetch by username

  const userReviews = mockReviews.filter(r => r.user.id === user.id);

  const stats = [
    { icon: FiBook, label: 'Books Read', value: user.booksRead },
    { icon: FiStar, label: 'Reviews', value: user.reviewsCount },
    { icon: FiUsers, label: 'Followers', value: user.followersCount },
    { icon: FiUsers, label: 'Following', value: user.followingCount },
  ];

  return (
    <div>
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <PageContainer>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar src={user.avatar} alt={user.name} size="2xl" className="border-4 border-white" />
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-4xl font-bold mb-2">{user.name}</h1>
              <p className="text-xl text-indigo-100 mb-4">@{user.username}</p>
              <p className="text-lg mb-4">{user.bio}</p>
              <p className="text-sm text-indigo-200 flex items-center gap-2 justify-center md:justify-start">
                <FiCalendar />
                Joined {format(new Date(user.joinDate), 'MMMM yyyy')}
              </p>
            </div>
          </div>
        </PageContainer>
      </div>

      <PageContainer>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 -mt-8 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center">
              <stat.icon className="mx-auto text-3xl text-indigo-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Reviews</h2>
          {userReviews.length > 0 ? (
            <div className="space-y-4">
              {userReviews.map(review => (
                <div key={review.id} className="bg-white rounded-lg p-6 shadow-md">
                  <p className="text-gray-700 mb-2">{review.review}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Badge variant="primary">★ {review.rating}</Badge>
                    <span>·</span>
                    <span>{format(new Date(review.date), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No reviews yet</p>
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
};

export default ProfilePage;
