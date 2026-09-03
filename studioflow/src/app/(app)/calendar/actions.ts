"use server";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/components/action-form";
export async function saveEvent(_:ActionResult,form:FormData):Promise<ActionResult>{
 const {profile,studio}=await requireTeacher();const db=await createClient();
 const title=String(form.get("title")??"").trim(),starts=String(form.get("starts_at")),ends=String(form.get("ends_at"));
 if(!title||title.length>120||!Number.isFinite(Date.parse(starts))||!Number.isFinite(Date.parse(ends))||Date.parse(ends)<=Date.parse(starts))return {error:"Enter a title and an end time after the start."};
 const event={studio_id:studio!.id,teacher_id:profile.id,student_id:String(form.get("student_id")??"")||null,title,description:String(form.get("description")??"").slice(0,4000),location:String(form.get("location")??"").slice(0,300),starts_at:starts,ends_at:ends,time_zone:String(form.get("time_zone")??"UTC")};
 const id=String(form.get("id")??"");
 const result=id?await db.from("calendar_events").update(event).eq("id",id).eq("teacher_id",profile.id).select("id"):await db.from("calendar_events").insert(event).select("id");
 if(result.error)return {error:result.error.message.includes("overlaps")?"This time overlaps another lesson or studio event.":"Couldn't save this event. Check the student, times and time zone."};
 if(!result.data?.length)return {error:"Event no longer available."};
 revalidatePath("/calendar");return {message:"Event saved."};
}
export async function deleteEvent(_:ActionResult,form:FormData):Promise<ActionResult>{
 const {profile}=await requireTeacher();const db=await createClient();const {error}=await db.from("calendar_events").delete().eq("id",String(form.get("id"))).eq("teacher_id",profile.id);
 if(error)return {error:"Couldn't delete this event."};revalidatePath("/calendar");return {message:"Event deleted."};
}
