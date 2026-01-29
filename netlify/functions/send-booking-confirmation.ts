import { createRequire } from 'module';
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { Resend } from 'resend';

// Load .env from project root when running locally (netlify dev does not inject .env into functions)
const require = createRequire(import.meta.url);
if (!process.env.RESEND_API_KEY) {
  require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Style Forage <onboarding@resend.dev>';

  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured');
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Email service unavailable',
        message: 'Confirmation email could not be sent. Your booking is confirmed.',
      }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { customerName, customerEmail, service, date, times } = body;

    if (!customerEmail || typeof customerEmail !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Customer email is required' }),
      };
    }

    const resend = new Resend(apiKey);

    const timesDisplay = Array.isArray(times) ? times.join(', ') : (times || '');
    const dateFormatted = date || '';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #fafaf9; color: #1c1917;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 24px;">
    <div style="background: white; border-radius: 24px; padding: 40px; border: 1px solid #f5f5f4; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 64px; height: 64px; background: #8cae8c; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 28px;">✓</span>
        </div>
        <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #1c1917; font-family: Georgia, serif;">Booking Confirmed</h1>
      </div>
      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #44403c;">
        Hi ${customerName || 'there'},
      </p>
      <p style="margin: 0 0 28px; font-size: 16px; line-height: 1.6; color: #44403c;">
        Thank you for booking with Style Forage. Here are your session details:
      </p>
      <div style="background: #fafaf9; border-radius: 16px; padding: 24px; margin-bottom: 28px; border: 1px solid #f5f5f4;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-size: 12px; font-weight: 600; color: #78716c; text-transform: uppercase; letter-spacing: 0.05em;">Service</td>
            <td style="padding: 8px 0; font-size: 16px; font-weight: 600; color: #1c1917; text-align: right;">${service || 'Styling Session'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 12px; font-weight: 600; color: #78716c; text-transform: uppercase; letter-spacing: 0.05em;">Date</td>
            <td style="padding: 8px 0; font-size: 16px; font-weight: 600; color: #1c1917; text-align: right;">${dateFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 12px; font-weight: 600; color: #78716c; text-transform: uppercase; letter-spacing: 0.05em;">Your availability</td>
            <td style="padding: 8px 0; font-size: 16px; font-weight: 600; color: #1c1917; text-align: right;">${timesDisplay || '—'}</td>
          </tr>
        </table>
      </div>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #44403c;">
        <strong>What happens next?</strong> I’ll confirm your exact time and send any prep notes before your session.
      </p>
      <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #44403c;">
        If you have questions, reply to this email or reach out anytime.
      </p>
      <p style="margin: 28px 0 0; font-size: 15px; line-height: 1.6; color: #78716c;">
        — Roslyn<br>
        <span style="color: #8cae8c; font-weight: 600;">Style Forage</span>
      </p>
    </div>
    <p style="margin: 24px 0 0; font-size: 12px; color: #a8a29e; text-align: center;">
      You received this email because you booked a session at styleforage.com
    </p>
  </div>
</body>
</html>
    `.trim();

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: customerEmail,
      subject: `Booking confirmed: ${service || 'Styling Session'} | Style Forage`,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to send email',
          message: 'Your booking is confirmed. We could not send the confirmation email.',
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, id: data?.id }),
    };
  } catch (err) {
    console.error('send-booking-confirmation error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Email service error',
        message: 'Your booking is confirmed. We could not send the confirmation email.',
      }),
    };
  }
};

export { handler };
