# ChessChat

A real-time chess game with integrated chat functionality, featuring AI opponent gameplay and social features. Play chess while chatting with other players, track your progress, and engage with the chess community.

## Features

### Core Functionality
- Real-time chess gameplay against an AI opponent with multiple difficulty levels
- Integrated real-time chat system during games
- Move validation and game state management
- Game history and replay functionality

### User Features
- User authentication and profile management
- Personalized game statistics and analytics
- Friend system with social features
- Achievement tracking and rewards

### Technical Features
- Responsive Material-UI design
- Real-time WebSocket communication
- Secure JWT-based authentication
- RESTful API architecture
- Efficient chess move calculation algorithm

## Tech Stack

### Frontend
- React.js 18+ with TypeScript
- Material-UI v5 for UI components
- Socket.IO client for real-time communication
- Axios for HTTP requests
- React Router v6 for navigation
- Context API for state management

### Backend
- Node.js with Express
- MongoDB with Mongoose ODM
- Socket.IO for WebSocket handling
- JWT for authentication
- bcrypt for password hashing

### Development Tools
- ESLint for code linting
- Prettier for code formatting
- Jest for testing
- Git for version control
- Docker for containerization

## Project Structure

```
ChessChat/
├── src/
│   ├── frontend/                # React frontend application
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── contexts/       # React Context providers
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── pages/         # Page components
│   │   │   ├── services/      # API service layer
│   │   │   ├── utils/         # Utility functions
│   │   │   └── App.tsx        # Root component
│   │   └── package.json
│   └── backend/               # Node.js backend server
│       ├── config/           # Configuration files
│       ├── controllers/      # Route controllers
│       ├── middleware/       # Custom middleware
│       ├── models/          # Mongoose models
│       ├── routes/          # API routes
│       ├── services/        # Business logic
│       ├── utils/           # Utility functions
│       └── server.js        # Entry point
└── package.json
```

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/ItzikShiva/ChessChat.git
   cd ChessChat
   ```

2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd src/backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Set up environment variables:
   Create `.env` files in both frontend and backend directories:

   Backend `.env`:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   ```

   Frontend `.env`:
   ```
   REACT_APP_API_URL=http://localhost:5000
   REACT_APP_WS_URL=ws://localhost:5000
   ```

4. Start the application:
   ```bash
   # Start backend server (from backend directory)
   npm start

   # Start frontend development server (from frontend directory)
   npm start
   ```

## Code Style Guide

### General Principles
- Follow SOLID principles
- Write self-documenting code with clear naming
- Keep functions small and focused
- Use TypeScript for type safety
- Implement proper error handling

### Frontend Guidelines
- Use functional components with hooks
- Implement proper component composition
- Follow Material-UI best practices
- Maintain consistent file structure
- Write unit tests for critical components

### Backend Guidelines
- Follow RESTful API conventions
- Implement proper validation and sanitization
- Use async/await for asynchronous operations
- Maintain clear separation of concerns
- Document API endpoints

## Git Workflow

1. Branch Naming:
   - Feature branches: `feature/feature-name`
   - Bug fixes: `fix/bug-name`
   - Improvements: `improve/improvement-name`

2. Commit Messages:
   - Use present tense ("Add feature" not "Added feature")
   - Be descriptive but concise
   - Reference issue numbers when applicable

3. Branch Strategy:
   - `main`: Production-ready code
   - `develop`: Development code
   - Feature branches: Created from and merged back to `develop`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details

## Acknowledgments

- Chess engine based on [chess.js](https://github.com/jhlywa/chess.js)
- UI components from [Material-UI](https://mui.com/)
- Special thanks to all contributors 