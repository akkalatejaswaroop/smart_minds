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
      },
       {
        title: 'Chapter 2: SQL Fundamentals',
        content: `Structured Query Language (SQL) is a domain-specific language used in programming and designed for managing data held in a relational database management system (RDBMS). It is particularly useful in handling structured data, i.e., data incorporating relations among entities and variables. SQL offers two main advantages over older read-write APIs such as ISAM or VSAM. Firstly, it introduced the concept of accessing many records with one single command. Secondly, it eliminates the need to specify how to reach a record, i.e., with or without an index.`
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
      },
       {
        title: 'Chapter 2: Greedy Algorithms',
        content: `A greedy algorithm is any algorithm that follows the problem-solving heuristic of making the locally optimal choice at each stage. In many problems, a greedy strategy does not usually produce an optimal solution, but nonetheless, a greedy heuristic may yield locally optimal solutions that approximate a globally optimal solution in a reasonable amount of time. For example, a greedy strategy for the traveling salesman problem is the following heuristic: "At each step of the journey, visit the nearest unvisited city."`
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
      },
      {
        title: 'Chapter 2: Variables and Data Types',
        content: `In Python, variables are created when you assign a value to it. Python has no command for declaring a variable. A variable can have a short name (like x and y) or a more descriptive name (age, carname, total_volume). Python has various standard data types that are used to define the operations possible on them and the storage method for each of them. These include Integer, Float, String, and Boolean.`
      }
    ]
  },
  {
    id: 5,
    title: 'Full Stack Web Development',
    author: 'David Chen',
    coverImage: 'https://placehold.co/400x600/B45309/FFFFFF/png?text=Full\\nStack',
    genre: 'Web Development',
    level: 'Intermediate',
    readingTime: '15 hours',
    summary: 'A complete guide to full stack web development, covering HTML, CSS, JavaScript, Node.js, Express, and React. Build modern, data-driven web applications from scratch.',
    chapters: [
      {
        title: 'Chapter 1: The MERN Stack',
        content: 'The MERN stack is a popular JavaScript stack used for building modern web applications. MERN stands for MongoDB, Express, React, and Node.js. MongoDB is a NoSQL database, Express is a web application framework for Node.js, React is a JavaScript library for building user interfaces, and Node.js is a JavaScript runtime environment. Together, they provide a complete framework for building scalable, high-performance web applications.'
      }
    ]
  },
  {
    id: 6,
    title: 'Java OOP In-Depth',
    author: 'Priya Sharma',
    coverImage: 'https://placehold.co/400x600/7E22CE/FFFFFF/png?text=Java\\nOOP',
    genre: 'Programming',
    level: 'Intermediate',
    readingTime: '10 hours',
    summary: 'Master Object-Oriented Programming concepts with Java. This book covers inheritance, polymorphism, encapsulation, and abstraction with practical, real-world examples and design patterns.',
    chapters: [
      {
        title: 'Chapter 1: The Four Pillars of OOP',
        content: 'Object-Oriented Programming (OOP) is based on four main principles: Encapsulation, Abstraction, Inheritance, and Polymorphism. Encapsulation is the bundling of data and the methods that operate on that data into a single unit, or object. Abstraction is the concept of hiding the complex reality while exposing only the necessary parts. Inheritance is a mechanism where a new class derives properties and methods from an existing class. Polymorphism allows methods to do different things based on the object it is acting upon.'
      }
    ]
  },
  {
    id: 7,
    title: 'AI: A Modern Approach',
    author: 'Chen Liang',
    coverImage: 'https://placehold.co/400x600/047857/FFFFFF/png?text=AI\\nApproach',
    genre: 'Computer Science',
    level: 'Advanced',
    readingTime: '20 hours',
    summary: 'The authoritative text on Artificial Intelligence. This book explores the full range of AI, from search and logic to machine learning, natural language processing, and robotics.',
    chapters: [
      {
        title: 'Chapter 1: What is AI?',
        content: 'Artificial intelligence (AI) is the intelligence of machines or software, as opposed to the intelligence of human beings or other animals. It is a field of study in computer science that develops and studies intelligent machines. Such machines may be called AIs. AI technology is widely used throughout industry, government, and science. Some high-profile applications are: advanced web search engines, recommendation systems, understanding human speech, self-driving cars, and competing at the highest level in strategic games.'
      }
    ]
  },
  {
    id: 8,
    title: 'Discrete Math Explained',
    author: 'Maria Garcia',
    coverImage: 'https://placehold.co/400x600/9F1239/FFFFFF/png?text=Discrete\\nMath',
    genre: 'Mathematics',
    level: 'Beginner',
    readingTime: '7 hours',
    summary: 'A clear and concise introduction to the fundamental concepts of discrete mathematics, including logic, set theory, combinatorics, and graph theory. Essential for computer science students.',
    chapters: [
      {
        title: 'Chapter 1: Propositional Logic',
        content: 'Propositional logic is the branch of logic that studies ways of joining and/or modifying entire propositions, statements or sentences to form more complicated propositions, statements or sentences, as well as the logical relationships and properties that are derived from these methods of combining or altering statements. In propositional logic, the simplest statements are considered as indivisible units, and hence, propositional logic does not study those logical properties and relations that depend upon parts of statements that are not themselves statements on their own, like the subject and predicate of a statement.'
      }
    ]
  }
];