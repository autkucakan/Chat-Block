# Block Chat API

A real-time chat application API built with FastAPI.

## Authentication System

The application uses a JWT (JSON Web Token) based authentication system with the following components:

### 1. File Structure

- `app/routers/oauth2.py`: Core JWT functionality, token creation, validation, and login
- `app/routers/auth.py`: Implements user registration

### 2. Authentication Flow

1. **Registration**: Users register with username, email, and password
   - POST `/api/auth/register`
   - Password is hashed with bcrypt before storage
   - Returns the created user without the password

2. **Login**: Users login with username and password
   - POST `/api/auth/login`
   - Verifies the credentials against the database
   - Returns a JWT token upon successful authentication

3. **Access Protected Routes**: Protected routes require a valid JWT token
   - Include the token in the Authorization header: `Bearer <token>`
   - The token is automatically verified and the user is extracted
   - If the token is invalid or expired, a 401 Unauthorized error is returned

### 3. Token Security

- Tokens expire after 30 minutes (configurable)
- Uses HS256 algorithm for signing
- Contains the user_id in the payload
- Secret key is used for signing (should be stored as an environment variable in production)

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get access token
- `GET /api/auth/me` - Get current user info

### Users

- `GET /api/users` - Get all users
- `GET /api/users/{user_id}` - Get user by ID

### Chats

- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create a new chat
- `GET /api/chats/{chat_id}` - Get chat by ID

### Messages

- `GET /api/messages/{chat_id}` - Get messages for a chat
- `POST /api/messages` - Send a new message

## Getting Started

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
uvicorn app.main:app --reload
```
