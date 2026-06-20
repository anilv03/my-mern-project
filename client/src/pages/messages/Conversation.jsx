import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMessages, sendMessage, markChatAsRead, fetchChats, selectChat } from '../../store/slices/chatSlice';
import { selectAuth } from '../../store/slices/authSlice';
import { useSocket } from '../../context/SocketContext';
import { format } from 'date-fns';
import { getInitials } from '../../lib/helpers';

const Conversation = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const socket = useSocket();
  const { messages, currentPage, totalPages, currentChat } = useSelector(selectChat);
  const { user } = useSelector(selectAuth);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    dispatch(fetchMessages({ chatId: id, page: 1 }));
    dispatch(markChatAsRead(id));
    if (socket) {
      socket.emit('chat:join', { chatId: id });
    }
    return () => {
      if (socket) {
        socket.emit('chat:leave', { chatId: id });
      }
    };
  }, [id, dispatch, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      if (msg.chat === id && msg.sender?._id !== user?._id) {
        dispatch(fetchMessages({ chatId: id, page: 1 }));
      }
    };
    socket.on('chat:message', handler);
    return () => socket.off('chat:message', handler);
  }, [socket, id, dispatch, user]);

  const handleSend = useCallback(async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await dispatch(sendMessage({ chatId: id, content: text }));
    setText('');
    if (socket) {
      socket.emit('chat:stop_typing', { chatId: id });
    }
  }, [text, id, dispatch, socket]);

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!isTyping && socket) {
      setIsTyping(true);
      socket.emit('chat:typing', { chatId: id });
    }
    if (e.target.value === '' && socket) {
      setIsTyping(false);
      socket.emit('chat:stop_typing', { chatId: id });
    }
  };

  const loadMore = () => {
    if (currentPage < totalPages) {
      dispatch(fetchMessages({ chatId: id, page: currentPage + 1 }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg border flex flex-col h-[70vh]">
        <div className="p-4 border-b flex items-center gap-3">
          <Link to="/messages" className="text-gray-500 hover:text-gray-700">&larr; Back</Link>
          <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
            {getInitials('Support')}
          </div>
          <span className="font-medium">Conversation</span>
        </div>

        <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {currentPage < totalPages && (
            <button onClick={loadMore} className="w-full text-center text-sm text-primary-600 py-2">
              Load older messages
            </button>
          )}
          {messages.map(msg => (
            <div key={msg._id} className={`flex ${msg.sender?._id === user?._id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-lg px-4 py-2 ${msg.sender?._id === user?._id ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.sender?._id === user?._id ? 'text-primary-200' : 'text-gray-400'}`}>
                  {format(new Date(msg.createdAt), 'hh:mm a')}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
          <input
            type="text"
            value={text}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button type="submit" disabled={!text.trim()} className="btn-primary text-sm !px-6">Send</button>
        </form>
      </div>
    </div>
  );
};

export default Conversation;
