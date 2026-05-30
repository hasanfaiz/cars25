import nodemailer from 'nodemailer';

function clean(value = '') {
  return String(value).replace(/[<>]/g, '').trim();
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  try { return JSON.parse(raw || '{}'); } catch { return Object.fromEntries(new URLSearchParams(raw)); }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  const body = await readBody(req);
  const name = clean(body.name);
  const phone = clean(body.phone);
  const email = clean(body.email);
  const vehicle = clean(body.vehicle);
  const message = clean(body.message);
  const source = clean(body.source || 'Cars25 website enquiry');

  if (!name || !phone || !message) {
    return res.status(400).json({ ok: false, message: 'Name, phone and message are required.' });
  }

  const requiredEnv = ['MAILTRAP_HOST', 'MAILTRAP_PORT', 'MAILTRAP_USER', 'MAILTRAP_PASS', 'MAIL_TO', 'MAIL_FROM'];
  const missing = requiredEnv.filter(key => !process.env[key]);
  if (missing.length) {
    return res.status(500).json({ ok: false, message: `Mail settings missing: ${missing.join(', ')}` });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: Number(process.env.MAILTRAP_PORT || 2525),
    secure: Number(process.env.MAILTRAP_PORT) === 465,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS
    }
  });

  const subject = vehicle ? `Cars25 enquiry: ${vehicle}` : 'Cars25 website enquiry';
  const html = `
    <h2>New Cars25 enquiry</h2>
    <p><strong>Source:</strong> ${source}</p>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Email:</strong> ${email || 'Not provided'}</p>
    <p><strong>Vehicle:</strong> ${vehicle || 'General enquiry'}</p>
    <p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>
  `;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_TO,
    replyTo: email || process.env.MAIL_FROM,
    subject,
    text: `New Cars25 enquiry\n\nSource: ${source}\nName: ${name}\nPhone: ${phone}\nEmail: ${email || 'Not provided'}\nVehicle: ${vehicle || 'General enquiry'}\nMessage:\n${message}`,
    html
  });

  return res.status(200).json({ ok: true, message: 'Enquiry sent.' });
}
