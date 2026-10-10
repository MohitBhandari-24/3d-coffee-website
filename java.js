const MENU=[
 {id:'espresso',name:'Espresso',desc:'Double shot, thick crema, short and sharp.',price:180,col:'#3a2012',milk:false},
 {id:'cappuccino',name:'Cappuccino',desc:'Equal parts espresso, steamed milk and foam.',price:240,col:'#8a5a3b',milk:true},
 {id:'caramel',name:'Caramel latte',desc:'House caramel, silky milk, one heart on top.',price:280,col:'#b98350',milk:true},
 {id:'mocha',name:'Dark mocha',desc:'70% cocoa melted into espresso and milk.',price:300,col:'#5a3326',milk:true}
];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let current=MENU[1],cart={};
/* ---------- 3D scene ---------- */
const canvas=document.getElementById('stage');
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(40,1,.1,100);
camera.position.set(0,3.2,7.2);
scene.add(new THREE.HemisphereLight(0xfff1d6,0x1d3b30,.9));
const sun=new THREE.DirectionalLight(0xffe2b0,1.3);sun.position.set(4,6,4);scene.add(sun);
const rim=new THREE.PointLight(0xf0c24b,1.2,20);rim.position.set(-4,3,-3);scene.add(rim);

const rig=new THREE.Group();scene.add(rig);
const ceramic=new THREE.MeshStandardMaterial({color:0xf1e3cb,roughness:.28,metalness:.05,side:THREE.DoubleSide});
const cup=new THREE.Mesh(new THREE.LatheGeometry([[0,0],[.55,0],[.65,.1],[1,.9],[1.12,1.35],[1.02,1.35],[.93,1.28],[.82,.22],[0,.16]].map(p=>new THREE.Vector2(p[0],p[1])),64),ceramic);
rig.add(cup);
const saucer=new THREE.Mesh(new THREE.LatheGeometry([[0,-.1],[1.1,-.1],[1.9,.1],[2,.18],[1.92,.2],[1.3,.04],[0,.04]].map(p=>new THREE.Vector2(p[0],p[1])),64),ceramic);
rig.add(saucer);
const handle=new THREE.Mesh(new THREE.TorusGeometry(.42,.09,16,32,Math.PI*1.2),ceramic);
handle.position.set(1.05,.82,0);handle.rotation.z=-Math.PI*.6;rig.add(handle);

const art=document.createElement('canvas');art.width=art.height=256;
const actx=art.getContext('2d');const tex=new THREE.CanvasTexture(art);
const coffee=new THREE.Mesh(new THREE.CircleGeometry(.95,64),new THREE.MeshStandardMaterial({map:tex,roughness:.15}));
coffee.rotation.x=-Math.PI/2;coffee.position.y=1.2;rig.add(coffee);
let shade=new THREE.Color(current.col),target=new THREE.Color(current.col),milkNow=1;
function heart(s,c){actx.save();actx.translate(128,128);actx.scale(s,s);actx.fillStyle=c;actx.beginPath();actx.moveTo(0,42);actx.bezierCurveTo(-72,-8,-42,-62,0,-26);actx.bezierCurveTo(42,-62,72,-8,0,42);actx.fill();actx.restore()}
function paint(){
  const base='#'+shade.getHexString();
  const g=actx.createRadialGradient(128,128,10,128,128,128);g.addColorStop(0,base);g.addColorStop(1,'#'+shade.clone().multiplyScalar(.6).getHexString());
  actx.fillStyle=g;actx.fillRect(0,0,256,256);
  if(current.milk){const m='rgba(244,230,208,.95)';heart(1.35,m);heart(1.05,base);heart(.78,m);heart(.5,base)}
  else{actx.strokeStyle='rgba(214,160,90,.5)';actx.lineWidth=6;for(let r=30;r<120;r+=28){actx.beginPath();actx.arc(128,128,r,0,6.3);actx.stroke()}}
  tex.needsUpdate=true;
}
paint();

/* floating beans */
const beanGeo=new THREE.SphereGeometry(.2,20,14),beanMat=new THREE.MeshStandardMaterial({color:0x3a2012,roughness:.5});
const beans=new THREE.Group();scene.add(beans);
for(let i=0;i<18;i++){const b=new THREE.Mesh(beanGeo,beanMat);b.scale.set(1,.65,.75);
  b.userData={a:Math.random()*6.28,r:3+Math.random()*2.2,y:Math.random()*4-.5,s:.2+Math.random()*.4,sp:Math.random()*2};
  const cr=new THREE.Mesh(new THREE.BoxGeometry(.34,.015,.02),new THREE.MeshBasicMaterial({color:0x1a0d06}));cr.position.z=.15;b.add(cr);beans.add(b)}

/* steam */
const sc=document.createElement('canvas');sc.width=sc.height=64;const sx=sc.getContext('2d');
const sg=sx.createRadialGradient(32,32,0,32,32,32);sg.addColorStop(0,'rgba(255,255,255,.9)');sg.addColorStop(1,'rgba(255,255,255,0)');sx.fillStyle=sg;sx.fillRect(0,0,64,64);
const stex=new THREE.CanvasTexture(sc);const steam=[];
for(let i=0;i<34;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:stex,transparent:true,depthWrite:false,opacity:0}));sp.userData={t:i/34,x:(Math.random()-.5)*.8,z:(Math.random()-.5)*.8,ph:Math.random()*6};rig.add(sp);steam.push(sp)}

