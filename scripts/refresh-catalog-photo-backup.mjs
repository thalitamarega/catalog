import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
const root=new URL("../",import.meta.url);
const products=JSON.parse(await readFile(new URL("data/catalog-snapshot.json",root),"utf8"));
let next=0,done=0;const failures=[];
async function worker(){while(next<products.length){const p=products[next++];let succeeded=false;
 for(let attempt=0;attempt<3&&!succeeded;attempt++)try{
  const url=new URL(p.image_url);if(url.hostname!=="qkhwtksyxvwozfyzhyfr.supabase.co"||!url.pathname.startsWith("/storage/v1/object/public/catalog-images/"))throw new Error("Unexpected storage URL");
  const r=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error("HTTP "+r.status);
  const bytes=Buffer.from(await r.arrayBuffer());const metadata=await sharp(bytes).metadata();if(metadata.format!=="webp")throw new Error("Expected WebP");
  const backup=await sharp(bytes).rotate().resize({width:900,height:900,fit:"inside",withoutEnlargement:true}).webp({quality:82}).toBuffer();
  await writeFile(new URL("public/catalog/photos/"+p.id+".webp",root),backup);succeeded=true;done++;if(done%250===0)console.log("Updated "+done+" photos");
 }catch(e){if(attempt===2)failures.push({id:p.id,error:String(e)});}}
}
await Promise.all(Array.from({length:20},worker));
console.log(JSON.stringify({done,failures}));if(failures.length)process.exitCode=1;
