import { pool } from "./db.js";
import { createShareHandler } from "../server/share-handler.js";
export default createShareHandler({
  getProperty: async (id) => {
    const [rows] = await pool.execute(
      "SELECT id, title, image, price, moneda, location, address, status, bedrooms, bathrooms, area FROM properties WHERE id = ? LIMIT 1",
      [id],
    );
    return rows;
  },
});
