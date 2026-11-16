const { createHmac, timingSafeEqual } = require('crypto');

const sendJson = (response, status, body) => response.status(status).json(body);

const readScalar = (value) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value);
  return '';
};

const getSignatureParts = (value) => {
  if (typeof value !== 'string') return null;

  const parts = {};
  for (const entry of value.split(',')) {
    const separator = entry.indexOf('=');
    if (separator < 1) continue;

    const key = entry.slice(0, separator).trim();
    const partValue = entry.slice(separator + 1).trim();
    if (key === 'ts' || key === 'v1') {
      if (Object.prototype.hasOwnProperty.call(parts, key)) return null;
      parts[key] = partValue;
    }
  }

  return /^\d+$/.test(parts.ts || '')
    && /^[\da-f]{64}$/i.test(parts.v1 || '')
    ? parts
    : null;
};

const verifySignature = (paymentId, requestId, signature, secret) => {
  const parts = getSignatureParts(signature);
  if (!parts || !requestId) return false;

  const manifest = `id:${paymentId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest();
  const received = Buffer.from(parts.v1, 'hex');
  return received.length === expected.length && timingSafeEqual(received, expected);
};

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Este método no está disponible.' });
  }

  let body = request.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (error) {
      return sendJson(response, 400, { error: 'La notificación no es válida.' });
    }
  }

  const query = request.query || {};
  const bodyType = body && typeof body === 'object' ? body.type : '';
  const eventType = readScalar(bodyType) || readScalar(query.type) || readScalar(query.topic);
  if (eventType && eventType !== 'payment') {
    return sendJson(response, 200, { received: true, ignored: true });
  }

  const bodyPaymentId = body && typeof body === 'object'
    ? readScalar(body.data && body.data.id)
    : '';
  const queryPaymentId = readScalar(query['data.id']);
  if ((bodyPaymentId && !/^\d+$/.test(bodyPaymentId))
    || (queryPaymentId && !/^\d+$/.test(queryPaymentId))
    || (bodyPaymentId && queryPaymentId && bodyPaymentId !== queryPaymentId)) {
    return sendJson(response, 400, { error: 'El identificador del pago no es válido.' });
  }

  const paymentId = bodyPaymentId || queryPaymentId;
  if (!paymentId) {
    return sendJson(response, 400, { error: 'La notificación no contiene un pago.' });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!accessToken || !webhookSecret) {
    return sendJson(response, 503, { error: 'El webhook de pagos todavía no está configurado.' });
  }

  const headers = request.headers || {};
  const requestId = headers['x-request-id'];
  const signature = headers['x-signature'];
  if (!verifySignature(paymentId, requestId, signature, webhookSecret)) {
    return sendJson(response, 401, { error: 'La firma de la notificación no es válida.' });
  }

  let mercadoPagoResponse;
  try {
    mercadoPagoResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('No se pudo consultar el pago en Mercado Pago.');
    return sendJson(response, 502, { error: 'No se pudo verificar el pago con Mercado Pago.' });
  }

  if (!mercadoPagoResponse.ok) {
    console.error(`Mercado Pago no pudo verificar el pago (HTTP ${mercadoPagoResponse.status}).`);
    return sendJson(response, 502, { error: 'No se pudo verificar el pago con Mercado Pago.' });
  }

  let payment;
  try {
    payment = await mercadoPagoResponse.json();
  } catch (error) {
    return sendJson(response, 502, { error: 'Mercado Pago respondió con datos no válidos.' });
  }

  if (!payment || String(payment.id) !== paymentId || typeof payment.status !== 'string') {
    return sendJson(response, 502, { error: 'Mercado Pago respondió con datos no válidos.' });
  }

  let paymentStatus = 'other';
  if (payment.status === 'approved') {
    paymentStatus = 'approved';
  } else if (['pending', 'in_process', 'authorized', 'in_mediation'].includes(payment.status)) {
    paymentStatus = 'pending';
  } else if (payment.status === 'rejected') {
    paymentStatus = 'rejected';
  }

  return sendJson(response, 200, {
    received: true,
    paymentId,
    paymentStatus
  });
};
