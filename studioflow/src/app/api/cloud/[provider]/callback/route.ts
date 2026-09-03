import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAppContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cloudConfig,providerId,tokenRequest,encrypt,decrypt } from "@/lib/cloud";
export async function GET(request:Request,{params}:{params:Promise<{provider:string}>}){
 const {profile}=await requireAppContext();let p;try{p=providerId((await params).provider);}catch{return new Response("Unknown provider",{status:404});}
 const config=cloudConfig(p),store=await cookies(),cookie=store.get(`sf_oauth_${p}`)?.value;
 store.set(`sf_oauth_${p}`,"",{path:`/api/cloud/${p}/callback`,maxAge:0});
 const url=new URL(request.url);let notice="Connection was not completed. Please try again.";
 try{
  if(!cookie||!config||url.searchParams.has("error"))throw new Error();
  const state=decrypt<{state:string;verifier:string;user:string;expires:number}>(cookie);
  const code=url.searchParams.get("code");if(state.state!==url.searchParams.get("state")||state.user!==profile.id||state.expires<Date.now()||!code)throw new Error();
  const tokens=await tokenRequest(p,{grant_type:"authorization_code",code,redirect_uri:config.callback,code_verifier:state.verifier});
  if(!tokens.refresh_token)throw new Error();
  const db=await createClient();const {error}=await db.from("cloud_connections").upsert({profile_id:profile.id,provider:p,encrypted_tokens:encrypt(tokens),updated_at:new Date().toISOString()},{onConflict:"profile_id,provider"});if(error)throw new Error();notice="Cloud account connected.";
 }catch{/* Never expose OAuth codes, tokens, or provider errors. */}
 return NextResponse.redirect(new URL(`/materials?notice=${encodeURIComponent(notice)}`,request.url));
}
