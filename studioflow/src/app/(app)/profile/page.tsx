import { requireAppContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ProfilePhoto } from "@/components/profile-photo";
export default async function ProfilePage(){
 const {profile}=await requireAppContext(); const db=await createClient();
 const url=profile.avatar_path?(await db.storage.from("avatars").createSignedUrl(profile.avatar_path,3600)).data?.signedUrl:null;
 return <div className="max-w-xl"><PageHeader title="Your profile" description="Your photo is visible to members of your studio."/><ProfilePhoto userId={profile.id} name={profile.full_name} initialUrl={url??null} oldPath={profile.avatar_path}/></div>;
}
