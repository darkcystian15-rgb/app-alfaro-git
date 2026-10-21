// netlify/functions/getAsesores.js
import { pool } from "./db.js";

export async function handler(event) {
  try {
    const rawId = event.queryStringParameters?.id;

    // 🔹 Si mandan ID → traer un asesor específico
    if (rawId) {
      const asesorId = parseInt(rawId, 10);

      if (isNaN(asesorId)) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Id inválido, debe ser un número" }),
        };
      }

      const [rows] = await pool.execute(
        `
        SELECT id, img_asesores, name_asesores, face_asesores, wasap_asesores,
               insta_asesores, tiktok_asesores, linkedin_asesores
        FROM asesores
        WHERE id = ?
        `,
        [asesorId]
      );

      if (rows.length === 0) {
        return {
          statusCode: 404,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Asesor no encontrado" }),
        };
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(rows[0]),
      };
    }

    // 🔹 Si NO mandan ID → devolver todos los asesores
    const [rows] = await pool.execute(
      `
      SELECT id, img_asesores, name_asesores, face_asesores, wasap_asesores,
             insta_asesores, tiktok_asesores, linkedin_asesores
      FROM asesores
      ORDER BY id ASC
      `
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(rows),
    };
  } catch (error) {
    console.error("❌ ERROR en getAsesores:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Error al traer asesores",
        error: "No se pudo completar la consulta",
      }),
    };
  }
}
