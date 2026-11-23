(() => {
'use strict';
const cfg=window.SALVA;
const message=(text,error=false)=>{const el=document.getElementById('message');if(el){el.textContent=text;el.classList.toggle('error',error);}};
if(!cfg||!window.supabase){message('Bağlantı dosyaları yüklenemedi. Sayfayı yenile.',true);return;}
const db=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseKey);
window.SalvaApp={db,cfg,message,
url:(page,id)=>{const u=new URL(page,location.href);if(id)u.searchParams.set('id',id);return u;},
async call(body){const {data,error}=await db.auth.getSession();if(error||!data.session)throw Error('Devam etmek için giriş yap.');
const form=body instanceof FormData;const response=await fetch(cfg.supabaseUrl+'/functions/v1/'+cfg.functionName,{method:'POST',headers:{apikey:cfg.supabaseKey,Authorization:'Bearer '+data.session.access_token,...(form?{}:{'Content-Type':'application/json'})},body:form?body:JSON.stringify(body)});
let result;try{result=await response.json();}catch{throw Error('Sunucu yanıtı okunamadı.');}if(!response.ok)throw Error(result.error||'İşlem tamamlanamadı.');return result;},
qrSvg(text){if(!window.qrcode)throw Error('QR aracı yüklenemedi. Sayfayı yenile.');const code=window.qrcode(0,'M');code.addData(text);code.make();return code.createSvgTag({cellSize:6,margin:24,scalable:true});},
download(blob,name){const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),10000);},
bytes:n=>(n/1024/1024).toFixed(1)+' MB'};
})();