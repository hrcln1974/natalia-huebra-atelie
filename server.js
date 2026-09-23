'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),url=require('url'),querystring=require('querystring');
const ROOT=__dirname, PORT=Number(process.env.PORT||3000), DATA_DIR=path.join(ROOT,'data'), DB_FILE=process.env.DB_PATH||path.join(DATA_DIR,'db.json'), UPLOAD_DIR=path.join(ROOT,'storage','uploads');
fs.mkdirSync(DATA_DIR,{recursive:true});fs.mkdirSync(UPLOAD_DIR,{recursive:true});
function slugify(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90)}
const defaults={business_name:'Ateliê Natália Huebra',phone:'(28) 99983-5920',email:'natytuany@hotmail.com',address:'R. Salomão Fadlalah, 86, Ibatiba - ES, 29395-000',instagram:'https://www.instagram.com/nataliahuebra',facebook:'https://www.facebook.com/share/1Emdx3eSRE/?mibextid=wwXIfr',youtube:'https://www.youtube.com/embed/MqpiMHmU2vI'};
const seedProducts=[
 {name:'Romance Atemporal',slug:'romance-atemporal',code:'NH-001',category:'Noivas',collection:'Essenciais',size:'Sob medida',color:'Off-white',fabric:'Renda',description:'Silhueta delicada, renda e acabamento sofisticado.',price:'Consulte',status:'disponivel',image:'assets/catalogo-vestido-1.jpg'},
 {name:'Elegância em Movimento',slug:'elegancia-em-movimento',code:'NH-002',category:'Festa',collection:'Celebração',size:'Sob medida',color:'Variado',fabric:'Sob consulta',description:'Modelagem marcante para celebrar com personalidade.',price:'Consulte',status:'disponivel',image:'assets/catalogo-vestido-2.jpg'},
 {name:'Exclusividade',slug:'exclusividade',code:'NH-003',category:'Sob encomenda',collection:'Personalizados',size:'Sob medida',color:'Personalizado',fabric:'Sob consulta',description:'Uma criação personalizada para o seu estilo e ocasião.',price:'Consulte',status:'disponivel',image:'assets/catalogo-vestido-3.jpg'}
];
const seedGallery=[
 {title:'Detalhes de renda',category:'noivas',url:'assets/noiva-renda.jpg',caption:'Detalhes de renda em vestido de noiva',status:'publicado',order:1},
 {title:'Criação para noiva',category:'noivas',url:'assets/noiva-2.jpg',caption:'Vestido de noiva',status:'publicado',order:2},
 {title:'Vestido de festa',category:'festa',url:'assets/modelo-1.jpg',caption:'Modelo usando vestido de festa',status:'publicado',order:3},
 {title:'Ambiente do Ateliê',category:'atelie',url:'assets/atelie-1.jpg',caption:'Ambiente do Ateliê Natália Huebra',status:'publicado',order:4},
 {title:'Detalhes do Ateliê',category:'atelie',url:'assets/atelie-2.jpg',caption:'Detalhes do Ateliê Natália Huebra',status:'publicado',order:5}
];
const seedVideos=[
 {title:'Conheça o Ateliê',category:'Institucional',url:'videos/video3.mp4',caption:'Ateliê Natália Huebra',type:'local',status:'publicado',order:1},
 {title:'Processo de criação',category:'Processo',url:'videos/video1.mp4',caption:'Criação Natália Huebra',type:'local',status:'publicado',order:2},
 {title:'Coleção',category:'Coleções',url:'videos/video2.mp4',caption:'Coleção Natália Huebra',type:'local',status:'publicado',order:3},
 {title:'Vídeo do Ateliê no YouTube',category:'Institucional',url:'https://www.youtube.com/embed/MqpiMHmU2vI',caption:'Vídeo do Ateliê Natália Huebra',type:'youtube',status:'publicado',order:4}
];
function hashPassword(p,s=crypto.randomBytes(16).toString('hex')){return `${s}:${crypto.scryptSync(p,s,64).toString('hex')}`}
function verifyPassword(p,h){try{const [s,x]=h.split(':');const y=crypto.scryptSync(p,s,64).toString('hex');return crypto.timingSafeEqual(Buffer.from(x,'hex'),Buffer.from(y,'hex'))}catch{return false}}
function readDB(){
 if(!fs.existsSync(DB_FILE)){
  const db={seq:{users:0,clients:0,leads:0,appointments:0,products:0,quotes:0,orders:0,measurements:0,payments:0,audit_logs:0,gallery:0,videos:0},users:[],clients:[],leads:[],appointments:[],products:seedProducts.map((x,i)=>({...x,id:i+1,created_at:new Date().toISOString()})),quotes:[],orders:[],measurements:[],payments:[],audit_logs:[],gallery:seedGallery.map((x,i)=>({...x,id:i+1,created_at:new Date().toISOString()})),videos:seedVideos.map((x,i)=>({...x,id:i+1,created_at:new Date().toISOString()})),settings:defaults};
  db.seq.products=seedProducts.length;db.seq.gallery=seedGallery.length;db.seq.videos=seedVideos.length;
  if(process.env.ADMIN_PASSWORD){const email=process.env.ADMIN_EMAIL||'admin@atelier-nataliahuebra.com';db.users.push({id:1,email,password_hash:hashPassword(process.env.ADMIN_PASSWORD),role:'super_admin',created_at:new Date().toISOString()});db.seq.users=1}
  fs.writeFileSync(DB_FILE,JSON.stringify(db,null,2));return db
 }
 const db=JSON.parse(fs.readFileSync(DB_FILE,'utf8'));
 if(!db.seq)db.seq={};
 db.settings={...defaults,...db.settings};
 for(const k of ['clients','leads','appointments','products','quotes','orders','measurements','payments','audit_logs','gallery','videos'])if(!Array.isArray(db[k]))db[k]=[];
 db.seq={users:0,clients:0,leads:0,appointments:0,products:0,quotes:0,orders:0,measurements:0,payments:0,audit_logs:0,gallery:0,videos:0,...db.seq};
 if(!db.products.length){db.products=seedProducts.map((x,i)=>({...x,id:i+1,created_at:new Date().toISOString()}));db.seq.products=seedProducts.length}
 db.products.forEach(p=>{if(!p.slug)p.slug=slugify(p.name);});
 if(!db.gallery.length){db.gallery=seedGallery.map((x,i)=>({...x,id:i+1,created_at:new Date().toISOString()}));db.seq.gallery=seedGallery.length}
 if(!db.videos.length){db.videos=seedVideos.map((x,i)=>({...x,id:i+1,created_at:new Date().toISOString()}));db.seq.videos=seedVideos.length}
 return db
}
let db=readDB();
if(!db.users.length) console.warn('Nenhum administrador configurado. Defina ADMIN_PASSWORD e execute npm run admin:create.');
function save(){const tmp=DB_FILE+'.tmp';fs.writeFileSync(tmp,JSON.stringify(db,null,2));fs.renameSync(tmp,DB_FILE)}
function next(k){db.seq[k]=(db.seq[k]||0)+1;return db.seq[k]}
function leadScore(o){let score=0;if(o.phone)score+=30;if(o.email)score+=15;if(o.interest)score+=20;if(o.message&&String(o.message).length>=20)score+=15;if(o.event_date)score+=10;if(o.source==='site')score+=5;if(o.status==='qualificado')score+=5;return Math.min(100,score)}
function add(k,o){o.id=next(k);o.created_at=new Date().toISOString();db[k].push(o);save();return o}
function find(k,id){return db[k].find(x=>x.id===Number(id))}
const securityHeaders={'X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(),microphone=(),geolocation=()','Content-Security-Policy':"default-src 'self'; img-src 'self' data:; media-src 'self'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; frame-src https://www.youtube.com https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'"};
function send(res,status,body,headers={}){const data=Buffer.from(JSON.stringify(body));res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':data.length,'Cache-Control':'no-store',...securityHeaders,...headers});res.end(data)}
function html(res,status,body){const data=Buffer.from(body);res.writeHead(status,{'Content-Type':'text/html; charset=utf-8','Content-Length':data.length,'Cache-Control':'no-store',...securityHeaders});res.end(data)}
function parseCookies(req){const out={};for(const p of (req.headers.cookie||'').split(';')){const i=p.indexOf('=');if(i>0)out[p.slice(0,i).trim()]=decodeURIComponent(p.slice(i+1).trim())}return out}
const sessions=new Map(), attempts=new Map();
function session(req){const t=parseCookies(req).atelier_session;const s=t&&sessions.get(t);if(!s||s.expires<Date.now()){if(t)sessions.delete(t);return null}return s}
function requireAuth(req,res){const s=session(req);if(!s){send(res,401,{error:'Não autenticado'});return null}return s}
function sameOrigin(req){if(['GET','HEAD','OPTIONS'].includes(req.method))return true;const origin=req.headers.origin;if(!origin)return true;return origin===`http://${req.headers.host}`||origin===`https://${req.headers.host}`}
function readBody(req){return new Promise((resolve,reject)=>{let b='';req.on('data',c=>{b+=c;if(b.length>1e6)req.destroy()});req.on('end',()=>{try{resolve(b?JSON.parse(b):{})}catch{reject(new Error('JSON inválido'))}});req.on('error',reject)})}
function publicPath(p){let fp=path.normalize(path.join(ROOT,p));if(!fp.startsWith(ROOT))return null;return fp}
function mime(fp){return ({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4','.ico':'image/x-icon','.xml':'application/xml','.txt':'text/plain; charset=utf-8'})[path.extname(fp).toLowerCase()]||'application/octet-stream'}
function staticFile(req,res,p){const fp=publicPath(p);if(!fp||!fs.existsSync(fp)||fs.statSync(fp).isDirectory())return false;res.writeHead(200,{'Content-Type':mime(fp),...securityHeaders,'X-Content-Type-Options':'nosniff','Cache-Control':p.startsWith('assets/')||p.startsWith('videos/')?'public,max-age=604800':'no-cache'});fs.createReadStream(fp).pipe(res);return true}
function log(req,action,entity,id){add('audit_logs',{user_id:session(req)?.user?.id||null,action,entity,entity_id:id||null})}
const fields={clients:['name','phone','email','event_type','event_date','instagram','notes','status'],leads:['name','phone','email','interest','message','source','status','score','next_follow_up','notes','tags'],appointments:['client_id','starts_at','kind','notes','status'],products:['name','code','category','collection','size','color','fabric','description','price','status','image'],quotes:['client_id','number','total','deposit','balance','valid_until','status','notes'],orders:['client_id','quote_id','number','status','total','notes'],measurements:['client_id','bust','waist','hip','height','shoulder','arm','length','shoe','notes'],payments:['client_id','order_id','description','amount','due_date','paid_at','status'],gallery:['title','category','url','caption','status','order'],videos:['title','category','url','caption','type','status','order']};
function safe(v){if(v===undefined||v===null)return '';return String(v).slice(0,5000)}
const adminHTML=fs.readFileSync(path.join(ROOT,'public/admin/index.html'),'utf8');
function productDetailHTML(product){
 const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const name=esc(product.name||'Criação Natália Huebra');
 const image=esc(product.image||'assets/catalogo-vestido-1.jpg');
 const category=esc(product.category||'Coleção');
 const description=esc(product.description||'Criação sob medida para o seu momento.');
 const price=esc(product.price||'Consulte disponibilidade e valores');
 const size=esc(product.size||'Sob medida');
 const color=esc(product.color||'Personalizado');
 const fabric=esc(product.fabric||'Sob consulta');
 const waText=encodeURIComponent('Olá! Tenho interesse no vestido "'+(product.name||'')+'" do Ateliê Natália Huebra. Gostaria de receber disponibilidade e valores.');
 return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="'+name+' — '+description+' | Ateliê Natália Huebra."><meta property="og:type" content="product"><meta property="og:title" content="'+name+' | Ateliê Natália Huebra"><meta property="og:description" content="'+description+'"><meta property="og:image" content="/'+image.replace(/^\//,'')+'"><meta property="og:locale" content="pt_BR"><link rel="canonical" href="/vestidos/'+esc(product.slug||slugify(product.name))+'"><link rel="icon" href="/icon.png"><link rel="stylesheet" href="/style.css"></head><body class="product-detail-page"><header class="site-header scrolled"><div class="container header-inner"><a class="brand" href="/" aria-label="Ateliê Natália Huebra — início"><span class="brand-mark">NH</span><span class="brand-text"><strong>Natália Huebra</strong><small>ATELIÊ</small></span></a><nav class="nav" style="display:flex" aria-label="Navegação principal"><a href="/">Início</a><a href="/#destaques">Destaques</a><a href="/#galeria">Galeria</a><a href="/#visita">Agendamento</a></nav></div></header><main class="product-detail-hero"><div class="container"><a class="detail-back" href="/#colecoes">← Voltar para coleções</a><div class="product-detail-grid"><div><img class="product-detail-image" src="/'+image+'" alt="'+name+'" loading="eager"></div><div class="product-detail-copy"><p class="kicker">'+category+'</p><h1>'+name+'</h1><p class="lead">'+description+'</p><p class="price">'+price+'</p><div class="detail-meta"><div><strong>Medida</strong><span>'+size+'</span></div><div><strong>Cor</strong><span>'+color+'</span></div><div><strong>Tecido</strong><span>'+fabric+'</span></div></div><div class="hero-actions"><a class="btn btn-gold" target="_blank" rel="noopener noreferrer" href="https://wa.me/5528999835920?text='+waText+'">TENHO INTERESSE</a><a class="btn btn-outline-dark" href="/#visita">AGENDAR ATENDIMENTO</a></div></div></div></div></main></body></html>';
}

function simplePage({title,description,canonicalPath,heading,bodyHtml,ctaHtml=''}) {
 const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const canonical = (canonicalPath || '/');
 return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${esc(description)}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:image" content="/assets/og-atelie.jpg"><meta property="og:locale" content="pt_BR">
<link rel="canonical" href="${esc(canonical)}"><link rel="icon" href="/icon.png"><title>${esc(title)}</title><link rel="stylesheet" href="/style.css"></head>
<body class="simple-page"><header class="site-header scrolled"><div class="container header-inner"><a class="brand" href="/" aria-label="Ateliê Natália Huebra — início"><span class="brand-mark">NH</span><span class="brand-text"><strong>Natália Huebra</strong><small>ATELIÊ</small></span></a><a class="nav-cta" href="/#visita">Agendar atendimento</a></div></header>
<main class="simple-page-main"><div class="narrow"><p class="eyebrow">ATELIÊ NATÁLIA HUEBRA</p><h1>${esc(heading)}</h1>${bodyHtml}${ctaHtml}</div></main><footer class="simple-page-footer"><a href="/">Voltar ao início</a></footer></body></html>`;
}
function notFoundHTML(){
 return simplePage({title:'Página não encontrada | Ateliê Natália Huebra',description:'A página solicitada não foi encontrada. Volte ao Ateliê Natália Huebra para continuar navegando.',canonicalPath:'/404',heading:'Página não encontrada',bodyHtml:'<p>O endereço que você acessou não existe ou foi movido. Você pode voltar ao início e continuar conhecendo nossas criações.</p>',ctaHtml:'<p><a class="btn btn-gold" href="/">Voltar ao início</a></p>'});
}
function privacyHTML(){
 return simplePage({title:'Política de Privacidade | Ateliê Natália Huebra',description:'Política de Privacidade do Ateliê Natália Huebra e informações sobre o tratamento de dados enviados pelo site.',canonicalPath:'/politica-de-privacidade',heading:'Política de Privacidade',bodyHtml:`<div class="legal-content">
<h2>1. Dados enviados pelo site</h2><p>Ao solicitar atendimento, você pode informar nome, telefone/WhatsApp, e-mail, interesse e mensagem. Esses dados são utilizados para responder ao contato e organizar o atendimento solicitado.</p>
<h2>2. Dados de leads</h2><p>Quando o formulário é enviado, os dados podem ser registrados no painel administrativo do Ateliê para acompanhamento do atendimento. O acesso é restrito à administração autorizada.</p>
<h2>3. WhatsApp</h2><p>O site pode abrir o WhatsApp para continuidade da conversa. O tratamento realizado pelo WhatsApp segue as políticas e condições da própria plataforma.</p>
<h2>4. Cookies e tecnologias de terceiros</h2><p>O site não utiliza cookies de publicidade por padrão. Serviços externos, quando habilitados, podem aplicar suas próprias tecnologias e políticas.</p>
<h2>5. Segurança e direitos</h2><p>São adotadas medidas técnicas compatíveis com a estrutura do site para proteger os dados. Para solicitar informação, correção ou exclusão de dados enviados pelo site, entre em contato pelo WhatsApp ou pelo e-mail <a href="mailto:natytuany@hotmail.com">natytuany@hotmail.com</a>.</p>
<h2>6. Atualizações</h2><p>Esta política pode ser atualizada para refletir mudanças no site ou na forma de atendimento.</p></div>`});
}
function thankYouHTML(){
 return simplePage({title:'Obrigado pelo contato | Ateliê Natália Huebra',description:'Agradecimento pelo contato com o Ateliê Natália Huebra.',canonicalPath:'/obrigado',heading:'Obrigada pelo seu contato!',bodyHtml:'<p>Seu pedido de atendimento foi recebido. Em seguida, o WhatsApp poderá ser aberto para você continuar a conversa com o Ateliê.</p><p>Enquanto isso, você pode conhecer nossas coleções e criações.</p>',ctaHtml:'<p><a class="btn btn-gold" href="/#colecoes">Ver coleções</a> <a class="btn btn-outline-dark" href="/">Voltar ao início</a></p>'});
}

async function route(req,res){
 const u=url.parse(req.url,true), p=u.pathname;
 if(p==='/health')return send(res,200,{ok:true,service:'atelier-natalia-huebra',version:'4.1.0'});
 if(p==='/404'&&req.method==='GET')return html(res,404,notFoundHTML());
 if(p==='/politica-de-privacidade'&&req.method==='GET')return html(res,200,privacyHTML());
 if(p==='/obrigado'&&req.method==='GET')return html(res,200,thankYouHTML());
 if(p==='/robots.txt'&&req.method==='GET'){res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8',...securityHeaders});return res.end('User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: /sitemap.xml\n');}
 if(p==='/sitemap.xml'&&req.method==='GET'){const urls=['/','/politica-de-privacidade'];db.products.filter(q=>q.status!=='inativo'&&q.status!=='oculto').forEach(q=>urls.push('/vestidos/'+(q.slug||slugify(q.name))));const xml='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(q=>'<url><loc>'+q+'</loc></url>').join('')+'</urlset>';res.writeHead(200,{'Content-Type':'application/xml; charset=utf-8',...securityHeaders});return res.end(xml);}
 const productRoute=p.match(/^\/vestidos\/([a-z0-9-]+)$/);if(productRoute&&req.method==='GET'){const product=db.products.find(q=>(q.slug||slugify(q.name))===productRoute[1]&&q.status!=='inativo'&&q.status!=='oculto');if(!product)return html(res,404,notFoundHTML());return html(res,200,productDetailHTML(product));}

 if(p==='/admin')return html(res,200,adminHTML);
 if(p==='/api/settings'&&req.method==='GET')return send(res,200,db.settings);
 if(p==='/api/public'&&req.method==='GET')return send(res,200,{settings:db.settings,products:db.products.filter(x=>x.status!=='inativo'&&x.status!=='oculto'),gallery:db.gallery.filter(x=>x.status==='publicado').sort((a,b)=>Number(a.order||0)-Number(b.order||0)),videos:db.videos.filter(x=>x.status==='publicado').sort((a,b)=>Number(a.order||0)-Number(b.order||0))});
 if(p==='/api/leads'&&req.method==='POST'){try{const b=await readBody(req);if(!b.name||!b.phone)return send(res,400,{error:'Nome e telefone são obrigatórios'});const x=add('leads',{name:safe(b.name),phone:safe(b.phone),email:safe(b.email),interest:safe(b.interest),message:safe(b.message),source:safe(b.source||'site'),status:'novo',score:leadScore(b),next_follow_up:safe(b.next_follow_up),notes:safe(b.notes),tags:safe(b.tags)});return send(res,201,{ok:true,id:x.id,score:x.score})}catch(e){return send(res,400,{error:e.message})}}
 if(p==='/api/auth/login'&&req.method==='POST'){const now=Date.now(),ip=req.socket.remoteAddress||'unknown',a=attempts.get(ip)||{n:0,t:now};if(now-a.t>15*60e3){a.n=0;a.t=now}if(a.n>=10)return send(res,429,{error:'Muitas tentativas. Tente novamente em alguns minutos.'});try{const b=await readBody(req),u=db.users.find(x=>x.email.toLowerCase()===String(b.email||'').toLowerCase());if(!u||!verifyPassword(String(b.password||''),u.password_hash)){a.n++;attempts.set(ip,a);return send(res,401,{error:'E-mail ou senha inválidos'})}a.n=0;attempts.set(ip,a);const token=crypto.randomBytes(32).toString('hex');sessions.set(token,{user:{id:u.id,email:u.email,role:u.role},expires:Date.now()+8*3600e3});return send(res,200,{ok:true,user:{email:u.email,role:u.role}},{'Set-Cookie':`atelier_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV==='production'?'; Secure':''}`})}catch(e){return send(res,400,{error:e.message})}}
 if(p==='/api/auth/logout'&&req.method==='POST'){const t=parseCookies(req).atelier_session;if(t)sessions.delete(t);return send(res,200,{ok:true},{'Set-Cookie':'atelier_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'})}
 if(p==='/api/auth/me'&&req.method==='GET'){const s=requireAuth(req,res);if(!s)return;return send(res,200,{user:s.user})}
 if(p.startsWith('/api/')&&!sameOrigin(req))return send(res,403,{error:'Origem não autorizada'});
 const s=(p.startsWith('/api/')?requireAuth(req,res):null);if(p.startsWith('/api/')&&!s)return;
 if(p==='/api/dashboard'){const today=new Date().toISOString().slice(0,10);return send(res,200,{clients:db.clients.length,leads:db.leads.length,appointments:db.appointments.filter(x=>x.starts_at&&x.starts_at.slice(0,10)===today).length,products:db.products.length,orders:db.orders.length,gallery:db.gallery.length,videos:db.videos.length,pending:db.payments.filter(x=>x.status==='pendente').reduce((a,x)=>a+Number(x.amount||0),0)})}
 if(p==='/api/audit')return send(res,200,db.audit_logs.slice(-300).reverse().map(a=>({...a,email:db.users.find(u=>u.id===a.user_id)?.email||null})));
 if(p==='/api/settings'&&req.method==='PUT'){const b=await readBody(req);for(const k of Object.keys(defaults))if(k in b)db.settings[k]=safe(b[k]);save();log(req,'update','settings');return send(res,200,{ok:true})}
 const m=p.match(/^\/api\/(clients|leads|appointments|products|quotes|orders|measurements|payments)(?:\/(\d+))?$/);if(m){const k=m[1],id=m[2],fspec=fields[k];if(req.method==='GET')return send(res,200,db[k].slice(-500).reverse());if(req.method==='POST'){const b=await readBody(req),o={};for(const f of fspec)o[f]=safe(b[f]);if(k==='clients'&&!o.name)return send(res,400,{error:'Nome obrigatório'});if(k==='leads'){o.score=leadScore(o);if(!o.status)o.status='novo'}const x=add(k,o);log(req,'create',k,x.id);return send(res,201,{id:x.id})}if(id&&req.method==='PUT'){const o=find(k,id);if(!o)return send(res,404,{error:'Registro não encontrado'});const b=await readBody(req);for(const f of fspec)if(f in b)o[f]=safe(b[f]);if(k==='leads')o.score=leadScore(o);o.updated_at=new Date().toISOString();save();log(req,'update',k,Number(id));return send(res,200,{ok:true})}if(id&&req.method==='DELETE'){const idx=db[k].findIndex(x=>x.id===Number(id));if(idx<0)return send(res,404,{error:'Registro não encontrado'});db[k].splice(idx,1);save();log(req,'delete',k,Number(id));return send(res,200,{ok:true})}}
 if(staticFile(req,res,p==='/'?'/index.html':p.slice(1)))return;
 return html(res,404,notFoundHTML());
}
const server=http.createServer((req,res)=>{route(req,res).catch(e=>{console.error(e);send(res,500,{error:'Erro interno'})})});
server.listen(PORT,()=>console.log(`Ateliê Natália Huebra v4.1.0 — http://localhost:${PORT}`));
