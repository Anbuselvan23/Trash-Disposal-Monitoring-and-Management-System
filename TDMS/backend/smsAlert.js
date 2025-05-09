require('dotenv').config({ path: '../.env' });
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function sendSMS(level) {
  const message = `⚠️ Alert: Trash bin is ${level}% full. Please dispose soon.`;

  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.TO_PHONE_NUMBER,
    });
    console.log('✅ SMS sent successfully');
  } catch (err) {
    console.error('❌ Failed to send SMS:', err.message);
  }
}

module.exports = sendSMS;
