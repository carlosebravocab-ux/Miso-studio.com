const { randomUUID } = require('crypto');

const products = {
  'camisa-core': { name: 'Camisa Core', price: 580, sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], colors: ['#d9c6b3', '#3d4f4d', '#1d1a1a', '#a65e4b', '#f1e8dc', '#526a8a'] },
  'taza-ritmo': { name: 'Taza Ritmo', price: 399, sizes: ['11 oz', '15 oz'], colors: ['#f3e9df', '#d7b28b', '#72947d', '#c97868', '#607b91', '#343b3c'] },
  'vaso-sky': { name: 'Vaso Sky', price: 550, sizes: ['350 ml', '500 ml'], colors: ['#d3b494', '#3e4d5f', '#17191a', '#a65e4b', '#d7ded8', '#79918d'] },
  'camisa-boda': { name: 'Camisa Boda', price: 620, sizes: ['XS', 'S', 'M', 'L', 'XL'], colors: ['#d4c0ac', '#f1f1ef', '#5c4f4a', '#a65e4b', '#81918b', '#526a8a'] },
  'taza-familia': { name: 'Taza Familia', price: 430, sizes: ['11 oz', '15 oz'], colors: ['#f8e9d9', '#b38a62', '#838f7f', '#c97868', '#667f92', '#383b3c'] },
  'vaso-team': { name: 'Vaso Team', price: 610, sizes: ['350 ml', '500 ml'], colors: ['#ceb38a', '#324d52', '#dddfdc', '#9c604e', '#687b91', '#343638'] }
};

const coupons = {
  MISO10: 0.1,
  NOVA10: 0.1,
  BODA25: 0.25,
  ENVIOFREE: 0
};

const readText = (value, maxLength) => (
  typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength)
    : ''
);

const isMercadoPagoUrl = (value) => {
  let url;
  try {
    url = new URL(value);
  } catch (error) {
    return false;
  }
  return url.protocol === 'https:'
    && (
      url.hostname === 'mercadopago.com.mx'
      || url.hostname.endsWith('.mercadopago.com.mx')
      || url.hostname === 'mercadopago.com'
      || url.hostname.endsWith('.mercadopago.com')
    );
};

const getShippingFee = (postalCode, method, subtotalCents) => {
  if (method === 'tienda') return 0;
  if (method === 'express') return 24000;
  if (!/^\d{5}$/.test(postalCode)) return null;
  if (subtotalCents >= 120000) return 0;
  if (/^(?:0[1-4]|0[6-9]|[1-3]\d)/.test(postalCode)) return 12000;
  if (/^[4-6]\d/.test(postalCode)) return 18000;
  if (/^[7-9]\d/.test(postalCode)) return 22000;
  return 32000;
};

