import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchTickets, createTicket, addTicketReply, closeTicket, reopenTicket } from '../../store/slices/supportTicketSlice';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';
import { formatDate, formatDateTime, classNames, getTimeAgo } from '../../lib/helpers';

const statusFilters = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_on_seller', label: 'Awaiting You' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const priorityVariants = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const statusVariants = {
  open: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  waiting_on_seller: 'bg-yellow-100 text-yellow-700',
  waiting_on_admin: 'bg-purple-100 text-purple-700',
  resolved: 'bg-gray-100 text-gray-700',
  closed: 'bg-gray-100 text-gray-700',
};

const categories = [
  { value: 'technical', label: 'Technical Issue' },
  { value: 'billing', label: 'Billing & Payments' },
  { value: 'product', label: 'Product Management' },
  { value: 'account', label: 'Account Issue' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'other', label: 'Other' },
];

export default function SupportTickets() {
  const dispatch = useDispatch();
  const { tickets, currentTicket, isLoading, isSuccess, pagination } = useSelector(state => state.tickets);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingTicket, setViewingTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const [newTicket, setNewTicket] = useState({
    subject: '', category: 'technical', priority: 'medium', description: '',
  });

  useEffect(() => {
    dispatch(fetchTickets({ page, status: statusFilter || undefined }));
  }, [dispatch, page, statusFilter]);

  useEffect(() => {
    if (isSuccess) {
      setShowCreateModal(false);
      setNewTicket({ subject: '', category: 'technical', priority: 'medium', description: '' });
    }
  }, [isSuccess]);

  const handleCreateTicket = (e) => {
    e.preventDefault();
    dispatch(createTicket(newTicket));
  };

  const handleViewTicket = (ticket) => {
    setViewingTicket(ticket);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !viewingTicket) return;
    setSendingReply(true);
    await dispatch(addTicketReply({ id: viewingTicket._id, message: replyText }));
    setReplyText('');
    setSendingReply(false);
  };

  const handleCloseTicket = () => {
    if (viewingTicket) dispatch(closeTicket(viewingTicket._id));
  };

  const handleReopenTicket = () => {
    if (viewingTicket) dispatch(reopenTicket(viewingTicket._id));
  };

  return (
    <>
      <Helmet><title>Support Tickets | Seller | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Support Tickets</h1>
            <p className="text-gray-500 mt-1">Get help from our support team</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>Create Ticket</Button>
        </div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {statusFilters.map(f => (
            <button key={f.value} onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === f.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {isLoading && tickets.length === 0 ? (
          <PageLoader />
        ) : tickets.length === 0 ? (
          <Card className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No tickets found</h3>
            <p className="text-gray-500 mb-4">Create a support ticket and we'll get back to you</p>
            <Button onClick={() => setShowCreateModal(true)}>Create Ticket</Button>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {tickets.map(ticket => (
                <Card key={ticket._id} padding={false} hover>
                  <div className="p-4 cursor-pointer" onClick={() => handleViewTicket(ticket)}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{ticket.subject}</h3>
                          <Badge variant={ticket.status === 'open' ? 'success' : ticket.status === 'closed' ? 'secondary' : ticket.status === 'in_progress' ? 'info' : 'warning'} size="xs">
                            {ticket.status?.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{ticket.description}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        <span className={classNames('px-2 py-0.5 rounded text-xs font-medium', priorityVariants[ticket.priority] || 'bg-gray-100 text-gray-700')}>
                          {ticket.priority}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{ticket.category?.replace(/_/g, ' ')}</span>
                      <span>{formatDate(ticket.createdAt)}</span>
                      {ticket.replies?.length > 0 && <span>{ticket.replies.length} replies</span>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {pagination?.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="text-sm text-gray-600">Page {page} of {pagination.totalPages}</span>
                <Button variant="ghost" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Support Ticket" size="lg">
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <Input label="Subject" value={newTicket.subject} onChange={e => setNewTicket(f => ({ ...f, subject: e.target.value }))} required placeholder="Brief description of your issue" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={newTicket.category} onChange={e => setNewTicket(f => ({ ...f, category: e.target.value }))} className="input-field w-full">
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={newTicket.priority} onChange={e => setNewTicket(f => ({ ...f, priority: e.target.value }))} className="input-field w-full">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={5} className="input-field w-full" value={newTicket.description} onChange={e => setNewTicket(f => ({ ...f, description: e.target.value }))} required placeholder="Describe your issue in detail..." />
          </div>
          <div className="flex gap-3">
            <Button type="submit" fullWidth isLoading={isLoading}>Submit Ticket</Button>
            <Button type="button" variant="outline" fullWidth onClick={() => setShowCreateModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!viewingTicket} onClose={() => { setViewingTicket(null); setReplyText(''); }} title={viewingTicket?.subject || 'Ticket'} size="3xl">
        {viewingTicket && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant={viewingTicket.status === 'open' ? 'success' : viewingTicket.status === 'closed' ? 'secondary' : 'info'} size="sm">
                {viewingTicket.status?.replace(/_/g, ' ')}
              </Badge>
              <span className={classNames('px-2 py-0.5 rounded text-xs font-medium', priorityVariants[viewingTicket.priority])}>
                {viewingTicket.priority}
              </span>
              <span className="text-xs text-gray-500 capitalize">{viewingTicket.category?.replace(/_/g, ' ')}</span>
              <span className="text-xs text-gray-500">Created {formatDate(viewingTicket.createdAt)}</span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewingTicket.description}</p>
            </div>

            {viewingTicket.replies?.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900">Replies ({viewingTicket.replies.length})</h4>
                {viewingTicket.replies.map((reply, i) => (
                  <div key={reply._id || i} className={classNames('flex gap-3', reply.isAdmin ? '' : 'flex-row-reverse')}>
                    <div className={classNames('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                      reply.isAdmin ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-600'
                    )}>
                      {reply.isAdmin ? 'S' : 'Y'}
                    </div>
                    <div className={classNames('max-w-[80%] rounded-lg p-3', reply.isAdmin ? 'bg-primary-50' : 'bg-gray-100')}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-900">{reply.isAdmin ? 'Support Team' : 'You'}</span>
                        <span className="text-xs text-gray-400">{getTimeAgo(reply.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{reply.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewingTicket.status !== 'closed' && viewingTicket.status !== 'resolved' && (
              <div className="border-t pt-4">
                <div className="flex gap-3">
                  <input className="input-field flex-1" placeholder="Type your reply..." value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }} />
                  <Button onClick={handleSendReply} isLoading={sendingReply} disabled={!replyText.trim()}>Send</Button>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {(viewingTicket.status === 'open' || viewingTicket.status === 'in_progress' || viewingTicket.status === 'waiting_on_seller') && (
                <Button variant="danger" size="sm" onClick={handleCloseTicket}>Close Ticket</Button>
              )}
              {(viewingTicket.status === 'closed' || viewingTicket.status === 'resolved') && (
                <Button variant="outline" size="sm" onClick={handleReopenTicket}>Reopen Ticket</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
