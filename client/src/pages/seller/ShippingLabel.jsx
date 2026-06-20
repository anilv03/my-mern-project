import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { fetchShippingLabel, clearShippingLabel } from '../../store/slices/sellerSlice';
import Button from '../../components/ui/Button';
import Card, { CardBody } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Loader';
import { formatPrice } from '../../lib/helpers';

export default function ShippingLabel() {
  const { orderId } = useParams();
  const dispatch = useDispatch();
  const { shippingLabel, isLoading } = useSelector(state => state.seller);
  const [showPrintView, setShowPrintView] = useState(false);
  const barcodeRef = useRef(null);
  const printRef = useRef(null);

  useEffect(() => {
    dispatch(fetchShippingLabel(orderId));
    return () => { dispatch(clearShippingLabel()); };
  }, [dispatch, orderId]);

  useEffect(() => {
    if (barcodeRef.current && shippingLabel) {
      try {
        JsBarcode(barcodeRef.current, shippingLabel.orderNumber, {
          format: 'CODE128',
          width: 1.5,
          height: 40,
          displayValue: true,
          fontSize: 12,
          margin: 5,
        });
      } catch {
      }
    }
  }, [shippingLabel]);

  const handlePrint = () => {
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      setShowPrintView(false);
    }, 200);
  };

  if (isLoading || !shippingLabel) return <PageLoader />;

  const { customer, seller, items, orderNumber, pricing } = shippingLabel;

  const labelContent = (
    <div ref={printRef} className="bg-white" style={{ width: '105mm', minHeight: '148mm', padding: '5mm', margin: '0 auto', fontFamily: 'Arial, sans-serif', fontSize: '10pt' }}>
      <div style={{ textAlign: 'center', marginBottom: '3mm', borderBottom: '2px solid #000', paddingBottom: '2mm' }}>
        <h1 style={{ fontSize: '14pt', fontWeight: 'bold', margin: 0 }}>ZALNIO</h1>
        <p style={{ fontSize: '8pt', margin: '2px 0', color: '#555' }}>Shipping Label</p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3mm' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '3mm' }}>
              <p style={{ fontSize: '7pt', fontWeight: 'bold', margin: '0 0 1mm 0', color: '#666', textTransform: 'uppercase' }}>From</p>
              <p style={{ fontSize: '9pt', fontWeight: 'bold', margin: '0' }}>{seller?.name || 'Zalnio Seller'}</p>
              {seller?.address && (
                <>
                  <p style={{ fontSize: '8pt', margin: '1px 0' }}>{seller.address.street || ''}</p>
                  <p style={{ fontSize: '8pt', margin: '1px 0' }}>
                    {[seller.address.city, seller.address.state, seller.address.zip].filter(Boolean).join(', ')}
                  </p>
                </>
              )}
              <p style={{ fontSize: '8pt', margin: '1px 0' }}>Phone: {seller?.phone || 'N/A'}</p>
            </td>
            <td style={{ width: '50%', verticalAlign: 'top', paddingLeft: '3mm' }}>
              <p style={{ fontSize: '7pt', fontWeight: 'bold', margin: '0 0 1mm 0', color: '#666', textTransform: 'uppercase' }}>To</p>
              <p style={{ fontSize: '9pt', fontWeight: 'bold', margin: '0' }}>{customer?.name || 'Customer'}</p>
              {customer?.address && (
                <>
                  <p style={{ fontSize: '8pt', margin: '1px 0' }}>{customer.address.street || ''}</p>
                  <p style={{ fontSize: '8pt', margin: '1px 0' }}>
                    {[customer.address.city, customer.address.state, customer.address.zip].filter(Boolean).join(', ')}
                  </p>
                </>
              )}
              <p style={{ fontSize: '8pt', margin: '1px 0' }}>Phone: {customer?.phone || 'N/A'}</p>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ borderTop: '1px dashed #999', borderBottom: '1px dashed #999', padding: '2mm 0', marginBottom: '3mm' }}>
        <p style={{ fontSize: '7pt', fontWeight: 'bold', margin: '0 0 1mm 0', color: '#666', textTransform: 'uppercase' }}>Order #{orderNumber}</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <th style={{ textAlign: 'left', padding: '1mm 2mm' }}>Product</th>
              <th style={{ textAlign: 'center', padding: '1mm 2mm' }}>Qty</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: '1mm 2mm' }}>{item.title}</td>
                <td style={{ textAlign: 'center', padding: '1mm 2mm' }}>{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '3mm' }}>
        <svg ref={barcodeRef} style={{ maxWidth: '90mm' }} />
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-block', border: '1px solid #ccc', padding: '2mm' }}>
          <QRCodeSVG value={JSON.stringify({ order: orderNumber, id: shippingLabel.orderId })} size={60} level="M" />
        </div>
        <p style={{ fontSize: '7pt', margin: '1mm 0 0 0', color: '#999' }}>Scan to track</p>
      </div>

      <div style={{ textAlign: 'center', marginTop: '3mm', borderTop: '1px solid #ddd', paddingTop: '1mm' }}>
        <p style={{ fontSize: '7pt', margin: '0', color: '#999' }}>
          Zalnio Marketplace &middot; shipping@zalnio.com
        </p>
      </div>
    </div>
  );

  if (showPrintView) {
    return (
      <div style={{ margin: 0, padding: 0 }}>
        {labelContent}
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Shipping Label | Seller | Zalnio</title></Helmet>
      <div className="max-w-4xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/seller/orders" className="hover:text-primary-600">Orders</Link>
          <span>/</span>
          <span className="text-gray-900">Shipping Label #{orderNumber}</span>
        </nav>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Shipping Label</h1>
                <p className="text-sm text-gray-500">Order #{orderNumber}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="primary" onClick={handlePrint}>
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print / Save PDF
                </Button>
                <Link to="/seller/orders">
                  <Button variant="ghost">Back to Orders</Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="bg-gray-50 rounded-xl p-4 flex justify-center overflow-auto">
          {labelContent}
        </div>
      </div>
    </>
  );
}
