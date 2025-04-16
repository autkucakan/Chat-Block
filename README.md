# Block Chat API

A real-time chat application API built with FastAPI and PostgreSQL.
A real-time chat application API built with FastAPI and PostgreSQL.

## 1. Introduction

Block Chat is a modern chat application API that allows users to register, login, create chats, and exchange messages in real-time. The API is built using FastAPI for high performance and SQLAlchemy with PostgreSQL for reliable data storage.

## 2. Features

- **Authentication System**
  - JWT-based authentication
  - Secure password hashing with bcrypt
  - User registration and login
  - Token refresh endpoint

- **User Management**
  - Create and manage user accounts
  - View user profiles

- **Chat System**
  - Create individual and group chats
  - Add/remove users from chats

- **Messaging**
  - Send and receive messages
  - Read status tracking
  - Message timestamps

## 3. Project Structure

```
Chat-Block/
│
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI application entry point
│   ├── database.py              # Database configuration and connection
│   ├── models.py                # SQLAlchemy data models
│   ├── schemas.py               # Pydantic schemas for request/response validation
│   │
│   └── routers/
│       ├── __init__.py
│       ├── auth.py              # Authentication endpoints (register, login, me)
│       ├── oauth2.py            # JWT token handling and user authentication
│       ├── users.py             # User-related endpoints
│       ├── chats.py             # Chat-related endpoints
│       └── messages.py          # Message-related endpoints
│
└── README.md                    # Project documentation
```

## 4. Installation

### Prerequisites

- Python 3.8+
- PostgreSQL

### Step 1: Clone the repository

```bash
git clone https://github.com/yourusername/Chat-Block.git
cd Chat-Block
```

### Step 2: Create a virtual environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

### Step 3: Install dependencies

```bash
pip install -r requirements.txt
```

If `requirements.txt` is not available, install the required packages:

```bash
pip install fastapi[all] sqlalchemy psycopg2-binary passlib[bcrypt] python-jose[cryptography] email-validator
```

### Step 4: Configure the database

Create a PostgreSQL database and update the connection string in `app/database.py`:

```python
SQLALCHEMY_DATABASE_URL = "postgresql://username:password@localhost:5432/blockchat"
```

### Step 5: Run the application

```bash
uvicorn app.main:app --reload
```

## 5. API Endpoints
## 1. Introduction

Block Chat is a modern chat application API that allows users to register, login, create chats, and exchange messages in real-time. The API is built using FastAPI for high performance and SQLAlchemy with PostgreSQL for reliable data storage.

## 2. Features

- **Authentication System**
  - JWT-based authentication
  - Secure password hashing with bcrypt
  - User registration and login
  - Token refresh endpoint

- **User Management**
  - Create and manage user accounts
  - View user profiles

- **Chat System**
  - Create individual and group chats
  - Add/remove users from chats

- **Messaging**
  - Send and receive messages
  - Read status tracking
  - Message timestamps

## 3. Project Structure

```
Chat-Block/
│
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI application entry point
│   ├── database.py              # Database configuration and connection
│   ├── models.py                # SQLAlchemy data models
│   ├── schemas.py               # Pydantic schemas for request/response validation
│   │
│   └── routers/
│       ├── __init__.py
│       ├── auth.py              # Authentication endpoints (register, login, me)
│       ├── oauth2.py            # JWT token handling and user authentication
│       ├── users.py             # User-related endpoints
│       ├── chats.py             # Chat-related endpoints
│       └── messages.py          # Message-related endpoints
│
└── README.md                    # Project documentation
```

## 4. Installation

### Prerequisites

- Python 3.8+
- PostgreSQL

### Step 1: Clone the repository

```bash
git clone https://github.com/yourusername/Chat-Block.git
cd Chat-Block
```

### Step 2: Create a virtual environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

### Step 3: Install dependencies

```bash
pip install -r requirements.txt
```

If `requirements.txt` is not available, install the required packages:

```bash
pip install fastapi[all] sqlalchemy psycopg2-binary passlib[bcrypt] python-jose[cryptography] email-validator
```

### Step 4: Configure the database

Create a PostgreSQL database and update the connection string in `app/database.py`:

```python
SQLALCHEMY_DATABASE_URL = "postgresql://username:password@localhost:5432/blockchat"
```

### Step 5: Run the application

```bash
uvicorn app.main:app --reload
```

## 5. API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - User login (returns JWT token)
- `POST /auth/refresh` - Refresh JWT token
- `GET /auth/me` - Get current user's profile

### Users

- `GET /users` - Get list of users (with pagination)
- `GET /users/{user_id}` - Get specific user profile
- `PUT /users/{user_id}` - Update user profile
- `DELETE /users/{user_id}` - Delete user account
- `GET /users/{user_id}/status` - Get user online status
- `PUT /users/{user_id}/status` - Update user status (online/offline/away)

### Chats

- `GET /chats` - Get list of user's chats/conversations
- `POST /chats` - Create new chat (group or direct message)
- `GET /chats/{chat_id}` - Get chat details
- `PUT /chats/{chat_id}` - Update chat details (rename, etc.)
- `DELETE /chats/{chat_id}` - Delete chat
- `POST /chats/{chat_id}/members` - Add members to chat
- `DELETE /chats/{chat_id}/members/{user_id}` - Remove member from chat

### Messages

- `GET /chats/{chat_id}/messages` - Get messages in a chat (with pagination)
- `POST /chats/{chat_id}/messages` - Send new message
- `PUT /chats/{chat_id}/messages/{message_id}` - Edit message
- `DELETE /chats/{chat_id}/messages/{message_id}` - Delete message
- `GET /chats/{chat_id}/messages/{message_id}/read-status` - Get message read status
- `PUT /chats/{chat_id}/messages/read` - Mark messages as read

### WebSocket
- `WebSocket /ws/chat/{chat_id}` - WebSocket connection for real-time chat
- `WebSocket /ws/status` - WebSocket connection for user status updates

## 6. Authentication

The application uses JWT (JSON Web Token) for authentication. To access protected endpoints:

1. Obtain a token via `/api/auth/login`
2. Include the token in the Authorization header:
   ```
   Authorization: Bearer <your_token>
   ```

## 7. Development

### Creating Requirements File

To generate a requirements.txt file:

```bash
pip freeze > requirements.txt
pip freeze > requirements.txt
```

### Running Tests

To run tests (once implemented):

### Running Tests

To run tests (once implemented):

```bash
pytest
```

## 8. License

This project is licensed under the MIT License - see the LICENSE file for details.

## 9. Contact

For any questions or suggestions, please contact:

- Email: ahmet.utku.cakan@gmail.com or voltry6@gmail.com
- GitHub: [voltRy](https://github.com/voltry) or [autkucakan](https://github.com/autkucakan)