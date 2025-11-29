import { mockUsers } from './mockUsers';

export const mockReviews = [
  {
    id: 1,
    bookId: 1,
    user: mockUsers[0],
    rating: 5,
    review: "Absolutely mesmerizing! This book made me think about all the choices I've made in life. The concept is brilliant and the execution is flawless. A must-read!",
    date: "2024-09-15",
    likes: 45,
    helpful: 32
  },
  {
    id: 2,
    bookId: 1,
    user: mockUsers[1],
    rating: 4,
    review: "Great philosophical novel. Some parts felt a bit repetitive, but overall a very thought-provoking read.",
    date: "2024-08-22",
    likes: 23,
    helpful: 18
  },
  {
    id: 3,
    bookId: 2,
    user: mockUsers[2],
    rating: 5,
    review: "This book changed my life! The framework for building habits is practical and backed by science. Highly recommend to anyone looking to improve themselves.",
    date: "2024-09-01",
    likes: 78,
    helpful: 65
  },
  {
    id: 4,
    bookId: 2,
    user: mockUsers[0],
    rating: 4,
    review: "Solid advice on habit formation. Some concepts are repeated from other self-help books, but Clear presents them in an actionable way.",
    date: "2024-07-18",
    likes: 34,
    helpful: 27
  },
  {
    id: 5,
    bookId: 3,
    user: mockUsers[1],
    rating: 5,
    review: "Andy Weir does it again! Even better than The Martian. The science is fascinating and the story keeps you hooked till the end.",
    date: "2024-09-10",
    likes: 92,
    helpful: 81
  }
];
