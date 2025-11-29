import PageContainer from '../components/layout/PageContainer';
import BookGrid from '../components/books/BookGrid';
import { featuredBooks, trendingBooks } from '../data/mockBooks';

const HomePage = () => {
  return (
    <div>
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <PageContainer>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Discover Your Next Favorite Book
          </h1>
          <p className="text-xl md:text-2xl text-indigo-100 mb-8">
            Join thousands of readers sharing reviews and recommendations
          </p>
        </PageContainer>
      </div>

      <PageContainer>
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Featured Books</h2>
          <BookGrid books={featuredBooks} />
        </section>

        {/* Trending Books */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Trending Now</h2>
          <BookGrid books={trendingBooks} />
        </section>
      </PageContainer>
    </div>
  );
};

export default HomePage;
