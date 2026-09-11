// Local validation assets only; not production nginx installation.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
await mkdir('work/nginx-cert',{recursive:true});
for(const mode of ['http','https']){
 let source=await readFile(`deploy/nginx/site-${mode}.conf.template`,'utf8');
 source=source.replaceAll('__DOMAIN__','127.0.0.1').replaceAll('__PORT__','80').replaceAll('listen 80;','listen 8080;').replaceAll('listen 443 ssl;','listen 8443 ssl;').replaceAll('https://127.0.0.1$request_uri','https://127.0.0.1:9445$request_uri');
 await writeFile(`work/nginx-${mode}.conf`,source);
}
