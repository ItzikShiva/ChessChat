# ChessChat

A real-time chess game with integrated chat functionality. Play chess against a computer opponent while chatting about the game.

## Features

- Real-time chess gameplay against computer opponent
- Integrated chat system
- User authentication and profile management
- Game statistics tracking
- Coin-based wagering system

## Tech Stack

- Frontend: React.js with Material-UI
- Backend: Node.js with Express
- Database: MongoDB
- Real-time Communication: Socket.IO
- Authentication: JWT

## Project Structure

```
ChessChat/
├── src/
│   ├── frontend/         # React frontend application
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── ...
│   │   └── package.json
│   └── backend/         # Node.js backend server
│       ├── config/
│       ├── models/
│       ├── routes/
│       └── server.js
└── package.json
```

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
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
   Create `.env` files in both frontend and backend directories with the necessary environment variables.

4. Start the application:
   ```bash
   # Start backend server (from backend directory)
   npm start

   # Start frontend development server (from frontend directory)
   npm start
   ```

## Development

- `main` branch: Production-ready code
- `develop` branch: Development code
- Feature branches: Created for new features
- Bugfix branches: Created for bug fixes

## Contributing

1. Create a new branch for your feature/bugfix
2. Make your changes
3. Submit a pull request to the `develop` branch

## License

MIT License 