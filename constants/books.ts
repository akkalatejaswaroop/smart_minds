import type { Book } from '../types';

export const BOOKS: Book[] = [
  {
    id: 1,
    title: 'Fundamentals of Machine Learning',
    author: 'Dr. Evelyn Reed',
    coverImage: 'https://placehold.co/400x600/0284C7/FFFFFF/png?text=Machine\\nLearning',
    genre: 'Computer Science',
    level: 'Intermediate',
    readingTime: '8 hours',
    summary: 'An in-depth guide to the core concepts of machine learning, from linear regression to neural networks. This book provides both theoretical foundations and practical examples in Python.',
    chapters: [
      {
        title: 'Chapter 1: Introduction to ML',
        content: `Machine learning (ML) is a field of inquiry devoted to understanding and building methods that 'learn' – that is, methods that leverage data to improve performance on some set of tasks. It is seen as a part of artificial intelligence. Machine learning algorithms build a model based on sample data, known as training data, in order to make predictions or decisions without being explicitly programmed to do so. Machine learning algorithms are used in a wide variety of applications, such as in medicine, email filtering, speech recognition, and computer vision, where it is difficult or unfeasible to develop conventional algorithms to perform the needed tasks.`
      },
      {
        title: 'Chapter 2: Supervised Learning',
        content: `Supervised learning is the machine learning task of learning a function that maps an input to an output based on example input-output pairs. It infers a function from labeled training data consisting of a set of training examples. In supervised learning, each example is a pair consisting of an input object (typically a vector) and a desired output value (also called the supervisory signal). A supervised learning algorithm analyzes the training data and produces an inferred function, which can be used for mapping new examples. An optimal scenario will allow for the algorithm to correctly determine the class labels for unseen instances.`
      }
    ]
  },
  {
    id: 2,
    title: 'The Structure of Modern Databases',
    author: 'Samuel Jones',
    coverImage: 'https://placehold.co/400x600/581C87/FFFFFF/png?text=Databases',
    genre: 'Computer Science',
    level: 'Beginner',
    readingTime: '6 hours',
    summary: 'A comprehensive overview of database management systems, covering the relational model, SQL, normalization, and transaction management. Perfect for students and aspiring developers.',
    chapters: [
      {
        title: 'Chapter 1: The Relational Model',
        content: `The relational model for database management is a database model based on first-order predicate logic, first formulated and proposed in 1969 by Edgar F. Codd. In the relational model of a database, all data is represented in terms of tuples, grouped into relations. A database organized in terms of the relational model is a relational database. The purpose of the relational model is to provide a declarative method for specifying data and queries: users directly state what information the database contains and what information they want from it, and let the database management system software take care of describing data structures for storing the data and retrieval procedures for answering queries.`
      }
    ]
  },
  {
    id: 3,
    title: 'Advanced Algorithms & Data Structures',
    author: 'Jian-Yang Lee',
    coverImage: 'https://placehold.co/400x600/BE123C/FFFFFF/png?text=Algorithms',
    genre: 'Computer Science',
    level: 'Advanced',
    readingTime: '12 hours',
    summary: 'Explore complex algorithms and data structures including graph theory, dynamic programming, and NP-completeness. This book challenges readers with complex problems and elegant solutions.',
    chapters: [
      {
        title: 'Chapter 1: Dynamic Programming',
        content: `In computer science, mathematics, and economics, dynamic programming is a method for solving a complex problem by breaking it down into a collection of simpler subproblems, solving each of those subproblems just once, and storing their solutions. The next time the same subproblem occurs, instead of recomputing its solution, one simply looks up the previously computed solution, thereby saving computation time at the expense of a (hopefully) modest expenditure in storage space. Each of the subproblem solutions is indexed in some way, typically based on the values of its input parameters, so as to facilitate its lookup.`
      }
    ]
  },
    {
    id: 4,
    title: 'Introduction to Python Programming',
    author: 'Aisha Khan',
    coverImage: 'https://placehold.co/400x600/15803D/FFFFFF/png?text=Python',
    genre: 'Programming',
    level: 'Beginner',
    readingTime: '5 hours',
    summary: 'A beginner-friendly introduction to Python. Covers fundamental concepts like variables, data types, control flow, functions, and basic data structures.',
    chapters: [
      {
        title: 'Chapter 1: Your First Python Program',
        content: `Python is an interpreted, high-level and general-purpose programming language. Python's design philosophy emphasizes code readability with its notable use of significant indentation. Its language constructs and object-oriented approach aim to help programmers write clear, logical code for small and large-scale projects. To get started, you will need to install Python on your computer. Once installed, you can write your first program. The traditional first program is one that displays the message "Hello, World!". In Python, this is remarkably simple. You just need one line of code: print("Hello, World!")`
      }
    ]
  }
];
