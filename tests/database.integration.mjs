// Solo contra la base aislada. Las escrituras de prueba siempre terminan en ROLLBACK.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import { pathToFileURL } from 'node:url';
const v = JSON.parse(await fs.readFile(process.env.PORTAL_DB_CONFIG, 'utf8'));
const db = await mysql.createConnection({host:v.DB_HOST,port:Number(v.DB_PORT),user:v.DB_USER,password:v.DB_PASSWORD,database:'inmobi16_portal'});
const ids = JSON.parse(await fs.readFile(process.env.PORTAL_PUBLIC_IDS, 'utf8'));
globalThis.__portalIntegrationPool = db;
async function load(name) {
  let source = await fs.readFile(new URL('../api/'+name+'.js',import.meta.url),'utf8');
  source = source.replace(/import \{ pool \} from "\.\/db\.js";[^\n]*/, 'const pool = globalThis.__portalIntegrationPool;');
  source = source.replace('"../server/share-handler.js"',JSON.stringify(pathToFileURL(process.cwd()+'/server/share-handler.js').href));
  return (await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
}
const names=['getProperties','getPropertyDetails','getPropertyDetailInfo','property-share','get-options','getAsesores','getArticulos','getNoticias','get-social-links'];
const handlers=Object.fromEntries(await Promise.all(names.map(async name=>[name,await load(name)])));
async function invoke(name,query={}) {
 const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v;return this},status(n){this.statusCode=n;return this},json(body){this.body=body;return this},send(body){this.body=body;return this},end(){return this}};
 await handlers[name]({method:'GET',query},res);return res;
}
try {
 await db.beginTransaction();
 await db.query("UPDATE publications SET publication_status='published',approved_at=UTC_TIMESTAMP() WHERE property_id IN (?)",[ids]);
 const catalog=await invoke('getProperties');assert.equal(catalog.statusCode,200);assert.equal(catalog.body.length,ids.length);
 assert.deepEqual(catalog.body.map(x=>x.id).sort((a,b)=>a-b),[...ids].sort((a,b)=>a-b));
 const featured=await invoke('getProperties',{featured:'true'});assert.equal(featured.body.length,8);
 const sample=catalog.body[0],id=sample.id;
 const filtered=await invoke('getProperties',{location:sample.location,status:sample.status});assert.equal(filtered.statusCode,200);assert.ok(filtered.body.length>0);assert.ok(filtered.body.every(p=>p.location===sample.location));
 for(const property of catalog.body){
  assert.ok(!('propietario' in property));
  const detail=await invoke('getPropertyDetails',{id:String(property.id)});assert.equal(detail.statusCode,200);assert.equal(detail.body.property.id,property.id);assert.ok(!('propietario' in detail.body.property));
  assert.ok(detail.body.subProperties.every(x=>x.property_id===property.id));
  for(let i=1;i<detail.body.subProperties.length;i++){const a=detail.body.subProperties[i-1],b=detail.body.subProperties[i];assert.ok(a.order<b.order||(a.order===b.order&&a.id<b.id));}
  const info=await invoke('getPropertyDetailInfo',{id:String(property.id)});assert.equal(info.statusCode,200);assert.ok(info.body.every(x=>x.id_properties===property.id));
 }
 for(const name of names.slice(4)){const r=await invoke(name);assert.equal(r.statusCode,200,name);}
 const share=await invoke('property-share',{id:String(id)});assert.equal(share.statusCode,200);assert.ok(share.body.includes('og:image'));assert.equal(share.headers['cache-control'],'no-store');
 const image=await invoke('property-share',{id:String(id),format:'image'});assert.equal(image.statusCode,200);assert.ok(Buffer.isBuffer(image.body));
 await db.query("UPDATE publications SET publication_status='suspended' WHERE property_id=?",[id]);
 assert.equal((await invoke('getPropertyDetails',{id:String(id)})).statusCode,404);
 assert.deepEqual((await invoke('getPropertyDetailInfo',{id:String(id)})).body,[]);
 assert.equal((await invoke('property-share',{id:String(id)})).statusCode,404);
 assert.ok(!(await invoke('getProperties')).body.some(x=>x.id===id));
 console.log(JSON.stringify({database:'inmobi16_portal',catalog:ids.length,featured:8,allDetailsAndInfo:true,filters:true,editorialApis:true,shareHtmlAndImage:true,suspension:true,privateFieldsExcluded:true,rollback:true}));
} finally {await db.rollback();await db.end();delete globalThis.__portalIntegrationPool;}
