(() => {
  'use strict';
  const cfg = window.AR_CONFIG;
  const intro = document.querySelector('#intro');
  const startup = document.querySelector('#startup');
  const status = document.querySelector('#status');
  const hint = document.querySelector('#hint');
  const retry = document.querySelector('#retry');
  retry.onclick = () => location.reload();
  let scene, video, found = false, ready = false;
  const fail = message => {
    scene?.systems['mindar-image-system']?.stop();
    video?.pause();
    intro.hidden = false; status.hidden = true; hint.hidden = true;
    startup.textContent = message; retry.hidden = false;
  };
  if (!window.isSecureContext) return fail('Kamera için HTTPS gerekir. GitHub Pages adresini HTTPS ile aç.');
  if (!navigator.mediaDevices?.getUserMedia) return fail('Kamera desteklenmiyor. Sayfayı telefonunun Safari veya Chrome tarayıcısında aç.');
  if (!window.AFRAME || !AFRAME.components['mindar-image']) return fail('AR dosyaları yüklenemedi. İnternet bağlantını kontrol edip yeniden dene.');
  if (!cfg || !(cfg.aspectRatio > 0)) return fail('Afiş boyut ayarını kontrol et.');
  const setStatus = text => { status.hidden = false; status.textContent = text; };
  scene = document.createElement('a-scene');
  scene.setAttribute('mindar-image', {imageTargetSrc: cfg.target, autoStart: false, uiLoading: 'no', uiScanning: 'no', uiError: 'no'});
  scene.setAttribute('vr-mode-ui', 'enabled: false');
  scene.setAttribute('device-orientation-permission-ui', 'enabled: false');
  scene.setAttribute('renderer', 'colorManagement: true; alpha: true');
  const camera = document.createElement('a-camera');
  camera.setAttribute('position', '0 0 0'); camera.setAttribute('look-controls', 'enabled: false');
  scene.append(camera);
  const target = document.createElement('a-entity');
  target.setAttribute('mindar-image-target', 'targetIndex: 0');
  scene.append(target);
  if (cfg.video) {
    const assets = document.createElement('a-assets');
    video = document.createElement('video'); video.id = 'animation';
    video.crossOrigin = 'anonymous'; video.muted = true; video.defaultMuted = true;
    video.loop = true; video.playsInline = true; video.preload = 'auto';
    video.setAttribute('playsinline', ''); video.setAttribute('muted', ''); video.src = cfg.video;
    assets.append(video); scene.prepend(assets);
    const plane = document.createElement('a-video');
    plane.setAttribute('src', '#animation'); plane.setAttribute('width', '1');
    plane.setAttribute('height', String(1 / cfg.aspectRatio));
    plane.setAttribute('position', '0 0 0.001'); target.append(plane);
    video.addEventListener('error', () => fail('Video yüklenemedi. Dosya yolunu ve MP4 biçimini kontrol et.'));
    video.addEventListener('waiting', () => { if(found) setStatus('Animasyon yükleniyor…'); });
    video.addEventListener('playing', () => { if(found) setStatus('Afiş tanındı · Animasyon oynuyor'); });
  } else {
    // Ses veya video gerektirmeyen hafif hareket testi.
    const ring = document.createElement('a-torus');
    ring.setAttribute('radius', '.18'); ring.setAttribute('radius-tubular', '.012');
    ring.setAttribute('position', '0 0 .08'); ring.setAttribute('material', 'shader: flat; color: #c4ef97');
    ring.setAttribute('animation', 'property: rotation; to: 0 360 0; dur: 5000; easing: linear; loop: true');
    target.append(ring);
    const cube = document.createElement('a-box');
    cube.setAttribute('width','.13'); cube.setAttribute('height','.13'); cube.setAttribute('depth','.13');
    cube.setAttribute('position','0 0 .13'); cube.setAttribute('material','shader: flat; color: #ef936b');
    cube.setAttribute('animation','property: rotation; to: 360 360 0; dur: 6000; easing: linear; loop: true');
    target.append(cube);
  }
  async function play() {
    if (!video || !found || document.hidden) return;
    try { await video.play(); if(!found || document.hidden) video.pause(); }
    catch { setStatus('Otomatik oynatma engellendi. Tarayıcı ayarlarını kontrol edip sayfayı yeniden aç.'); }
  }
  target.addEventListener('targetFound', () => {
    found = true; hint.hidden = true;
    setStatus(video ? 'Afiş tanındı · Animasyon hazırlanıyor' : 'Kart tanındı · AR çalışıyor');
    if (video && cfg.restartOnFound) video.currentTime = 0;
    play();
  });
  target.addEventListener('targetLost', () => {
    found = false; video?.pause(); setStatus('Kameranı tekrar karta tut'); hint.hidden = false;
  });
  scene.addEventListener('arReady', () => {
    ready = true; intro.hidden = true; hint.hidden = false; setStatus('Kameranı örnek karta tut');
  });
  scene.addEventListener('arError', () => fail('Kamera başlatılamadı. Kamera iznini, açık diğer kamera uygulamalarını ve tarayıcını kontrol et.'));
  scene.addEventListener('loaded', async () => {
    try { await scene.systems['mindar-image-system'].start(); }
    catch (error) { fail(error?.name === 'NotAllowedError' ? 'Kamera izni verilmedi. Tarayıcı ayarlarından izin verip yeniden dene.' : 'AR başlatılamadı. Bağlantını ve kamera iznini kontrol edip yeniden dene.'); }
  }, {once: true});
  document.body.append(scene);
  document.addEventListener('visibilitychange', () => { if(document.hidden) video?.pause(); else play(); });
  window.addEventListener('pagehide', () => { video?.pause(); scene.systems['mindar-image-system']?.stop(); });
  window.addEventListener('pageshow', e => { if(e.persisted) location.reload(); });
  setTimeout(() => { if(!ready && retry.hidden) startup.textContent = 'Yükleme sürüyor. Kamera izin penceresini ve internet bağlantını kontrol et.'; }, 20000);
})();