const sendError = (response, status, message) => response.status(status).json({ error: message });

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendError(response, 405, 'Este método no está disponible.');
  }
  const contentLength = Number(request.headers['content-length']);
  if (Number.isFinite(contentLength) && contentLength > 32768) {
    return sendError(response, 413, 'La información del pedido es demasiado grande.');
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const siteUrlValue = process.env.SITE_URL;
  const mode = process.env.MERCADOPAGO_MODE || 'test';
  if (!accessToken || !siteUrlValue || !['test', 'live'].includes(mode)) {
    return sendError(response, 503, 'El pago todavía no está configurado. No se realizó ningún cobro.');
  }
  if ((mode === 'test' && !accessToken.startsWith('TEST-'))
    || (mode === 'live' && accessToken.startsWith('TEST-'))) {
    return sendError(response, 503, 'La configuración del modo de pago no es válida. No se realizó ningún cobro.');
  }

  let siteUrl;
  try {
    siteUrl = new URL(siteUrlValue);
  } catch (error) {
    return sendError(response, 503, 'La dirección de la tienda no está configurada correctamente.');
  }
  if (siteUrl.protocol !== 'https:') {
    return sendError(response, 503, 'La tienda debe usar HTTPS para aceptar pagos.');
  }

  const origin = request.headers.origin;
  if (!origin || origin !== siteUrl.origin) {
    return sendError(response, 403, 'No se pudo validar el origen de la solicitud.');
  }

  let body = request.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (error) {
      return sendError(response, 400, 'La información del pedido no es válida.');
    }
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)
    || !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) {
    return sendError(response, 400, 'Agrega productos válidos antes de continuar.');
  }

  const customer = body.customer;
  if (!customer || typeof customer !== 'object') {
    return sendError(response, 400, 'Revisa tus datos de contacto y entrega.');
  }

  const name = readText(customer.name, 100);
  const email = readText(customer.email, 254).toLowerCase();
  const phone = readText(customer.phone, 30);
  const city = readText(customer.city, 100);
  const address = readText(customer.address, 200);
  const postalCode = readText(customer.postalCode, 5);
  const shippingMethod = readText(customer.shippingMethod, 20);
  const notes = readText(customer.notes, 500);

  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || phone.replace(/\D/g, '').length < 10 || city.length < 2
    || !/^\d{5}$/.test(postalCode)
    || !['domicilio', 'tienda', 'express'].includes(shippingMethod)
    || (shippingMethod !== 'tienda' && address.length < 5)) {
    return sendError(response, 400, 'Revisa tus datos de contacto y entrega.');
  }

  let subtotalCents = 0;
  const orderItems = [];
  let totalQuantity = 0;

  for (const cartItem of body.items) {
    const product = products[cartItem && cartItem.id];
    const quantity = cartItem && cartItem.quantity;
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 1000
      || !product.sizes.includes(cartItem.size)
      || !product.colors.includes(cartItem.color)) {
      return sendError(response, 400, 'Uno de los productos o sus opciones no es válido.');
    }

    totalQuantity += quantity;
    if (totalQuantity > 1000) {
      return sendError(response, 400, 'La cantidad total del pedido excede el límite permitido.');
    }

    subtotalCents += product.price * 100 * quantity;
    orderItems.push({
      name: product.name,
      quantity,
      size: cartItem.size,
      color: cartItem.color,
      design: readText(cartItem.customization && cartItem.customization.text, 200),
      placement: readText(cartItem.customization && cartItem.customization.placement, 80)
    });
  }

  const couponCode = readText(body.couponCode, 12).toUpperCase();
  if (couponCode && coupons[couponCode] === undefined) {
    return sendError(response, 400, 'El cupón aplicado ya no es válido.');
  }

  const shippingFeeCents = getShippingFee(postalCode, shippingMethod, subtotalCents);
  if (shippingFeeCents === null) {
    return sendError(response, 400, 'Ingresa un código postal válido para calcular el envío.');
  }

  const shippingDiscountCents = couponCode === 'ENVIOFREE' ? shippingFeeCents : 0;
  const productDiscountCents = Math.round(subtotalCents * (coupons[couponCode] || 0));
  const totalCents = Math.max(0, subtotalCents + shippingFeeCents - shippingDiscountCents - productDiscountCents);
  if (totalCents < 1) {
    return sendError(response, 400, 'El total del pedido no es válido.');
  }

  const itemSummary = orderItems
    .map((item) => `${item.quantity} x ${item.name} (${item.size})`)
    .join(', ')
    .slice(0, 240);
  const [firstName, ...surnameParts] = name.split(/\s+/);
  const payer = { email, name: firstName };
  if (surnameParts.length) payer.surname = surnameParts.join(' ');
  const preference = {
    items: [{
      id: randomUUID(),
      title: 'Pedido personalizado MISO',
      description: itemSummary,
      quantity: 1,
      unit_price: totalCents / 100,
      currency_id: 'MXN'
    }],
    payer,
    external_reference: randomUUID(),
    back_urls: {
      success: siteUrl.origin,
      pending: siteUrl.origin,
      failure: siteUrl.origin
    },
    auto_return: 'approved',
    metadata: {
      customer_name: name,
      customer_phone: phone,
      customer_city: city,
      shipping_address: address,
      postal_code: postalCode,
      shipping_method: shippingMethod,
      coupon_code: couponCode,
      notes,
      items: orderItems
    }
  };

  let mercadoPagoResponse;
  try {
    mercadoPagoResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preference)
    });
  } catch (error) {
    console.error('No se pudo conectar con Mercado Pago.', error);
    return sendError(response, 502, 'No se pudo conectar con Mercado Pago. Inténtalo de nuevo más tarde.');
  }

  if (!mercadoPagoResponse.ok) {
    console.error(`Mercado Pago rechazó la preferencia (HTTP ${mercadoPagoResponse.status}).`);
    return sendError(response, 502, 'Mercado Pago no pudo iniciar el pago. Revisa la configuración e inténtalo de nuevo.');
  }

  let preferenceResult;
  try {
    preferenceResult = await mercadoPagoResponse.json();
  } catch (error) {
    console.error('Mercado Pago respondió con datos no válidos.');
    return sendError(response, 502, 'No se recibió una respuesta válida de Mercado Pago.');
  }

  const checkoutUrl = mode === 'test'
    ? preferenceResult.sandbox_init_point
    : preferenceResult.init_point;
  if (!isMercadoPagoUrl(checkoutUrl)) {
    console.error('Mercado Pago no devolvió una URL de checkout para el modo configurado.');
    return sendError(response, 502, 'Mercado Pago no devolvió el enlace de pago. Inténtalo de nuevo más tarde.');
  }

  return response.status(200).json({ checkoutUrl });
};
