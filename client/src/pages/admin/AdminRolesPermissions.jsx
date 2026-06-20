import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { formatDate, classNames } from '../../lib/helpers';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { PageLoader, Spinner } from '../../components/ui/Loader';
import adminService from '../../services/adminService';

const permissionGroups = [
  {
    group: 'Dashboard', key: 'dashboard',
    permissions: [
      { key: 'view', label: 'View Dashboard' },
    ],
  },
  {
    group: 'Users', key: 'users',
    permissions: [
      { key: 'view', label: 'View Users' },
      { key: 'create', label: 'Create Users' },
      { key: 'edit', label: 'Edit Users' },
      { key: 'delete', label: 'Delete Users' },
    ],
  },
  {
    group: 'Sellers', key: 'sellers',
    permissions: [
      { key: 'view', label: 'View Sellers' },
      { key: 'approve', label: 'Approve/Reject Sellers' },
      { key: 'suspend', label: 'Suspend/Restore Sellers' },
    ],
  },
  {
    group: 'Products', key: 'products',
    permissions: [
      { key: 'view', label: 'View Products' },
      { key: 'approve', label: 'Approve/Reject Products' },
      { key: 'manage', label: 'Manage Products' },
    ],
  },
  {
    group: 'Orders', key: 'orders',
    permissions: [
      { key: 'view', label: 'View Orders' },
      { key: 'update', label: 'Update Order Status' },
      { key: 'cancel', label: 'Cancel Orders' },
    ],
  },
  {
    group: 'Coupons', key: 'coupons',
    permissions: [
      { key: 'view', label: 'View Coupons' },
      { key: 'create', label: 'Create Coupons' },
      { key: 'delete', label: 'Delete Coupons' },
    ],
  },
  {
    group: 'Refunds', key: 'refunds',
    permissions: [
      { key: 'view', label: 'View Refunds' },
      { key: 'approve', label: 'Approve/Reject Refunds' },
    ],
  },
  {
    group: 'Wallet', key: 'wallet',
    permissions: [
      { key: 'view', label: 'View Wallet' },
      { key: 'credit', label: 'Credit Wallet' },
      { key: 'debit', label: 'Debit Wallet' },
    ],
  },
  {
    group: 'Withdrawals', key: 'withdrawals',
    permissions: [
      { key: 'view', label: 'View Withdrawals' },
      { key: 'approve', label: 'Approve/Reject Withdrawals' },
    ],
  },
  {
    group: 'Referrals', key: 'referrals',
    permissions: [
      { key: 'view', label: 'View Referral Analytics' },
    ],
  },
  {
    group: 'Creator Program', key: 'creator_program',
    permissions: [
      { key: 'view', label: 'View Rewards' },
      { key: 'review', label: 'Review Rewards' },
    ],
  },
  {
    group: 'CMS', key: 'cms',
    permissions: [
      { key: 'view', label: 'View CMS' },
      { key: 'create', label: 'Create Content' },
      { key: 'edit', label: 'Edit Content' },
      { key: 'delete', label: 'Delete Content' },
    ],
  },
  {
    group: 'Flash Sales', key: 'flash_sales',
    permissions: [
      { key: 'view', label: 'View Flash Sales' },
      { key: 'create', label: 'Create Flash Sales' },
      { key: 'edit', label: 'Edit Flash Sales' },
      { key: 'delete', label: 'Delete Flash Sales' },
    ],
  },
  {
    group: 'Reports', key: 'reports',
    permissions: [
      { key: 'view', label: 'View Reports' },
    ],
  },
  {
    group: 'Notifications', key: 'notifications',
    permissions: [
      { key: 'view', label: 'View Notifications' },
      { key: 'send', label: 'Send Notifications' },
    ],
  },
  {
    group: 'Support Tickets', key: 'support_tickets',
    permissions: [
      { key: 'view', label: 'View Tickets' },
      { key: 'reply', label: 'Reply to Tickets' },
      { key: 'assign', label: 'Assign Tickets' },
      { key: 'close', label: 'Close/Reopen Tickets' },
    ],
  },
  {
    group: 'Settings', key: 'settings',
    permissions: [
      { key: 'view', label: 'View Settings' },
      { key: 'edit', label: 'Edit Settings' },
    ],
  },
  {
    group: 'Roles', key: 'roles',
    permissions: [
      { key: 'view', label: 'View Roles' },
      { key: 'create', label: 'Create Roles' },
      { key: 'edit', label: 'Edit Roles' },
      { key: 'delete', label: 'Delete Roles' },
    ],
  },
];

export default function AdminRolesPermissions() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', permissions: [] });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([adminService.getRoles(), adminService.getPermissions()]);
      setRoles(rolesRes.roles || rolesRes || []);
      setPermissions(permsRes.permissions || permsRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreateModal = () => {
    setEditRole(null);
    setForm({ name: '', description: '', permissions: [] });
    setShowModal(true);
  };

  const openEditModal = (role) => {
    setEditRole(role);
    setForm({
      name: role.name || '',
      description: role.description || '',
      permissions: role.permissions?.map(p => typeof p === 'string' ? p : p.key || p) || [],
    });
    setShowModal(true);
  };

  const togglePermission = (permKey) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(permKey)
        ? f.permissions.filter(p => p !== permKey)
        : [...f.permissions, permKey],
    }));
  };

  const handleSubmit = async () => {
    if (!form.name) return;
    setSubmitting(true);
    try {
      if (editRole) {
        await adminService.updateRole(editRole._id, form);
      } else {
        await adminService.createRole(form);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await adminService.deleteRole(deleteModal);
      setDeleteModal(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Helmet><title>Roles & Permissions | Admin | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Roles & Permissions</h1>
            <p className="text-gray-500 mt-1">Manage admin roles and access permissions</p>
          </div>
          <Button onClick={openCreateModal}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Create Role
          </Button>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : roles.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No roles defined</h3>
            <p className="text-gray-500 mb-4">Create your first role to set up permissions</p>
            <Button onClick={openCreateModal}>Create Role</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {roles.map(role => (
              <Card key={role._id}>
                <CardBody>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                      {role.description && <p className="text-sm text-gray-500 mt-0.5">{role.description}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="xs" variant="ghost" onClick={() => openEditModal(role)} title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </Button>
                      {role.name !== 'super_admin' && role.name !== 'admin' && (
                        <Button size="xs" variant="ghost" className="text-red-500" onClick={() => setDeleteModal(role._id)} title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(role.permissions || []).map(perm => {
                      const permStr = typeof perm === 'string' ? perm : perm.key || perm;
                      return <Badge key={permStr} variant="primary" size="xs">{permStr.replace(/_/g, ' ')}</Badge>;
                    })}
                  </div>
                  <div className="mt-3 text-xs text-gray-400">{role.userCount || role.usersCount || 0} users</div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editRole ? 'Edit Role' : 'Create Role'} size="2xl">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Input label="Role Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Content Manager" />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Role description" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
            <div className="space-y-4">
              {permissionGroups.map(group => (
                <div key={group.key} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">{group.group}</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {group.permissions.map(perm => {
                      const permKey = `${group.key}.${perm.key}`;
                      return (
                        <label key={permKey} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.permissions.includes(permKey)}
                            onChange={() => togglePermission(permKey)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">{perm.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} isLoading={submitting} disabled={!form.name}>{editRole ? 'Update Role' : 'Create Role'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Role" size="sm">
        <p className="text-gray-600 mb-6">Are you sure you want to delete this role? This action cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setDeleteModal(null)}>Cancel</Button>
          <Button variant="danger" fullWidth onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </>
  );
}