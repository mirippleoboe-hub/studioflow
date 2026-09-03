import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomBytes,createHash } from "node:crypto";
import { requireAppContext } from "@/lib/auth";
import { cloudConfig,providerId,oauth,encrypt } from "@/lib/cloud";
export async function GET(request:Request,{params}:{params:Promise<{provider:string}>}){
 const {profile}=await requireAppContext();let p;try{p=providerId((await params).provider);}catch{return new Response("Unknown provider",{status:404});}
 const config=cloudConfig(p);if(!config)return NextResponse.redirect(new URL("/materials?notice=Cloud%20connection%20needs%20administrator%20setup",request.url));
 if(new URL(request.url).origin!==new URL(config.callback).origin)return NextResponse.redirect(new URL(`/api/cloud/${p}/connect`,config.callback));
 const state=randomBytes(24).toString("base64url"),verifier=randomBytes(48).toString("base64url");
 (await cookies()).set(`sf_oauth_${p}`,encrypt({state,verifier,user:profile.id,expires:Date.now()+600000}),{httpOnly:true,secure:new URL(request.url).protocol==="https:",sameSite:"lax",path:`/api/cloud/${p}/callback`,maxAge:600});
 const url=new URL(oauth[p].authorize);url.search=new URLSearchParams({client_id:config.clientId,redirect_uri:config.callback,response_type:"code",scope:oauth[p].scope,state,code_challenge:createHash("sha256").update(verifier).digest("base64url"),code_challenge_method:"S256",...(p==="google"?{access_type:"offline",prompt:"consent"}:p==="dropbox"?{token_access_type:"offline"}:{})}).toString();
 return NextResponse.redirect(url);
}
