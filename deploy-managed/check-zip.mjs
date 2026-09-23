// Validate ZIP paths without normalization and extract in PHP's Unix-style VFS.
import {PHP} from '@php-wasm/universal';
import {loadNodeRuntime} from '@php-wasm/node';
import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const directory=process.argv[2];
if(!directory)throw new Error('Usage: node deploy-managed/check-zip.mjs PACKAGE_DIRECTORY');
const php=new PHP(await loadNodeRuntime('8.2',{emscriptenOptions:{processId:process.pid}}));
try{
 for(const kind of ['plugin','theme']){
  php.writeFile('/tmp/package.zip',await readFile(join(resolve(directory),`art-alexis-${kind}.zip`)));
  const required=kind==='theme'?['style.css','index.php','functions.php','detail.php','assets/site.css','assets/site.js','assets/gasoek.ttf','assets/poppins.ttf','assets/poppins-500.ttf','assets/poppins-600.ttf','assets/poppins-700.ttf']:['art-alexis.php','includes/model.php','includes/admin.php','includes/import.php','includes/media.php','includes/preview.php'];
  if(kind==='theme')required.push(...['gasoek','poppins','poppins-500','poppins-600','poppins-700'].map(name=>'assets/'+name+'.woff2'));
  if(kind==='plugin')required.push('includes/bulk.php','assets/bulk.js','assets/bulk.css');
  const result=await php.run({code:`<?php
   $zip = new ZipArchive();
   if ($zip->open('/tmp/package.zip') !== true) throw new Exception('ZIP open failed');
   $target = '/tmp/${kind}'; mkdir($target);
   for($i=0; $i<$zip->numFiles; $i++) {
     $name=$zip->getNameIndex($i);
     if(str_contains($name, chr(92)) || str_contains($name, '..') || !str_starts_with($name, 'art-alexis/')) throw new Exception('Invalid raw path: '.$name);
   }
   if(!$zip->extractTo($target)) throw new Exception('Extraction failed');
   for($i=0; $i<$zip->numFiles; $i++) {
     $name=$zip->getNameIndex($i);
     if(!is_file($target.'/'.$name) || hash('sha256',file_get_contents($target.'/'.$name)) !== hash('sha256',$zip->getFromIndex($i))) throw new Exception('Extracted file mismatch: '.$name);
   }
   $required=json_decode('${JSON.stringify(required)}',true);
   foreach($required as $file) if(!is_file($target.'/art-alexis/'.$file)) throw new Exception('Missing extracted entry: '.$file);
   $header=file_get_contents($target.'/art-alexis/${kind==='theme'?'style.css':'art-alexis.php'}');
   if(!preg_match('/${kind==='theme'?'Theme':'Plugin'} Name:\\s*Art Alexis/', $header)) throw new Exception('Missing WordPress header');
   echo 'PASS ${kind}: PHP 8.2 ZIP extraction, file hashes, required files and WordPress header';
  `});
  if(result.exitCode!==0||!result.text.startsWith('PASS '))throw new Error(result.errors+' '+result.text);
  console.log(result.text);
 }
}finally{php.exit();}
