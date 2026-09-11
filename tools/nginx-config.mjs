import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const [domain,rawPort='8080']=process.argv.slice(2);
if(!domain || domain.length>253 || !domain.split('.').every(label=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)))throw new Error('Supply a DNS hostname (ASCII/punycode), localhost or IPv4; no scheme, port or paths.');
const port=Number(rawPort);if(!/^\d+$/.test(rawPort)||port<1024||port>65535)throw new Error('Backend port must be 1024..65535');
const dest=resolve('dist/nginx-'+new Date().toISOString().replace(/[:.]/g,'-'));await mkdir(dest,{recursive:true});
for(const mode of ['http','https']){const template=await readFile(`deploy/nginx/site-${mode}.conf.template`,'utf8');await writeFile(`${dest}/art-alexis-${mode}.conf`,template.replaceAll('__DOMAIN__',domain.toLowerCase()).replaceAll('__PORT__',String(port)),{flag:'wx'});}
console.log('Nginx configs generated (nothing installed): '+dest);
