import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');
async function runBackendTests(source){
const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
const ID='11111111-1111-4111-8111-111111111111',USER='22222222-2222-4222-8222-222222222222',JOB='33333333-3333-4333-8333-333333333333',BASE='https://ik.imagekit.io/b6yycb6z6/';
const results=[];
async function scenario(name,options,check){
let handler,uploads=0,deleted=[];
const state={projects:options.existing?[{id:ID,owner_id:USER,state:'published',title:'Eski',total_bytes:500,file_ids:['old-p','old-t','old-v'],poster_url:BASE+'old.jpg',video_url:BASE+'old.mp4',target_url:BASE+'old.mind'}]:[],jobs:[],attempts:[]};
class Query{
constructor(table){this.table=table;this.filters=[];this.op='select';}
select(cols,opts){this.opts=opts;return this;}eq(k,v){this.filters.push(r=>r[k]===v);return this;}gte(){return this;}limit(){return this;}single(){this.one=true;return this;}
update(data){this.op='update';this.patch=data;return this;}delete(){this.op='delete';return this;}
then(resolve,reject){try{const arr=this.table==='ar_projects'?state.projects:this.table==='ar_replacements'?state.jobs:state.attempts,rows=arr.filter(r=>this.filters.every(fn=>fn(r)));
if(this.op==='update')rows.forEach(r=>Object.assign(r,this.patch));if(this.op==='delete')for(const r of rows)arr.splice(arr.indexOf(r),1);
resolve({data:this.one?rows[0]||null:rows,count:rows.length,error:null});}catch(e){reject(e);}}
}
const client={auth:{getUser:async()=>options.invalid?{data:{user:null},error:{message:'invalid'}}:{data:{user:{id:USER,email_confirmed_at:options.unconfirmed?null:'yes'}},error:null}},from:table=>new Query(table),
rpc:async(name,args)=>{
if(options.reserveError&&name.startsWith('ar_reserve'))return {error:{message:options.reserveError}};
if(name==='ar_reserve_replacement'){if(!state.projects.length)return {error:{message:'NOT_FOUND'}};state.jobs.push({id:JOB,project_id:ID,owner_id:USER,total_bytes:args.p_bytes,file_ids:[],state:'uploading'});return {data:JOB};}
if(name==='ar_reserve'){state.projects.push({id:ID,owner_id:USER,state:'uploading',total_bytes:args.p_bytes,file_ids:[]});return {data:ID};}
if(name==='ar_finish_replacement'){const row=state.projects[0],job=state.jobs[0],old=row.file_ids;Object.assign(row,{title:args.p_title,poster_url:args.p_poster,video_url:args.p_video,target_url:args.p_target,file_ids:job.file_ids,total_bytes:job.total_bytes});job.file_ids=old;job.state='cleanup';if(options.lostCommit)return {error:{message:'connection lost'}};return {data:ID};}
if(name==='ar_claim_delete'){if(!state.projects.length)return {error:{message:'NOT_FOUND'}};state.projects[0].state='failed';return {data:null};}
return {error:{message:'unknown rpc'}};
}};
class FakeFile{constructor(name,bytes){this.name=name;this.bytes=new Uint8Array(bytes);this.size=bytes.length;}slice(a,b){const bytes=this.bytes.slice(a,b);return {arrayBuffer:async()=>bytes.buffer};}}
class FakeBlob{constructor(chunks){this.chunks=chunks;}async text(){return this.chunks.map(b=>String.fromCharCode(...b)).join('');}}
class FakeForm{constructor(){this.fields=new Map();}get(k){return this.fields.get(k);}set(k,v){this.fields.set(k,v);}}
const form=new FakeForm();for(const [k,v]of Object.entries({title:'Yeni',aspect_ratio:'0.7',poster:new FakeFile('p.png',[137,80,78,71,13,10,26,10,0,0,0,0]),video:new FakeFile('v.mp4',[0,0,0,0,102,116,121,112,0,0,0,0]),target:new FakeFile('targets.mind',[1,2,3])}))form.set(k,v);if(options.replace)form.set('replace_id',ID);if(options.badVideo)form.set('video',new FakeFile('v.mp4',[1,2,3,4,5,6,7,8]));
class FakeResponse{constructor(){ }static json(data,{status=200,headers}={}){return {data,status,headers};}async formData(){return form;}}
const fetchMock=async(url,opts)=>{if(opts.method==='DELETE'){deleted.push(url.split('/').pop());return {ok:true,status:204};}
uploads++;if(options.failUpload===uploads)return {ok:false,status:500};return {ok:true,json:async()=>({fileId:'new-'+uploads,url:BASE+'new-'+uploads})};};
new Function('Deno','createClient','Response','Blob','File','FormData','fetch','btoa','AbortSignal',source.replace(/^import .*;$/m,''))({env:{get:()=>'configured'},serve:fn=>handler=fn},()=>client,FakeResponse,FakeBlob,FakeFile,FakeForm,fetchMock,()=>'',{timeout:()=>({})});
const json=options.action?JSON.stringify({action:options.action,id:options.id||ID}):'files';
let read=false;
const req={method:options.method||'POST',headers:{get:k=>({origin:options.origin||'https://salvastudio.co',authorization:options.noAuth?'':'Bearer token','content-type':options.action?'application/json':'multipart/form-data; boundary=test','content-length':options.oversize?'999999999':String(json.length)})[k]||null},body:{getReader:()=>({read:async()=>{if(read)return {done:true};read=true;return {done:false,value:new Uint8Array([...json].map(c=>c.charCodeAt(0)))};},cancel:async()=>{},releaseLock(){}})}};
const response=await handler(req);await check(response,{state,uploads,deleted});results.push(name);
}
await scenario('Foreign origin rejected',{origin:'https://evil.example'},r=>assert(r.status===403,'origin'));
await scenario('Missing login rejected',{noAuth:true},r=>assert(r.status===401,'auth'));
await scenario('Invalid token rejected',{invalid:true},r=>assert(r.status===401,'token'));
await scenario('Unconfirmed account rejected',{unconfirmed:true},r=>assert(r.status===401,'confirmed'));
await scenario('Oversize body rejected',{oversize:true},r=>assert(r.status===413,'body'));
await scenario('Invalid MP4 rejected',{badVideo:true},r=>assert(r.status===400,'magic'));
await scenario('Usage capabilities and quota',{existing:true,action:'usage'},r=>assert(r.status===200&&r.data.updates&&r.data.storageUsed===500,'usage'));
await scenario('New upload publishes three files',{},(r,c)=>assert(r.status===200&&c.uploads===3&&c.state.projects[0].state==='published','upload'));
await scenario('Project limit enforced',{reserveError:'LIMIT_USER'},r=>assert(r.status===409,'limit'));
await scenario('Cannot replace another owner project',{replace:true},r=>assert(r.status===404,'ownership'));
await scenario('Replacement keeps id and cleans old files',{existing:true,replace:true},(r,c)=>assert(r.status===200&&r.data.id===ID&&c.state.projects[0].video_url===BASE+'new-3'&&c.deleted.includes('old-v')&&!c.deleted.includes('new-3'),'replace'));
await scenario('Failed replacement preserves old version',{existing:true,replace:true,failUpload:2},(r,c)=>assert(r.status===502&&c.state.projects[0].video_url===BASE+'old.mp4'&&c.deleted.includes('new-1')&&!c.deleted.includes('old-v'),'rollback'));
await scenario('Lost commit response does not delete live assets',{existing:true,replace:true,lostCommit:true},(r,c)=>assert(r.status===502&&c.state.projects[0].video_url===BASE+'new-3'&&!c.deleted.some(x=>x.startsWith('new-')),'ambiguous commit'));
await scenario('Delete removes project assets',{existing:true,action:'delete'},(r,c)=>assert(r.status===200&&!c.state.projects.length&&c.deleted.includes('old-v'),'delete'));
return results;
}
async function runAuthTests(source){
const results=[];const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
async function setup(signup,mismatch=false){
const el={};for(const id of ['authForm','email','password','passwordAgain','authSubmit','verifyHelp','resend'])el[id]={value:'',hidden:true,disabled:false};el.authForm.dataset={mode:signup?'signup':'login'};el.email.value='test@example.com';el.password.value='long-password';el.passwordAgain.value=mismatch?'different':'long-password';let signedUp=0,signedIn=0,redirected=false,notice='';
const db={auth:{getSession:async()=>({data:{session:null}}),signUp:async()=>{signedUp++;return {data:{session:null},error:null}},signInWithPassword:async()=>{signedIn++;return {data:{session:{access_token:'ok'}},error:null}}}};
new Function('window','document','location','URL','setTimeout','clearTimeout',source)({SalvaApp:{db,message:text=>notice=text}},{getElementById:id=>el[id]},{href:'https://salvastudio.co/ar/signup.html',replace:()=>redirected=true},function(){this.href='https://salvastudio.co/ar/';},()=>1,()=>{});
await el.authForm.onsubmit({preventDefault(){}});
return {el,signedUp,signedIn,redirected,notice};}
const a=await setup(true);assert(a.signedUp===1&&!a.redirected&&!a.el.resend.hidden&&a.notice.includes('Doğrulama'),'signup must request confirmation and stay');results.push('Signup has separate confirmation flow');
const b=await setup(true,true);assert(b.signedUp===0&&b.notice.includes('aynı'),'mismatch');results.push('Mismatching signup passwords blocked');
const c=await setup(false);assert(c.signedIn===1&&c.redirected,'login');results.push('Login redirects authenticated user to studio');
return results;
}
const js=['common','auth','studio','poster','collection','viewer'];
for(const name of js)new Function(read('ar/'+name+'.js'));
const backend=await runBackendTests(read('supabase/quick-task.ts'));
const auth=await runAuthTests(read('ar/auth.js'));
const html=read('ar/index.html'),studio=read('ar/studio.js');
for(const match of studio.matchAll(/\$\('([^']+)'\)/g))if(!html.includes('id="'+match[1]+'"'))throw Error('Missing UI element: '+match[1]);
if(!read('ar/login.html').includes('data-mode="login"')||!read('ar/signup.html').includes('data-mode="signup"'))throw Error('Auth routes must be separate');
console.log('PASS: '+(backend.length+auth.length)+' behavior checks, 6 JavaScript syntax checks, studio element contract and auth routes.');
