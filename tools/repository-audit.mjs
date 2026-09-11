import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdir,readFile,cp} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const root=process.cwd(),audit=resolve('work/git-audit');await mkdir(audit,{recursive:true});
execFileSync('git',['init','--quiet',audit]);
let args=['--git-dir='+join(audit,'.git'),'--work-tree='+root];
try{const top=execFileSync('git',['rev-parse','--show-toplevel'],{cwd:root,stdio:['ignore','pipe','ignore']}).toString().trim();if(resolve(top)===root)args=[];}catch{}
const files=[...new Set(execFileSync('git',[...args,'ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root}).toString().split('\0').filter(file=>file&&existsSync(file)))];
const forbidden=/\.(jpe?g|png|webp|gif|avif|psd|sql|sqlite3?|zip|tar|gz|bak|pem|key|p12|pfx)$/i;
for(const file of files){if(forbidden.test(file)||/(^|\/)(work|secrets|backups|uploads|seed|reference)\//.test(file)||(/(^|\/)\.env($|\.)/.test(file)&&!file.endsWith('.example')))throw new Error('Private file is a Git candidate: '+file);}
const secrets=await import('node:fs/promises').then(fs=>fs.readdir('deploy/secrets').catch(()=>[]));
for(const name of secrets){const value=(await readFile('deploy/secrets/'+name,'utf8')).trim();if(value.length<16)continue;for(const file of files){if(/\.(ttf|woff2?)$/.test(file))continue;if((await readFile(file,'utf8')).includes(value))throw new Error('Secret leaked into '+file);}}
const exportDir=resolve('work/code-only-'+Date.now());await mkdir(exportDir);
for(const file of files){const dest=join(exportDir,file);await mkdir(join(dest,'..'),{recursive:true});await cp(file,dest);}
// Reuse dependencies only for the isolated build; no source assets are supplied.
await import('node:fs/promises').then(fs=>fs.symlink(resolve('node_modules'),join(exportDir,'node_modules'),'junction'));
execFileSync(process.execPath,['tools/release.mjs'],{cwd:exportDir,stdio:'inherit'});
console.log(JSON.stringify({passed:true,gitCandidates:files.length,privateImages:0,secrets:0,codeOnlyBuild:true,exportDir}));
