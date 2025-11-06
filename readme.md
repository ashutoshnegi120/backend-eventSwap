# Event Management & Swapping API

A RESTful API backend for managing events and facilitating event time-swapping between users. Built with Node.js, Express, and MongoDB.

## Features

- **User Authentication**: JWT-based secure authentication with bcrypt password hashing
- **Event Management**: Create, read, update, and delete events
- **Event Swapping**: Marketplace for swapping event time slots between users
- **Real-time Notifications**: Server-Sent Events (SSE) for instant swap request notifications
- **Time Conflict Detection**: Automatic validation to prevent overlapping events
- **Atomic Transactions**: Safe event swapping with MongoDB transactions

## Tech Stack

- **Runtime**: Node.js 18.x
- **Framework**: Express 5.1.0
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Containerization**: Docker

## Installation

### Prerequisites

- Node.js 18.x or higher
- MongoDB instance
- Docker (optional)

### Local Setup

1. Clone the repository
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory
```env
MONGODB_URI=mongodb://localhost:27017/your-database
JWT_SECRET_KEY=your-secret-key-here
```

4. Start the server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:8080`

### Docker Setup

1. Build the Docker image
```bash
docker build -t event-api .
```

2. Run the container
```bash
docker run -p 8080:8080 --env-file .env event-api
```

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt-token",
  "userId": "user-id",
  "email": "john@example.com"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "message": "User logged in successfully",
  "token": "jwt-token",
  "userId": "user-id",
  "email": "john@example.com"
}
```

### Event Management Endpoints

All event endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

#### Create Event
```http
POST /api/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-id",
  "title": "Team Meeting",
  "description": "Weekly sync meeting",
  "start": "2024-11-10T10:00:00Z",
  "end": "2024-11-10T11:00:00Z",
  "type": "BUSY"
}
```

**Event Types:**
- `BUSY`: Regular event (default)
- `SWAPPABLE`: Event available for swapping

#### Get User Events
```http
GET /api/getEvent/:userId
Authorization: Bearer <token>
```

#### Update Event
```http
PATCH /api/update/:eventId
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description",
  "startTime": "2024-11-10T14:00:00Z",
  "endTime": "2024-11-10T15:00:00Z",
  "status": "SWAPPABLE"
}
```

#### Delete Event
```http
DELETE /api/delete/:eventId
Authorization: Bearer <token>
```

#### Get Blocked Times
```http
GET /api/busy-times
Authorization: Bearer <token>
```

Returns all busy time slots across all events.

### Event Swapping Endpoints

#### Get Swappable Events
```http
GET /api/getAll/:userId
Authorization: Bearer <token>
```

Returns all events marked as `SWAPPABLE` except those belonging to the requesting user.

#### Send Swap Request
```http
POST /api/swapRequest/:userId/:targetEventId/:userEventId
Authorization: Bearer <token>
```

**Parameters:**
- `userId`: ID of the user sending the request
- `targetEventId`: ID of the event to swap with
- `userEventId`: ID of the user's event to offer for swap

#### Subscribe to Real-time Notifications
```http
GET /api/SSE/:email
```

Establishes an SSE connection for real-time swap request notifications.

**Events:**
- `ping`: Heartbeat every 25 seconds
- `swapRequest`: New swap request received
- `swapResponse`: Response to a swap request (accepted/rejected)

#### Respond to Swap Request
```http
POST /api/responceToRequest/:swapId
Authorization: Bearer <token>
Content-Type: application/json

{
  "isAccepted": true
}
```

When accepted, the event times are swapped atomically using MongoDB transactions.

#### Get Swap History
```http
GET /api/getSwap/:userId
Authorization: Bearer <token>
```

Returns all swap requests where the user is either the sender or receiver.

## Data Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date
}
```

### Event
```javascript
{
  title: String,
  description: String,
  startTime: Date,
  endTime: Date,
  status: String (BUSY | SWAPPABLE),
  userId: ObjectId (ref: User)
}
```

### Swap Request
```javascript
{
  fromUser: ObjectId (ref: User),
  toUser: ObjectId (ref: User),
  fromEvent: ObjectId (ref: Event),
  toEvent: ObjectId (ref: Event),
  status: String (pending | accepted | rejected),
  createdAt: Date
}
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `201`: Resource created
- `400`: Bad request (missing/invalid data)
- `401`: Unauthorized (missing/invalid token)
- `404`: Resource not found
- `409`: Conflict (e.g., overlapping events)
- `500`: Internal server error

**Error Response Format:**
```json
{
  "error": "Error message description"
}
```

## Security Features

- **Password Hashing**: bcrypt with salt rounds of 12
- **JWT Authentication**: 1-hour token expiration
- **CORS**: Configured to accept requests from any origin (adjust in production)
- **Input Validation**: Required field validation on all endpoints
- **Transaction Safety**: Atomic operations for critical operations like event swapping

## Development

### Project Structure
```
backend/
├── auth/              # JWT authentication logic
├── controller/        # Business logic controllers
├── database/          # MongoDB connection
├── module/            # Mongoose models
├── routes/            # API route definitions
├── utlity/            # Helper functions
├── index.js           # Application entry point
├── Dockerfile         # Docker configuration
└── package.json       # Dependencies and scripts
```

### Scripts
```bash
npm start      # Start production server
npm run dev    # Start development server with nodemon
```

## Environment Variables

Required environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/events` |
| `JWT_SECRET_KEY` | Secret key for JWT signing | `your-super-secret-key` |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Support

For issues or questions, please open an issue in the repository.

---

**Note**: This is a backend API service. You'll need to build a frontend application to interact with these endpoints.