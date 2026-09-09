"use server";
import { requireAppContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { connectionToken } from "@/lib/cloud-session";
import { providerId,cloudFile } from "@/lib/cloud";
export async function changeSharing(id:string,shared:boolean){const {profile}=await requireAppContext();const db=await createClient();const {error}=await db.from("materials").update({shared}).eq("id",id).eq("owner_id",profile.id);revalidatePath("/materials");return {error:error?"Couldn't update sharing.":undefined};}
export async function removeMaterial(id:string){const {profile}=await requireAppContext();const db=await createClient();const {data}=await db.from("materials").select("*").eq("id",id).eq("owner_id",profile.id).single();if(!data)return {error:"Material not found."};const {error}=await db.from("materials").delete().eq("id",id).eq("owner_id",profile.id);if(error)return {error:"Couldn't remove material."};if(data.storage_path)await db.storage.from("materials").remove([data.storage_path]);revalidatePath("/materials");return {};}
export async function addCloudMaterial(provider:string,fileId:string){
 const {profile,studio}=await requireAppContext();const db=await createClient();
 try{const {data:c}=await db.from("cloud_connections").select("*").eq("provider",providerId(provider)).eq("profile_id",profile.id).single();if(!c)throw new Error();
 const file=await cloudFile(providerId(provider),await connectionToken(c),fileId);if(!file)return {error:"File not found in your connected account. Refresh the list."};
 const {error}=await db.from("materials").insert({studio_id:studio!.id,owner_id:profile.id,name:file.name,connection_id:c.id,provider_file_id:file.id,mime_type:file.mime_type,size_bytes:file.size_bytes,shared:false});if(error)throw new Error();revalidatePath("/materials");return {};
 }catch{return {error:"Couldn't add this file. Reconnect your account and try again."};}
}
export async function disconnectCloud(provider:string){const {profile}=await requireAppContext();const db=await createClient();const {error}=await db.from("cloud_connections").delete().eq("provider",provider).eq("profile_id",profile.id);revalidatePath("/materials");return {error:error?"Couldn't disconnect.":undefined};}
