import {mkdir,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
await mkdir('deploy/secrets',{recursive:true,mode:0o700});
for(const name of ['db-password','db-root-password','admin-password','editor-password']){
 try {await writeFile(`deploy/secrets/${name}.txt`,randomBytes(24).toString('base64url')+'\n',{flag:'wx',mode:0o444});console.log('Created '+name);}
 catch(e){if(e.code!=='EEXIST')throw e;console.log('Preserved '+name);}
}
// Files must be readable by container uid 33; the host directory is owner-only.
console.log('Keep deploy/secrets private and back it up securely. No existing secrets were changed.');
