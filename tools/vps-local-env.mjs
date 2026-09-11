import {readFile,readdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const releases=(await readdir('dist')).filter(n=>n.startsWith('release-')).sort();if(!releases.length)throw new Error('Run npm run release first');
let config=await readFile('deploy/.env.example','utf8');
const values={COMPOSE_PROJECT_NAME:'art-alexis-vps-check',SITE_URL:'http://127.0.0.1:9402',ADMIN_LOGIN:'siteadmin',ADMIN_EMAIL:'admin@localhost.test',EDITOR_EMAIL:'editor@localhost.test',RELEASE_DIR:resolve('dist',releases.at(-1)).replaceAll('\\','/'),BACKEND_PORT:'19402',WORDPRESS_IMAGE:'wordpress:php8.3-apache'};
for(const [key,value]of Object.entries(values))config=config.replace(new RegExp('^'+key+'=.*$','m'),key+'='+value);
await writeFile('deploy/.env',config,{flag:'wx'});console.log('Created local-only production-config test at port 9402. Not production credentials/config.');
