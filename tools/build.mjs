import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
const dest='wordpress/themes/art-alexis/assets';await mkdir(dest,{recursive:true});
await build({entryPoints:['src/site.js'],bundle:true,minify:true,target:['es2020'],outfile:dest+'/site.js',legalComments:'linked',external:['*.ttf','*.woff2?v=1.2.1']});
// Source-parity styles are bundled directly. Do not prepend the obsolete preview.
for(const name of ['gasoek.ttf','poppins.ttf'])await copyFile('preview/assets/'+name,dest+'/'+name);
console.log('Local theme assets built.');
