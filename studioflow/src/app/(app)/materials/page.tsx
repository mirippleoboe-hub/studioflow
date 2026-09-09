import { requireAppContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cloudConfig,providers,providerNames } from "@/lib/cloud";
import { PageHeader } from "@/components/page-header";
import { MaterialsWorkspace } from "@/components/materials-workspace";
export default async function MaterialsPage({searchParams}:{searchParams:Promise<{notice?:string}>}){
 const {profile,studio}=await requireAppContext();const db=await createClient();const params=await searchParams;
 const [{data:materials,error},{data:connections}]=await Promise.all([db.from("materials").select("*").eq("studio_id",studio!.id).order("created_at",{ascending:false}),db.from("cloud_connections").select("id,provider").eq("profile_id",profile.id)]);
 return <div><PageHeader title="Materials" description="Keep files private or share them with your studio. Connect cloud accounts to store files in your own drive."/>{params.notice&&<p role="status" className="mb-4 text-sm">{params.notice}</p>}{error?<p role="alert">Unable to load materials. Please refresh.</p>:<MaterialsWorkspace userId={profile.id} studioId={studio!.id} materials={materials??[]} providers={providers.map(id=>({id,name:providerNames[id],ready:!!cloudConfig(id),connected:!!connections?.some(c=>c.provider===id)}))}/>}</div>;
}
