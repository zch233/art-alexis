import {mkdir,writeFile,access} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
await mkdir('work',{recursive:true});
try{await access('work/docker.env');console.log('Existing Docker credentials preserved.');process.exit(0);}catch{}
const secret=()=>randomBytes(18).toString('base64url');const password=secret(),db=secret();
await writeFile('work/docker.env',[
 'MYSQL_DATABASE=art_alexis','MYSQL_USER=alexis','MYSQL_PASSWORD='+db,'MYSQL_ROOT_PASSWORD='+secret(),
 'WORDPRESS_DB_HOST=db:3306','WORDPRESS_DB_NAME=art_alexis','WORDPRESS_DB_USER=alexis','WORDPRESS_DB_PASSWORD='+db,
 'AA_ADMIN_PASSWORD='+password,'AA_EDITOR_PASSWORD='+secret()
].join('\n')+'\n',{flag:'wx'});
console.log('Docker credentials generated in ignored work/docker.env.');
