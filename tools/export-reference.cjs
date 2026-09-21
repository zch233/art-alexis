// Read-only local preview of the client export. Never exposes the workspace.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(process.argv[2]||'D:/Users/gupo/Downloads/site-package');
const mime={'.html':'text/html; charset=utf-8','.jpg':'image/jpeg','.svg':'image/svg+xml','.png':'image/png','.css':'text/css'};
http.createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(404).end();}
}).listen(9402,'127.0.0.1',()=>console.log('Read-only source reference: http://127.0.0.1:9402'));
