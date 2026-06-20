import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchNotifications, markAsRead, markAllAsRead, deleteNotification } from '../../store/slices/notificationSlice';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Loader';
import { formatDate, formatDateTime, getTimeAgo, classNames } from '../../lib/helpers';

const NOTIF_ICONS = {
  order_placed: 'M9 5l7 7-7 7',
  order_shipped: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2-2m0 0l2 2m-2-2l2-2',
  order_delivered: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  order_cancelled: 'M6 18L18 6M6 6l12 12',
  payment_received: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  payment_failed: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  seller_approved: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  welcome: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  system: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

const TYPE_COLORS = {
  order: 'bg-blue-100 text-blue-600',
  payment: 'bg-green-100 text-green-600',
  seller: 'bg-purple-100 text-purple-600',
  product: 'bg-orange-100 text-orange-600',
  review: 'bg-pink-100 text-pink-600',
  system: 'bg-gray-100 text-gray-600',
  welcome: 'bg-yellow-100 text-yellow-600',
  promo: 'bg-indigo-100 text-indigo-600',
};

const getNotifColor = (type) => {
  const key = Object.keys(TYPE_COLORS).find(k => type?.includes(k)) || 'system';
  return TYPE_COLORS[key];
};

export default function Notifications() {
  const dispatch = useDispatch();
  const { notifications, isLoading, unreadCount } = useSelector(state => state.notifications);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkRead = (id) => dispatch(markAsRead(id));
  const handleMarkAllRead = () => dispatch(markAllAsRead());
  const handleDelete = (id) => dispatch(deleteNotification(id));

  const filtered = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;

  return (
    <>
      <Helmet><title>Notifications | Zalnio</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-500 mt-1">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>Mark All as Read</Button>
          )}
        </div>

        <div className="flex gap-2 mb-6">
          {['all', 'unread'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={classNames('px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}>
              {f === 'all' ? 'All' : 'Unread'} {f === 'unread' && `(${unreadCount})`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h2>
              <p className="text-gray-500">You're all caught up!</p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(notif => {
              const iconPath = NOTIF_ICONS[notif.type] || NOTIF_ICONS.system;
              return (
                <Card
                  key={notif._id}
                  padding={false}
                  hover={false}
                  className={classNames('transition-colors', !notif.isRead && 'bg-primary-50/50 border-primary-100')}
                >
                  <div className="flex items-start gap-4 p-4">
                    <div className={classNames('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', getNotifColor(notif.type))}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => !notif.isRead && handleMarkRead(notif._id)}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={classNames('text-sm', !notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-700')}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                          <span className="text-xs text-gray-400 whitespace-nowrap">{getTimeAgo(notif.createdAt)}</span>
                          {!notif.isRead && <span className="w-2 h-2 rounded-full bg-primary-500" />}
                        </div>
                      </div>
                      {notif.link && (
                        <Link to={notif.link} className="text-xs text-primary-600 hover:underline mt-1 inline-block">
                          View details
                        </Link>
                      )}
                    </div>
                    <button onClick={() => handleDelete(notif._id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
