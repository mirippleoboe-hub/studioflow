import { NextResponse } from "next/server";
import { requireAppContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listFiles,uploadCloud,providerId } from "@/lib/cloud";
import { connectionToken } from "@/lib/cloud-session";
async function connection(p:string){const {profile}=await requireAppContext();const db=await createClient();const {data,error}=await db.from("cloud_connections").select("*").eq("profile_id",profile.id).eq("provider",providerId(p)).single();if(error||!data)throw new Error("Connect your account first.");return data;}
export async function GET(_:Request,{params}:{params:Promise<{provider:string}>}){
 try{const c=await connection((await params).provider);return NextResponse.json({files:await listFiles(providerId(c.provider),await connectionToken(c))},{headers:{"Cache-Control":"private, no-store"}});}catch{return NextResponse.json({error:"Couldn't load files. Connect or reconnect your cloud account."},{status:400});}
}
export async function POST(request:Request,{params}:{params:Promise<{provider:string}>}){
 if(request.headers.get("origin")!==new URL(request.url).origin)return new Response("Invalid origin",{status:403});
 if(Number(request.headers.get("content-length"))>4*1024*1024)return new Response("File too large",{status:413});
 try{const c=await connection((await params).provider);const file=(await request.formData()).get("file");if(!(file instanceof File)||file.size>3*1024*1024||file.size===0)return NextResponse.json({error:"Choose a file up to 3 MB."},{status:400});
 return NextResponse.json({file:await uploadCloud(providerId(c.provider),await connectionToken(c),file)});
 }catch{return NextResponse.json({error:"Upload failed. Please reconnect or try again."},{status:400});}
}
