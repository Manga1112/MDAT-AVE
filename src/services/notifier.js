import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { env } from '../config/env.js';
import logger from '../config/logger.js';

let transporter = null;

function isGmailConfigured() {
  return !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN && process.env.GMAIL_SENDER);
}

async function getTransporter() {
  if (transporter) return transporter;
  if (!isGmailConfigured()) return null;

  const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  const accessToken = await oAuth2Client.getAccessToken();

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_SENDER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: accessToken?.token,
    },
  });
  return transporter;
}

function formatSubject(event, payload) {
  switch (event) {
    case 'ticket_created':
      return `New Ticket #${payload.ticketId} in ${payload.department}`;
    case 'ticket_status_changed':
      return `Ticket #${payload.ticketId} status: ${payload.status}`;
    case 'ticket_approval_decision':
      return `Ticket #${payload.ticketId} ${payload.status}`;
    default:
      return `Notification: ${event}`;
  }
}

function formatBody(event, payload) {
  return [
    `Event: ${event}`,
    `Details: ${JSON.stringify(payload, null, 2)}`,
    '',
    '— Automation Hub',
  ].join('\n');
}

export async function notify(event, payload = {}) {
  // Always log for observability
  logger.info({ event, payload }, 'notify');

  // If Gmail creds not configured, skip sending
  if (!isGmailConfigured()) {
    return;
  }

  try {
    const tx = await getTransporter();
    if (!tx) return;

    // Determine recipients – use payload.to if provided else default to sender
    const to = Array.isArray(payload.to) && payload.to.length > 0 ? payload.to.join(',') : process.env.GMAIL_SENDER;

    await tx.sendMail({
      from: process.env.GMAIL_SENDER,
      to,
      subject: formatSubject(event, payload),
      text: formatBody(event, payload),
    });
  } catch (e) {
    logger.error({ err: e }, 'notify failed');
  }
}
