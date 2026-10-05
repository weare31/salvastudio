(async()=>{
const status=document.getElementById('viewerStatus'),cfg=window.SALVA;
const say=text=>status.textContent=text;
let scene,video,found=false;
try {
 if(!isSecureContext)throw new Error('Kamera için HTTPS adresini kullan.');
 if(!window.supabase||!window.AFRAME||!AFRAME.components['mindar-image'])throw new Error('AR kütüphaneleri yüklenemedi. Sayfayı yeniden aç.');
 if(!navigator.mediaDevices?.getUserMedia)throw new Error('Sayfayı Safari veya Chrome ile aç.');
 const id=new URLSearchParams(location.search).get('id');
 if(!id||!/^[0-9a-f-]{36}$/i.test(id))throw new Error('Geçerli bir AR bağlantısı kullan.');
 const db=supabase.createClient(cfg.supabaseUrl,cfg.supabaseKey);
 const {data:row,error}=await db.from('ar_projects').select('title,poster_url,video_url,target_url,aspect_ratio').eq('id',id).eq('state','published').single();
 if(error||!row)throw new Error('Bu çalışma bulunamadı veya silinmiş.');
 document.title=row.title+' · Salva AR';
 const a=document.getElementById('posterLink');a.href='poster.html?id='+encodeURIComponent(id);a.hidden=false;
 scene=document.createElement('a-scene');
 scene.setAttribute('mindar-image',{imageTargetSrc:row.target_url,autoStart:false,uiLoading:'no',uiScanning:'no',uiError:'no',filterMinCF:.001,filterBeta:.001,warmupTolerance:5,missTolerance:10});
 scene.setAttribute('renderer','alpha: true; colorManagement: true');
 scene.setAttribute('vr-mode-ui','enabled: false');scene.setAttribute('device-orientation-permission-ui','enabled: false');
 const assets=document.createElement('a-assets');video=document.createElement('video');video.id='arVideo';video.crossOrigin='anonymous';video.src=row.video_url;video.loop=true;video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='auto';video.setAttribute('playsinline','');video.setAttribute('muted','');assets.append(video);scene.append(assets);
 const camera=document.createElement('a-camera');camera.setAttribute('look-controls','enabled: false');scene.append(camera);
 const target=document.createElement('a-entity');target.setAttribute('mindar-image-target','targetIndex: 0');
 const plane=document.createElement('a-video');plane.setAttribute('src','#arVideo');plane.setAttribute('width','1');plane.setAttribute('height',String(1/row.aspect_ratio));plane.setAttribute('position','0 0 .001');target.append(plane);scene.append(target);
 async function play(){try{await video.play();if(!found||document.hidden)video.pause();}catch{say('Tarayıcı otomatik oynatmayı engelledi. Sayfayı yeniden açıp dene.');}}
 target.addEventListener('targetFound',()=>{found=true;document.getElementById('viewerLinks').hidden=true;say('Poster tanındı');play();});
 target.addEventListener('targetLost',()=>{found=false;video.pause();say('Kameranı tekrar postere tut');});
 video.addEventListener('waiting',()=>{if(found)say('Video yükleniyor…');});video.addEventListener('playing',()=>{if(found)say('Poster tanındı · Video oynuyor');});
 video.addEventListener('error',()=>{say('Video yüklenemedi. Bağlantını veya videonun biçimini kontrol et.');});
 scene.addEventListener('arReady',()=>{document.documentElement.classList.add('ar-camera-active');say('Kameranı posterin tamamına doğrult');});
 scene.addEventListener('arError',()=>say('Kamera başlatılamadı. Tarayıcı kamera izinlerini kontrol et.'));
 scene.addEventListener('loaded',async()=>{say('Kamera hazırlanıyor…');try{await scene.systems['mindar-image-system'].start();}catch{say('Kamera veya hedef dosyası yüklenemedi. İzinleri ve interneti kontrol et.');}},{once:true});
 document.body.append(scene);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(found)play();});
 window.addEventListener('pagehide',()=>{video.pause();scene.systems['mindar-image-system']?.stop();});
 window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
}catch(e){say(e.message);}
})();
