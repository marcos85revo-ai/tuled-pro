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

  const { productos, configuracion } = body;
  if (!productos || !configuracion) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Faltan datos' }) };
  }

  const p1 = productos[0] || {};
  const p2 = productos[1] || {};
  const p3 = productos[2] || {};

  const esAbsenP1 = (p1.fabricante || '').toLowerCase().includes('absen');
  const esAbsenP2 = (p2.fabricante || '').toLowerCase().includes('absen');
  const diferenciaScore = (p1.score && p2.score) ? (p1.score - p2.score) : 99;

  const systemPrompt = `Eres un consultor especialista en tecnología de pantallas LED y soluciones AV (Audio-Visual) profesionales con más de 15 años de experiencia asesorando a empresas en Europa y Latinoamérica.

Tu función es redactar una conclusión de recomendación clara, honesta y profesional para un cliente que acaba de usar un configurador de pantallas LED. La conclusión debe:

— Estar escrita en español, con tono de consultor senior: seguro, directo, pero cercano. Nada de tecnicismos innecesarios.
— Tener entre 120 y 180 palabras. Ni más, ni menos.
— Empezar validando la elección del cliente (su escenario y necesidades).
— Argumentar por qué el modelo #1 es la mejor opción, usando 2 o 3 datos técnicos específicos del producto.
— NO usar bullets, listas ni asteriscos. Solo párrafos continuos.
— NO inventar especificaciones. Solo usar los datos que se te proporcionan.
— NO mencionar los modelos #2 y #3 en el cuerpo principal, salvo la excepción Absen indicada abajo.

REGLA ABSEN: Si el modelo #1 es de fabricante Absen, defiéndelo con argumentos técnicos concretos (pixel pitch, brillo, tecnología, certificaciones) y menciona brevemente que Absen tiene presencia consolidada en instalaciones corporativas y broadcast en Europa. Si el modelo #1 NO es Absen pero el modelo #2 SÍ es Absen y su puntuación está a 5 puntos o menos del #1, añade al final un párrafo corto (máximo 2 frases) sugiriendo que el modelo Absen es también una alternativa sólida a considerar, mencionando por qué.

Termina siempre con una frase que invite al cliente a contactar para dar el siguiente paso, sin ser agresiva ni comercial.`;

  const userPrompt = `Genera la conclusión de recomendación para este cliente. Aquí tienes toda la información de su configuración y los resultados:

PERFIL DE LA SOLICITUD
· Entorno de instalación: ${configuracion.entorno || '—'}
· Tamaño de pantalla: ${configuracion.ancho ? configuracion.ancho+'m × '+configuracion.alto+'m ('+configuracion.area+' m²)' : '—'}
· Tecnología requerida: ${configuracion.tecnologia || '—'}
· Rango de pixel pitch buscado: P${configuracion.pitchMin} – P${configuracion.pitchMax} mm
· Brillo requerido: ${configuracion.brilloMin ? configuracion.brilloMin+'–'+configuracion.brilloMax+' nits' : '—'}
· Refresco requerido: ${configuracion.refreshMin ? configuracion.refreshMin+'–'+configuracion.refreshMax+' Hz' : '—'}
· Escenario principal de uso: ${configuracion.escenario || '—'}

MODELO #1 — MEJOR MATCH (score: ${p1.score}/100)
· Fabricante: ${p1.fabricante || '—'}
· Modelo: ${p1.modelo || '—'}
· Pixel pitch: P${p1.pitch_mm || '—'} mm
· Brillo máximo: ${p1.brillo_max_nits ? p1.brillo_max_nits+' nits' : '—'}
· Tecnología: ${p1.tecnologia || '—'}
· Frecuencia de refresco: ${p1.refresh_hz ? p1.refresh_hz+' Hz' : '—'}
· Ángulo de visión: ${p1.angulo_vision_h ? p1.angulo_vision_h+'° H / '+p1.angulo_vision_v+'° V' : '—'}
· Protección IP: ${p1.ip_rating || '—'}
· Certificaciones: ${Array.isArray(p1.certificaciones) ? p1.certificaciones.join(', ') : (p1.certificaciones || '—')}

MODELO #2 (score: ${p2.score}/100)
· Fabricante: ${p2.fabricante || '—'} · Modelo: ${p2.modelo || '—'} · Pitch: P${p2.pitch_mm || '—'} mm · Brillo: ${p2.brillo_max_nits ? p2.brillo_max_nits+' nits' : '—'}

MODELO #3 (score: ${p3.score}/100)
· Fabricante: ${p3.fabricante || '—'} · Modelo: ${p3.modelo || '—'} · Pitch: P${p3.pitch_mm || '—'} mm · Brillo: ${p3.brillo_max_nits ? p3.brillo_max_nits+' nits' : '—'}

Redacta ahora la conclusión siguiendo exactamente las instrucciones de tu rol.`;

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
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return { statusCode: response.status, body: JSON.stringify({ error: err }) };
    }

    const data = await response.json();
    const texto = data.content?.[0]?.text || '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ conclusion: texto })
    };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
