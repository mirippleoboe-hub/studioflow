"use client";
import { useEffect,useRef,useState,useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessage,markRead } from "@/app/(app)/messages/actions";
import type { MessageRow } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
export function Conversation({recipient,name,userId,messages}:{recipient:string;name:string;userId:string;messages:MessageRow[]}){
 const router=useRouter(),[body,setBody]=useState(""),[error,setError]=useState(""),[pending,start]=useTransition();const end=useRef<HTMLDivElement>(null);
 const [mounted,setMounted]=useState(false);
 useEffect(()=>setMounted(true),[]);
 const latest=messages.at(-1)?.id;
 useEffect(()=>{end.current?.scrollIntoView({block:"nearest"});void markRead(recipient);},[recipient,latest]);
 useEffect(()=>{const id=setInterval(()=>{if(document.visibilityState==="visible")router.refresh();},15000);return()=>clearInterval(id);},[router]);
 return <section className="rounded-xl border bg-card p-4"><h2 className="mb-2 font-semibold">{name}</h2><p className="mb-4 text-xs text-muted-foreground">Latest 100 messages · Updates every 15 seconds</p>
 <div className="h-80 space-y-3 overflow-y-auto" aria-label="Conversation history">{messages.length===0&&<p className="text-sm text-muted-foreground">Start your conversation.</p>}{messages.map(m=><article key={m.id} className={`max-w-[90%] rounded-lg p-3 ${m.sender_id===userId?"ml-auto bg-accent":"bg-muted"}`}><p className="whitespace-pre-wrap break-words text-sm">{m.body}</p><p className="mt-2 text-xs text-muted-foreground"><time dateTime={m.created_at}>{mounted?new Date(m.created_at).toLocaleString():m.created_at.replace("T"," ").slice(0,16)+" UTC"}</time>{m.sender_id===userId&&(m.read_at?" · Read":" · Sent")}</p></article>)}<div ref={end}/></div>
 <form className="mt-4 space-y-3" onSubmit={e=>{e.preventDefault();start(async()=>{try{const result=await sendMessage(recipient,body);if(result.error)setError(result.error);else{setBody("");setError("");router.refresh();}}catch{setError("Message not sent. Please try again.");}});}}><label className="block text-sm" htmlFor="message">Message to {name}</label><textarea id="message" className="min-h-24 w-full rounded-md border bg-background p-3" required maxLength={4000} value={body} disabled={pending} onChange={e=>setBody(e.target.value)}/><Button disabled={pending||!body.trim()}>{pending?"Sending…":"Send message"}</Button>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}</form></section>;
}
