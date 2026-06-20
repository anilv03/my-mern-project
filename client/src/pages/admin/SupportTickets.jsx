import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { formatDate, formatDateTime, getTimeAgo, classNames } from '../../lib/helpers';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';
import adminService from '../../services/adminService';

const statusTabs = ['', 'open', 'in_progress', 'resolved', 'closed'];

const statusBadgeVariant = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'secondary',
};

const priorityBadgeVariant = {
  low: 'secondary',
  medium: 'primary',
  high: 'warning',
  urgent: 'danger',
};

export default function AdminSupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ open: 0, in_progress: 0, resolved: 0, closed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [assignModal, setAssignModal] = useState(null);
  const [assignTo, setAssignTo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const perPage = 20;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { page, limit: perPage, status: statusFilter || undefined, priority: priorityFilter || undefined, search: debouncedSearch || undefined };
      const res = await adminService.getSupportTickets(params);
      setTickets(res.tickets || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalItems(res.pagination?.totalItems || 0);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, priorityFilter, debouncedSearch]);

  useEffect(() => { setPage(1); }, [statusFilter, priorityFilter, debouncedSearch]);
  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const fetchTicketDetail = async (ticket) => {
    try {
      const res = await adminService.getSupportTicketById(ticket._id);
      setSelectedTicket(res);
    } catch (err) {
      setSelectedTicket(ticket);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setSubmitting(true);
    try {
      await adminService.replyToTicket(selectedTicket._id, replyText);
      setReplyText('');
      fetchTicketDetail(selectedTicket);
      fetchTickets();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async () => {
    if (!assignModal || !assignTo) return;
    try {
      await adminService.assignTicket(assignModal, assignTo);
      setAssignModal(null);
      setAssignTo('');
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClose = async (id) => {
    try {
      await adminService.closeTicket(id);
      if (selectedTicket?._id === id) setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReopen = async (id) => {
    try {
      await adminService.reopenTicket(id);
      if (selectedTicket?._id === id) setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Helmet><title>Support Tickets | Admin | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Support Tickets</h1>
            <p className="text-gray-500 mt-1">Manage customer and seller support tickets</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Open</p><p className="text-2xl font-bold text-yellow-600 mt-1">{stats.open || 0}</p></div></div></Card>
          <Card><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">In Progress</p><p className="text-2xl font-bold text-blue-600 mt-1">{stats.in_progress || 0}</p></div></div></Card>
          <Card><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Resolved</p><p className="text-2xl font-bold text-green-600 mt-1">{stats.resolved || 0}</p></div></div></Card>
          <Card><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Closed</p><p className="text-2xl font-bold text-gray-600 mt-1">{stats.closed || 0}</p></div></div></Card>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1">
            {statusTabs.map(status => (
              <button key={status} onClick={() => setStatusFilter(status)} className={classNames('px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors', statusFilter === status ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                {status ? status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="input-field text-sm">
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <Input placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} className="!w-48" />
          </div>
        </div>

        <Card padding={false}>
          {isLoading ? (
            <PageLoader />
          ) : tickets.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No tickets found</h3>
              <p className="text-gray-500">No support tickets match your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tickets.map(ticket => (
                      <tr key={ticket._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <button onClick={() => fetchTicketDetail(ticket)} className="text-sm font-medium text-primary-600 hover:underline text-left">
                            {ticket.subject || ticket.title}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{ticket.user?.name || ticket.customerName || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <Badge variant="info" size="xs">{ticket.category || 'general'}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={priorityBadgeVariant[ticket.priority] || 'secondary'} size="xs">{ticket.priority || 'medium'}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariant[ticket.status] || 'secondary'} size="xs">{ticket.status?.replace('_', ' ')}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{ticket.assignedTo?.name || ticket.assignedToName || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(ticket.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button size="xs" variant="ghost" onClick={() => fetchTicketDetail(ticket)} title="View">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </Button>
                            <Button size="xs" variant="ghost" onClick={() => { setAssignModal(ticket._id); setAssignTo(''); }} title="Assign">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                            </Button>
                            {(ticket.status === 'resolved' || ticket.status === 'closed') ? (
                              <Button size="xs" variant="ghost" className="text-green-600" onClick={() => handleReopen(ticket._id)} title="Reopen">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                              </Button>
                            ) : (
                              <Button size="xs" variant="ghost" className="text-red-600" onClick={() => handleClose(ticket._id)} title="Close">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-sm text-gray-600">Showing {((page - 1) * perPage) + 1}-{Math.min(page * perPage, totalItems)} of {totalItems}</span>
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

      <Modal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)} title={selectedTicket?.subject || selectedTicket?.title || 'Ticket Details'} size="2xl">
        {selectedTicket && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <Badge variant={statusBadgeVariant[selectedTicket.status] || 'secondary'} size="sm">{selectedTicket.status?.replace('_', ' ')}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Priority</p>
                <Badge variant={priorityBadgeVariant[selectedTicket.priority] || 'secondary'} size="sm">{selectedTicket.priority || 'medium'}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">From</p>
                <p className="text-sm text-gray-900">{selectedTicket.user?.name || selectedTicket.customerName || 'N/A'}</p>
                <p className="text-xs text-gray-500">{selectedTicket.user?.email || ''}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Category</p>
                <Badge variant="info" size="sm">{selectedTicket.category || 'general'}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Created</p>
                <p className="text-sm text-gray-900">{formatDateTime(selectedTicket.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Assigned To</p>
                <p className="text-sm text-gray-900">{selectedTicket.assignedTo?.name || selectedTicket.assignedToName || 'Unassigned'}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.description || selectedTicket.message || 'No description'}</p>
            </div>

            {selectedTicket.replies?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Replies ({selectedTicket.replies.length})</h4>
                <div className="space-y-3">
                  {(selectedTicket.replies || []).map((reply, i) => (
                    <div key={reply._id || i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{reply.user?.name || reply.userName || 'Admin'}</span>
                        <span className="text-xs text-gray-500">{getTimeAgo(reply.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.message || reply.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-1">Add Reply</label>
                <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3} className="input-field resize-y mb-3" placeholder="Type your reply..." />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setSelectedTicket(null)}>Cancel</Button>
                  <Button size="sm" onClick={handleReply} isLoading={submitting} disabled={!replyText.trim()}>Send Reply</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={!!assignModal} onClose={() => setAssignModal(null)} title="Assign Ticket" size="sm">
        <div className="space-y-4">
          <Input label="Admin ID or Email *" value={assignTo} onChange={(e) => setAssignTo(e.target.value)} placeholder="Enter admin user ID or email" />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setAssignModal(null)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!assignTo.trim()}>Assign</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}