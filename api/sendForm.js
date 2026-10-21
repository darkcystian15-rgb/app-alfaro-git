// ✅ Endpoint: /api/sendForm
// Vercel soporta fetch nativo y parsing automático de JSON

export default async function handler(req, res) {
  const start = Date.now();
  console.log("\n🚀 ===== INICIO EJECUCIÓN /api/sendForm =====");
  console.log("🕒 Fecha:", new Date().toLocaleString());
  console.log("📩 Evento recibido:", {
    method: req.method,
    bodyType: typeof req.body,
  });

  // ✅ Manejo de preflight (CORS)
  if (req.method === "OPTIONS") {
    console.log("⚙️ Respuesta OPTIONS (preflight)");
    return res
      .status(200)
      .setHeader("Access-Control-Allow-Origin", "*")
      .setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
      .setHeader("Access-Control-Allow-Headers", "Content-Type")
      .send("OK");
  }

  // ✅ Solo permitir POST
  if (req.method !== "POST") {
    console.warn("⚠️ Método no permitido:", req.method);
    return res
      .status(405)
      .setHeader("Access-Control-Allow-Origin", "*")
      .json({ success: false, message: "Método no permitido" });
  }

  try {
    // 🔹 Parsear body desde el frontend
    const data = typeof req.body === "string" ? JSON.parse(req.body) : req.body;


    // 🧠 Validar token reCAPTCHA antes de continuar
    const recaptchaToken = data.recaptchaToken;
    const secret = process.env.RECAPTCHA_SECRET_KEY;

    console.log("🔑 Clave secreta reCAPTCHA:", secret ? "✅ Configurada" : "❌ Faltante");
    console.log("🎟️ Token recibido:", recaptchaToken ? "✅ Presente" : "❌ Ausente");

    if (!recaptchaToken) {
      console.error("⛔ No se recibió el token reCAPTCHA desde el frontend.");
      return res
        .status(400)
        .setHeader("Access-Control-Allow-Origin", "*")
        .json({
          success: false,
          message: "Token reCAPTCHA faltante en la solicitud.",
        });
    }

    // 🔹 Verificar reCAPTCHA con Google
    console.log("🌍 Enviando solicitud a Google reCAPTCHA...");
    const verifyURL = "https://www.google.com/recaptcha/api/siteverify";

    const verifyResponse = await fetch(verifyURL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secret}&response=${recaptchaToken}`,
    });

    console.log("🌐 Estado HTTP reCAPTCHA:", verifyResponse.status);

    const verification = await verifyResponse.json();
    console.log("🧩 Resultado verificación reCAPTCHA:", verification);

    // ⚠️ Si falla la verificación, detener flujo
    if (!verification.success) {
      console.warn("🚫 reCAPTCHA falló. Errores:", verification["error-codes"]);
      return res
        .status(400)
        .setHeader("Access-Control-Allow-Origin", "*")
        .json({
          success: false,
          message: "❌ Falló la validación reCAPTCHA (no exitosa)",
          verification,
        });
    }

    if (typeof verification.score === "number" && verification.score < 0.5) {
      console.warn("⚠️ reCAPTCHA con score bajo:", verification.score);
      return res
        .status(400)
        .setHeader("Access-Control-Allow-Origin", "*")
        .json({
          success: false,
          message: `❌ Score reCAPTCHA demasiado bajo (${verification.score})`,
          verification,
        });
    }

    console.log("✅ reCAPTCHA verificado con éxito. Score:", verification.score ?? "N/A");

    // 🔹 Enviar datos a tu Apps Script
    const scriptURL =
      "https://script.google.com/macros/s/AKfycbw3bNJNLgKjk-ZXkyCKe9knM64OfOeG1ZwZVUgf98bGZtp6yHd9XFjFRuVeb_s11rmo/exec";

    console.log("📤 Enviando datos a Google Apps Script...");
    const response = await fetch(scriptURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    console.log("🌐 Estado HTTP Apps Script:", response.status);
    const text = await response.text();


    // 🔹 Intentar parsear respuesta JSON
    let result;
    try {
      result = JSON.parse(text);

    } catch (err) {
      console.error("❌ Respuesta de Apps Script no es JSON válido:", err.message);
      result = {
        success: false,
        message: "Respuesta de Apps Script no es JSON válida",

      };
    }

    console.log("🏁 Flujo completado correctamente ✅");
    console.log(`⏱️ Tiempo total: ${Date.now() - start} ms`);
    console.log("🚀 ===== FIN EXITOSO /api/sendForm =====\n");

    return res
      .status(200)
      .setHeader("Access-Control-Allow-Origin", "*")
      .json(result);

  } catch (error) {
    console.error("💥 Error general en sendForm:", error.message);
    console.error(error.stack);
    console.log(`⏱️ Tiempo hasta error: ${Date.now() - start} ms`);
    console.log("🧭 ===== FIN EJECUCIÓN /api/sendForm (ERROR) =====\n");

    return res
      .status(500)
      .setHeader("Access-Control-Allow-Origin", "*")
      .json({
        success: false,
        message: "No se pudo enviar el formulario. Intenta nuevamente.",
      });
  }
}

