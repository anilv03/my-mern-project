const logger = require('../utils/logger');

class ShippingProvider {
  async createShipment(shipmentData) { throw new Error('Not implemented'); }
  async trackShipment(awbNumber) { throw new Error('Not implemented'); }
  async generateLabel(shipmentId) { throw new Error('Not implemented'); }
  async cancelShipment(shipmentId) { throw new Error('Not implemented'); }
}

class ShiprocketProvider extends ShippingProvider {
  constructor() {
    super();
    this.baseUrl = process.env.SHIPROCKET_API_URL || 'https://apiv2.shiprocket.in/v1/external';
    this.token = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    if (this.token && this.tokenExpiry > Date.now()) return this.token;
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;
    if (!email || !password) {
      logger.warn('Shiprocket credentials not configured, using manual mode');
      return null;
    }
    try {
      const axios = require('axios');
      const { data } = await axios.post(`${this.baseUrl}/auth/login`, { email, password });
      this.token = data.token;
      this.tokenExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
      return this.token;
    } catch (error) {
      logger.error('Shiprocket auth failed:', error.response?.data || error.message);
      return null;
    }
  }

  async createShipment(shipmentData) {
    const token = await this.authenticate();
    if (!token) return this._manualFallback(shipmentData);
    try {
      const axios = require('axios');
      const { data } = await axios.post(`${this.baseUrl}/shipments/create/forward`, shipmentData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return {
        success: true,
        shipmentId: data.shipment_id,
        awbNumber: data.awb_code,
        courierName: data.courier_name,
        trackingUrl: `https://shiprocket.co/tracking/${data.awb_code}`,
        status: 'pickup_scheduled',
        shippingCharge: data.shipping_charge || 0,
      };
    } catch (error) {
      logger.error('Shiprocket shipment creation failed:', error.response?.data || error.message);
      return this._manualFallback(shipmentData);
    }
  }

  async trackShipment(awbNumber) {
    const token = await this.authenticate();
    if (!token) return { status: 'in_transit', events: [] };
    try {
      const axios = require('axios');
      const { data } = await axios.get(`${this.baseUrl}/shipments/${awbNumber}/track`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return {
        status: data.tracking_data?.shipment_track?.[0]?.current_status?.toLowerCase().replace(/\s+/g, '_') || 'in_transit',
        events: (data.tracking_data?.shipment_track?.[0]?.tracking_data || []).map(e => ({
          status: e.status,
          location: e.location,
          description: e.activity,
          timestamp: new Date(e.date),
        })),
      };
    } catch (error) {
      logger.error('Shiprocket tracking failed:', error.response?.data || error.message);
      return { status: 'in_transit', events: [] };
    }
  }

  async generateLabel(shipmentId) {
    const token = await this.authenticate();
    if (!token) return { url: null };
    try {
      const axios = require('axios');
      const { data } = await axios.post(`${this.baseUrl}/shipments/${shipmentId}/label`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { url: data.label_url };
    } catch (error) {
      logger.error('Shiprocket label generation failed:', error.response?.data || error.message);
      return { url: null };
    }
  }

  async cancelShipment(shipmentId) {
    const token = await this.authenticate();
    if (!token) return { success: false };
    try {
      const axios = require('axios');
      await axios.post(`${this.baseUrl}/shipments/cancel`, { shipment_id: shipmentId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true };
    } catch (error) {
      logger.error('Shiprocket cancellation failed:', error.response?.data || error.message);
      return { success: false };
    }
  }

  _manualFallback(shipmentData) {
    return {
      success: true,
      shipmentId: null,
      awbNumber: null,
      courierName: null,
      trackingUrl: null,
      status: 'pending',
      shippingCharge: 0,
      _manual: true,
    };
  }
}

let provider = null;

const getShippingProvider = () => {
  if (!provider) {
    const preferred = process.env.SHIPPING_PROVIDER || 'manual';
    if (preferred === 'shiprocket') {
      provider = new ShiprocketProvider();
    } else {
      provider = new ShippingProvider();
    }
  }
  return provider;
};

module.exports = { getShippingProvider, ShiprocketProvider };
