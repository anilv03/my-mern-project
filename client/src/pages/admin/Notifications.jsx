import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { formatDate, classNames } from '../../lib/helpers';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';
import adminService from '../../services/adminService';

const typeTabs = ['', 'info', 'warning', 'success', 'promotion'];

const typeBadgeVariant = {
  info: 'info',
  warning: 'warning',
  success: 'success',
  promotion: 'primary',
};

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    recipientId: '', type: 'info', title: '', message: '', link: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const perPage = 20;

  useEffect(() => {
    fetchNotifications();
  }, [page, typeFilter]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getAllNotifications({ page, limit: perPage, type: typeFilter || undefined });
      setNotifications(res.notifications || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalItems(res.pagination?.totalItems || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.message) return;
    setSubmitting(true);
    try {
      await adminService.sendNotification({
        recipientId: form.recipientId || undefined,
        type: form.type,
        title: form.title,
        message: form.message,
        link: form.link || undefined,
      });
      setShowModal(false);
      setForm({ recipientId: '', type: 'info', title: '', message: '', link: '' });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet><title>Notifications - Admin | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-500 mt-1">Send and manage platform notifications</p>
          </div>
          <Button onClick={() => { setForm({ recipientId: '', type: 'info', title: '', message: '', link: '' }); setShowModal(true); }}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Send Notification
          </Button>
        </div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {typeTabs.map(type => (
            <button
              key={type}
              onClick={() => { setTypeFilter(type); setPage(1); }}
              className={classNames(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                typeFilter === type ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {type ? type.charAt(0).toUpperCase() + type.slice(1) : 'All'}
            </button>
          ))}
        </div>

        <Card padding={false}>
          {isLoading ? (
            <PageLoader />
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
              <p className="text-gray-500">No notifications have been sent yet</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Read</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {notifications.map(notif => (
                      <tr key={notif._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{notif.recipient?.name || notif.recipientId?.name || 'All Users'}</p>
                          <p className="text-xs text-gray-500">{notif.recipient?.email || ''}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={typeBadgeVariant[notif.type] || 'secondary'} size="xs">{notif.type}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 max-w-[200px] truncate">{notif.title}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[250px] truncate" title={notif.message}>{notif.message}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${notif.read ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {notif.read ? 'Read' : 'Unread'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(notif.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-sm text-gray-600">
                    Showing {((page - 1) * perPage) + 1}-{Math.min(page * perPage, totalItems)} of {totalItems}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                    <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Send Notification" size="md">
        <div className="space-y-4">
          <Input label="Recipient User ID (leave empty for all)" value={form.recipientId} onChange={(e) => setForm({ ...form, recipientId: e.target.value })} placeholder="User ID or leave empty" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
              <option value="promotion">Promotion</option>
            </select>
          </div>
          <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Notification title" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
              className="input-field resize-y"
              placeholder="Notification message..."
            />
          </div>
          <Input label="Link URL (optional)" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} isLoading={submitting} disabled={!form.title || !form.message}>Send Notification</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
