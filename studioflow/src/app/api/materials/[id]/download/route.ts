import { requireAppContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cloudAdmin,connectionToken } from "@/lib/cloud-session";
import { providerId,downloadCloud } from "@/lib/cloud";
import { NextResponse } from "next/server";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 const {studio}=await requireAppContext();const db=await createClient();const {data:m}=await db.from("materials").select("*").eq("id",(await params).id).eq("studio_id",studio!.id).single();
 if(!m)return new Response("Material not found",{status:404});
 if(m.storage_path){const {data,error}=await db.storage.from("materials").createSignedUrl(m.storage_path,60,{download:m.name});if(error||!data)return new Response("File unavailable",{status:404});return NextResponse.redirect(data.signedUrl);}
 try{
  // Authorization above uses the viewer's RLS session before accessing the owner's encrypted connection.
  const admin=cloudAdmin();const {data:member}=await admin.from("studio_memberships").select("id").eq("studio_id",m.studio_id).eq("profile_id",m.owner_id).maybeSingle();if(!member)return new Response("Material unavailable",{status:404});
  const {data:c}=await admin.from("cloud_connections").select("*").eq("id",m.connection_id!).eq("profile_id",m.owner_id).single();if(!c||!m.provider_file_id)return new Response("Connection removed",{status:404});
  const res=await downloadCloud(providerId(c.provider),await connectionToken(c,true),m.provider_file_id,m.mime_type);
  return new Response(res.body,{headers:{"Content-Type":"application/octet-stream","Content-Disposition":`attachment; filename*=UTF-8''${encodeURIComponent(m.name)}`,"X-Content-Type-Options":"nosniff","Cache-Control":"private, no-store"}});
 }catch{return new Response("Cloud file unavailable. Ask its owner to reconnect the cloud account.",{status:502});}
}
