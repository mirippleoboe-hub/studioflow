import { AssignmentsWorkspace } from "@/components/assignments-workspace";
import { PageHeader } from "@/components/page-header";
import { requireAppContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { studioPeople } from "@/lib/studio-people";
export default async function AssignmentsPage(){
 const {profile,studio}=await requireAppContext();const db=await createClient();const [{data,error},people]=await Promise.all([db.from("assignments").select("*").eq("studio_id",studio!.id).order("due_date",{ascending:true,nullsFirst:false}).order("created_at",{ascending:false}),studioPeople(studio!.id)]);
 return <div><PageHeader title="Assignments" description={profile.role==="teacher"?"Create practice work for one student or your whole studio.":"Your current individual and studio-wide practice work."}/>{error?<p role="alert">Unable to load assignments. Please refresh.</p>:<AssignmentsWorkspace assignments={data??[]} people={people} teacher={profile.role==="teacher"} userId={profile.id}/>}</div>;
}
