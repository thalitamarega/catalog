import { readFile, writeFile, mkdir, readdir, unlink } from "node:fs/promises";
const root=new URL("../",import.meta.url);
const products=JSON.parse(await readFile(new URL("data/catalog-snapshot.json",root),"utf8"));
const directory=new URL("data/catalog-photo-packs/",root);await mkdir(directory,{recursive:true});
const index={};let number=0,offset=0,parts=[];
function packName(){return "photos-"+String(number).padStart(3,"0")+".bin";}
async function flush(){if(parts.length)await writeFile(new URL(packName(),directory),Buffer.concat(parts));number++;offset=0;parts=[];}
for(const product of products){
 const bytes=await readFile(new URL("public/catalog/photos/"+product.id+".webp",root));
 if(offset+bytes.length>2000000)await flush();
 index[product.id]={pack:packName(),offset,length:bytes.length};parts.push(bytes);offset+=bytes.length;
}
await flush();await writeFile(new URL("data/catalog-photo-index.json",root),JSON.stringify(index,null,2)+"\n");
for(const file of await readdir(directory)){const match=file.match(/^photos-(\d+)\.bin$/);if(match&&Number(match[1])>=number)await unlink(new URL(file,directory));}
console.log("Packed "+products.length+" images into "+number+" files.");
