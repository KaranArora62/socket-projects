// src/App.tsx
import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

function App() {
  const [userCount, setUserCount] = useState<number>(0);
  const [userId, setUserId] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [usernames, setUsernames] = useState<string[]>([]);
  const [inputUsername, setInputUsername] = useState<string>('');
  const [isUsernameSet, setIsUsernameSet] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Retrieve or generate a user ID
    let storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      storedUserId = uuidv4();
      localStorage.setItem('userId', storedUserId);
    }
    setUserId(storedUserId);

    const newSocket: Socket = io('http://localhost:3000', {
      withCredentials: true,
      query: {
        userId: storedUserId,
      },
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected with socket ID:', newSocket.id);
    });

    newSocket.on('update-data', (data: { count: number; users: string[] }) => {
      setUserCount(data.count);
      setUsernames(data.users);
    });

    newSocket.on('your-info', (data: { username: string }) => {
      setUsername(data.username);
      setIsUsernameSet(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleSetUsername = () => {
    if (socket && inputUsername.trim() !== '') {
      socket.emit('set-username', inputUsername.trim());
      setIsUsernameSet(true);
    }
  };

  return (
    <div className="container">
      {!isUsernameSet ? (
        <div style={{ textAlign: 'center' }}>
          <h2>Welcome!</h2>
          <p>Please enter your username to continue:</p>
          <div className="username-input">
            <input
              type="text"
              placeholder="Enter username"
              value={inputUsername}
              onChange={(e) => setInputUsername(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSetUsername();
              }}
            />
            <button onClick={handleSetUsername}>Join</button>
          </div>
        </div>
      ) : (
        <>
          <h1 style={{ textAlign: 'center' }}>Real-Time User List</h1>
          <h2>Hello, {username}!</h2>
          <p>Total Connected Users: {userCount}</p>
          <h3>Currently Online:</h3>
          <ul className="user-list">
            {usernames.map((name, index) => (
              <li key={index}>
                {name}
                {name === username ? ' (You)' : ''}
              </li>
            ))}
          </ul>
          <div className="footer">
            <p>Your User ID: {userId}</p>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
