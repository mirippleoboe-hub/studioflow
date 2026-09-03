import { createClient } from "@/lib/supabase/server";
export async function ProfileAvatar({path,name}:{path:string|null;name:string}) {
  const db=await createClient();
  const url=path?(await db.storage.from("avatars").createSignedUrl(path,3600)).data?.signedUrl:null;
  // eslint-disable-next-line @next/next/no-img-element
  return url?<img src={url} alt={`${name}'s profile picture`} className="h-9 w-9 shrink-0 rounded-full object-cover"/>:<span aria-hidden="true" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent">{name.charAt(0)}</span>;
}
