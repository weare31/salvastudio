// Supabase Edge Function: quick-task — verify_jwt=false; kullanıcı JWT'si burada doğrulanır.
// Secret: IMAGEKIT_PRIVATE_KEY. Supabase servis değerleri platformdan gelir.
import { createClient } from 'npm:@supabase/supabase-js@2.49.8';
const MIB=1024*1024,BASE='https://ik.imagekit.io/b6yycb6z6/',UUID=/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const ORIGINS=new Set(['https://salvastudio.co','https://www.salvastudio.co']);
Deno.serve(async req=>{
const origin=req.headers.get('origin')||'',cors={'Access-Control-Allow-Origin':ORIGINS.has(origin)?origin:'https://salvastudio.co','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
const reply=(body,status=200)=>Response.json(body,{status,headers:cors});
if(origin&&!ORIGINS.has(origin))return reply({error:'Bu kaynaktan erişime izin verilmiyor.'},403);
if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
if(req.method!=='POST')return reply({error:'Yöntem desteklenmiyor.'},405);
const privateKey=Deno.env.get('IMAGEKIT_PRIVATE_KEY'),serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),url=Deno.env.get('SUPABASE_URL');
if(!privateKey||!serviceKey||!url)return reply({error:'Sunucu yapılandırması eksik.'},503);
const authHeader='Basic '+btoa(privateKey+':');let client,projectId=null,jobId=null,uploaded=[],committed=false;
async function boundedBody(max){if(Number(req.headers.get('content-length'))>max)throw Error('BODY_LIMIT');const reader=req.body?.getReader();if(!reader)throw Error('BAD_BODY');const chunks=[];let size=0;try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw Error('BODY_LIMIT');}chunks.push(value);}}finally{reader.releaseLock();}return new Blob(chunks);}
async function removeFiles(ids){const remaining=[];for(const id of ids){try{const r=await fetch('https://api.imagekit.io/v1/files/'+encodeURIComponent(id),{method:'DELETE',headers:{Authorization:authHeader},signal:AbortSignal.timeout(15000)});if(!r.ok&&r.status!==404)remaining.push(id);}catch{remaining.push(id);}}return remaining;}
async function cleanupJob(job){const remaining=await removeFiles(job.file_ids||[]);const q=remaining.length?await client.from('ar_replacements').update({file_ids:remaining,state:job.state==='cleanup'?'cleanup':'failed'}).eq('id',job.id):await client.from('ar_replacements').delete().eq('id',job.id);return !q.error&&!remaining.length;}
function reserveError(error){const t=error.message||'';for(const k of ['LIMIT_USER','LIMIT_GLOBAL_DAILY','LIMIT_DAILY','LIMIT_STORAGE','UPDATE_BUSY','NOT_FOUND'])if(t.includes(k))throw Error(k);throw Error('DB_ERROR');}
try{
const bearer=req.headers.get('authorization')||'';if(!bearer.startsWith('Bearer '))return reply({error:'Giriş yapman gerekiyor.'},401);
client=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:auth,error:authError}=await client.auth.getUser(bearer.slice(7));
if(authError||!auth.user||auth.user.is_anonymous||!auth.user.email_confirmed_at)return reply({error:'Doğrulanmış bir hesapla giriş yap.'},401);
const user=auth.user,contentType=req.headers.get('content-type')||'';
if(contentType.includes('application/json')){
const body=JSON.parse(await (await boundedBody(4096)).text());
if(body.action==='usage'){
// Tamamlanan güncellemelerin eski dosyalarını tekrar temizlemeyi dene.
const cleanup=await client.from('ar_replacements').select('*').eq('owner_id',user.id).eq('state','cleanup').limit(3);
if(cleanup.error)throw Error('MIGRATION_REQUIRED');
for(const job of cleanup.data||[])await cleanupJob(job);
const [projects,jobs,attempts]=await Promise.all([
client.from('ar_projects').select('total_bytes'),
client.from('ar_replacements').select('total_bytes'),
client.from('ar_upload_attempts').select('id',{count:'exact',head:true}).eq('owner_id',user.id).gte('created_at',new Date(Date.now()-86400000).toISOString())
]);if(projects.error||jobs.error||attempts.error)throw Error('DB_ERROR');
return reply({updates:true,storageUsed:[...(projects.data||[]),...(jobs.data||[])].reduce((n,r)=>n+Number(r.total_bytes),0),storageLimit:2147483648,userAttempts:attempts.count||0});
}
if(body.action!=='delete'||!UUID.test(body.id||''))return reply({error:'Geçersiz işlem.'},400);
const claim=await client.rpc('ar_claim_delete',{p_owner:user.id,p_project:body.id});if(claim.error)reserveError(claim.error);
const {data:row,error}=await client.from('ar_projects').select('*').eq('id',body.id).eq('owner_id',user.id).single();if(error||!row)throw Error('NOT_FOUND');
const jobs=await client.from('ar_replacements').select('*').eq('project_id',row.id).eq('owner_id',user.id);if(jobs.error)throw Error('DB_ERROR');
for(const job of jobs.data||[])if(!await cleanupJob(job))throw Error('CLEANUP_ERROR');
const remaining=await removeFiles(row.file_ids||[]);if(remaining.length){await client.from('ar_projects').update({file_ids:remaining,state:'failed'}).eq('id',row.id).eq('owner_id',user.id);throw Error('CLEANUP_ERROR');}
const deleted=await client.from('ar_projects').delete().eq('id',row.id).eq('owner_id',user.id);if(deleted.error)throw Error('DB_ERROR');return reply({ok:true});
}
if(!contentType.startsWith('multipart/form-data'))return reply({error:'Dosyalar bekleniyor.'},400);
const form=await new Response(await boundedBody(18*MIB),{headers:{'Content-Type':contentType}}).formData();
const title=String(form.get('title')||'').trim(),ratio=Number(form.get('aspect_ratio')),replaceId=String(form.get('replace_id')||'');
const poster=form.get('poster'),video=form.get('video'),target=form.get('target');
if(!title||title.length>80||!Number.isFinite(ratio)||ratio<.1||ratio>10||replaceId&&!UUID.test(replaceId))throw Error('INVALID_FILES');
if(!(poster instanceof File)||!(video instanceof File)||!(target instanceof File))throw Error('INVALID_FILES');
if(!poster.size||poster.size>2*MIB||!video.size||video.size>10*MIB||!target.size||target.size>5*MIB||!target.name.toLowerCase().endsWith('.mind'))throw Error('INVALID_FILES');
const p=new Uint8Array(await poster.slice(0,12).arrayBuffer()),v=new Uint8Array(await video.slice(0,12).arrayBuffer());
const jpeg=p[0]===255&&p[1]===216&&p[2]===255,png=p[0]===137&&p[1]===80&&p[2]===78&&p[3]===71&&p[4]===13&&p[5]===10&&p[6]===26&&p[7]===10;
if(!jpeg&&!png||v[4]!==102||v[5]!==116||v[6]!==121||v[7]!==112)throw Error('INVALID_FILES');
const bytes=poster.size+video.size+target.size;
const reserved=replaceId?await client.rpc('ar_reserve_replacement',{p_owner:user.id,p_project:replaceId,p_bytes:bytes}):await client.rpc('ar_reserve',{p_owner:user.id,p_title:title,p_ratio:ratio,p_bytes:bytes});
if(reserved.error)reserveError(reserved.error);if(replaceId){jobId=reserved.data;projectId=replaceId;}else projectId=reserved.data;
const folder='/salva-ar/'+user.id+'/'+projectId+(jobId?'/versions/'+jobId:'');
async function upload(file,name){const data=new FormData();data.set('file',file,name);data.set('fileName',name);data.set('folder',folder);data.set('useUniqueFileName','false');data.set('overwriteFile','false');
const r=await fetch('https://upload.imagekit.io/api/v1/files/upload',{method:'POST',headers:{Authorization:authHeader},body:data,signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error('IMAGEKIT_ERROR');const result=await r.json();
if(typeof result.fileId==='string')uploaded.push(result.fileId);
if(typeof result.fileId!=='string'||typeof result.url!=='string'||!result.url.startsWith(BASE))throw Error('IMAGEKIT_ERROR');
const saved=jobId?await client.from('ar_replacements').update({file_ids:uploaded}).eq('id',jobId).eq('owner_id',user.id):await client.from('ar_projects').update({file_ids:uploaded}).eq('id',projectId).eq('owner_id',user.id);if(saved.error)throw Error('DB_ERROR');return result.url;}
const posterUrl=await upload(poster,jpeg?'poster.jpg':'poster.png'),targetUrl=await upload(target,'targets.mind'),videoUrl=await upload(video,'video.mp4');
if(jobId){
const saved=await client.rpc('ar_finish_replacement',{p_owner:user.id,p_job:jobId,p_title:title,p_ratio:ratio,p_poster:posterUrl,p_video:videoUrl,p_target:targetUrl});
if(saved.error)throw Error('DB_ERROR');committed=true;
const old=await client.from('ar_replacements').select('*').eq('id',jobId).single();const cleanupPending=old.error||!old.data?true:!await cleanupJob(old.data);
return reply({ok:true,id:projectId,cleanupPending});
}
const saved=await client.from('ar_projects').update({state:'published',poster_url:posterUrl,video_url:videoUrl,target_url:targetUrl,file_ids:uploaded}).eq('id',projectId).eq('owner_id',user.id);if(saved.error)throw Error('DB_ERROR');committed=true;return reply({ok:true,id:projectId});
}catch(error){
if(projectId&&client&&!committed){
// Commit yanıtı kaybolmuş olabilir: yayınlanan yeni dosyaları silme.
try {
if(jobId){const check=await client.from('ar_replacements').select('*').eq('id',jobId).single();if(check.error||!check.data||check.data.state==='cleanup')committed=true;}
else{const check=await client.from('ar_projects').select('state').eq('id',projectId).single();if(check.error||check.data?.state==='published')committed=true;}
}catch{committed=true;}
}
if(projectId&&client&&!committed){
const remaining=await removeFiles(uploaded);
if(jobId){if(!remaining.length)await client.from('ar_replacements').delete().eq('id',jobId);else await client.from('ar_replacements').update({file_ids:remaining,state:'failed'}).eq('id',jobId);}
else if(!remaining.length)await client.from('ar_projects').delete().eq('id',projectId);
else await client.from('ar_projects').update({file_ids:remaining,state:'failed'}).eq('id',projectId);
}
const errors={BODY_LIMIT:'Dosya boyutu sınırı aşıldı.',BAD_BODY:'İstek okunamadı.',INVALID_FILES:'Poster JPG/PNG (2 MB), video MP4 (10 MB), hedef .mind (5 MB) olmalı.',LIMIT_USER:'En fazla 3 proje oluşturabilirsin.',LIMIT_DAILY:'Son 24 saatte 5 yükleme denemesi sınırına ulaştın.',LIMIT_GLOBAL_DAILY:'Günlük ortak yükleme sınırına ulaşıldı.',LIMIT_STORAGE:'Ortak depolama dolu. Güncellemede eski ve yeni dosyalar için geçici alan gerekir.',UPDATE_BUSY:'Bu projede başka bir işlem sürüyor. Yarım kalan işlemler için 15 dakika sonra silmeyi deneyebilirsin.',NOT_FOUND:'Proje bulunamadı veya bu hesaba ait değil.',DB_ERROR:'Veritabanı işlemi tamamlanamadı.',MIGRATION_REQUIRED:'Sunucu güncellemesi henüz uygulanmamış.',IMAGEKIT_ERROR:'Dosyalar depoya yüklenemedi.',CLEANUP_ERROR:'Bazı dosyalar temizlenemedi. Silmeyi tekrar deneyebilirsin.'};
const code=error.message||'',status=code==='BODY_LIMIT'?413:code==='INVALID_FILES'||code==='BAD_BODY'?400:code==='NOT_FOUND'?404:code==='UPDATE_BUSY'||code==='LIMIT_USER'?409:code.startsWith('LIMIT_')?429:502;
return reply({error:errors[code]||'İşlem tamamlanamadı.'},status);
}
});