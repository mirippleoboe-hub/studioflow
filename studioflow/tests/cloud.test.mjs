import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import ts from 'typescript';
const source=(await readFile(new URL('../src/lib/cloud.ts',import.meta.url),'utf8')).replace('import "server-only";','');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const cloud=await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
test('cloud credentials are encrypted with integrity protection and configuration gates',()=>{
 process.env.CLOUD_TOKEN_KEY=randomBytes(32).toString('base64');
 const original={access_token:'test-only',refresh_token:'test-refresh',expires_at:123};
 const value=cloud.encrypt(original);
 assert.deepEqual(cloud.decrypt(value),original);
 assert.ok(!value.includes('test-only'));
 const corrupt=Buffer.from(value,'base64url');corrupt[corrupt.length-1]^=1;
 assert.throws(()=>cloud.decrypt(corrupt.toString('base64url')));
 assert.throws(()=>cloud.providerId('https://untrusted.test'));
 assert.equal(cloud.cloudConfig('google'),null);
});
test('provider listing adapters normalize files without exposing tokens',async()=>{
 const previous=globalThis.fetch;
 try {
  const cases=[['google',{files:[{id:'g1',name:'Score.pdf',mimeType:'application/pdf',size:'25'}]}],['onedrive',{value:[{id:'m1',name:'Score.pdf',size:25,file:{mimeType:'application/pdf'}},{id:'folder',name:'folder',folder:{}}]}],['dropbox',{entries:[{'.tag':'file',id:'d1',name:'Score.pdf',size:25},{'.tag':'folder',id:'folder',name:'folder'}]}]];
  for(const [provider,response] of cases){globalThis.fetch=async(url,init)=>{assert.ok(String(url).startsWith('https://'));assert.equal(init.headers.Authorization,'Bearer fake-token');return Response.json(response);};const files=await cloud.listFiles(provider,'fake-token');assert.equal(files.length,1);assert.equal(files[0].name,'Score.pdf');assert.equal(files[0].size_bytes,25);}
 }finally{globalThis.fetch=previous;}
});
