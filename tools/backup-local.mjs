// Explicit local content export. No production config, credentials or code are copied.
import {execFileSync,spawnSync} from 'node:child_process';
import {openSync,closeSync} from 'node:fs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const compose=['compose','-f','compose.yaml'];
const run=(args)=>execFileSync('docker',[...compose,...args],{encoding:'utf8',maxBuffer:8*1024*1024});
const id=run(['ps','-q','wordpress']).trim();if(!id)throw new Error('Local wordpress must be running.');
const inspect=JSON.parse(execFileSync('docker',['inspect',id],{encoding:'utf8'}))[0];if(!inspect.State.Running)throw new Error('Local site is not running.');
const volume=inspect.Mounts.find(m=>m.Destination==='/var/www/html'&&m.Type==='volume')?.Name;
if(!volume||!/^[-a-zA-Z0-9_]+$/.test(volume))throw new Error('Expected named site volume.');
const source=run(['run','--rm','--no-deps','cli','option','get','home']).trim();const url=new URL(source);if(!['http:','https:'].includes(url.protocol))throw new Error('Invalid source URL');
const version=run(['run','--rm','--no-deps','cli','core','version']).trim();
const prefix=run(['run','--rm','--no-deps','cli','config','get','table_prefix','--type=variable']).trim();if(prefix!=='wp_')throw new Error('This migration path requires wp_ tables; use an explicit migration for custom prefixes.');
const dest=resolve('deploy/backups/local-content-'+new Date().toISOString().replace(/[:.]/g,'-'));await mkdir(dest,{recursive:true,mode:0o700});
try{
 run(['stop','wordpress']);
 const fd=openSync(dest+'/database.sql','wx',0o600);
 try{const result=spawnSync('docker',[...compose,'exec','-T','db','sh','-c','MYSQL_PWD="$MYSQL_PASSWORD" exec mysqldump -u"$MYSQL_USER" --single-transaction --quick --no-tablespaces --set-gtid-purged=OFF "$MYSQL_DATABASE"'],{stdio:['ignore',fd,'pipe']});if(result.status!==0)throw new Error('Database export failed; incomplete directory retained.');}finally{closeSync(fd);}
 execFileSync('docker',['run','--rm','--user','0:0','--entrypoint','sh','-v',volume+':/site:ro','-v',dest+':/backup','wordpress:cli-php8.3','-c','set -eu; set --; for d in uploads languages; do if [ -d "/site/wp-content/$d" ]; then set -- "$@" "$d"; fi; done; test "$#" -gt 0; tar -czf /backup/media.tar.gz -C /site/wp-content "$@"'],{stdio:'inherit'});
 await writeFile(dest+'/source-url.txt',source+'\n');await writeFile(dest+'/format.txt','art-alexis-content-v1\n');
 await writeFile(dest+'/metadata.json',JSON.stringify({format:'art-alexis-content-v1',wordpress:version,tablePrefix:prefix,sourceUrl:source,createdAt:new Date().toISOString(),contains:'Database and uploads/languages only; no wp-config, code or DB connection passwords. WP user password hashes are sensitive.'},null,2));
 let manifest='';for(const file of ['database.sql','media.tar.gz','source-url.txt','format.txt','metadata.json'])manifest+=createHash('sha256').update(await readFile(dest+'/'+file)).digest('hex')+'  '+file+'\n';
 await writeFile(dest+'/SHA256SUMS',manifest);await writeFile(dest+'/COMPLETE','Private content export. Restore only with deploy/import-content.sh.\n');console.log('Private migration backup: '+dest);
}finally{run(['start','wordpress']);}
