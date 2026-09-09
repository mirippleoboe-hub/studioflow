"use server";
import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/components/action-form";
const refresh=()=>revalidatePath("/dashboard");
export async function saveAnnouncement(_:ActionResult,form:FormData):Promise<ActionResult>{
 const {profile,studio}=await requireTeacher();const db=await createClient();const title=String(form.get("title")??"").trim(),body=String(form.get("body")??"").trim();
 if(!title||title.length>120||!body||body.length>4000)return {error:"Enter a title and announcement message."};
 const expires=String(form.get("expires_at")??"");const payload={studio_id:studio!.id,author_id:profile.id,title,body,published_at:new Date().toISOString(),expires_at:expires?new Date(`${expires}T23:59:59`).toISOString():null};const id=String(form.get("id")??"");
 const result=id?await db.from("announcements").update(payload).eq("id",id).eq("author_id",profile.id).select("id"):await db.from("announcements").insert(payload).select("id");
 if(result.error)return {error:"Couldn't publish this announcement."};if(!result.data?.length)return {error:"Announcement no longer available."};refresh();return {message:id?"Announcement updated.":"Announcement published."};
}
export async function deleteAnnouncement(_:ActionResult,form:FormData):Promise<ActionResult>{const {profile}=await requireTeacher();const db=await createClient();const {error}=await db.from("announcements").delete().eq("id",String(form.get("id"))).eq("author_id",profile.id);if(error)return {error:"Couldn't delete this announcement."};refresh();return {message:"Announcement deleted."};}
