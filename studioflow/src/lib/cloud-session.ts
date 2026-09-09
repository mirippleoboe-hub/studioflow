import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { decrypt,encrypt,tokenRequest,providerId,type Tokens } from "@/lib/cloud";
import type { CloudConnection,Database } from "@/lib/database.types";
export function cloudAdmin(){const config=getSupabaseConfig(),key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!config||!key)throw new Error("Cloud sharing not configured");return createSupabaseClient<Database>(config.url,key,{auth:{persistSession:false,autoRefreshToken:false}});}
export async function connectionToken(connection:CloudConnection,shared=false){
 let tokens=decrypt<Tokens>(connection.encrypted_tokens);const provider=providerId(connection.provider);
 if(tokens.expires_at<Date.now()+60000){
  if(!tokens.refresh_token)throw new Error("Please reconnect your cloud account.");
  const next=await tokenRequest(provider,{grant_type:"refresh_token",refresh_token:tokens.refresh_token});tokens={...next,refresh_token:next.refresh_token??tokens.refresh_token};
  const db=shared?cloudAdmin():await createClient();
  const {error}=await db.from("cloud_connections").update({encrypted_tokens:encrypt(tokens),updated_at:new Date().toISOString()}).eq("id",connection.id);
  if(error)throw new Error("Could not refresh connection. Please reconnect.");
 }
 return tokens.access_token;
}
