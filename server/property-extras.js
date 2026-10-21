import {publicSettingsProblems,escapePublicText,validCoordinates} from './public-settings.js';
export function validatePropertyExtras(snapshot){if(publicSettingsProblems(snapshot).length)throw Error('invalid');}
export async function readMapMode(db,id){const [[row]]=await db.query('SELECT contenido FROM portal_intranet_sync WHERE clave=?',[`map:${id}`]);const value=typeof row?.contenido==='string'?JSON.parse(row.contenido):row?.contenido;return ['none','exact','approximate'].includes(value?.mode)?value.mode:null;}
export async function writePropertyExtras(db,id,snapshot,fields){
 validatePropertyExtras(snapshot);const map=snapshot.map;
 if(map&&map.mode!=='preserve'){
  const approximate=map.mode==='approximate';
  fields.latitude=map.mode==='none'?0:approximate?Number(Number(map.latitude).toFixed(2)):Number(map.latitude);
  fields.longitude=map.mode==='none'?0:approximate?Number(Number(map.longitude).toFixed(2)):Number(map.longitude);
  await db.query('INSERT INTO portal_intranet_sync(clave,revision,contenido,body_hash) VALUES(?,1,?,?) ON DUPLICATE KEY UPDATE revision=revision+1,contenido=VALUES(contenido)',[`map:${id}`,JSON.stringify({mode:map.mode}), '']);
 }
 if(snapshot.additionalInfoMode==='replace'){
  await db.query('DELETE FROM mas_info WHERE property_ref_id=?',[id]);
  for(const block of snapshot.additionalInfo)await db.query('INSERT INTO mas_info(titulo_info,descripcion_info,id_properties,property_ref_id) VALUES(?,?,?,?)',[block.title,escapePublicText(block.content),id,id]);
 }
}
export function publicMapFields(property,mode){
 if(mode==='none'||!validCoordinates(property.latitude,property.longitude))return {latitude:null,longitude:null,map_mode:'none'};
 if(mode==='approximate')return {latitude:Number(Number(property.latitude).toFixed(2)),longitude:Number(Number(property.longitude).toFixed(2)),map_mode:'approximate'};
 return {latitude:Number(property.latitude),longitude:Number(property.longitude),map_mode:'exact'};
}
