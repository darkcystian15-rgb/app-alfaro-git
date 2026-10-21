import {createHash,timingSafeEqual} from 'node:crypto';
const knownTypes=['Casa','Departamento','Terreno','Oficina','Local Comercial','Terreno Comercial','Hotel'];
export function canonicalSyncJson(value){if(Array.isArray(value))return '['+value.map(canonicalSyncJson).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonicalSyncJson(value[key])).join(',')+'}';return JSON.stringify(value);}
export function syncAuthorized(request,secret){const actual=Buffer.from(request.headers.authorization||''),expected=Buffer.from(`Bearer ${secret||''}`);return Boolean(secret&&secret.length>=32&&actual.length===expected.length&&timingSafeEqual(actual,expected));}
const positive=value=>Number.isFinite(Number(value))&&Number(value)>0;
export function validateSync(body){
 if(!body||!Number.isSafeInteger(body.revision)||body.revision<1)throw new Error('invalid');
 if(body.kind==='banners'){
  if(!Array.isArray(body.items)||!body.items.length||body.items.length>10)throw new Error('invalid');
  for(const b of body.items)if(!b.authorized||!b.enabled||!/^[a-f0-9-]{36}$/.test(b.imageId)||typeof b.title!=='string'||!b.title||b.title.length>120||((b.href||b.buttonLabel)&&(!b.buttonLabel||!/^\/(?:propiedades(?:\/resumen\/[1-9]\d*)?|contacto|vende-o-alquila)?(?:\?[^\\\s#]*)?$/.test(b.href))))throw new Error('invalid');
  return;
 }
 if(body.kind!=='property'||!Number.isSafeInteger(body.sourceId)||body.sourceId<1||!['published','suspended','withdrawn'].includes(body.status))throw new Error('invalid');
 const s=body.snapshot;
 if(body.status!=='published')return;
 if(!s||s.sourceId!==body.sourceId||typeof s.title!=='string'||s.title.length<10||s.title.length>100||typeof s.description!=='string'||s.description.length<40||s.description.length>8000||typeof s.location!=='string'||!s.location||s.location.length>250||typeof s.district!=='string'||!s.district||s.district.length>25||!knownTypes.includes(s.type)||!['venta','alquiler'].includes(s.operation))throw new Error('invalid');
 if(s.price!==null&&(!positive(s.price)||!['PEN','USD'].includes(s.currency)))throw new Error('invalid');
 if(!Array.isArray(s.photos)||!s.photos.length||s.photos.length>100||s.photos.some(p=>!Number.isSafeInteger(p.id)||p.id<1||typeof p.caption!=='string'||p.caption.length>100)||!s.photos.some(p=>p.id===s.coverPhotoId)||new Set(s.photos.map(p=>p.id)).size!==s.photos.length)throw new Error('invalid');
}
const escaped=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const syncMediaUrl=(source,id,kind='photo')=>kind==='photo'?`/api/intranet-sync?media=photo&property=${source}&id=${id}`:`/api/intranet-sync?media=banner&id=${encodeURIComponent(id)}`;
export async function applySync(db,body,origin){
 validateSync(body);const hash=createHash('sha256').update(canonicalSyncJson(body)).digest('hex');
 await db.beginTransaction();
 try{
  const key=body.kind==='banners'?'home':`property:${body.sourceId}`;
  await db.query('INSERT IGNORE INTO portal_intranet_sync(clave,revision,contenido,body_hash) VALUES (?,0,?,?)',[key,'{}','']);
  const [[old]]=await db.query('SELECT * FROM portal_intranet_sync WHERE clave=? FOR UPDATE',[key]);
  if(body.revision<old.revision||(body.revision===old.revision&&old.body_hash!==hash))throw new Error('stale');
  if(body.revision===old.revision){await db.commit();return old.property_id?{portalId:old.property_id,portalUrl:`${origin}/propiedades/resumen/${old.property_id}`}:{ok:true};}
  let id=old.property_id;
  if(body.kind==='property'){
   if(body.status==='published'){
    const s=body.snapshot;const description=escaped(s.description).replace(/\r?\n/g,'<br>');if(description.length>10000)throw new Error('invalid');
    if(!id&&s.existingPortalId!=null){
     if(!Number.isSafeInteger(s.existingPortalId)||s.existingPortalId<1)throw new Error('invalid');
     const [[existing]]=await db.query("SELECT p.id FROM properties p JOIN publications pub ON pub.property_id=p.id WHERE p.id=? AND pub.source_system='legacy_portal' FOR UPDATE",[s.existingPortalId]);
     if(!existing)throw new Error('mapping');const [linked]=await db.query('SELECT clave FROM portal_intranet_sync WHERE property_id=?',[s.existingPortalId]);if(linked.length)throw new Error('mapping');id=existing.id;
    }
    const [[type]]=await db.query('SELECT id FROM tipos WHERE LOWER(nombre)=LOWER(?)',[s.type]);
    const [[mode]]=await db.query('SELECT id FROM modalidades WHERE LOWER(nombre)=LOWER(?)',[s.operation==='alquiler'?'Alquiler':'Venta']);
    if(!type||!mode)throw new Error('catalog');
    const districts=await db.query('SELECT id FROM distritos WHERE LOWER(nombre)=LOWER(?)',[s.district]);
    // No inventar geografía administrativa: la etiqueta pública se conserva incluso si no hay ID único.
    const district=districts[0].length===1?districts[0][0].id:null;
    const fields={title:s.title,image:syncMediaUrl(body.sourceId,s.coverPhotoId),price:s.price??0,price_on_request:s.price===null?1:0,moneda:(s.currency==='PEN'?'S/':'US$')+(s.priceBasis==='por_unidad'?' c/u':''),currency_code:s.currency,price_basis:s.priceBasis==='por_unidad'?'per_unit':null,address:s.location,location:s.district,status:s.operation==='alquiler'?'Alquiler':'Venta',bedrooms:s.bedrooms??0,bathrooms:s.bathrooms??0,cocheras:s.garages??0,area:s.landArea??0,area_c:s.builtArea??0,description,distribution:escaped(s.rentalTerms||''),latitude:0,longitude:0,destacado:s.featured?1:0,property_type_id:type.id,modality_id:mode.id,district_id:district};
    if(id)await db.query('UPDATE properties SET ? WHERE id=?',[fields,id]);else{const [created]=await db.query('INSERT INTO properties SET ?',[fields]);id=created.insertId;}
    await db.query("INSERT INTO publications(property_id,publication_status,approved_at,source_system,internal_reference) VALUES (?,'published',UTC_TIMESTAMP(),'alfaro_intranet',?) ON DUPLICATE KEY UPDATE publication_status='published',approved_at=UTC_TIMESTAMP(),source_system='alfaro_intranet',internal_reference=VALUES(internal_reference)",[id,String(body.sourceId)]);
    await db.query('DELETE FROM sub_properties WHERE property_ref_id=?',[id]);
    for(const [index,photo] of s.photos.entries())await db.query('INSERT INTO sub_properties(property_id,property_ref_id,content,text_content,image,`order`) VALUES(?,?,?,?,?,?)',[id,id,photo.caption.slice(0,50),photo.caption,syncMediaUrl(body.sourceId,photo.id),index+1]);
   }else{
    if(!id)throw new Error('missing');await db.query('UPDATE publications SET publication_status=? WHERE property_id=?',[body.status,id]);
   }
  }
  await db.query('UPDATE portal_intranet_sync SET revision=?,contenido=?,body_hash=?,property_id=? WHERE clave=?',[body.revision,JSON.stringify(body),hash,id||null,key]);
  await db.commit();return id?{portalId:id,portalUrl:`${origin}/propiedades/resumen/${id}`}:{ok:true};
 }catch(error){await db.rollback();throw error;}
}

export function createIntranetSyncHandler({pool,secret,bridgeUrl,origin,fetcher=fetch}){return async function(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method==='POST'){
  if(!syncAuthorized(req,secret))return res.status(401).json({error:'No autorizado'});
  let db;try{const body=typeof req.body==='string'?JSON.parse(req.body):req.body;if(JSON.stringify(body).length>150000)return res.status(413).json({error:'Solicitud demasiado grande'});validateSync(body);db=await pool.getConnection();return res.status(200).json(await applySync(db,body,origin));}catch(error){return res.status(error.message==='stale'?409:400).json({error:'No se pudo aceptar la publicación. Revisa su versión y condiciones.'});}finally{db?.release();}
 }
 if(!['GET','HEAD'].includes(req.method))return res.status(405).json({error:'Método no permitido'});
 try{
  if(req.query.content==='home'){
   const [[row]]=await pool.query("SELECT contenido FROM portal_intranet_sync WHERE clave='home'");
   const data=typeof row?.contenido==='string'?JSON.parse(row.contenido):row?.contenido;
   return res.status(200).json({banners:(data?.items||[]).filter(b=>b.enabled).map(b=>({image:syncMediaUrl(null,b.imageId,'banner'),label:b.title,subtitle:b.subtitle,buttonLabel:b.buttonLabel,href:b.href,position:b.position}))});
  }
  let params;
  if(req.query.media==='photo'){
   const source=Number(req.query.property),id=Number(req.query.id);if(!Number.isSafeInteger(source)||source<1||!Number.isSafeInteger(id)||id<1)return res.status(404).end();
   const [[row]]=await pool.query("SELECT s.contenido FROM portal_intranet_sync s JOIN public_properties p ON p.id=s.property_id WHERE s.clave=?",[`property:${source}`]);
   const data=typeof row?.contenido==='string'?JSON.parse(row.contenido):row?.contenido;
   if(data?.status!=='published'||!data.snapshot.photos.some(p=>p.id===id))return res.status(404).end();params={kind:'photo',property:String(source),id:String(id)};
  }else if(req.query.media==='banner'){
   const id=String(req.query.id||'');if(!/^[a-f0-9-]{36}$/.test(id))return res.status(404).end();
   const [[row]]=await pool.query("SELECT contenido FROM portal_intranet_sync WHERE clave='home'");const data=typeof row?.contenido==='string'?JSON.parse(row.contenido):row?.contenido;
   if(!data?.items.some(b=>b.enabled&&b.imageId===id))return res.status(404).end();params={kind:'banner',id};
  }else return res.status(404).end();
  const url=new URL(bridgeUrl);if(url.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(url.hostname))throw new Error('bridge');for(const [k,v]of Object.entries(params))url.searchParams.set(k,v);
  const image=await fetcher(url,{headers:{Authorization:`Bearer ${secret}`},redirect:'error',cache:'no-store',signal:AbortSignal.timeout(20000)});
  const mime=image.headers.get('content-type')?.split(';')[0];if(!image.ok||!['image/webp','image/jpeg','image/png'].includes(mime))return res.status(404).end();
  const bytes=Buffer.from(await image.arrayBuffer());if(bytes.length>4*1024*1024)throw new Error('size');res.setHeader('Content-Type',mime);res.setHeader('X-Content-Type-Options','nosniff');return req.method==='HEAD'?res.status(200).end():res.status(200).send(bytes);
 }catch{return res.status(503).json({error:'Contenido temporalmente no disponible'});}
};}
