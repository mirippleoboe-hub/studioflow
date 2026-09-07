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
 const db=await createClient();const [eventsResult,availabilityResult,requestsResult,people]=await Promise.all([
  db.from("calendar_events").select("*").eq("studio_id",studio!.id).lt("starts_at",until.toISOString()).gt("ends_at",from.toISOString()).order("starts_at"),
  db.from("availability_rules").select("*").eq("studio_id",studio!.id).order("weekday").order("start_minute"),
  db.from("booking_requests").select("*").eq("studio_id",studio!.id).order("requested_start"),
  studioPeople(studio!.id)
 ]);
 const error=eventsResult.error||availabilityResult.error||requestsResult.error;
 return <div><PageHeader title="Scheduling" description={profile.role==="teacher"?"Plan lessons, share availability, and respond to lesson requests.":"See your calendar and request a time that fits your teacher's availability."}/>{error?<p role="alert">Unable to load scheduling. Please refresh.</p>:<CalendarView month={month} events={eventsResult.data??[]} availability={availabilityResult.data??[]} requests={requestsResult.data??[]} teacher={profile.role==="teacher"} userId={profile.id} people={people}/>}</div>;
}
