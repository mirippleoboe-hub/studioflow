import "server-only";
import { createCipheriv,createDecipheriv,randomBytes } from "node:crypto";
export const providers=["google","onedrive","dropbox"] as const;
export type Provider=typeof providers[number];
export function providerId(value:string):Provider {if(!providers.includes(value as Provider))throw new Error("Unknown provider");return value as Provider;}
export const providerNames:Record<Provider,string>={google:"Google Drive",onedrive:"OneDrive",dropbox:"Dropbox"};
const keys={google:"GOOGLE_DRIVE",onedrive:"ONEDRIVE",dropbox:"DROPBOX"};
export function cloudConfig(p:Provider){
 const clientId=process.env[`${keys[p]}_CLIENT_ID`],secret=process.env[`${keys[p]}_CLIENT_SECRET`],key=process.env.CLOUD_TOKEN_KEY,site=process.env.NEXT_PUBLIC_SITE_URL;
 if(!clientId||!secret||!key||Buffer.from(key,"base64").length!==32||!site||!process.env.SUPABASE_SERVICE_ROLE_KEY)return null;
 return {clientId,secret,callback:`${site}/api/cloud/${p}/callback`};
}
function encryptionKey(){const key=Buffer.from(process.env.CLOUD_TOKEN_KEY??"","base64");if(key.length!==32)throw new Error("Cloud encryption is not configured");return key;}
export function encrypt(value:unknown){
 const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",encryptionKey(),iv);
 const encrypted=Buffer.concat([cipher.update(JSON.stringify(value),"utf8"),cipher.final()]);
 return Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString("base64url");
}
export function decrypt<T>(value:string):T {const b=Buffer.from(value,"base64url"),cipher=createDecipheriv("aes-256-gcm",encryptionKey(),b.subarray(0,12));cipher.setAuthTag(b.subarray(12,28));return JSON.parse(Buffer.concat([cipher.update(b.subarray(28)),cipher.final()]).toString("utf8"));}
export const oauth={
 google:{authorize:"https://accounts.google.com/o/oauth2/v2/auth",token:"https://oauth2.googleapis.com/token",scope:"https://www.googleapis.com/auth/drive.file"},
 onedrive:{authorize:"https://login.microsoftonline.com/common/oauth2/v2.0/authorize",token:"https://login.microsoftonline.com/common/oauth2/v2.0/token",scope:"offline_access Files.ReadWrite"},
 dropbox:{authorize:"https://www.dropbox.com/oauth2/authorize",token:"https://api.dropboxapi.com/oauth2/token",scope:"files.metadata.read files.content.read files.content.write"}
};
export type Tokens={access_token:string;refresh_token?:string;expires_at:number};
export async function tokenRequest(p:Provider,values:Record<string,string>):Promise<Tokens>{
 const config=cloudConfig(p);if(!config)throw new Error("Connection not configured");
 const res=await fetch(oauth[p].token,{method:"POST",body:new URLSearchParams({...values,client_id:config.clientId,client_secret:config.secret}),cache:"no-store",signal:AbortSignal.timeout(20000)});
 if(!res.ok)throw new Error("Cloud authorization expired. Reconnect your account.");
 const data=await res.json();if(!data.access_token)throw new Error("Missing cloud authorization");
 return {access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Date.now()+(data.expires_in??3600)*1000};
}
async function api(url:string,token:string,init:RequestInit={}){const res=await fetch(url,{...init,headers:{Authorization:`Bearer ${token}`,...init.headers},cache:"no-store",signal:AbortSignal.timeout(25000)});if(!res.ok)throw new Error("Cloud file unavailable. Reconnect your account or try again.");return res;}
export type CloudFile={id:string;name:string;mime_type:string;size_bytes:number};
export async function listFiles(p:Provider,token:string):Promise<CloudFile[]>{
 if(p==="google") {const data=await (await api("https://www.googleapis.com/drive/v3/files?pageSize=100&q=trashed%3Dfalse%20and%20mimeType!%3D'application%2Fvnd.google-apps.folder'&fields=files(id,name,mimeType,size)&orderBy=modifiedTime%20desc",token)).json();return (data.files??[]).map((f:{id:string;name:string;mimeType:string;size:string})=>({id:f.id,name:f.name,mime_type:f.mimeType,size_bytes:Number(f.size??0)}));}
 if(p==="onedrive"){const data=await(await api("https://graph.microsoft.com/v1.0/me/drive/root/children?$top=100&$select=id,name,size,file",token)).json();return (data.value??[]).filter((f:{file?:unknown})=>f.file).map((f:{id:string;name:string;size:number;file:{mimeType:string}})=>({id:f.id,name:f.name,mime_type:f.file.mimeType,size_bytes:f.size}));}
 const data=await(await api("https://api.dropboxapi.com/2/files/list_folder",token,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:"",limit:100,recursive:false})})).json();return (data.entries??[]).filter((f:Record<string,unknown>)=>f[".tag"]==="file").map((f:{id:string;name:string;size:number})=>({id:f.id,name:f.name,mime_type:"application/octet-stream",size_bytes:f.size}));
}
export async function uploadCloud(p:Provider,token:string,file:File):Promise<CloudFile>{
 const name=file.name.replace(/[\/\\<>:"|?*\x00-\x1f]/g,"_").slice(0,150),unique=`StudioFlow-${Date.now()}-${randomBytes(4).toString("hex")}-${name}`;
 let result;
 if(p==="google"){
  const boundary=`studioflow${randomBytes(12).toString("hex")}`;
  const body=Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({name:unique})}\r\n--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`),Buffer.from(await file.arrayBuffer()),Buffer.from(`\r\n--${boundary}--`)]);
  result=await(await api("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,mimeType",token,{method:"POST",headers:{"Content-Type":`multipart/related; boundary=${boundary}`},body})).json();
 }else if(p==="onedrive")result=await(await api(`https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(unique)}:/content`,token,{method:"PUT",headers:{"Content-Type":"application/octet-stream"},body:await file.arrayBuffer()})).json();
 else result=await(await api("https://content.dropboxapi.com/2/files/upload",token,{method:"POST",headers:{"Content-Type":"application/octet-stream","Dropbox-API-Arg":JSON.stringify({path:`/${unique}`,mode:"add",autorename:true})},body:await file.arrayBuffer()})).json();
 return {id:result.id,name:result.name,mime_type:file.type||"application/octet-stream",size_bytes:file.size};
}
export async function downloadCloud(p:Provider,token:string,id:string,mime:string){
 if(p==="google")return api(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}${mime.startsWith("application/vnd.google-apps.")?"/export?mimeType=application%2Fpdf":"?alt=media"}`,token);
 if(p==="onedrive")return api(`https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(id)}/content`,token);
 return api("https://content.dropboxapi.com/2/files/download",token,{method:"POST",headers:{"Dropbox-API-Arg":JSON.stringify({path:id})}});
}

export async function cloudFile(p:Provider,token:string,id:string):Promise<CloudFile>{
 let f;
 if(p==="google"){f=await(await api(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?fields=id,name,mimeType,size`,token)).json();if(f.mimeType==="application/vnd.google-apps.folder")throw new Error("Choose a file");}
 else if(p==="onedrive"){f=await(await api(`https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(id)}?$select=id,name,size,file`,token)).json();if(!f.file)throw new Error("Choose a file");}
 else {f=await(await api("https://api.dropboxapi.com/2/files/get_metadata",token,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:id})})).json();if(f[".tag"]!=="file")throw new Error("Choose a file");}
 return {id:f.id,name:f.name,mime_type:f.mimeType??f.file?.mimeType??"application/octet-stream",size_bytes:Number(f.size??0)};
}
