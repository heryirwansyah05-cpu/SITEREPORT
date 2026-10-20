const $=id=>document.getElementById(id);let chosenPhoto=null,sites=[];let latestResult=null;
fetch('data/sites.json').then(r=>{if(!r.ok)throw Error('Database site tidak termuat');return r.json()}).then(x=>{sites=x}).catch(e=>console.warn(e));
$('photo').addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(!f)return;if(!f.type.startsWith('image/')){alert('Pilih file gambar seperti JPG atau PNG.');return}chosenPhoto=f;$('uploadTitle').textContent=f.name;$('uploadHint').textContent='Foto siap dianalisis';$('preview').src=URL.createObjectURL(f);$('previewWrap').classList.remove('hidden');$('analyze').disabled=false;$('result').classList.add('hidden');$('readWarning').classList.add('hidden')});
$('analyze').addEventListener('click',analyzePhoto);$('again').addEventListener('click',()=>{$('photo').value='';chosenPhoto=null;$('uploadTitle').textContent='Pilih foto screenshot';$('uploadHint').textContent='JPG, PNG atau WEBP';$('previewWrap').classList.add('hidden');$('analyze').disabled=true;$('result').classList.add('hidden');window.scrollTo({top:0,behavior:'smooth'})});
function norm(s){return String(s||'').toLowerCase().replace(/\s+/g,' ').trim()}function num(s){if(s===undefined||s===null||s==='')return null;let n=Number(String(s).replace(',','.'));return Number.isFinite(n)?n:null}function match(text,re){const m=text.match(re);return m?m[1].trim():''}
function parseOcr(raw){let t=String(raw||'').replace(/\r/g,' ');const out={};
// G-Net Track screen in Indonesian: Bujur = longitude, Lintang = latitude.
out.lon=match(t,/(?:Bujur|Longitude|Long|Lon)\s*[:=]?\s*(-?\d{1,3}[.,]\d{4,})/i);
out.lat=match(t,/(?:Lintang|Latitude|Lat)\s*[:=]?\s*(-?\d{1,2}[.,]\d{4,})/i);
out.enb=match(t,/(?:eNB(?:\s*ID)?|eNodeB)\s*[:=]?\s*(\d{3,})/i);
out.cell=match(t,/(?:CID|Cell\s*ID|CELLID)\s*[:=]?\s*(\d{1,5})/i);
out.pci=match(t,/PCI\s*[:=]?\s*(\d{1,4})/i);
out.rsrp=match(t,/RSRP\s*[:=]?\s*(-?\d{1,3}(?:[.,]\d+)?)/i);
out.rsrq=match(t,/RSRQ\s*[:=]?\s*(-?\d{1,2}(?:[.,]\d+)?)/i);
out.sinr=match(t,/(?:SNR|SINR)\s*[:=]?\s*(-?\d{1,3}(?:[.,]\d+)?)/i);
out.band=match(t,/BAND\s*[:=]?\s*(L?\d+)/i);
out.tech=match(t,/(?:Jenis|Type|Network)\s*[:=]?\s*(4G|5G|LTE|NR)/i);
// Recover common OCR label/value spacing variations.
if(!out.rsrp){let m=t.match(/RSRP[^-\d]{0,8}(-\d{2,3})/i);if(m)out.rsrp=m[1]}
if(!out.rsrq){let m=t.match(/RSRQ[^-\d]{0,8}(-\d{1,2})/i);if(m)out.rsrq=m[1]}
if(!out.sinr){let m=t.match(/(?:SNR|SINR)[^ -\d]{0,8}(-?\d{1,2})/i);if(m)out.sinr=m[1]}
return {values:out,text:t}}
function haversine(a,b,c,d){const R=6371,rad=x=>x*Math.PI/180,dl=rad(c-a),dn=rad(d-b);const h=Math.sin(dl/2)**2+Math.cos(rad(a))*Math.cos(rad(c))*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)))}
function qRSRP(v){return v===null?null:v>=-90?'baik':v>=-105?'cukup':v>=-110?'lemah':'sangat lemah'}function qRSRQ(v){return v===null?null:v>=-10?'baik':v>=-15?'cukup':'buruk'}function qSINR(v){return v===null?null:v>=20?'baik':v>=5?'cukup':'rendah'}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function analyzePhoto(){if(!chosenPhoto)return;if(!window.Tesseract){showWarning('Modul pembaca foto belum tersedia. Periksa koneksi internet lalu muat ulang web.');return}$('analyze').disabled=true;$('progress').classList.remove('hidden');$('progressText').textContent='Membaca tulisan pada screenshot…';$('readWarning').classList.add('hidden');try{const worker=await Tesseract.createWorker('eng',1,{logger:m=>{if(m.status==='recognizing text')$('progressText').textContent='Membaca foto… '+Math.round((m.progress||0)*100)+'%'}});const res=await worker.recognize(chosenPhoto);await worker.terminate();const parsed=parseOcr(res.data.text);renderResult(parsed.values,parsed.text);$('progress').classList.add('hidden');$('result').classList.remove('hidden');$('result').scrollIntoView({behavior:'smooth',block:'start'});const count=Object.values(parsed.values).filter(Boolean).length;if(count<4)showWarning('Sebagian angka tidak terbaca jelas. Periksa bagian “Lihat data yang terbaca”. Coba screenshot yang lebih tajam dan tidak terpotong.');}catch(e){$('progress').classList.add('hidden');showWarning('Foto belum berhasil dibaca. Pastikan internet aktif dan coba lagi. Detail: '+e.message)}finally{$('analyze').disabled=false}}
function showWarning(t){$('readWarning').textContent=t;$('readWarning').classList.remove('hidden')}
function renderResult(v,ocrText){const rsrp=num(v.rsrp),rsrq=num(v.rsrq),sinr=num(v.sinr),lat=num(v.lat),lon=num(v.lon);const qr=[qRSRP(rsrp),qRSRQ(rsrq),qSINR(sinr)].filter(Boolean);let status='Perlu Perhatian',cls='warn',title='Data belum lengkap',problem='Sebagian parameter jaringan belum terbaca. Hasil ini belum cukup untuk menilai kondisi jaringan secara menyeluruh.';const weak=rsrp!==null&&rsrp < -110,badq=rsrq!==null&&rsrq<=-16,bads=sinr!==null&&sinr<5;const known=[rsrp,rsrq,sinr].filter(x=>x!==null).length;
if(known){if(weak||badq||bads){status='BURUK';cls='bad';title=weak?'Sinyal sangat lemah':'Kualitas jaringan buruk';let parts=[];if(weak)parts.push('daya sinyal yang diterima sangat lemah');if(badq)parts.push('kualitas sinyal buruk dan banyak gangguan' );if(bads)parts.push('sinyal kurang bersih sehingga koneksi data tidak stabil');problem=`KESIMPULAN: ${parts.join('; ')}.

DAMPAK KE PENGGUNA:
• Internet sangat lambat; halaman, gambar, dan aplikasi lama terbuka.
• Pesan WhatsApp tertahan dengan ikon jam pasir dan lama terkirim.
• WhatsApp call/video call, streaming, dan game online putus-putus, buffering, atau lag.
• Jika indikator bar di HP hanya 1 bar, itu tanda visual penerimaan sinyal rendah. Bar sinyal dan ikon WhatsApp harus dikonfirmasi langsung di HP, bukan disimpulkan dari angka G-Net Track saja.

TINDAKAN: Uji ulang di tempat terbuka dan di 2–3 titik berbeda. Jika tetap buruk, kirim laporan ini ke tim Technical untuk pemeriksaan site dan jaringan.`}else if(rsrp!==null&&rsrp>=-100&&(!badq)&&(!bads)){status='BAIK';cls='good';title='Kondisi sinyal cukup baik';problem=`KESIMPULAN: Parameter sinyal yang terbaca tergolong baik.

DAMPAK KE PENGGUNA: Chat WhatsApp, browsing, dan aplikasi internet seharusnya berpeluang berjalan normal. Namun, internet tetap bisa lambat jika jaringan padat, kuota/paket bermasalah, pengaturan HP bermasalah, atau ada gangguan layanan. Kualitas panggilan, streaming, dan game perlu dikonfirmasi melalui tes langsung.

TINDAKAN: Jika pengguna tetap mengalami internet lambat atau pesan WhatsApp tertahan, lakukan tes ulang dan kirim hasilnya ke tim Technical.`}else{status='PERLU PERHATIAN';cls='warn';title='Kualitas sinyal belum ideal';problem=`KESIMPULAN: Sebagian parameter sinyal berada pada tingkat menengah dan belum menunjukkan kondisi yang optimal.

DAMPAK KE PENGGUNA: Internet mungkin masih dapat digunakan, tetapi kecepatan dan kestabilannya bisa berubah. Pesan WhatsApp dapat lebih lama terkirim; panggilan video, streaming, atau game online mungkin tersendat. Ikon jam pasir dan jumlah bar harus diperiksa langsung pada HP.

TINDAKAN: Coba tes di beberapa titik dan bandingkan hasilnya. Jika keluhan tetap terjadi, teruskan laporan ke tim Technical.`}}
$('status').textContent=status;$('status').className='status '+cls;$('resultTitle').textContent=title;$('resultSub').textContent=(v.tech||'Jaringan seluler')+(v.band?' · Band '+v.band:'');
let usage='Data sinyal belum cukup untuk memperkirakan kenyamanan penggunaan aplikasi. Ambil screenshot yang lebih jelas lalu analisis kembali.';
if(known){if(weak||badq||bads){usage='Dampak penggunaan: internet sangat lambat. Chat WhatsApp tertahan dengan ikon jam pasir, sedangkan panggilan, streaming video, dan game online putus-putus atau lag.';}else if(rsrp!==null&&rsrp>=-100&&(!badq)&&(!bads)){usage='Perkiraan pemakaian: sinyal radio tergolong baik. Chat, browsing, dan aplikasi internet berpeluang berjalan normal; kualitas call/video call, streaming, dan game tetap bergantung pada kecepatan, ping, kepadatan jaringan, serta perangkat.';}else{usage='Dampak penggunaan: koneksi belum stabil. Chat dan browsing berjalan lambat, sementara panggilan video, streaming, dan game online tersendat.';}}
$('problem').textContent=problem+' '+usage;
let actions=[];if(weak)actions.push('Coba ukur di luar bangunan atau tempat lebih terbuka.');if(badq||bads)actions.push('Bandingkan hasil di 2–3 titik sekitar untuk melihat apakah kualitas berubah.');if(!known)actions.push('Ambil ulang screenshot yang menampilkan RSRP, RSRQ, dan SNR/SINR dengan jelas.');actions.push('Jika hasil tetap buruk di beberapa titik, kirim screenshot dan lokasi ke tim jaringan untuk pemeriksaan lebih lanjut.');$('actions').innerHTML=actions.slice(0,3).map(x=>'<li>'+esc(x)+'</li>').join('');
const read=[['GPS Latitude',v.lat||'Tidak terbaca'],['GPS Longitude',v.lon||'Tidak terbaca'],['eNB ID',v.enb||'Tidak terbaca'],['Cell ID',v.cell||'Tidak terbaca'],['PCI',v.pci||'Tidak terbaca'],['RSRP',v.rsrp?v.rsrp+' dBm':'Tidak terbaca'],['RSRQ',v.rsrq?v.rsrq+' dB':'Tidak terbaca'],['SNR / SINR',v.sinr?v.sinr+' dB':'Tidak terbaca']];$('readValues').innerHTML=read.map(([k,val])=>'<div class="read-item"><small>'+esc(k)+'</small><strong>'+esc(val)+'</strong></div>').join('');$('ocrText').textContent='Teks yang terbaca otomatis (untuk pemeriksaan):\n'+ocrText.slice(0,1200);
const gpsOk=lat!==null&&lon!==null&&Math.abs(lat)<=90&&Math.abs(lon)<=180;let near=[];if(gpsOk)near=sites.filter(s=>typeof s.lat==='number'&&typeof s.lon==='number').map(s=>({...s,km:haversine(lat,lon,s.lat,s.lon)})).sort((a,b)=>a.km-b.km).slice(0,3);
if(near.length){const s=near[0];$('siteName').textContent=s.name;$('siteDetails').textContent=s.id+(s.district?' · '+s.district:'')+' · '+(s.km<1?Math.round(s.km*1000)+' meter':s.km.toFixed(2)+' km')+' dari titik pengukuran';$('servingNote').textContent='Ini site terdekat berdasarkan koordinat, bukan konfirmasi site yang melayani HP.';$('mapLink').href='https://www.google.com/maps/dir/'+lat+','+lon+'/'+s.lat+','+s.lon;$('mapLink').classList.remove('hidden')}else{$('siteName').textContent='Lokasi belum terbaca';$('siteDetails').textContent='Koordinat GPS tidak ditemukan atau database site belum termuat.';$('servingNote').textContent='Pastikan screenshot menampilkan Bujur dan Lintang. Jika perlu, gunakan screenshot yang lebih jelas.';$('mapLink').classList.add('hidden')}
latestResult={status,title,problem,actions:actions.slice(0,3),site:near[0]||null,v};}
$('copy').addEventListener('click',async()=>{if(!latestResult)return;const r=latestResult,v=r.v||{};const site=r.site?`${r.site.name} (${r.site.id}), jarak ${r.site.km<1?Math.round(r.site.km*1000)+' meter':r.site.km.toFixed(2)+' km'}`:'Belum teridentifikasi dari koordinat';const report=[
'SIMPLE REPORT NETWORK ISSUE',
'Tujuan: Tim Technical',
'Status kondisi: '+r.status,
'Kesimpulan: '+(r.status==='BURUK'?'Sinyal sangat lemah (1 bar). Internet sangat lambat, chat WhatsApp tertahan dengan ikon jam pasir, dan koneksi putus-putus.':r.status==='BAIK'?'Parameter sinyal tergolong baik. Internet berjalan normal saat pengukuran.':'Kualitas sinyal belum ideal. Internet lambat dan koneksi tidak stabil.'),
'Parameter terbaca: RSRP '+(v.rsrp?v.rsrp+' dBm':'tidak terbaca')+' | RSRQ '+(v.rsrq?v.rsrq+' dB':'tidak terbaca')+' | SINR/SNR '+(v.sinr?v.sinr+' dB':'tidak terbaca'),
'Identitas sel: eNB '+(v.enb||'tidak terbaca')+' | Cell ID '+(v.cell||'tidak terbaca')+' | PCI '+(v.pci||'tidak terbaca'),
'Koordinat: '+(v.lat&&v.lon?v.lat+', '+v.lon:'tidak terbaca'),
'Site terdekat: '+(r.site?`${r.site.name} (${r.site.id}), jarak ${r.site.km<1?Math.round(r.site.km*1000)+' meter':r.site.km.toFixed(2)+' km'}`:'belum teridentifikasi dari koordinat'),
'Permintaan: Mohon bantu tim Technical melakukan pengecekan status SITE '+(r.site?`${r.site.id} - ${r.site.name}`:'yang terkait dengan titik pengukuran')+'.',
'Jaringan : '+$('network').value
].join('\n');try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(report)}else{throw Error('clipboard unavailable')} }catch(e){const ta=document.createElement('textarea');ta.value=report;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();const ok=document.execCommand('copy');ta.remove();if(!ok){alert('Laporan belum dapat disalin otomatis. Silakan pilih dan salin teks laporan dari hasil.');return}}const b=$('copy');b.textContent='Laporan tersalin ✓';b.classList.add('copied');setTimeout(()=>{b.textContent='Salin laporan untuk Technical';b.classList.remove('copied')},2200)});
