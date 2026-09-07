"use server";
import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/components/action-form";
const refresh=()=>{revalidatePath("/assignments");revalidatePath("/dashboard");};
export async function saveAssignment(_:ActionResult,form:FormData):Promise<ActionResult>{
 const {profile,studio}=await requireTeacher();const db=await createClient();const title=String(form.get("title")??"").trim();
 if(!title||title.length>120)return {error:"Enter an assignment title."};
 const target=String(form.get("target")??"studio"),studentId=target==="student"?String(form.get("student_id")??""):"";
 if(target==="student"&&!studentId)return {error:"Choose a student."};
 const payload={studio_id:studio!.id,teacher_id:profile.id,student_id:studentId||null,title,instructions:String(form.get("instructions")??"").trim().slice(0,6000),due_date:String(form.get("due_date")??"")||null,status:String(form.get("status")??"active") as "active"|"archived"};
 const id=String(form.get("id")??"");const result=id?await db.from("assignments").update(payload).eq("id",id).eq("teacher_id",profile.id).select("id"):await db.from("assignments").insert(payload).select("id");
 if(result.error)return {error:result.error.message.includes("active student")?"Choose an active student in this studio.":"Couldn't save this assignment."};if(!result.data?.length)return {error:"Assignment no longer available."};refresh();return {message:id?"Assignment updated.":"Assignment created."};
}
export async function deleteAssignment(_:ActionResult,form:FormData):Promise<ActionResult>{const {profile}=await requireTeacher();const db=await createClient();const {error}=await db.from("assignments").delete().eq("id",String(form.get("id"))).eq("teacher_id",profile.id);if(error)return {error:"Couldn't delete this assignment."};refresh();return {message:"Assignment deleted."};}
