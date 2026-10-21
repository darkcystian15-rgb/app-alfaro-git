import mysql from 'mysql2/promise';
import {loadConfig} from './portal-operations.mjs';
import {installIntranetSchema} from '../server/intranet-schema.mjs';
const db=await mysql.createConnection(await loadConfig());
try{
 const apply=process.argv.includes('--apply');
 if(apply)await installIntranetSchema(db);
 console.log(JSON.stringify({applied:apply,businessRowsChanged:0,legacyIdsPreserved:true}));
}catch(error){console.error('Instalación detenida:',error.code||error.message);process.exitCode=1;}finally{await db.end();}
