# Shared data structure for WebSocket connections
chat_connections = {}  # chat_id -> list of WebSocket objects

# For status connections, use a dictionary to map WebSocket objects to user IDs
status_connections = {}  # WebSocket -> user_id
