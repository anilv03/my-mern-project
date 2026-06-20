import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import adminService from '../../services/adminService';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { PageLoader } from '../../components/ui/Loader';
import { formatPrice } from '../../lib/helpers';
import Badge from '../../components/ui/Badge';

const LEVEL_COLORS = ['bg-blue-50 text-blue-700', 'bg-indigo-50 text-indigo-700', 'bg-purple-50 text-purple-700', 'bg-pink-50 text-pink-700', 'bg-amber-50 text-amber-700'];

export default function SellerReferralTrees() {
  const [sellers, setSellers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { fetchSellers(); }, [page, search]);

  const fetchSellers = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getSellerReferralTrees({ page, limit: 20, search });
      setSellers(res.sellers || []);
      setPagination(res.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
    } catch { setSellers([]); }
    setIsLoading(false);
  };

  if (isLoading) return <PageLoader />;

  return (
    <>
      <Helmet><title>Seller Referral Trees - Admin | Zalnio</title></Helmet>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Seller Referral Trees</h1>
        <p className="text-gray-500 mt-1">View each seller's referral team size and level-wise earnings</p>
      </div>

      <div className="mb-4">
        <Input placeholder="Search by name, email, or referral code..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Sellers ({pagination.total})</h2></CardHeader>
        <CardBody padding={false}>
          {sellers.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No sellers found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-500">Seller</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Referral Code</th>
                    <th className="px-4 py-3 font-medium text-gray-500 text-center">Direct</th>
                    <th className="px-4 py-3 font-medium text-gray-500 text-center">Team</th>
                    <th className="px-4 py-3 font-medium text-gray-500 text-right">Total Earned</th>
                    <th className="px-4 py-3 font-medium text-gray-500 text-right">Pending</th>
                    <th className="px-4 py-3 font-medium text-gray-500 text-right">Credited</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sellers.map(s => (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-gray-400">{s.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="info">{s.referralCode || 'N/A'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">{s.directReferrals}</td>
                      <td className="px-4 py-3 text-center font-semibold">{s.totalTeam}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatPrice(s.summary.total)}</td>
                      <td className="px-4 py-3 text-right text-yellow-600 font-medium">{formatPrice(s.summary.pending)}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">{formatPrice(s.summary.credited)}</td>
                      <td className="px-4 py-3">
                        <Button size="xs" variant="ghost" onClick={() => setExpanded(expanded === s._id ? null : s._id)}>
                          {expanded === s._id ? 'Hide' : 'Levels'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {sellers.filter(s => expanded === s._id).map(s => (
        <Card key={`detail-${s._id}`} className="mt-2">
          <CardBody padding={false}>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-500">Level</th>
                  <th className="px-4 py-2 font-medium text-gray-500 text-right">Pending</th>
                  <th className="px-4 py-2 font-medium text-gray-500 text-right">Credited</th>
                  <th className="px-4 py-2 font-medium text-gray-500 text-right">Cancelled</th>
                  <th className="px-4 py-2 font-medium text-gray-500 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {s.levelIncome.filter(l => l.total > 0).map(l => (
                  <tr key={l.level} className={LEVEL_COLORS[l.level - 1]}>
                    <td className="px-4 py-2 font-medium">Level {l.level}</td>
                    <td className="px-4 py-2 text-right text-yellow-600">{formatPrice(l.pending)}</td>
                    <td className="px-4 py-2 text-right text-green-600">{formatPrice(l.credited)}</td>
                    <td className="px-4 py-2 text-right text-red-500">{formatPrice(l.cancelled)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{formatPrice(l.total)}</td>
                  </tr>
                ))}
                {s.levelIncome.every(l => l.total === 0) && (
                  <tr><td colSpan={5} className="px-4 py-3 text-center text-gray-400">No earnings yet</td></tr>
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
      ))}

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`px-3 py-1 rounded text-sm ${page === p ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{p}</button>
          ))}
        </div>
      )}
    </>
  );
}
