import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchInvoice, clearInvoiceData } from '../../store/slices/sellerSlice';
import Button from '../../components/ui/Button';
import Card, { CardBody } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Loader';
import { formatDate, formatPrice } from '../../lib/helpers';

export default function Invoice() {
  const { orderId } = useParams();
  const dispatch = useDispatch();
  const { invoiceData, isLoading } = useSelector(state => state.seller);
  const printRef = useRef(null);

  useEffect(() => {
    dispatch(fetchInvoice(orderId));
    return () => { dispatch(clearInvoiceData()); };
  }, [dispatch, orderId]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const content = printRef.current?.innerHTML || '';
    printWindow.document.write(`
      <html><head><title>Invoice</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 12pt; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 20pt; }
        .section { margin-bottom: 20px; }
        .section h3 { border-bottom: 2px solid #333; padding-bottom: 5px; }
        .total-row { font-weight: bold; font-size: 14pt; }
      </style></head><body>
      <div class="header"><h1>INVOICE</h1></div>
      ${content}
      <script>window.onload = function() { window.print(); window.close(); }</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  if (isLoading || !invoiceData) return <PageLoader />;

  const { invoiceNumber, orderNumber, orderDate, customer, items, pricing, payment } = invoiceData;

  return (
    <>
      <Helmet><title>Invoice | Seller | Zalnio</title></Helmet>
      <div className="max-w-4xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/seller/orders" className="hover:text-primary-600">Orders</Link>
          <span>/</span>
          <span className="text-gray-900">Invoice #{invoiceNumber}</span>
        </nav>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Invoice</h1>
                <p className="text-sm text-gray-500">{invoiceNumber}</p>
              </div>
              <Button variant="primary" onClick={handlePrint}>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Invoice
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <div ref={printRef} className="p-6 sm:p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">ZALNIO</h1>
              <p className="text-sm text-gray-500">Marketplace Invoice</p>
            </div>

            <div className="flex justify-between mb-6 text-sm">
              <div>
                <p className="font-semibold">Invoice: {invoiceNumber}</p>
                <p className="text-gray-600">Order: #{orderNumber}</p>
                <p className="text-gray-600">Date: {formatDate(orderDate)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">Payment: {payment?.method?.toUpperCase() || 'N/A'}</p>
                <p className="text-gray-600 capitalize">Status: {payment?.status || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 border-b pb-1">Bill To</h3>
                <p>{customer?.name}</p>
                {customer?.email && <p className="text-gray-600">{customer.email}</p>}
                {customer?.phone && <p className="text-gray-600">{customer.phone}</p>}
                {customer?.billingAddress && (
                  <p className="text-gray-600 mt-1">
                    {customer.billingAddress.street && <>{customer.billingAddress.street}<br /></>}
                    {[customer.billingAddress.city, customer.billingAddress.state, customer.billingAddress.zip].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 border-b pb-1">Ship To</h3>
                {customer?.shippingAddress ? (
                  <>
                    <p>{customer.shippingAddress.fullName || customer.name}</p>
                    <p className="text-gray-600">{customer.shippingAddress.street}</p>
                    <p className="text-gray-600">
                      {[customer.shippingAddress.city, customer.shippingAddress.state, customer.shippingAddress.zip].filter(Boolean).join(', ')}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500">Same as billing</p>
                )}
              </div>
            </div>

            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2 font-semibold text-gray-700">#</th>
                  <th className="text-left py-2 font-semibold text-gray-700">Product</th>
                  <th className="text-center py-2 font-semibold text-gray-700">Qty</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Price</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {items?.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-2 text-gray-600">{idx + 1}</td>
                    <td className="py-2">
                      <p className="font-medium text-gray-900">{item.title}</p>
                      {item.sku && <p className="text-xs text-gray-500">SKU: {item.sku}</p>}
                    </td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2 text-right">{formatPrice(item.price)}</td>
                    <td className="py-2 text-right font-medium">{formatPrice(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(pricing?.subtotal || 0)}</span>
                </div>
                {pricing?.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-red-600">-{formatPrice(pricing.discount)}</span>
                  </div>
                )}
                {pricing?.couponDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coupon {pricing.couponCode && `(${pricing.couponCode})`}</span>
                    <span className="text-red-600">-{formatPrice(pricing.couponDiscount)}</span>
                  </div>
                )}
                {pricing?.shipping > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>{formatPrice(pricing.shipping)}</span>
                  </div>
                )}
                {pricing?.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span>{formatPrice(pricing.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-300 pt-1 font-bold text-base">
                  <span>Total</span>
                  <span>{formatPrice(pricing?.total || 0)}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t text-center text-xs text-gray-400">
              <p>This is a computer-generated invoice. No signature required.</p>
              <p>Zalnio Marketplace &middot; Thank you for your business!</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
