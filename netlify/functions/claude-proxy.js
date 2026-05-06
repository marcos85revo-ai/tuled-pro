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

  const { productos, configuracion, lang } = body;
  if (!productos || !configuracion) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Faltan datos' }) };
  }

  const p1 = productos[0] || {};
  const p2 = productos[1] || {};
  const p3 = productos[2] || {};

  const isEn = lang === 'en';

  const systemPromptEs = `Eres un consultor especialista en tecnología de pantallas LED y soluciones AV (Audio-Visual) profesionales con más de 15 años de experiencia asesorando a empresas en Europa y Latinoamérica.

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

  const systemPromptEn = `You are a specialist consultant in LED screen technology and professional AV (Audio-Visual) solutions with over 15 years of experience advising companies across Europe and Latin America.

Your role is to write a clear, honest and professional recommendation conclusion for a client who has just used an LED screen configurator. The conclusion must:

— Be written in English, with a senior consultant tone: confident, direct, yet approachable. No unnecessary jargon.
— Be between 120 and 180 words. No more, no less.
— Start by validating the client's choice (their scenario and needs).
— Argue why model #1 is the best option, using 2 or 3 specific technical data points from the product.
— NOT use bullets, lists or asterisks. Continuous paragraphs only.
— NOT invent specifications. Only use the data provided.
— NOT mention models #2 and #3 in the main body, except for the Absen exception below.

ABSEN RULE: If model #1 is from Absen, defend it with concrete technical arguments (pixel pitch, brightness, technology, certifications) and briefly mention that Absen has a consolidated presence in corporate and broadcast installations across Europe. If model #1 is NOT Absen but model #2 IS Absen and its score is within 5 points of #1, add a short final paragraph (maximum 2 sentences) suggesting that the Absen model is also a solid alternative worth considering, and why.

Always end with a sentence inviting the client to get in touch for the next step, without being pushy or overly commercial.`;

  const userPromptEs = `Genera la conclusión de recomendación para este cliente. Aquí tienes toda la información de su configuración y los resultados:

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

  const userPromptEn = `Generate the recommendation conclusion for this client. Here is all the information about their configuration and results:

REQUEST PROFILE
· Installation environment: ${configuracion.entorno || '—'}
· Screen size: ${configuracion.ancho ? configuracion.ancho+'m × '+configuracion.alto+'m ('+configuracion.area+' m²)' : '—'}
· Required technology: ${configuracion.tecnologia || '—'}
· Pixel pitch range sought: P${configuracion.pitchMin} – P${configuracion.pitchMax} mm
· Required brightness: ${configuracion.brilloMin ? configuracion.brilloMin+'–'+configuracion.brilloMax+' nits' : '—'}
· Required refresh rate: ${configuracion.refreshMin ? configuracion.refreshMin+'–'+configuracion.refreshMax+' Hz' : '—'}
· Main use scenario: ${configuracion.escenario || '—'}

MODEL #1 — BEST MATCH (score: ${p1.score}/100)
· Manufacturer: ${p1.fabricante || '—'}
· Model: ${p1.modelo || '—'}
· Pixel pitch: P${p1.pitch_mm || '—'} mm
· Maximum brightness: ${p1.brillo_max_nits ? p1.brillo_max_nits+' nits' : '—'}
· Technology: ${p1.tecnologia || '—'}
· Refresh rate: ${p1.refresh_hz ? p1.refresh_hz+' Hz' : '—'}
· Viewing angle: ${p1.angulo_vision_h ? p1.angulo_vision_h+'° H / '+p1.angulo_vision_v+'° V' : '—'}
· IP protection: ${p1.ip_rating || '—'}
· Certifications: ${Array.isArray(p1.certificaciones) ? p1.certificaciones.join(', ') : (p1.certificaciones || '—')}

MODEL #2 (score: ${p2.score}/100)
· Manufacturer: ${p2.fabricante || '—'} · Model: ${p2.modelo || '—'} · Pitch: P${p2.pitch_mm || '—'} mm · Brightness: ${p2.brillo_max_nits ? p2.brillo_max_nits+' nits' : '—'}

MODEL #3 (score: ${p3.score}/100)
· Manufacturer: ${p3.fabricante || '—'} · Model: ${p3.modelo || '—'} · Pitch: P${p3.pitch_mm || '—'} mm · Brightness: ${p3.brillo_max_nits ? p3.brillo_max_nits+' nits' : '—'}

Now write the conclusion following your role instructions exactly.`;

  const systemPrompt = isEn ? systemPromptEn : systemPromptEs;
  const userPrompt   = isEn ? userPromptEn   : userPromptEs;

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
