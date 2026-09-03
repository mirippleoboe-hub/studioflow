"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
export function ProfilePhoto({userId,name,initialUrl,oldPath}:{userId:string;name:string;initialUrl:string|null;oldPath:string|null}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState(""); const router=useRouter();
 async function save(file?:File){
  setBusy(true);setError("");setMessage(""); const db=createClient(); let path:string|null=null;
  try{
   if(file){
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>2*1024*1024)throw new Error("Choose a JPG, PNG or WebP image under 2 MB.");
    const bitmap=await createImageBitmap(file); if(bitmap.width>8000||bitmap.height>8000){bitmap.close();throw new Error("Choose a smaller image (up to 8000 pixels).");}
    const canvas=document.createElement("canvas"); canvas.width=canvas.height=384;
    const ctx=canvas.getContext("2d")!;const side=Math.min(bitmap.width,bitmap.height);
    ctx.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,384,384);bitmap.close();
    const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Couldn't read this image.")),"image/webp",0.85));
    path=`${userId}/${crypto.randomUUID()}.webp`;
    const upload=await db.storage.from("avatars").upload(path,blob,{contentType:"image/webp"});if(upload.error)throw new Error("Photo upload failed. Please try again.");
   }
   const result=await db.from("profiles").update({avatar_path:path}).eq("id",userId);if(result.error){if(path)await db.storage.from("avatars").remove([path]);throw new Error("Couldn't save your photo.");}
   if(oldPath)await db.storage.from("avatars").remove([oldPath]);
   setMessage(file?"Photo updated.":"Photo removed.");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Please try again.");}finally{setBusy(false);}
 }
 return <div className="space-y-5 rounded-xl border bg-card p-6">
  {/* eslint-disable-next-line @next/next/no-img-element */}
  {initialUrl?<img src={initialUrl} alt={`${name}'s profile`} className="h-24 w-24 rounded-full object-cover"/>:<div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-3xl">{name.charAt(0)}</div>}
  <p className="font-medium">{name}</p><label className="block text-sm">Upload profile picture<input disabled={busy} className="mt-2 block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0];if(file)void save(file);e.target.value="";}}/></label>
  <p className="text-sm text-muted-foreground">JPG, PNG or WebP, up to 2 MB. Your photo is cropped to a square.</p>
  {oldPath&&<Button disabled={busy} variant="outline" onClick={()=>save()}>Remove photo</Button>}
  <p role="status" className="text-sm">{busy?"Updating photo…":message}</p>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 </div>;
}
