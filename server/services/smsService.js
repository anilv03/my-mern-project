const logger = require('../utils/logger');

const sendSms = async (phone, message) => {
  try {
    if (process.env.NODE_ENV === 'development' && !process.env.TWILIO_ACCOUNT_SID) {
      logger.info(`[DEV SMS] To: ${phone}, Message: ${message}`);
      return { success: true, sid: 'dev-mode' };
    }

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const result = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
      logger.info(`SMS sent to ${phone}: ${result.sid}`);
      return { success: true, sid: result.sid };
    }

    logger.warn(`No SMS provider configured. SMS to ${phone} not sent.`);
    return { success: false, message: 'No SMS provider configured' };
  } catch (error) {
    logger.error(`SMS send failed to ${phone}: ${error.message}`);
    throw error;
  }
};

const sendOtpSms = async (phone, otp, purpose = 'verification') => {
  const appName = process.env.APP_NAME || 'Zalnio';
  const message = `Your ${appName} OTP for ${purpose} is: ${otp}. Valid for 10 minutes.`;
  return sendSms(phone, message);
};

module.exports = { sendSms, sendOtpSms };
