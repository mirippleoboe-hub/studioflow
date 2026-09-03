import { requireAppContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { studioPeople } from "@/lib/studio-people";
import { CalendarView } from "@/components/calendar-view";
import { PageHeader } from "@/components/page-header";
export default async function CalendarPage({searchParams}:{searchParams:Promise<{month?:string}>}){
 const {profile,studio}=await requireAppContext();const params=await searchParams;
 const month=/^\d{4}-(0[1-9]|1[0-2])$/.test(params.month??"")?params.month!:new Date().toISOString().slice(0,7);
 const from=new Date(`${month}-01T00:00:00Z`);from.setUTCDate(from.getUTCDate()-2);
 const until=new Date(`${month}-01T00:00:00Z`);until.setUTCMonth(until.getUTCMonth()+1);until.setUTCDate(3);
 const db=await createClient();const {data,error}=await db.from("calendar_events").select("*").eq("studio_id",studio!.id).lt("starts_at",until.toISOString()).gt("ends_at",from.toISOString()).order("starts_at");
 return <div><PageHeader title="Calendar" description={profile.role==="teacher"?"Schedule lessons and studio events. Conflicting times are flagged before saving.":"Your lessons and upcoming studio events."}/>{error?<p role="alert">Unable to load the calendar. Please refresh.</p>:<CalendarView month={month} events={data??[]} teacher={profile.role==="teacher"} userId={profile.id} people={await studioPeople(studio!.id)}/>}</div>;
}
