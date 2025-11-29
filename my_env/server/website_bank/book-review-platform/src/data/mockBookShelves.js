export const bookshelfTypes = {
    READ: 'read',
    READING: 'currently-reading',
    WANT_TO_READ: 'want-to-read'
  };
  
  export const mockBookshelves = [
    {
      id: 1,
      userId: 1,
      bookId: 1,
      shelf: bookshelfTypes.READ,
      dateAdded: "2024-08-20",
      dateFinished: "2024-09-15",
      rating: 5
    },
    {
      id: 2,
      userId: 1,
      bookId: 2,
      shelf: bookshelfTypes.READ,
      dateAdded: "2024-06-10",
      dateFinished: "2024-07-18",
      rating: 4
    },
    {
      id: 3,
      userId: 1,
      bookId: 3,
      shelf: bookshelfTypes.READING,
      dateAdded: "2024-09-25",
      progress: 45
    },
    {
      id: 4,
      userId: 1,
      bookId: 4,
      shelf: bookshelfTypes.WANT_TO_READ,
      dateAdded: "2024-09-28"
    }
  ];
  