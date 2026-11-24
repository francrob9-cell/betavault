import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {seed,applyAction} from './engine.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.pdf':'application/pdf'};
export function createServer(){
  let state=seed();
  return http.createServer(async(req,res)=>{
    const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
    try{
      const url=new URL(req.url,'http://localhost');
      if(url.pathname==='/api/state'&&req.method==='GET')return json(200,state);
      if(url.pathname==='/api/actions'&&req.method==='POST'){
        // Prevent browser-driven cross-origin writes. Local demonstration only.
        if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)return json(403,{error:'Cross-origin writes are not accepted.'});
        if(!req.headers['content-type']?.startsWith('application/json'))return json(415,{error:'Use application/json.'});
        let body='';for await(const chunk of req){body+=chunk;if(body.length>16384)return json(413,{error:'Payload too large.'});}
        let input;try{input=JSON.parse(body);}catch{return json(400,{error:'Invalid JSON.'});}
        if(!input?.action||!input?.role)return json(400,{error:'action and role are required.'});
        try{const result=applyAction(state,input.action,input.role);state=result.state;return json(200,result);}catch(e){return json(422,{error:e.message});}
      }
      if(url.pathname.startsWith('/api/'))return json(404,{error:'Endpoint not found.'});
      if(req.method!=='GET'&&req.method!=='HEAD')return json(405,{error:'Method not allowed.'});
      const name=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));
      const target=path.resolve(root,name);
      if(!target.startsWith(root+path.sep)||name.split(/[\\/]/).some(x=>x.startsWith('.'))||!types[path.extname(target)])return json(404,{error:'Not found.'});
      const bytes=await readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)],'X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:bytes);
    }catch(e){json(e.code==='ENOENT'?404:400,{error:'Unable to serve request.'});}
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.SCM_DEMO_PORT||4178);createServer().listen(port,'127.0.0.1',()=>console.log(`Supply Chain Operations Studio: http://127.0.0.1:${port}`));
}
