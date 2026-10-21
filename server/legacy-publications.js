import {validatePropertyExtras,writePropertyExtras} from './property-extras.js';
import {createHash} from 'node:crypto';
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const hash=v=>createHash('sha256').update(canonical(v)).digest('hex');
const escape=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Whitelist of public fields: no owner, contact or internal document crosses this API.
export async function legacyListings(db,id,lock=false,includeNative=false){
 const [rows]=await db.query(`SELECT p.id,p.title,p.image,p.price,p.price_on_request,p.moneda,p.address,p.location,p.status,p.bedrooms,p.bathrooms,p.cocheras,p.area,p.area_c,p.description,p.distribution,p.destacado,p.latitude,p.longitude,p.currency_code,p.price_basis,t.nombre type,pub.publication_status FROM properties p JOIN publications pub ON pub.property_id=p.id LEFT JOIN tipos t ON t.id=p.property_type_id WHERE ${includeNative?'1=1':"pub.source_system='legacy_portal'"} AND pub.approved_at IS NOT NULL ${id?'AND p.id=?':''} ORDER BY p.id${lock?' FOR UPDATE':''}`,id?[id]:[]);
 if(!rows.length)return [];
 const [info]=await db.query('SELECT property_ref_id,titulo_info,descripcion_info FROM mas_info WHERE property_ref_id IN (?) ORDER BY id',[rows.map(r=>r.id)]);
 const [maps]=await db.query("SELECT clave,contenido FROM portal_intranet_sync WHERE clave IN (?)",[rows.map(r=>`map:${r.id}`)]);
 const [photos]=await db.query('SELECT id,property_ref_id,image,text_content,content,`order` FROM sub_properties WHERE property_ref_id IN (?) ORDER BY `order`,id',[rows.map(r=>r.id)]);
 return rows.map(r=>{const marker=maps.find(m=>m.clave===`map:${r.id}`);const map=typeof marker?.contenido==='string'?JSON.parse(marker.contenido):marker?.contenido;const data={...r,mapMode:map?.mode||null,additionalInfo:info.filter(b=>Number(b.property_ref_id)===Number(r.id)).map(b=>({title:b.titulo_info,content:b.descripcion_info})),id:Number(r.id),photos:[...(r.image?[{id:0,image:r.image,caption:'Foto principal actual'}]:[]),...photos.filter(p=>Number(p.property_ref_id)===Number(r.id)).map(p=>({id:Number(p.id),image:p.image,caption:p.text_content||p.content||'Fotografía'}))]};return {...data,sourceRevision:hash(data)};});
}
export function validateLegacy(body){
 if(!body||body.kind!=='legacy'||!Number.isSafeInteger(body.portalId)||body.portalId<1||!Number.isSafeInteger(body.revision)||body.revision<1||typeof body.expectedSourceRevision!=='string'||!/^[a-f0-9]{64}$/.test(body.expectedSourceRevision)||!['published','suspended','withdrawn'].includes(body.status))throw Error('invalid');
 if(body.status!=='published')return;
 const s=body.snapshot;
 validatePropertyExtras(s);
 if(!s||typeof s.title!=='string'||!s.title.trim()||s.title.length>100||typeof s.description!=='string'||!s.description.trim()||s.description.length>8000||typeof s.location!=='string'||!s.location.trim()||s.location.length>250||typeof s.district!=='string'||!s.district.trim()||s.district.length>25||!['venta','alquiler'].includes(s.operation))throw Error('invalid');
 if(s.price!==null&&(!Number.isFinite(s.price)||s.price<=0||s.price>=1e12||!['PEN','USD'].includes(s.currency)))throw Error('invalid');
 if(s.price!==null&&!(s.operation==='alquiler'?s.priceBasis==='mensual':['total','por_unidad'].includes(s.priceBasis)))throw Error('invalid');
 for(const k of ['landArea','builtArea','bedrooms','bathrooms','garages'])if(s[k]!=null&&(!Number.isFinite(s[k])||s[k]<0||s[k]>=1e12||(['bedrooms','bathrooms','garages'].includes(k)&&(!Number.isInteger(s[k])||s[k]>1000))))throw Error('invalid');
 if(!Array.isArray(s.photos)||!s.photos.length||s.photos.length>100||s.photos.some(p=>!Number.isSafeInteger(p.id)||p.id<0||typeof p.caption!=='string'||p.caption.length>100)||new Set(s.photos.map(p=>p.id)).size!==s.photos.length||!s.photos.some(p=>p.id===s.coverPhotoId))throw Error('invalid');
}
export async function applyLegacy(db,body,origin){
 validateLegacy(body);await db.beginTransaction();
 try{
  const key=`legacy:${body.portalId}`,digest=hash(body);
  await db.query('INSERT IGNORE INTO portal_intranet_sync(clave,revision,contenido,body_hash) VALUES (?,0,?,?)',[key,'{}','']);
  const [[prior]]=await db.query('SELECT revision,body_hash FROM portal_intranet_sync WHERE clave=? FOR UPDATE',[key]);
  if(body.revision<prior.revision||(body.revision===prior.revision&&prior.body_hash!==digest))throw Error('stale');
  if(body.revision!==prior.revision){
   const [current]=await legacyListings(db,body.portalId,true);if(!current)throw Error('mapping');
   if(current.sourceRevision!==body.expectedSourceRevision)throw Error('stale');
   if(body.status==='published'){
    const s=body.snapshot,eligible=new Map(current.photos.map(p=>[p.id,p]));if(s.photos.some(p=>!eligible.has(p.id)))throw Error('invalid');
    const description=escape(s.description).replace(/\r?\n/g,'<br>');if(description.length>10000)throw Error('invalid');
    const fields={title:s.title,description,address:s.location,location:s.district,price:s.price??0,price_on_request:s.price===null?1:0,moneda:(s.currency==='PEN'?'S/':'US$')+(s.priceBasis==='por_unidad'?' c/u':''),currency_code:s.currency,price_basis:s.priceBasis==='por_unidad'?'per_unit':null,image:eligible.get(s.coverPhotoId).image,destacado:s.featured?1:0};
    // Keep legacy geography, coordinates and all fields not represented by the form.
    if(s.operation!==(current.status==='Alquiler'?'alquiler':'venta'))throw Error('invalid');
    for(const [k,column] of [['landArea','area'],['builtArea','area_c'],['bedrooms','bedrooms'],['bathrooms','bathrooms'],['garages','cocheras']])if(s[k]!=null)fields[column]=s[k];
    if(s.operation==='alquiler'){if(typeof s.rentalTerms!=='string'||s.rentalTerms.length>2000)throw Error('invalid');fields.distribution=escape(s.rentalTerms);}
    if(s.type){const [[type]]=await db.query('SELECT id FROM tipos WHERE nombre=?',[s.type]);if(!type)throw Error('invalid');fields.property_type_id=type.id;}
    await writePropertyExtras(db,body.portalId,s,fields);
    await db.query('UPDATE properties SET ? WHERE id=?',[fields,body.portalId]);
    // Resolve URLs on the server; the browser can only select current image IDs.
    await db.query('DELETE FROM sub_properties WHERE property_ref_id=? AND id NOT IN (?)',[body.portalId,[0,...s.photos.map(p=>p.id)]]);
    if(s.coverPhotoId!==0&&s.photos.some(p=>p.id===0)&&!s.photos.some(p=>p.id!==0&&eligible.get(p.id).image===current.image)){
     const photo=s.photos.find(p=>p.id===0);await db.query('INSERT INTO sub_properties(property_id,property_ref_id,content,text_content,image,`order`) VALUES(?,?,?,?,?,?)',[body.portalId,body.portalId,photo.caption.slice(0,50),photo.caption,current.image,s.photos.findIndex(p=>p.id===0)+1]);
    }
    for(const [index,p]of s.photos.entries())if(p.id!==0)await db.query('UPDATE sub_properties SET content=?,text_content=?,`order`=? WHERE id=? AND property_ref_id=?',[p.caption.slice(0,50),p.caption,index+1,p.id,body.portalId]);
   }
   await db.query('UPDATE publications SET publication_status=? WHERE property_id=?',[body.status,body.portalId]);
   await db.query('UPDATE portal_intranet_sync SET revision=?,contenido=?,body_hash=? WHERE clave=?',[body.revision,JSON.stringify(body),digest,key]);
  }
  await db.commit();return {portalId:body.portalId,portalUrl:`${origin}/propiedades/resumen/${body.portalId}`};
 }catch(e){await db.rollback();throw e;}
}
