import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePublicationChange,changePublication} from '../scripts/publication-workflow.mjs';
import {explicitType} from '../scripts/reconcile-phase3.mjs';

const base={id:4,expected:'pending_review',status:'published',actor:'Administrador',reason:'Datos y fotografías revisados',confirmPublicData:true};
test('La publicación exige identificación, motivo, ID y confirmación explícita',()=>{
  assert.doesNotThrow(()=>validatePublicationChange(base));
  for(const patch of [{id:0},{id:NaN},{status:'active'},{actor:''},{reason:''},{confirmPublicData:false},{expected:'published'}]) {
    assert.throws(()=>validatePublicationChange({...base,...patch}));
  }
});
test('Rechaza un estado cambiado concurrentemente y revierte sin escribir',async()=>{
  const calls=[];
  const db={beginTransaction:async()=>calls.push('begin'),query:async()=>[[{publication_status:'withdrawn'}]],rollback:async()=>calls.push('rollback')};
  await assert.rejects(changePublication(db,base),/Estado modificado/);
  assert.deepEqual(calls,['begin','rollback']);
});
test('Un fallo del registro de auditoría revierte el cambio de publicación',async()=>{
  const calls=[];
  const db={beginTransaction:async()=>calls.push('begin'),query:async sql=>{
    if(sql.startsWith('SELECT')) return [[{publication_status:'pending_review'}]];
    if(sql.startsWith('UPDATE')) {calls.push('update');return [];}
    throw new Error('audit unavailable');
  },commit:async()=>calls.push('commit'),rollback:async()=>calls.push('rollback')};
  await assert.rejects(changePublication(db,base),/audit unavailable/);
  assert.deepEqual(calls,['begin','update','rollback']);
});
test('No convierte usos mixtos ni inversiones futuras en categorías actuales',()=>{
  const catalog=['Casa','Departamento','Terreno','Oficina','Local Comercial','Terreno Comercial','Hotel'].map((nombre,i)=>({id:i+1,nombre}));
  for(const title of ['SE VENDE LOCAL PARA PROYECTO DE HOTEL','SE VENDE TERRENO INDUSTRIAL','SE VENDE CASA COMO TERRENO','SE ALQUILA OFICINAS - DEPARTAMENTO','SE VENDE LOCAL COMERCIO - VIVIENDA','SE ALQUILA EDIFICIO PARA EMPRESAS']) assert.equal(explicitType(title,catalog),null,title);
  assert.equal(explicitType('SE VENDE TERRENO COMERCIAL',catalog),6);
  assert.equal(explicitType('SE ALQUILAN OFICINAS COMERCIALES',catalog),4);
  assert.equal(explicitType('SE VENDE CASA LOS PINOS',catalog),1);
  assert.equal(explicitType('SE VENDE TERRENO',catalog),3);
});
