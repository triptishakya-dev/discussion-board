import { CONFIG } from '../../../lib/board-config';
import { calculateEstimate } from '../../../lib/estimate';

const escapeHtml = value => value.replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const inr = value => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
}).format(value);

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const { layoutKey, answers, requestId } = body ?? {};
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  if (!name || name.length > 100 || /[\r\n]/.test(name) ||
      email.length > 254 || !/^[^\s@,<>]+@[^\s@,<>]+\.[^\s@,<>]{2,}$/.test(email)) {
    return Response.json({ error: 'Enter your name and a valid email address.' }, { status: 400 });
  }
  if (typeof layoutKey !== 'string' || !Object.hasOwn(CONFIG.layouts, layoutKey) ||
      !answers || CONFIG.questions.some(({ id, options }) =>
        !Number.isInteger(answers[id]) || answers[id] < 0 || answers[id] >= options.length) ||
      typeof requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(requestId)) {
    return Response.json({ error: 'Complete the estimate before sending it.' }, { status: 400 });
  }

  const { RESEND_API_KEY, ESTIMATE_EMAIL_FROM } = process.env;
  if (!RESEND_API_KEY || !ESTIMATE_EMAIL_FROM) {
    return Response.json({ error: 'Email delivery has not been configured for this board.' }, { status: 503 });
  }

  const layout = CONFIG.layouts[layoutKey];
  const estimate = calculateEstimate(layout, answers);
  const firstName = name.split(/\s+/)[0];
  const introduction = `Thank you for exploring interior options with ${CONFIG.brandName}. Your estimated total cost for the ${layout.name} (${layout.area}) is ${inr(estimate.total)}.`;
  const terms = 'This is a preliminary estimate. The final quote depends on site measurements, material availability, and the confirmed scope of work.';
  const nextStep = 'If you would like to discuss your estimate or arrange a site visit, please reply to this email.';
  const selections = estimate.lines.map(({ label, choice }) => `${label}: ${choice}`);
  const subject = `Your interior estimate for the ${layout.name}`;
  const text = [
    `Hi ${firstName},`, introduction, `Your selected finishes\n${selections.map(line => '- ' + line).join('\n')}`,
    terms, nextStep, `Kind regards,\n${CONFIG.senderName}`,
  ].join('\n\n');
  const html = `<div style="max-width:600px;margin:auto;padding:24px;font:16px/1.6 Arial,sans-serif;color:#172033">
    <h1 style="font-size:23px">Your interior estimate</h1>
    <p>Hi ${escapeHtml(firstName)},</p>
    <p>${escapeHtml(introduction)}</p>
    <p style="padding:16px;background:#eef4ff"><strong>Estimated total: ${inr(estimate.total)}</strong></p>
    <h2 style="font-size:18px">Your selected finishes</h2>
    <ul>${selections.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>
    <p>${terms}</p><p>${nextStep}</p>
    <p>Kind regards,<br>${escapeHtml(CONFIG.senderName)}</p>
  </div>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `estimate/${requestId}`,
      },
      body: JSON.stringify({ from: ESTIMATE_EMAIL_FROM, to: [email], subject, text, html }),
      signal: AbortSignal.timeout(12000),
    });
    const result = await response.json();
    if (response.ok && result.id) return Response.json({ ok: true });
    console.error('Estimate email rejected by provider with HTTP status', response.status);
  } catch {
    console.error('Estimate email provider request failed');
  }
  return Response.json({ error: 'The email could not be sent. Please try again.' }, { status: 502 });
}
