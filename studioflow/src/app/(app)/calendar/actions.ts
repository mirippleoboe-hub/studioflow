"use server";
import { requireAppContext,requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/components/action-form";

const refresh=()=>{revalidatePath("/calendar");revalidatePath("/dashboard");};
const scheduleError=(message:string)=>message.includes("overlaps")||message.includes("available")?"This time is no longer available.":"Couldn't save this schedule change.";

export async function saveEvent(_:ActionResult,form:FormData):Promise<ActionResult>{
 const {profile,studio}=await requireTeacher();const db=await createClient();
 const title=String(form.get("title")??"").trim(),starts=String(form.get("starts_at")),ends=String(form.get("ends_at"));
 if(!title||title.length>120||!Number.isFinite(Date.parse(starts))||!Number.isFinite(Date.parse(ends))||Date.parse(ends)<=Date.parse(starts))return {error:"Enter a title and an end time after the start."};
 const eventType=String(form.get("event_type")??"lesson") as "lesson"|"studio_event"|"unavailable";
 const studentId=eventType==="lesson"?String(form.get("student_id")??"")||null:null;
 if(eventType==="lesson"&&!studentId)return {error:"Choose the student attending this lesson."};
 const base={studio_id:studio!.id,teacher_id:profile.id,student_id:studentId,title,description:String(form.get("description")??"").slice(0,4000),location:String(form.get("location")??"").slice(0,300),starts_at:starts,ends_at:ends,time_zone:String(form.get("time_zone")??"UTC"),event_type:eventType};
 const id=String(form.get("id")??"");let result;
 if(id) result=await db.from("calendar_events").update(base).eq("id",id).eq("teacher_id",profile.id).select("id");
 else {const count=Math.max(1,Math.min(24,Number(form.get("repeat_count")??1)||1)),group=count>1?crypto.randomUUID():null;const rows=Array.from({length:count},(_,i)=>({...base,starts_at:new Date(Date.parse(starts)+i*7*86400000).toISOString(),ends_at:new Date(Date.parse(ends)+i*7*86400000).toISOString(),recurrence_group_id:group}));result=await db.from("calendar_events").insert(rows).select("id");}
 if(result.error)return {error:scheduleError(result.error.message)};if(!result.data?.length)return {error:"Event no longer available."};
 refresh();return {message:id?"Event saved.":Number(form.get("repeat_count")??1)>1?"Lesson series scheduled.":"Event scheduled."};
}
export async function deleteEvent(_:ActionResult,form:FormData):Promise<ActionResult>{const {profile}=await requireTeacher();const db=await createClient();const {error}=await db.from("calendar_events").delete().eq("id",String(form.get("id"))).eq("teacher_id",profile.id);if(error)return {error:"Couldn't delete this event."};refresh();return {message:"Event deleted."};}
export async function addAvailability(_:ActionResult,form:FormData):Promise<ActionResult>{
 const {profile,studio}=await requireTeacher();const db=await createClient();const weekday=Number(form.get("weekday")),start=String(form.get("start_time")),end=String(form.get("end_time"));const minutes=(value:string)=>{const [h,m]=value.split(":").map(Number);return h*60+m;};const startMinute=minutes(start),endMinute=minutes(end);
 if(!Number.isInteger(weekday)||weekday<0||weekday>6||!Number.isFinite(startMinute)||!Number.isFinite(endMinute)||endMinute<=startMinute)return {error:"Choose a day and an end time after the start."};
 const {error}=await db.from("availability_rules").insert({studio_id:studio!.id,teacher_id:profile.id,weekday,start_minute:startMinute,end_minute:endMinute,time_zone:String(form.get("time_zone")??"UTC")});
 if(error)return {error:error.message.includes("duplicate")?"That availability window already exists.":"Couldn't add this availability window."};refresh();return {message:"Availability added."};
}
export async function removeAvailability(_:ActionResult,form:FormData):Promise<ActionResult>{const {profile}=await requireTeacher();const db=await createClient();const {error}=await db.from("availability_rules").delete().eq("id",String(form.get("id"))).eq("teacher_id",profile.id);if(error)return {error:"Couldn't remove this availability window."};refresh();return {message:"Availability removed."};}
export async function requestLesson(_:ActionResult,form:FormData):Promise<ActionResult>{
 const {profile,studio}=await requireAppContext();if(profile.role!=="student")return {error:"Only students can request lesson times."};const db=await createClient();
 const {error}=await db.rpc("request_lesson_slot",{p_studio_id:studio!.id,p_teacher_id:String(form.get("teacher_id")),p_requested_start:String(form.get("starts_at")),p_requested_end:String(form.get("ends_at")),p_time_zone:String(form.get("time_zone")??"UTC"),p_note:String(form.get("note")??"").slice(0,1000)});
 if(error)return {error:error.message.includes("outside")?"Choose a time inside the teacher's availability.":scheduleError(error.message)};refresh();return {message:"Lesson request sent to your teacher."};
}
export async function respondRequest(_:ActionResult,form:FormData):Promise<ActionResult>{
 await requireTeacher();const decision=String(form.get("decision"));if(decision!=="approved"&&decision!=="declined")return {error:"Choose approve or decline."};const db=await createClient();const {error}=await db.rpc("respond_booking_request",{p_request_id:String(form.get("id")),p_decision:decision,p_response_note:String(form.get("response_note")??"").slice(0,1000)});if(error)return {error:scheduleError(error.message)};refresh();return {message:decision==="approved"?"Request approved and added to the calendar.":"Request declined."};
}
export async function cancelRequest(_:ActionResult,form:FormData):Promise<ActionResult>{await requireAppContext();const db=await createClient();const {error}=await db.rpc("cancel_booking_request",{p_request_id:String(form.get("id"))});if(error)return {error:"Couldn't cancel this request."};refresh();return {message:"Request cancelled."};}
