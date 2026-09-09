"use server";
import { requireAppContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
export async function sendMessage(recipient:string,body:string){
 const {profile,studio}=await requireAppContext();if(!studio||!body.trim()||body.length>4000)return {error:"Write a message of up to 4,000 characters."};
 const db=await createClient();const {error}=await db.from("messages").insert({studio_id:studio.id,sender_id:profile.id,recipient_id:recipient,body:body.trim()});
 if(error)return {error:"Message not sent. Check that this person is still in your studio and try again."};
 revalidatePath("/messages");return {ok:true};
}
export async function markRead(sender:string){
 const {profile,studio}=await requireAppContext();const db=await createClient();
 await db.from("messages").update({read_at:new Date().toISOString()}).eq("studio_id",studio!.id).eq("recipient_id",profile.id).eq("sender_id",sender).is("read_at",null);
}
