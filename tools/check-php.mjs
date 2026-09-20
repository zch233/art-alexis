import {PHP} from '@php-wasm/universal';
import {loadNodeRuntime} from '@php-wasm/node';
import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
async function files(dir){const result=[];for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isDirectory())result.push(...await files(path));else if(path.endsWith('.php'))result.push(path);}return result;}
const version=process.argv[2] || '8.3';
if(!['8.2','8.3'].includes(version))throw new Error('Supported checks: 8.2, 8.3');
const php=new PHP(await loadNodeRuntime(version,{emscriptenOptions:{processId:process.pid}}));
try{let count=0;for(const file of await files('wordpress')){
 const source=(await readFile(file)).toString('base64');
 const result=await php.run({code:`<?php try { token_get_all(base64_decode('${source}'), TOKEN_PARSE); echo 'OK'; } catch (ParseError $e) { echo $e->getMessage(); }`});
 if(result.text!=='OK')throw new Error(file+': '+result.text);
 count++;console.log('PASS '+file);
}console.log(`${count} PHP files parsed successfully (PHP ${version}).`);}finally{php.exit();}
