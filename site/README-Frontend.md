# Block Chat Frontend

A responsive HTML/CSS/JS frontend for the Block Chat API.

## Features

- **Modern, responsive UI** that works on desktop and mobile
- **Real-time messaging** via WebSockets
- **Authentication** with login and registration
- **User status** indicators (online, offline, away)
- **Chat creation** with support for direct messages and group chats
- **Message history** with proper formatting and timestamps
- **Loading states** and error handling

## Structure

```
Block-Chat-Frontend/
│
├── index.html                 # Main HTML file
│
├── css/
│   └── styles.css             # Styles for the application
│
├── js/
│   ├── api.js                 # API service for backend communication
│   ├── auth.js                # Authentication functionality
│   ├── chat.js                # Chat functionality
│   ├── websocket.js           # WebSocket service
│   └── app.js                 # Main application code
│
└── README-Frontend.md         # This file
```

## How to Run

1. Ensure the Block Chat API is running at `http://localhost:8000/api`
2. Serve the frontend files using a local server:

   Using Python:
   ```bash
   python -m http.server 3000
   ```

   Using Node.js:
   ```bash
   npx serve -p 3000
   ```

3. Access the application at `http://localhost:3000`

## API Integration

The frontend communicates with the backend API using:

1. **REST API** for authentication, chat management, and message history
2. **WebSockets** for real-time messaging and user status updates

### API Endpoints Used

- **Authentication**
  - `POST /api/auth/register` - Register a new user
  - `POST /api/auth/login` - User login
  - `GET /api/auth/me` - Get current user's profile
  - `POST /api/auth/refresh` - Refresh JWT token

- **Users**
  - `GET /api/users` - Get list of users
  - `PUT /api/users/me/status` - Update user status

- **Chats**
  - `GET /api/chats` - Get user's chats
  - `POST /api/chats` - Create a new chat
  - `GET /api/chats/{chat_id}` - Get chat details

- **Messages**
  - `GET /api/chats/{chat_id}/messages` - Get messages in a chat
  - `POST /api/chats/{chat_id}/messages` - Send a message
  - `PUT /api/chats/{chat_id}/messages/read` - Mark messages as read

- **WebSockets**
  - `WebSocket /api/ws/chat/{chat_id}` - Real-time chat connection
  - `WebSocket /api/ws/status` - Real-time status updates

## Browser Compatibility

The application should work in all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Improvements

- Add message read receipts
- Implement typing indicators
- Add image/file sharing
- Add emoji support
- Implement push notifications
- Add user profile editing
- Add chat search functionality 