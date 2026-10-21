import fs from 'node:fs/promises';
import mysql from 'mysql2/promise';
import assert from 'node:assert/strict';
import {decryptSnapshot} from '../scripts/portal-operations.mjs';
import {restoreSnapshot} from '../scripts/restore-portal.mjs';
import {installWorkflow,reconcile} from '../scripts/reconcile-phase3.mjs';
import {changePublication} from '../scripts/publication-workflow.mjs';
if (!process.env.PORTAL_RESTORE_BACKUP || !process.env.PORTAL_BACKUP_KEY_FILE) throw new Error('Indicar copia y clave privadas');
const snapshot=decryptSnapshot(await fs.readFile(process.env.PORTAL_RESTORE_BACKUP),await fs.readFile(process.env.PORTAL_BACKUP_KEY_FILE));
const options={host:'127.0.0.1',port:Number(process.env.PORTAL_RESTORE_PORT || 33079),user:'root',password:'',dateStrings:true,supportBigNumbers:true,bigNumberStrings:true};
const admin=await mysql.createConnection(options);
const name='alfaro_restore_'+Date.now();
await admin.query(`CREATE DATABASE ${mysql.escapeId(name)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await admin.end();
const db=await mysql.createConnection({...options,database:name});
try {
 const restored=await restoreSnapshot(db,snapshot);
 await installWorkflow(db);
 const reconciled=await reconcile(db,true);
 const rerun=await reconcile(db,true);
 assert.deepEqual(rerun.assigned,{property_type_id:0,modality_id:0,district_id:0});
 const [[first]]=await db.query('SELECT property_id,publication_status FROM publications ORDER BY property_id LIMIT 1');
 const change={id:first.property_id,expected:first.publication_status,status:'suspended',actor:'Ensayo aislado',reason:'Prueba automatizada sin datos productivos'};
 await changePublication(db,change);
 for(const [view,key] of [['public_properties','id'],['public_property_gallery','property_id'],['public_property_info','id_properties']]) {
  const [[row]]=await db.query(`SELECT COUNT(*) AS n FROM ${view} WHERE ${key}=?`,[first.property_id]); assert.equal(Number(row.n),0);
 }
 await assert.rejects(changePublication(db,{...change,status:'withdrawn'}));
 await changePublication(db,{...change,expected:'suspended',status:'withdrawn'});
 await changePublication(db,{...change,expected:'withdrawn',status:'pending_review'});
 await assert.rejects(changePublication(db,{...change,expected:'pending_review',status:'published'}));
 await changePublication(db,{...change,expected:'pending_review',status:'published',confirmPublicData:true});
 const [[visible]]=await db.query('SELECT COUNT(*) AS n FROM public_properties WHERE id=?',[first.property_id]); assert.equal(Number(visible.n),1);
 const [[events]]=await db.query('SELECT COUNT(*) AS n FROM publication_events');assert.equal(Number(events.n),4);
 const report={date:new Date().toISOString(),isolated:true,restored,reconciled,idempotent:true,workflow:{suspend:true,withdraw:true,pending:true,publish:true,staleStateRejected:true,approvalRequired:true,events:4},productionWrites:false};
 await fs.writeFile('docs/evidencia-fase3/RESTAURACION-Y-FLUJO-2026-10-21.json',JSON.stringify(report,null,2)+'\n');
 await fs.writeFile('portal-private/restore-config.json',JSON.stringify({...options,DB_HOST:options.host,DB_PORT:options.port,DB_USER:'root',DB_PASSWORD:'',DB_NAME:name}),{mode:0o600});
 console.log(JSON.stringify(report));
}finally{await db.end();}
