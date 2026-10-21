export async function installIntranetSchema(db){
 await db.query(`CREATE TABLE IF NOT EXISTS portal_intranet_sync (clave VARCHAR(100) PRIMARY KEY,revision INT UNSIGNED NOT NULL DEFAULT 0,property_id INT UNSIGNED NULL UNIQUE,contenido JSON NOT NULL,body_hash CHAR(64) NOT NULL,actualizado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB`);
 const [columns]=await db.query("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='properties' AND COLUMN_NAME='price_on_request'");
 if(!columns.length)await db.query('ALTER TABLE properties ADD price_on_request BOOLEAN NOT NULL DEFAULT FALSE');
 const [[view]]=await db.query('SHOW CREATE VIEW public_properties');
 let sql=view['Create View'].replace(/DEFINER=`[^`]+`@`[^`]+`\s*/g,'').replace(/^CREATE /,'CREATE OR REPLACE ');
 if(!sql.includes('price_on_request'))sql=sql.replace(/`p`\.`price` AS `price`/,'(CASE WHEN `p`.`price_on_request`=1 THEN NULL ELSE `p`.`price` END) AS `price`');
 if(!sql.includes('price_on_request'))throw new Error('Vista pública no reconocida');
 await db.query(sql);
}
