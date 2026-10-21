import test from 'node:test';
import assert from 'node:assert/strict';
import {syncAuthorized,validateSync,createIntranetSyncHandler} from '../server/intranet-sync.mjs';
import {safeImageUrl} from '../server/share-render.js';
const secret='x'.repeat(64);
test('La escritura exige un secreto de servidor y no acepta credenciales Unicode de longitud diferente',()=>{
 assert.equal(syncAuthorized({headers:{authorization:`Bearer ${secret}`}},secret),true);
 for(const value of ['',`Bearer ${'a'.repeat(64)}`,`Bearer ${'é'.repeat(64)}`])assert.equal(syncAuthorized({headers:{authorization:value}},secret),false);
});
test('Un POST sin autorización no toca MySQL',async()=>{
 let touched=false;const handler=createIntranetSyncHandler({pool:{getConnection(){touched=true;throw Error();}},secret});const response={setHeader(){},status(n){this.code=n;return this;},json(){return this;}};
 await handler({method:'POST',headers:{},body:{}},response);assert.equal(response.code,401);assert.equal(touched,false);
});
test('La portada rechaza destinos externos y fotografías no autorizadas',()=>{
 const item={imageId:'12345678-abcd-abcd-abcd-123456789abc',title:'Una portada',enabled:true,authorized:true,href:'/propiedades',buttonLabel:'Ver'};
 assert.doesNotThrow(()=>validateSync({kind:'banners',revision:1,items:[item]}));
 assert.throws(()=>validateSync({kind:'banners',revision:1,items:[{...item,href:'//externo.invalid'}]}));
 assert.throws(()=>validateSync({kind:'banners',revision:1,items:[{...item,authorized:false}]}));
});
test('Las tarjetas sociales solo admiten la ruta de foto autorizada del propio portal',()=>{
 assert.ok(safeImageUrl('/api/intranet-sync?media=photo&property=1&id=2'));
 assert.equal(safeImageUrl('https://otro.invalid/api/intranet-sync?media=photo&property=1&id=2'),null);
 assert.equal(safeImageUrl('/api/intranet-sync?media=banner&id=2'),null);
 assert.equal(safeImageUrl('http://127.0.0.1/private'),null);
});
