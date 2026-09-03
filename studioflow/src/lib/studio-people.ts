import { createClient } from "@/lib/supabase/server";
export async function studioPeople(studioId: string) {
 const db=await createClient();
 const {data:members,error}=await db.from("studio_memberships").select("profile_id,role").eq("studio_id",studioId);
 if(error) throw new Error("Could not load studio members.");
 if(!members?.length) return [];
 const {data:profiles,error:profileError}=await db.from("profiles").select("id,full_name,role,avatar_path").in("id",members.map(m=>m.profile_id));
 if(profileError) throw new Error("Could not load studio profiles.");
 return (profiles??[]).map(p=>({...p,membershipRole:members.find(m=>m.profile_id===p.id)!.role}));
}
