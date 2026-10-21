// api/getArticulos.js
import { pool } from "./db.js"; // ajusta la ruta según tu estructura de carpetas

export default async function handler(req, res) {
  try {
    const rawId = req.query.id;

    // 🔹 Si mandan ID → traer artículo específico
    if (rawId) {
      const articuloId = parseInt(rawId, 10);

      if (isNaN(articuloId)) {
        return res.status(400).json({ message: "Id inválido, debe ser un número" });
      }

      const [rows] = await pool.execute(
        `
        SELECT id, titulo, descripcion, imagen, fecha, link
        FROM articulos
        WHERE id = ?
        `,
        [articuloId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Artículo no encontrado" });
      }

      return res
        .status(200)
        .setHeader("Access-Control-Allow-Origin", "*")
        .json(rows[0]);
    }

    // 🔹 Si NO mandan ID → devolver todos los artículos
    const [rows] = await pool.execute(
      `
      SELECT id, titulo, descripcion, imagen, fecha, link
      FROM articulos
      ORDER BY fecha DESC
      `
    );

    return res
      .status(200)
      .setHeader("Access-Control-Allow-Origin", "*")
      .json(rows);

  } catch (error) {
    console.error("❌ ERROR en getArticulos:", error);

    return res.status(500).json({
      message: "Error al traer artículos",
      error: "No se pudo completar la consulta",
    });
  }
}