/* interaction state */
let mx=0,my=0,hop=0,desk=innerWidth>800;
addEventListener('pointermove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5});
function resize(){desk=innerWidth>800;renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();rig.scale.setScalar(desk?1:.62)}
addEventListener('resize',resize);resize();
const ease=t=>t*t*(3-2*t);
const clock=new THREE.Clock();
function loop(){
  const t=clock.getElapsedTime(),dt=Math.min(clock.getDelta(),.05);
  const p=Math.min(scrollY/innerHeight,1),e=ease(p);
  const tx=desk?THREE.MathUtils.lerp(2.2,-2.6,e):0;
  const ty=desk?0:THREE.MathUtils.lerp(-.4,-1.2,e)+(p<.5?-1.2:0);
  rig.position.x+=(tx-rig.position.x)*.08;
  hop=Math.max(0,hop-.025);
  rig.position.y+=((desk?-.9:ty)+Math.abs(Math.sin(hop*Math.PI))*.7-rig.position.y)*.2;
  rig.rotation.y=(reduce?0:t*.35)+scrollY*.004+mx*.8;
  rig.rotation.x=my*.25+.12;
  camera.lookAt(0,.6,0);
  /* colour tween */
  if(Math.abs(shade.r-target.r)+Math.abs(shade.g-target.g)+Math.abs(shade.b-target.b)>.004){shade.lerp(target,.12);paint()}
  /* beans */
  beans.children.forEach(b=>{const d=b.userData;d.a+=d.s*.004*(reduce?0:1)+scrollY*0.00001;
    b.position.set(Math.cos(d.a)*d.r+(desk?rig.position.x:0),d.y+Math.sin(t*d.s+d.sp)*.3,Math.sin(d.a)*d.r-1);
    b.rotation.x=t*d.s;b.rotation.y=t*.5*d.s});
  /* steam */
  steam.forEach(s=>{const d=s.userData;d.t=(d.t+.0035*(reduce?.3:1))%1;
    s.position.set(d.x+Math.sin(t+d.ph)*.25*d.t*2,1.3+d.t*3,d.z);
    const k=.5+d.t*1.8;s.scale.set(k,k,1);s.material.opacity=Math.sin(d.t*Math.PI)*.28});
  renderer.render(scene,camera);
  requestAnimationFrame(loop);
}
loop();

/* ---------- Menu + cart ---------- */
const grid=document.getElementById('grid');
grid.innerHTML=MENU.map(d=>`<div class="card${d.id===current.id?' on':''}" tabindex="0" role="button" aria-pressed="${d.id===current.id}" data-id="${d.id}"><h3>${d.name}</h3><p>${d.desc}</p><div class="row"><span class="price">₹${d.price}</span><button class="add" data-add="${d.id}">Add to order</button></div></div>`).join('');
function select(id){current=MENU.find(d=>d.id===id);target.set(current.col);
  grid.querySelectorAll('.card').forEach(c=>{const on=c.dataset.id===id;c.classList.toggle('on',on);c.setAttribute('aria-pressed',on)});}
grid.addEventListener('click',e=>{
  const add=e.target.closest('[data-add]');
  if(add){e.stopPropagation();const id=add.dataset.add;select(id);cart[id]=(cart[id]||0)+1;hop=1;render();return}
  const c=e.target.closest('.card');if(c)select(c.dataset.id)});
grid.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('card')){e.preventDefault();select(e.target.dataset.id)}});
grid.addEventListener('pointermove',e=>{const c=e.target.closest('.card');if(!c||reduce)return;const r=c.getBoundingClientRect();
  c.style.transform=`rotateY(${((e.clientX-r.left)/r.width-.5)*10}deg) rotateX(${-((e.clientY-r.top)/r.height-.5)*10}deg)`});
grid.addEventListener('pointerleave',()=>grid.querySelectorAll('.card').forEach(c=>c.style.transform=''),true);

const drawer=document.getElementById('drawer'),itemsEl=document.getElementById('items'),pay=document.getElementById('pay');
function render(){
  const ids=Object.keys(cart).filter(k=>cart[k]>0);
  const n=ids.reduce((a,k)=>a+cart[k],0),sum=ids.reduce((a,k)=>a+cart[k]*MENU.find(d=>d.id===k).price,0);
  document.getElementById('cnt').textContent=n;document.getElementById('total').textContent='₹'+sum;pay.disabled=!n;
  itemsEl.innerHTML=ids.length?ids.map(k=>{const d=MENU.find(x=>x.id===k);return `<div class="it"><div><b>${d.name}</b><br>₹${d.price*cart[k]}</div><div class="q"><button data-m="${k}" aria-label="Remove one ${d.name}">−</button><span>${cart[k]}</span><button data-p="${k}" aria-label="Add one ${d.name}">+</button></div></div>`}).join(''):'<p>Your order is empty. Add a drink from the menu.</p>';
}
function toggle(o){drawer.classList.toggle('open',o);drawer.setAttribute('aria-hidden',!o)}
document.getElementById('cartBtn').onclick=()=>toggle(true);
document.getElementById('close').onclick=()=>toggle(false);
addEventListener('keydown',e=>{if(e.key==='Escape')toggle(false)});
itemsEl.addEventListener('click',e=>{const m=e.target.dataset.m,p=e.target.dataset.p;if(m)cart[m]--;if(p)cart[p]++;render()});
pay.onclick=()=>{const no=Math.floor(1000+Math.random()*9000);cart={};hop=1;render();
  itemsEl.innerHTML=`<p><b>Order #${no} placed.</b><br>We'll have it ready at the counter in about 8 minutes.</p>`;pay.disabled=true};
render();

