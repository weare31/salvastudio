(() => {
'use strict';
const $ = id => document.getElementById(id);
const cfg = window.SALVA;
if (!window.supabase) { $('message').textContent = 'Bağlantı dosyaları yüklenemedi. Sayfayı yeniden aç.'; return; }
const db = supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
let session = null, busy = false;
const urls = {};
function message(text, error = false) { $('message').textContent = text; $('message').classList.toggle('error',error); }
function lock(value) { busy=value; $('publish').disabled=value; $('logout').disabled=value; }
async function loadProjects() {
  if (!session) return;
  const {data,error}=await db.from('ar_projects').select('id,title,poster_url,state,created_at').eq('owner_id',session.user.id).order('created_at',{ascending:false});
  if(error) { message('Çalışmalar yüklenemedi. Veritabanı kurulumunu kontrol et.',true); return; }
  $('projects').replaceChildren();
  if (!data.length) $('projects').textContent='İlk çalışmanı yukarıdan yükle.';
  for(const row of data) {
    const article=document.createElement('article');article.className='project';
    const h=document.createElement('h3');h.textContent=row.title;article.append(h);
    if(row.poster_url) { const img=document.createElement('img');img.src=row.poster_url;img.alt=row.title;img.loading='lazy';article.append(img); }
    const actions=document.createElement('div');actions.className='actions';
    if(row.state==='published') {
      const link=new URL('view.html',location.href);link.searchParams.set('id',row.id);
      const a=document.createElement('a');a.href=link.href;a.textContent='AR deneyimini aç ↗';a.target='_blank';a.rel='noopener';actions.append(a);
      const posterLink=document.createElement('a');const p=new URL('poster.html',location.href);p.searchParams.set('id',row.id);posterLink.href=p.href;posterLink.target='_blank';posterLink.rel='noopener';posterLink.textContent='Posteri aç';actions.append(posterLink);
      const copy=document.createElement('button');copy.className='secondary';copy.textContent='Linki kopyala';copy.onclick=async()=>{try{await navigator.clipboard.writeText(link.href);message('AR linki kopyalandı.');}catch{message(link.href);}};actions.append(copy);
    } else {const p=document.createElement('p');p.textContent=row.state==='uploading'?'Yükleme sürüyor veya yarım kaldı.':'Yükleme tamamlanamadı.';actions.append(p);}
    const del=document.createElement('button');del.className='secondary';del.textContent='Sil';del.onclick=async()=>{
      if(busy || !confirm('Bu çalışmayı ve yüklenen dosyalarını silmek istiyor musun?'))return;
      lock(true);
      try{await call({action:'delete',id:row.id});message('Çalışma silindi.');await loadProjects();}catch(e){message(e.message,true);}finally{lock(false);}
    };actions.append(del);article.append(actions);$('projects').append(article);
  }
}
function updateSession(next) { session=next;$('auth').hidden=!!next;$('workspace').hidden=!next;if(next) loadProjects(); }
db.auth.getSession().then(({data,error})=>{if(error)message(error.message,true);updateSession(data.session);});
db.auth.onAuthStateChange((_event,next)=>{setTimeout(()=>updateSession(next),0);});
$('authForm').onsubmit=async e=>{e.preventDefault();message('Giriş yapılıyor…');const {error}=await db.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});message(error ? error.message : 'Giriş yapıldı.',!!error);};
$('signup').onclick=async()=>{
 if(!$('authForm').reportValidity())return;
 $('signup').disabled=true;
 const {error}=await db.auth.signUp({email:$('email').value.trim(),password:$('password').value,options:{emailRedirectTo:new URL('./',location.href).href}});
 message(error ? error.message : 'Doğrulama e-postanı kontrol et. Daha sonra burada giriş yapabilirsin.',!!error);$('signup').disabled=false;
};
$('logout').onclick=async()=>{const {error}=await db.auth.signOut();message(error?error.message:'Çıkış yapıldı.',!!error);};
$('refresh').onclick=loadProjects;
for(const name of ['poster','video']) $(name).onchange=()=>{
 const file=$(name).files[0];if(urls[name])URL.revokeObjectURL(urls[name]);
 const preview=$(name+'Preview');preview.hidden=!file;
 if(file){urls[name]=URL.createObjectURL(file);preview.src=urls[name];if(name==='video')preview.load();}
};
async function call(body) {
 const {data,error}=await db.auth.getSession();if(error || !data.session)throw new Error('Yüklemek için tekrar giriş yap.');
 const isForm=body instanceof FormData;
 const response=await fetch(cfg.supabaseUrl+'/functions/v1/'+cfg.functionName,{
 method:'POST',headers:{apikey:cfg.supabaseKey,Authorization:'Bearer '+data.session.access_token,...(isForm?{}:{'Content-Type':'application/json'})},body:isForm?body:JSON.stringify(body)
 });
 let result;try{result=await response.json();}catch{throw new Error('Sunucu yanıtı okunamadı. Edge Function kurulumunu kontrol et.');}
 if(!response.ok)throw new Error(result.error || 'Yükleme başarısız ('+response.status+').');
 return result;
}
function readImage(file){return new Promise((resolve,reject)=>{const img=new Image();const u=URL.createObjectURL(file);img.onload=()=>{URL.revokeObjectURL(u);resolve(img);};img.onerror=()=>{URL.revokeObjectURL(u);reject(new Error('Poster okunamadı. JPG veya PNG kullan.'));};img.src=u;});}
function readVideo(file){return new Promise((resolve,reject)=>{const v=document.createElement('video');const u=URL.createObjectURL(file);v.preload='metadata';v.onloadedmetadata=()=>{const data={width:v.videoWidth,height:v.videoHeight,duration:v.duration};URL.revokeObjectURL(u);v.removeAttribute('src');v.load();resolve(data);};v.onerror=()=>{URL.revokeObjectURL(u);reject(new Error('Video okunamadı. H.264 MP4 kullan.'));};v.src=u;});}
$('uploadForm').onsubmit=async e=>{
 e.preventDefault();if(busy)return;lock(true);$('progress').hidden=false;$('progress').value=0;
 try {
 const poster=$('poster').files[0],video=$('video').files[0];
 if(!poster || !video)throw new Error('Poster ve video seç.');
 if(!['image/jpeg','image/png'].includes(poster.type)||poster.size>2*1024*1024)throw new Error('Poster JPG/PNG ve en fazla 2 MB olmalı.');
 if(video.type!=='video/mp4'||video.size>10*1024*1024)throw new Error('Video MP4 ve en fazla 10 MB olmalı.');
 const img=await readImage(poster),meta=await readVideo(video);
 if(img.width>4096||img.height>4096)throw new Error('Poster kenarlarını en fazla 4096 piksel olarak küçült.');
 const ratio=img.width/img.height;
 if(!meta.width||!meta.height||!Number.isFinite(meta.duration)||meta.duration>60)throw new Error('Video en fazla 60 saniye olmalı.');
 if(Math.abs((meta.width/meta.height)/ratio-1)>.03)throw new Error('Poster ve videonun en-boy oranları aynı olmalı.');
 let target=$('target').files[0];
 if(!target){
   if(!window.MINDAR?.IMAGE?.Compiler)throw new Error('Derleyici yüklenemedi. Tanıma dosyası bölümünden .mind dosyası ekleyebilirsin.');
   message('Poster tanıma dosyası hazırlanıyor. Bu işlem biraz sürebilir…');
   const canvas=document.createElement('canvas');const factor=Math.min(1,1200/Math.max(img.width,img.height));canvas.width=Math.round(img.width*factor);canvas.height=Math.round(img.height*factor);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
   const input=new Image();input.src=canvas.toDataURL('image/png');await input.decode();
   const compiler=new MINDAR.IMAGE.Compiler();
   await compiler.compileImageTargets([input],value=>{$('progress').value=Math.min(75,Math.round(value*.75));});
   const binary=await compiler.exportData();target=new File([binary],'targets.mind',{type:'application/octet-stream'});
 }
 if(!target.name.toLowerCase().endsWith('.mind')||target.size>5*1024*1024||!target.size)throw new Error('Tanıma dosyası .mind ve en fazla 5 MB olmalı.');
 const form=new FormData();form.set('title',$('title').value.trim());form.set('aspect_ratio',String(ratio));form.set('poster',poster);form.set('video',video);form.set('target',target);
 $('progress').value=80;message('Dosyalar yükleniyor. Bu sayfayı kapatma…');
 await call(form);$('progress').value=100;message('Çalışman yayınlandı. Aşağıdaki AR linkini telefonunda aç.');
 $('uploadForm').reset();for(const name of ['poster','video']){if(urls[name])URL.revokeObjectURL(urls[name]);$(name+'Preview').hidden=true;}
 await loadProjects();
 }catch(error){message(error.message,true);}finally{lock(false);}
};
})();
