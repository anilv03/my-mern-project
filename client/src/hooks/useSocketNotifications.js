import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useSocket } from '../context/SocketContext';
import { addNotification } from '../store/slices/notificationSlice';

const useSocketNotifications = () => {
  const dispatch = useDispatch();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification) => {
      dispatch(addNotification(notification));
    };

    socket.on('notification', handleNotification);
    socket.on('new_notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('new_notification', handleNotification);
    };
  }, [socket, dispatch]);
};

export default useSocketNotifications;
