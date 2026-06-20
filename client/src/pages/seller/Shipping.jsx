import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchShipments, trackShipment, createShipment, selectShipping } from '../../store/slices/shippingSlice';
import { format } from 'date-fns';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  pickup_scheduled: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  returned: 'bg-gray-100 text-gray-800',
};

const ShipmentCard = ({ shipment, onTrack, onViewLabel }) => (
  <div className="bg-white rounded-lg border p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium">AWB: {shipment.awbNumber || 'Manual'}</span>
      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[shipment.status] || 'bg-gray-100'}`}>
        {shipment.status?.replace(/_/g, ' ')}
      </span>
    </div>
    <p className="text-xs text-gray-500">Courier: {shipment.courierName || 'N/A'}</p>
    <p className="text-xs text-gray-500">Provider: {shipment.provider}</p>
    {shipment.createdAt && (
      <p className="text-xs text-gray-500">{format(new Date(shipment.createdAt), 'dd MMM yyyy')}</p>
    )}
    {shipment.trackingUrl && (
      <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline block mt-1">
        Track Online
      </a>
    )}
    <div className="flex gap-2 mt-3">
      {shipment.awbNumber && (
        <button onClick={() => onTrack(shipment._id)} className="text-xs btn-secondary !px-3 !py-1">Track</button>
      )}
      <button onClick={() => onViewLabel(shipment._id)} className="text-xs btn-secondary !px-3 !py-1">Label</button>
    </div>
  </div>
);

const Shipping = () => {
  const dispatch = useDispatch();
  const { shipments, isLoading } = useSelector(selectShipping);

  useEffect(() => {
    dispatch(fetchShipments({}));
  }, [dispatch]);

  const handleTrack = (id) => {
    dispatch(trackShipment(id));
  };

  const handleViewLabel = async (id) => {
    const { getLabel } = await import('../../services/shippingService');
    const { data } = await getLabel(id);
    if (data?.data?.url) {
      window.open(data.data.url, '_blank');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Shipping</h1>
      </div>
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : shipments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500">No shipments yet</p>
          <p className="text-sm text-gray-400 mt-1">Shipments will appear here when you create them from orders</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shipments.map(s => <ShipmentCard key={s._id} shipment={s} onTrack={handleTrack} onViewLabel={handleViewLabel} />)}
        </div>
      )}
    </div>
  );
};

export default Shipping;
