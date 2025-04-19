# ChessChat

A real-time chess game with chat functionality built with React, Node.js, and PostgreSQL.

## Features

- Real-time chess gameplay
- Chat functionality
- User authentication
- Dark/Light theme
- Friend system
- Game history and statistics

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chesschat.git
cd chesschat
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

3. Set up the database:
```bash
# Create a PostgreSQL database named 'chesschat'
createdb chesschat

# Run the database migrations
cd ../backend
npm run migrate
```

4. Configure environment variables:
```bash
# Backend
cp src/backend/.env.example src/backend/.env
# Edit the .env file with your configuration

# Frontend
cp src/frontend/.env.example src/frontend/.env
# Edit the .env file with your configuration
```

## Development

1. Start the backend server:
```bash
cd src/backend
npm run dev
```

2. Start the frontend development server:
```bash
cd src/frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## Testing

```bash
# Backend tests
cd src/backend
npm test

# Frontend tests
cd src/frontend
npm test
```

## Deployment

1. Build the frontend:
```bash
cd src/frontend
npm run build
```

2. Deploy the backend:
```bash
cd src/backend
npm run build
```

## Project Structure

```
chesschat/
├── src/
│   ├── backend/           # Backend API
│   │   ├── api/          # API routes and controllers
│   │   ├── config/       # Configuration files
│   │   ├── db/          # Database setup and migrations
│   │   └── utils/       # Utility functions
│   └── frontend/        # React frontend
│       ├── components/  # React components
│       ├── hooks/      # Custom React hooks
│       ├── services/   # API services
│       └── styles/     # CSS and theme files
├── tests/              # Test files
└── docs/              # Documentation
```

## Contributing

1. Create a new branch for your feature:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit them:
```bash
git commit -m "Add your feature description"
```

3. Push to the branch:
```bash
git push origin feature/your-feature-name
```

4. Create a Pull Request

## License

MIT 