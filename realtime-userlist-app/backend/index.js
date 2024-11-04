const express = require('express');
const app = express();
const http = require('http').createServer(app);
const cors = require('cors');

const io = require('socket.io')(http, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors());

let users = {}; // Map userId to { username, sockets: Set of socket IDs }

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;

  if (!userId) {
    console.log('User connected without userId');
    socket.disconnect();
    return;
  }

  // Initialize user data if not present
  if (!users[userId]) {
    users[userId] = { username: '', sockets: new Set() };
  }

  // Add socket ID to user's set of sockets
  users[userId].sockets.add(socket.id);

  console.log(`User connected: ${socket.id} (User ID: ${userId})`);

  // If username is already set, send it to the client
  if (users[userId].username) {
    socket.emit('your-info', { username: users[userId].username });
  }

  // Update connected users count and list
  updateConnectedUsers();

  // Listen for 'set-username' event from client
  socket.on('set-username', (username) => {
    users[userId].username = username;
    console.log(`Username set for User ID ${userId}: ${username}`);

    // Emit updated data to all clients
    updateConnectedUsers();

    // Send the username to the connected client
    socket.emit('your-info', { username: username });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id} (User ID: ${userId})`);

    // Remove the socket from the user's socket set
    users[userId].sockets.delete(socket.id);

    // If the user has no more connected sockets, remove them from users
    if (users[userId].sockets.size === 0) {
      console.log(`User disconnected: User ID ${userId} (${users[userId].username})`);
      delete users[userId];
    }

    // Update connected users count and list
    updateConnectedUsers();
  });

  function updateConnectedUsers() {
    const connectedUsers = Object.keys(users).length;
    const usernames = Object.values(users)
      .map((user) => user.username)
      .filter((name) => name !== '');

    io.emit('update-data', {
      count: connectedUsers,
      users: usernames,
    });
  }
});

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
