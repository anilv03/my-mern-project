import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { selectAuth } from '../store/slices/authSlice';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, isAuthenticated, token } = useSelector(selectAuth);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketInstance = io(import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || '', {
      auth: { token },
      query: {
        userId: user?._id,
        role: user?.role,
      },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {});
    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, token, user?._id, user?.role]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    console.warn('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
