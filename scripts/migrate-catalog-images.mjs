import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import sharp from "sharp";
const root = new URL("../", import.meta.url);
const snapshotPath = new URL("data/catalog-snapshot.json", root);
const sourcesPath = new URL("data/catalog-image-sources.json", root);
const progressPath = new URL(".image-migration-progress.json", root);
const products = JSON.parse(await readFile(snapshotPath, "utf8"));
let sources;
try { sources = JSON.parse(await readFile(sourcesPath,"utf8")); }
catch { sources = Object.fromEntries(products.map(p=>[p.id,p.image_url])); await writeFile(sourcesPath,JSON.stringify(sources,null,2)+"\n"); }
const env = await readFile(new URL(".env.images-migration",root),"utf8");
const token = env.match(/IMAGE_MIGRATION_TOKEN=(.+)/)[1].trim();
const endpoint = "https://qkhwtksyxvwozfyzhyfr.supabase.co/functions/v1/catalog-images-import";
async function call(body) {
 const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json","x-migration-token":token},body:JSON.stringify(body),signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw new Error("Upload HTTP "+response.status);
 return response.json();
}
await call({action:"init"});
await mkdir(new URL("public/catalog/photos/",root),{recursive:true});
let progress={};try{progress=JSON.parse(await readFile(progressPath,"utf8"));}catch{}
let cursor=0,completed=0;const failed=[];
async function worker(){
 while(cursor<products.length){
  const p=products[cursor++];const path=new URL("public/catalog/photos/"+p.id+".webp",root);
  if(progress[p.id]){try{await access(path);completed++;continue;}catch{}}
  let done=false;
  for(let attempt=0;attempt<3&&!done;attempt++)try{
   let bytes;try{bytes=await readFile(path);}catch{
    const source=new URL(sources[p.id]);
    if(!["www.infinitypiercing.com.br","cdn.shopify.com"].includes(source.hostname))throw new Error("Unexpected source host");
    source.searchParams.set("width","900");
    let response=await fetch(source,{signal:AbortSignal.timeout(30000)});
    if(!response.ok) response=await fetch(sources[p.id],{signal:AbortSignal.timeout(30000)});
    if(!response.ok||!response.headers.get("content-type")?.startsWith("image/"))throw new Error("Download HTTP "+response.status);
    const original=Buffer.from(await response.arrayBuffer());
    bytes=await sharp(original).rotate().resize({width:900,height:900,fit:"inside",withoutEnlargement:true}).webp({quality:82}).toBuffer();
    if(bytes.length>1048576)throw new Error("Image exceeds limit");
    await writeFile(path,bytes);
   }
   const result=await call({id:p.id,base64:bytes.toString("base64")});
   progress[p.id]=result;completed++;done=true;
   if(completed%50===0){await writeFile(progressPath,JSON.stringify(progress));console.log(JSON.stringify({completed,total:products.length,failed:failed.length}));}
  }catch(error){if(attempt===2){failed.push({id:p.id,error:String(error)});console.log(JSON.stringify({failedId:p.id,error:String(error)}));}else await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));}
 }
}
await Promise.all(Array.from({length:20},worker));
await writeFile(progressPath,JSON.stringify(progress));
await writeFile(new URL(".image-migration-errors.json",root),JSON.stringify(failed,null,2));
if(failed.length){console.log(JSON.stringify({completed,failed:failed.length,examples:failed.slice(0,5)}));process.exitCode=1;}
else{
 for(const p of products)p.image_url=progress[p.id].url;
 await writeFile(snapshotPath,JSON.stringify(products,null,2)+"\n");
 console.log(JSON.stringify({completed,failed:0,bytes:Object.values(progress).reduce((sum,p)=>sum+p.size,0)}));
}
