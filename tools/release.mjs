import './build.mjs';
import {mkdir,readdir,readFile,copyFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
const destination=resolve('dist/release-'+new Date().toISOString().replace(/[:.]/g,'-'));
const allowed=/\.(php|css|js|txt|ttf|woff2?|svg)$/i;const manifest=[];
async function copy(source,relative){await mkdir(join(destination,relative),{recursive:true});for(const e of await readdir(source,{withFileTypes:true})){
 if(e.name==='seed'||e.name==='uploads')continue;
 if(e.isSymbolicLink())throw new Error('Symlink not permitted: '+e.name);
 const from=join(source,e.name),to=join(relative,e.name);
 if(e.isDirectory())await copy(from,to);
 else if(allowed.test(e.name)){const bytes=await readFile(from);await copyFile(from,join(destination,to));manifest.push({path:to.replaceAll('\\','/'),sha256:createHash('sha256').update(bytes).digest('hex')});}
 else throw new Error('Unexpected release file: '+from);
}}
await copy('wordpress/plugins/art-alexis','plugins/art-alexis');await copy('wordpress/themes/art-alexis','themes/art-alexis');
await writeFile(join(destination,'manifest.json'),JSON.stringify(manifest,null,2));console.log('Private-image-free release: '+destination);
