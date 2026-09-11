import {readFile,writeFile} from 'node:fs/promises';
const env=Object.fromEntries((await readFile('work/docker.env','utf8')).trim().split(/\r?\n/).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1)];}));
await writeFile('work/docker-login.json',JSON.stringify({note:'仅用于本机 Docker 测试；不要公开或用于生产',site:'http://127.0.0.1:9401/',backend:'http://127.0.0.1:9401/wp-admin/',editor:{username:'alexis',password:env.AA_EDITOR_PASSWORD},admin:{username:'admin',password:env.AA_ADMIN_PASSWORD}},null,2));
console.log('Local login information saved to work/docker-login.json.');
