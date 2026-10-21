import {pool} from './db.js';
import {createIntranetSyncHandler} from '../server/intranet-sync.mjs';
export default createIntranetSyncHandler({pool,secret:process.env.INTRANET_WEB_SYNC_TOKEN,bridgeUrl:process.env.INTRANET_WEB_BRIDGE_URL,origin:'https://app-alfaro-git-smoky.vercel.app'});
