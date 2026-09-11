import { build } from 'esbuild';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
const dest='wordpress/themes/art-alexis/assets';await mkdir(dest,{recursive:true});
await build({entryPoints:['src/site.js'],bundle:true,minify:true,target:['es2020'],outfile:dest+'/site.js',legalComments:'linked'});
const approved=await readFile('preview/site.css','utf8');const generated=await readFile(dest+'/site.css','utf8');
await writeFile(dest+'/site.css',approved.replaceAll("assets/gasoek.ttf","gasoek.ttf").replaceAll("assets/poppins.ttf","poppins.ttf")+'\n'+generated);
for(const name of ['gasoek.ttf','poppins.ttf'])await copyFile('preview/assets/'+name,dest+'/'+name);
console.log('Local theme assets built.');
