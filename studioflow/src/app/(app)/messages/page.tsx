import { ProfileAvatar } from "@/components/profile-avatar";
import Link from "next/link";
import { requireAppContext } from "@/lib/auth";
import { studioPeople } from "@/lib/studio-people";
import { createClient } from "@/lib/supabase/server";
import { Conversation } from "@/components/conversation";
import { PageHeader } from "@/components/page-header";
export default async function MessagesPage({searchParams}:{searchParams:Promise<{with?:string}>}){
 const {profile,studio}=await requireAppContext();const params=await searchParams;const db=await createClient();
 const people=(await studioPeople(studio!.id)).filter(p=>p.id!==profile.id&&(profile.role==="teacher"?p.membershipRole==="student":p.membershipRole!=="student"));
 const selected=people.find(p=>p.id===params.with)??people[0];
 const {data:unread}=await db.from("messages").select("sender_id").eq("studio_id",studio!.id).eq("recipient_id",profile.id).is("read_at",null);
 const result=selected?await db.from("messages").select("*").eq("studio_id",studio!.id).or(`and(sender_id.eq.${profile.id},recipient_id.eq.${selected.id}),and(sender_id.eq.${selected.id},recipient_id.eq.${profile.id})`).order("created_at",{ascending:false}).limit(100):{data:[],error:null};
 return <div><PageHeader title="Messages" description="Private conversations with your studio. Messages stay here in StudioFlow."/>
 <div className="grid gap-5 md:grid-cols-[210px_1fr]"><nav aria-label="Conversations" className="space-y-1">{people.map(p=><Link key={p.id} href={`/messages?with=${p.id}`} aria-current={selected?.id===p.id?"page":undefined} className={`flex items-center gap-2 rounded-md p-3 text-sm ${selected?.id===p.id?"bg-accent text-accent-foreground":"border"}`}><ProfileAvatar path={p.avatar_path} name={p.full_name}/><span>{p.full_name}</span>{unread?.some(m=>m.sender_id===p.id)&&<span className="ml-2 text-xs font-semibold">New</span>}</Link>)}</nav>
 {result.error?<p role="alert">Unable to load messages. Please refresh.</p>:selected?<Conversation key={selected.id} recipient={selected.id} name={selected.full_name} userId={profile.id} messages={[...(result.data??[])].reverse()}/>:<p className="rounded-xl border p-8 text-muted-foreground">{profile.role==="teacher"?"Your active students will appear here once they join.":"Your studio teachers will appear here."}</p>}</div></div>;
}
