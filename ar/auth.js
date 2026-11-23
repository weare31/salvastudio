(() => {'use strict';const app=window.SalvaApp;if(!app)return;const {db,message}=app;const $=id=>document.getElementById(id);const form=$('authForm'),signup=form.dataset.mode==='signup';let submittedEmail='',cooldown;
db.auth.getSession().then(({data})=>{if(data.session)location.replace('./');});
form.onsubmit=async e=>{e.preventDefault();if(signup&&$('password').value!==$('passwordAgain').value){message('Şifreler aynı olmalı.',true);return;}
$('authSubmit').disabled=true;try{const email=$('email').value.trim(),password=$('password').value;const options={emailRedirectTo:new URL('./',location.href).href};
const {data,error}=signup?await db.auth.signUp({email,password,options}):await db.auth.signInWithPassword({email,password});if(error)throw error;
if(data.session){location.replace('./');return;}submittedEmail=email;message('Doğrulama e-postanı kontrol et. Bağlantıyı açtıktan sonra giriş yap.');$('verifyHelp').hidden=false;$('resend').hidden=false;
}catch(e){message(e.message,true);}finally{$('authSubmit').disabled=false;}};
$('resend').onclick=async()=>{if(!submittedEmail)return;$('resend').disabled=true;try{const {error}=await db.auth.resend({type:'signup',email:submittedEmail,options:{emailRedirectTo:new URL('./',location.href).href}});if(error)throw error;message('Doğrulama e-postası istendi. Gelen kutunu kontrol et.');}catch(e){message(e.message,true);}finally{clearTimeout(cooldown);cooldown=setTimeout(()=>{$('resend').disabled=false;},60000);}};
})();