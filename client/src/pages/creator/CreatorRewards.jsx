import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { submitContent, fetchUserRewards, fetchRewardStats, fetchRewardSettings, resetCreatorRewardSuccess } from '../../store/slices/creatorRewardSlice';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';
import { formatPrice, formatDate, classNames } from '../../lib/helpers';

const CONTENT_TYPES = [
  { value: 'youtube_video', label: 'YouTube Video' },
  { value: 'youtube_short', label: 'YouTube Short' },
  { value: 'instagram_reel', label: 'Instagram Reel' },
  { value: 'facebook_video', label: 'Facebook Video' },
  { value: 'facebook_reel', label: 'Facebook Reel' },
];

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const TABS = [
  { value: 'submit', label: 'Submit Content' },
  { value: 'history', label: 'Reward History' },
  { value: 'stats', label: 'Stats' },
];

export default function CreatorRewards() {
  const dispatch = useDispatch();
  const { rewards, stats, settings, isLoading, isSuccess, pagination } = useSelector(state => state.creatorReward);
  const [activeTab, setActiveTab] = useState('submit');
  const [showSubmit, setShowSubmit] = useState(true);
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({
    contentType: 'youtube_video',
    contentUrl: '',
    thumbnailUrl: '',
    title: '',
    description: '',
    productLink: '',
  });

  useEffect(() => {
    dispatch(fetchRewardSettings());
    dispatch(fetchRewardStats());
    dispatch(fetchUserRewards({ page, limit: 10 }));
  }, [dispatch, page]);

  useEffect(() => {
    if (isSuccess) {
      setForm({ contentType: 'youtube_video', contentUrl: '', thumbnailUrl: '', title: '', description: '', productLink: '' });
      setShowSubmit(false);
      dispatch(resetCreatorRewardSuccess());
    }
  }, [isSuccess, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(submitContent(form));
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <Helmet><title>Creator Rewards | Zalnio</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">Creator Rewards</h1>
          <p className="text-gray-500 mt-1">Submit content and earn rewards</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-primary-600 text-white border-primary-600">
            <CardBody>
              <p className="text-primary-100 text-sm">Approved</p>
              <p className="text-3xl font-bold mt-1">{stats?.totalApproved || 0}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-gray-500 text-sm">Total Earned</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatPrice(stats?.totalApprovedAmount || 0)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-gray-500 text-sm">Pending Review</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats?.totalPending || 0}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-gray-500 text-sm">Reward Program</p>
              <p className="text-sm font-medium mt-1">{settings?.isEnabled ? 'Active' : 'Inactive'}</p>
            </CardBody>
          </Card>
        </div>

        <div className="flex gap-2 border-b border-gray-200 mb-6">
          {TABS.map(tab => (
            <button key={tab.value} onClick={() => setActiveTab(tab.value)}
              className={classNames('px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.value ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              )}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'submit' && (
          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Submit New Content</h2></CardHeader>
            <CardBody>
              {!settings?.isEnabled ? (
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg mb-4">
                  <p className="font-medium">Reward program is currently inactive</p>
                  <p className="text-sm mt-1">You can still submit content, but rewards may not be processed.</p>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                  <select value={form.contentType} onChange={e => handleChange('contentType', e.target.value)} className="input-field w-full">
                    {CONTENT_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                  </select>
                </div>

                <Input label="Content URL" type="url" value={form.contentUrl} onChange={e => handleChange('contentUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." required />
                <Input label="Thumbnail URL (optional)" type="url" value={form.thumbnailUrl} onChange={e => handleChange('thumbnailUrl', e.target.value)} />
                <Input label="Title" value={form.title} onChange={e => handleChange('title', e.target.value)} maxLength={200} required />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                  <textarea value={form.description} onChange={e => handleChange('description', e.target.value)} rows={3} maxLength={1000} className="input-field w-full" />
                </div>

                {settings?.requireProductLink && (
                  <Input label="Product Link (optional)" type="url" value={form.productLink} onChange={e => handleChange('productLink', e.target.value)} />
                )}

                <Button type="submit" fullWidth isLoading={isLoading} disabled={!settings?.isEnabled}>Submit for Review</Button>
              </form>
            </CardBody>
          </Card>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {rewards.length === 0 ? (
              <Card><CardBody><p className="text-gray-500 text-center py-4">No submissions yet</p></CardBody></Card>
            ) : (
              rewards.map(r => (
                <Card key={r._id} padding={false} hover={false}>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{r.title}</h3>
                          <span className={classNames('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[r.status])}>{r.status}</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">
                          {CONTENT_TYPES.find(ct => ct.value === r.contentType)?.label || r.contentType}
                        </p>
                        <a href={r.contentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline">View Content</a>
                        {r.rejectionReason && <p className="text-sm text-red-500 mt-1">Rejected: {r.rejectionReason}</p>}
                        <p className="text-xs text-gray-400 mt-2">{formatDate(r.createdAt)}</p>
                      </div>
                      {r.rewardAmount > 0 && (
                        <div className="text-right">
                          <p className="font-semibold text-green-600">+{formatPrice(r.rewardAmount)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
            {pagination?.pages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={classNames('px-3 py-1 rounded text-sm', page === p ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700')}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><h2 className="text-lg font-semibold">Your Stats</h2></CardHeader>
              <CardBody>
                <dl className="space-y-4">
                  <div className="flex justify-between"><dt className="text-gray-500">Approved</dt><dd className="font-semibold text-green-600">{stats?.totalApproved || 0}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Pending</dt><dd className="font-semibold text-orange-600">{stats?.totalPending || 0}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Rejected</dt><dd className="font-semibold text-red-600">{stats?.totalRejected || 0}</dd></div>
                  <div className="flex justify-between border-t pt-4"><dt className="font-medium">Total Earned</dt><dd className="font-bold text-green-600">{formatPrice(stats?.totalApprovedAmount || 0)}</dd></div>
                </dl>
              </CardBody>
            </Card>
            <Card>
              <CardHeader><h2 className="text-lg font-semibold">Reward Rates</h2></CardHeader>
              <CardBody>
                {settings?.rewardRates?.length > 0 ? (
                  <div className="space-y-3">
                    {settings.rewardRates.map(r => (
                      <div key={r.contentType} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{CONTENT_TYPES.find(ct => ct.value === r.contentType)?.label || r.contentType}</span>
                        <span className="font-medium text-primary-600">{formatPrice(r.rewardAmount)}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-gray-500 text-sm">No reward rates configured</p>}
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
