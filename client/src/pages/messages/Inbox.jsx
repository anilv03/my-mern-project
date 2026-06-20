import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchChats, selectChat } from '../../store/slices/chatSlice';
import { selectAuth } from '../../store/slices/authSlice';
import { formatDistanceToNow } from 'date-fns';
import { getInitials } from '../../lib/helpers';

const Inbox = () => {
  const dispatch = useDispatch();
  const { chats, isLoading } = useSelector(selectChat);
  const { user } = useSelector(selectAuth);

  useEffect(() => {
    dispatch(fetchChats());
  }, [dispatch]);

  const getOtherParticipant = (chat) => {
    return chat.participants?.find(p => p._id !== user?._id) || {};
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : chats.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500">No conversations yet</p>
          <p className="text-sm text-gray-400 mt-1">Start by visiting a product and contacting the seller</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border divide-y">
          {chats.map(chat => {
            const other = getOtherParticipant(chat);
            return (
              <Link key={chat._id} to={`/messages/${chat._id}`} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {other?.name ? getInitials(other.name) : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">{other?.name || 'Unknown User'}</span>
                    {chat.lastMessageAt && (
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{chat.lastMessage?.content || 'No messages yet'}</p>
                </div>
                {chat.product && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                    {chat.product.title?.slice(0, 20)}...
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Inbox;
