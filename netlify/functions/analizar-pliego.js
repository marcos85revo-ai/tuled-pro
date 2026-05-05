exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key no configurada' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) }; }

  const { texto } = body;
  if (!texto || texto.trim().length < 50) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Documento vacío o demasiado corto' }) };
  }

  // Truncar a 100.000 caracteres si es muy largo
  const MAX_CHARS = 100000;
  const textoFinal = texto.length > MAX_CHARS ? texto.substring(0, MAX_CHARS) : texto;
  const truncado = texto.length > MAX_CHARS;

  const systemPrompt = `Eres un especialista en licitaciones públicas y privadas con profundo conocimiento técnico en pantallas LED y tecnología AV profesional. Tu único objetivo es analizar documentos de licitación (pliegos técnicos, pliegos de prescripciones técnicas, tender documents) y extraer con precisión quirúrgica toda la información relevante para la selección de pantallas LED.

El documento puede estar en español o inglés. Detecta el idioma automáticamente. Responde SIEMPRE en español independientemente del idioma del pliego.

Debes extraer y estructurar la información en dos bloques:

BLOQUE 1 — Parámetros técnicos LED: Extrae SOLO lo que el pliego especifica explícitamente. No interpretes ni hagas inferencias. Si un parámetro no aparece en el documento, su valor debe ser exactamente la cadena "No especificado en el pliego". Los parámetros a extraer son: entorno de instalación (interior/exterior), dimensiones de la pantalla (ancho × alto en metros), pixel pitch requerido, brillo mínimo en nits, tecnología LED (SMD/COB/MicroLED u otras), frecuencia de refresco mínima, ángulo de visión, protección IP, certificaciones requeridas, cantidad de unidades, tipo de instalación, y cualquier otro requisito técnico LED relevante.

BLOQUE 2 — Datos administrativos: Nombre completo del organismo convocante, país y ciudad, número de referencia o expediente, presupuesto máximo con moneda, fecha límite de presentación de ofertas, fecha de publicación de resultados, plazo de entrega del equipamiento, plazo de garantía. Si alguno no aparece, valor exactamente: "No especificado en el pliego".

REGLA CRÍTICA: No inventes ningún dato. No extrapoles. No supongas. Si el documento no menciona un parámetro, el valor es "No especificado en el pliego".

Si el documento no contiene NINGUNA referencia a pantallas LED, videowall, display LED, pantalla de visualización o tecnología similar, responde ÚNICAMENTE con este JSON exacto:
{"tiene_contenido_led": false}

Responde ÚNICAMENTE con un objeto JSON válido. Sin texto adicional, sin explicaciones, sin bloques de código markdown. Solo el JSON puro.`;

  const userPrompt = `Analiza el siguiente documento de licitación y extrae toda la información según tus instrucciones. Responde ÚNICAMENTE con JSON válido con esta estructura exacta:

{
  "tiene_contenido_led": true,
  "organismo": "Nombre del organismo convocante",
  "pais_ciudad": "País, Ciudad",
  "referencia": "Número de expediente o referencia",
  "presupuesto": "Importe con moneda",
  "fecha_limite_oferta": "Fecha límite de presentación",
  "fecha_publicacion_resultados": "Fecha de publicación de resultados",
  "plazo_entrega": "Plazo de entrega del equipamiento",
  "plazo_garantia": "Plazo de garantía requerido",
  "led": {
    "entorno": "Interior o Exterior",
    "ancho_m": null,
    "alto_m": null,
    "pixel_pitch_mm": "No especificado en el pliego",
    "brillo_min_nits": null,
    "tecnologia": "No especificado en el pliego",
    "refresh_min_hz": null,
    "angulo_vision": "No especificado en el pliego",
    "ip_rating": "No especificado en el pliego",
    "certificaciones": [],
    "cantidad_unidades": null,
    "tipo_instalacion": "No especificado en el pliego",
    "otros_requisitos": "No especificado en el pliego"
  }
}

DOCUMENTO A ANALIZAR:

${textoFinal}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return { statusCode: response.status, body: JSON.stringify({ error: err }) };
    }

    const data = await response.json();
    const textoRespuesta = data.content?.[0]?.text || '';

    // Limpiar posibles bloques markdown
    const jsonLimpio = textoRespuesta.replace(/```json|```/g, '').trim();

    let resultado;
    try {
      resultado = JSON.parse(jsonLimpio);
    } catch(e) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Claude no devolvió JSON válido', raw: textoRespuesta }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ...resultado, truncado })
    };

  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};