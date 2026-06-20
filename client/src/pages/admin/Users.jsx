import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchUsers, updateUserStatus, resetAdminSuccess } from '../../store/slices/adminSlice';
import { formatDate, getInitials, classNames } from '../../lib/helpers';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';

const roleOptions = [
  { value: 'customer', label: 'Customer' },
  { value: 'seller', label: 'Seller' },
  { value: 'admin', label: 'Admin' },
];

const roleBadgeVariant = {
  customer: 'info',
  seller: 'accent',
  admin: 'warning',
  super_admin: 'danger',
};

const UserRow = ({ user, onEdit }) => (
  <tr className="hover:bg-gray-50 transition-colors">
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-medium flex-shrink-0">
          {user.avatar?.url ? (
            <img src={user.avatar.url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            getInitials(user.name)
          )}
        </div>
        <span className="text-sm font-medium text-gray-900">{user.name}</span>
      </div>
    </td>
    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
    <td className="px-4 py-3 text-sm text-gray-600">{user.phone || '-'}</td>
    <td className="px-4 py-3">
      <Badge variant={roleBadgeVariant[user.role] || 'secondary'} size="xs">
        {user.role?.replace('_', ' ')}
      </Badge>
    </td>
    <td className="px-4 py-3">
      <Badge variant={user.isActive ? 'success' : 'secondary'} size="xs" dot>
        {user.isActive ? 'Active' : 'Inactive'}
      </Badge>
    </td>
    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(user.createdAt)}</td>
    <td className="px-4 py-3">
      <Button size="xs" variant="ghost" onClick={() => onEdit(user)}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </Button>
    </td>
  </tr>
);

export default function AdminUsers() {
  const dispatch = useDispatch();
  const { users, isLoading, pagination, isSuccess } = useSelector(state => state.admin);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ role: '', isActive: true });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter]);

  useEffect(() => {
    dispatch(fetchUsers({ page, limit: pagination.limit || 20, role: roleFilter || undefined, search: debouncedSearch || undefined }));
  }, [dispatch, page, pagination.limit, roleFilter, debouncedSearch]);

  useEffect(() => {
    if (isSuccess) {
      setEditingUser(null);
      dispatch(resetAdminSuccess());
    }
  }, [isSuccess, dispatch]);

  const handleEdit = useCallback((user) => {
    setEditForm({ role: user.role, isActive: user.isActive });
    setEditingUser(user);
  }, []);

  const handleSave = () => {
    if (!editingUser) return;
    dispatch(updateUserStatus({ id: editingUser._id, data: editForm }));
  };

  const roleTabs = ['', 'customer', 'seller', 'admin'];

  return (
    <>
      <Helmet><title>Users | Admin | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Users</h1>
            <p className="text-gray-500 mt-1">Manage platform users</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {roleTabs.map(role => (
              <button
                key={role}
                onClick={() => { setRoleFilter(role); setPage(1); }}
                className={classNames(
                  'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  roleFilter === role ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'All'}
              </button>
            ))}
          </div>
        </div>

        <Card padding={false}>
          {isLoading ? (
            <PageLoader />
          ) : users.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map(user => (
                      <UserRow key={user._id} user={user} onEdit={handleEdit} />
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination?.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-sm text-gray-600">
                    Showing {((page - 1) * pagination.limit) + 1}-{Math.min(page * pagination.limit, pagination.totalItems)} of {pagination.totalItems}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <span className="text-sm text-gray-600">Page {page} of {pagination.totalPages}</span>
                    <Button variant="ghost" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Edit User" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm(f => ({ ...f, role: e.target.value }))}
              className="input-field"
            >
              {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={editForm.isActive}
              onChange={(e) => setEditForm(f => ({ ...f, isActive: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Active</span>
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
