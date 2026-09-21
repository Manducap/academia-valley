/* Academia Valley — JavaScript puro. Todas as medidas do mundo são em pixels. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('world'), ctx = canvas.getContext('2d');
  const dialog = $('dialog'), body = $('dialogBody'), choices = $('choices');
  const KEY = 'academia-valley-v1', W = 960, H = 640;
  const keys = new Set(), joy = {x:0,y:0};
  let running = false, last = 0, elapsed = 0, savedAt = 0, toastUntil = 0;
  let audio, muted = false, cavePhase = -1, focusBefore, storageOK = true;
  let cam = {x:0,y:0}, nearby = null;
  const fresh = () => ({version:1,mode:'mvp',x:190,y:480,day:1,time:480,
    money:12,xp:0,bag:{azeitonas:0,ervas:0,papiros:0},answered:[],read:[],
    harvested:[],watered:[],flags:{},upgrades:{sandalias:0,cesto:0},difficulty:1});
  let s = fresh(), hasSave = false;
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const shuffle = arr => {
    const a = [...arr];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  };
  // Importação defensiva: dados locais incompletos não interrompem o jogo.
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if(raw && raw.version === 1){
      const n = (v,a,b,f) => Number.isFinite(v) ? clamp(v,a,b) : f;
      s.mode = raw.mode === 'full' ? 'full' : 'mvp';
      for(const k of ['x','y','day','time','money','xp']){
        const bounds = {x:[16,944],y:[16,565],day:[1,99999],time:[360,1319],money:[0,1e7],xp:[0,1e7]}[k];
        s[k] = n(raw[k],...bounds,s[k]);
      }
      for(const k of Object.keys(s.bag)) s.bag[k]=Math.floor(n(raw.bag?.[k],0,9999,0));
      for(const k of ['answered','read']) s[k]=[...new Set((Array.isArray(raw[k])?raw[k]:[]).filter(id=>QUESTIONS.some(q=>q.id===id)))];
      for(const k of ['harvested','watered']) s[k]=(Array.isArray(raw[k])?raw[k]:[]).filter(v=>Number.isInteger(v)&&v>=0&&v<9);
      for(const k of ['delivery','cave','sort','duel','iris','alex','socrates']) s.flags[k]=raw.flags?.[k]===true;
      for(const k of Object.keys(s.upgrades)) s.upgrades[k]=Math.floor(n(raw.upgrades?.[k],0,1,0));
      s.difficulty=Math.floor(n(raw.difficulty,1,3,1));
      hasSave=true;
    }
  } catch { storageOK=false; }
  const blocks = [
    {x:114,y:65,w:224,h:106,type:'temple',name:'ACADEMIA'},
    {x:619,y:65,w:224,h:106,type:'temple',name:'LICEU'},
    {x:72,y:388,w:105,h:65,type:'home',name:'CASA'},
    {x:447,y:304,w:130,h:48,type:'market',name:'ÁGORA'},
    {x:817,y:405,w:108,h:95,type:'cave',name:'CAVERNA'}
  ];
  const resources = [
    {x:94,y:279,type:'azeitonas'},{x:154,y:279,type:'azeitonas'},{x:214,y:279,type:'azeitonas'},
    {x:98,y:338,type:'ervas'},{x:150,y:338,type:'ervas'},{x:202,y:338,type:'ervas'},
    {x:592,y:545,type:'papiros'},{x:644,y:545,type:'papiros'},{x:696,y:545,type:'papiros'}
  ];
  const stations = [
    {id:'home',x:132,y:478,label:'Casa · descansar'},
    {id:'market',x:474,y:378,label:'Mercado · trocar e entregar'},
    {id:'cave',x:863,y:523,label:'Entrar na caverna'},
    {id:'sort',x:691,y:280,label:'Mesa de classificação'},
    {id:'duel',x:482,y:227,label:'Duelo de ideias'}
  ];
  const activeNPCs = () => NPCS.filter((_,i)=>s.mode==='full'||i<2);
  const count = theme => s.answered.filter(id=>QUESTIONS.find(q=>q.id===id)?.tema===theme).length;
  const mvpDone = () => count('Platão')>=3 && count('Aristóteles')>=3 && s.flags.delivery;
  const complete = () => mvpDone() && ['cave','sort','duel','iris','alex','socrates'].every(k=>s.flags[k]);
  function notify(text){$('toast').textContent=text;toastUntil=elapsed+4;}
  function save(){
    try {localStorage.setItem(KEY,JSON.stringify(s));storageOK=true;hasSave=true;}
    catch {if(storageOK) notify('O navegador bloqueou o salvamento. Continue nesta aba.');storageOK=false;}
  }
  function sound(ok=true){
    if(muted)return;
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return;
      audio ||= new AC();
      if(audio.state==='suspended')audio.resume().catch(()=>{});
      const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;
      o.type='triangle';o.frequency.setValueAtTime(ok?520:220,t);
      o.frequency.setValueAtTime(ok?780:180,t+.08);
      g.gain.setValueAtTime(.04,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);
      o.connect(g);g.connect(audio.destination);o.start();o.stop(t+.23);
    }catch{/* Som indisponível não impede a partida. */}
  }
  function release(){keys.clear();joy.x=joy.y=0;$('knob').style.transform='';}
  function open(title,html,eyebrow='ACADEMIA VALLEY'){
    release();$('dialogTitle').textContent=title;body.innerHTML=html;choices.replaceChildren();choices.className='';
    $('eyebrow').textContent=eyebrow;
    if(!dialog.open){focusBefore=document.activeElement;dialog.showModal();}
    dialog.scrollTop=0;
  }
  function button(label,action,primary=false){
    const b=document.createElement('button');b.textContent=label;if(primary)b.className='primary';
    b.onclick=action;choices.append(b);return b;
  }
  function close(){dialog.close();cavePhase=-1;release();if(running)canvas.focus();else focusBefore?.focus();}
  $('close').onclick=()=>{if(running)close();};
  dialog.addEventListener('cancel',e=>{e.preventDefault();if(running)close();});
  function start(){running=true;close();save();if(!storageOK)notify('Salvamento indisponível neste navegador.');}
  function title(){
    open('Academia Valley',`<p>Cuide de uma pequena horta entre a Academia e o Liceu. Colha, converse e transforme perguntas em sabedoria.</p><div class="note">Uma vila imaginária reúne épocas diferentes da Grécia Antiga. Falas inventadas para fins educativos; datas aproximadas são sinalizadas.</div><p><b>Como jogar:</b> WASD ou setas para andar; E ou Enter para interagir. No celular, use o joystick e o botão Interagir.</p><p>O tempo pausa nas conversas. Sua casa permite avançar um dia. Comece pela Academia, ao noroeste.</p>`, 'UM LUGAR PARA CULTIVAR IDEIAS');
    if(hasSave)button('Continuar jornada',start,true);
    button('Novo jogo · MVP (2 personagens, 15 perguntas)',()=>newGame('mvp'),!hasSave);
    button('Novo jogo · jornada completa (40 perguntas)',()=>newGame('full'));
    if(!storageOK)body.insertAdjacentHTML('beforeend','<p class="bad">Não foi possível ler o progresso local. O jogo ainda pode ser iniciado.</p>');
  }
  function newGame(mode){
    if(hasSave){
      open('Começar de novo?','<p>Isso substitui o progresso salvo neste navegador.</p>');
      button('Sim, iniciar outra jornada',()=>{s=fresh();s.mode=mode;start();},true);
      button('Cancelar',()=>running?pause():title());
    }else{s=fresh();s.mode=mode;start();}
  }
  function pause(){
    if(!running){title();return;}
    open('Uma pausa à sombra',`<p>Dia ${s.day}. O mundo está pausado.</p><p>${storageOK?'O progresso é salvo automaticamente.':'O navegador não permitiu salvar o progresso.'}</p>`);
    button('Voltar à vila',close,true);button('Diário do Filósofo',journal);
    if(s.mode==='mvp')button('Ativar a jornada completa, mantendo o progresso',expand);
    button('Novo jogo',()=>newGame(s.mode));
  }
  function expand(){s.mode='full';save();close();notify('A vila se abriu: novos colegas e três desafios!');}
  $('menu').onclick=pause;$('journal').onclick=()=>running?journal():title();
  $('mute').onclick=()=>{muted=!muted;$('mute').textContent=muted?'Som: mudo':'Som: ligado';$('mute').setAttribute('aria-pressed',String(muted));};
  function reward(flag,xp,money){
    if(s.flags[flag])return false;
    s.flags[flag]=true;s.xp+=xp;s.money+=money;save();sound();return true;
  }
  function train(theme){
    open('Escolha seu desafio','<p>Acertos novos rendem Sabedoria e dracmas. Revisões corretas rendem 1 XP. Errar não tira recursos.</p>',theme.toUpperCase());
    for(let level=1;level<=3;level++){
      const pool=QUESTIONS.filter(q=>(s.mode==='full'||q.id<=15)&&q.tema===theme&&q.dificuldade===level);
      if(!pool.length)continue;
      button(['','Iniciante','Intermediário','Avançado'][level],()=>{
        s.difficulty=level;
        const unseen=pool.filter(q=>!s.answered.includes(q.id));
        quiz(shuffle(unseen.length?unseen:pool)[0],()=>train(theme));
      });
    }
  }
  // A opção guarda o índice original, mesmo após Fisher–Yates.
  function quiz(q,next,prefix=''){
    open('Uma questão para pensar',`${prefix}<p><span class="tag">${q.tema} · nível ${q.dificuldade}</span></p><p><b>${q.pergunta}</b></p>`,'ESCOLHA UMA RESPOSTA');
    const opts=shuffle(q.opcoes.map((text,index)=>({text,index})));
    opts.forEach(opt=>button(opt.text,()=>{
      const ok=opt.index===q.correta,first=!s.answered.includes(q.id);
      if(!s.read.includes(q.id))s.read.push(q.id);
      if(ok){
        if(first){s.answered.push(q.id);s.xp+=q.dificuldade*10;s.money+=q.dificuldade*3;}
        else s.xp+=1;
      }
      save();sound(ok);choices.replaceChildren();
      body.insertAdjacentHTML('beforeend',`<p class="${ok?'good':'bad'}">${ok?(first?`Muito bem! +${q.dificuldade*10} XP e +${q.dificuldade*3} dracmas.`:'Boa revisão! +1 XP.'):'Ainda não. Vamos pensar mais um pouco.'}</p><p>${q.explicacao}</p>`);
      if(ok)button('Continuar',next,true);
      else button('Tentar novamente',()=>quiz(q,next,prefix),true);
      button('Voltar à vila',close);
    }));
  }
  function npc(n){
    let extra='';
    if(n.id==='aluno'&&count('Comparações')>=2&&reward('iris',30,18))extra='Missão cumprida: +30 XP e +18 dracmas.';
    if(n.id==='alexandre'&&count('Contexto')>=2&&reward('alex',30,18))extra='Missão cumprida: +30 XP e +18 dracmas.';
    if(n.id==='socrates'&&s.answered.includes(35)&&reward('socrates',30,18))extra='Memória estudada: +30 XP e +18 dracmas.';
    open(n.nome,`<p>${n.fala}</p>${extra?`<p class="good">${extra}</p>`:''}`,'ENCONTRO NA VILA');
    if(n.id==='mercador'){button('Ver o mercado',market,true);return;}
    button('Conversar e aprender',()=>n.id==='socrates'?quiz(QUESTIONS.find(q=>q.id===35),()=>npc(n)):train(n.tema),true);
    if(n.id==='platao')button('Estudar o contexto histórico',()=>train('Contexto'));
    if(n.id==='aristoteles')button('Comparar os dois pensadores',()=>train('Comparações'));
    if(s.mode==='full'&&n.id==='aristoteles')button('Classificar a coleção do Liceu',classify);
    if(s.mode==='full'&&n.id==='platao')button('Perguntar sobre a caverna',()=>{close();notify('A caverna fica a sudeste, perto da costa.');});
    button('Até mais',close);
  }
  function market(){
    const total=s.bag.azeitonas*4+s.bag.ervas*3+s.bag.papiros*6;
    open('Mercado da ágora',`<p>Azeitona: 4 dracmas · erva: 3 · papiro: 6.</p><p>Sua bolsa vale <b>${total} dracmas</b>. Saldo: ${s.money}.</p><div class="note">Encomenda da vila: 3 azeitonas + 2 ervas. Recompensa: 35 dracmas e 30 XP. Reserve os itens antes de vender.</div>`);
    if(!s.flags.delivery){
      button('Entregar a primeira colheita',()=>{
        if(s.bag.azeitonas<3||s.bag.ervas<2){notify('Faltam itens. A horta fica a oeste da ágora.');close();return;}
        s.bag.azeitonas-=3;s.bag.ervas-=2;reward('delivery',30,35);market();
      },true);
    }else body.insertAdjacentHTML('beforeend','<p class="good">Encomenda entregue.</p>');
    button(`Vender tudo · receber ${total} dracmas`,()=>{
      if(!total)return;
      s.money+=total;Object.keys(s.bag).forEach(k=>s.bag[k]=0);save();sound();market();
    }).disabled=total===0;
    for(const [id,label,cost] of [['cesto','Cesto maior · +1 item por coleta',45],['sandalias','Sandálias · caminhar 30% mais rápido',60]]){
      const b=button(s.upgrades[id]?`${label} · comprado`:`${label} · ${cost} dracmas`,()=>{
        if(s.money<cost){body.insertAdjacentHTML('beforeend','<p class="bad">Ainda faltam dracmas.</p>');return;}
        s.money-=cost;s.upgrades[id]=1;save();sound();market();
      });b.disabled=Boolean(s.upgrades[id]);
    }
    button('Voltar à vila',close);
  }
  function nextDay(){
    s.day++;s.time=360;s.harvested=[];s.watered=[];s.x=190;s.y=480;save();
    notify(s.day%3===0?'Uma chuva leve rega as ervas hoje.':'Bom dia! A horta e os papiros se renovaram.');
  }
  function station(id){
    if(id==='home'){
      open('Sua pequena casa','<p>Descansar avança para as 6h do próximo dia e renova os recursos. O crescimento diário das plantas é uma simplificação do jogo.</p>');
      button('Dormir até amanhã',()=>{nextDay();close();},true);button('Ainda quero explorar',close);return;
    }
    if(id==='market'){market();return;}
    if(s.mode==='mvp'){
      open('Além da primeira colheita','<p>A jornada completa adiciona quatro personagens, 25 perguntas e três minijogos. Seu progresso será mantido.</p>');
      button('Ativar jornada completa',expand,true);button('Continuar no MVP',close);return;
    }
    if(id==='cave')cave();if(id==='sort')classify();if(id==='duel')duel();
  }
  function harvest(i){
    const r=resources[i];
    if(s.harvested.includes(i)){notify('Já colhido hoje. Descanse em casa para um novo dia.');return;}
    if(r.type==='ervas'&&!s.watered.includes(i)&&s.day%3!==0){
      s.watered.push(i);save();sound();notify('Erva regada. Interaja novamente para colher.');return;
    }
    const amount=1+s.upgrades.cesto;s.bag[r.type]+=amount;s.harvested.push(i);s.xp+=2;save();sound();notify(`+${amount} ${r.type} · +2 XP`);
  }
  function miniEnd(flag,name){
    const first=reward(flag,60,25);cavePhase=-1;
    open(name,`<p class="good">Desafio concluído!</p><p>${first?'Você ganhou 60 XP e 25 dracmas.':'Você revisou este desafio. A recompensa especial já foi recebida.'}</p>`);
    button('Voltar à vila',close,true);button('Consultar o diário',journal);
  }
  function cave(step=0){
    const ids=[3,16,17],texts=['As sombras parecem ser tudo o que existe. Examine-as.','Você sobe a passagem: enxergar de outro modo exige aprendizado.','Lá fora, a luz abre um horizonte. O Sol é uma imagem filosófica.'];
    if(step===3){miniEnd('cave','Da sombra à luz');return;}
    cavePhase=step;
    quiz(QUESTIONS.find(q=>q.id===ids[step]),()=>cave(step+1),`<p>${texts[step]}</p><div class="track">${ids.map((_,i)=>`<span class="${i<=step?'lit':''}"></span>`).join('')}</div>`);
  }
  function classify(){
    const items=shuffle([{nome:'Oliveira',cat:'Plantas'},{nome:'Alecrim',cat:'Plantas'},
      {nome:'Coruja',cat:'Animais'},{nome:'Golfinho',cat:'Animais'},
      {nome:'Coragem',cat:'Virtudes'},{nome:'Temeridade',cat:'Vícios'}]);
    let index=0;
    const show=()=>{
      if(index===items.length){miniEnd('sort','Olhar de naturalista');return;}
      const item=items[index];
      open('Coleção do Liceu',`<p>Toque na categoria do item, ou arraste-o até ela. ${index+1}/${items.length}</p><div class="item" draggable="true" id="sortItem">${item.nome}</div><p class="note">Exercício didático: seres vivos e qualidades morais pertencem a investigações diferentes. Esta não é uma taxonomia histórica de Aristóteles.</p><p id="sortFeedback" role="status"></p>`);
      choices.classList.add('categories');
      const answer=cat=>{
        if(cat===item.cat){sound();index++;choices.classList.remove('categories');show();}
        else{$('sortFeedback').textContent='Ainda não. Pense se é um ser vivo ou uma qualidade de caráter.';sound(false);}
      };
      $('sortItem').ondragstart=e=>e.dataTransfer.setData('text/plain',item.nome);
      ['Plantas','Animais','Virtudes','Vícios'].forEach(cat=>{
        const b=button(cat,()=>answer(cat));
        b.ondragover=e=>e.preventDefault();b.ondrop=e=>{e.preventDefault();if(e.dataTransfer.getData('text/plain')===item.nome)answer(cat);};
      });
    };show();
  }
  // A comparação premia distinções cuidadosas, sem declarar um filósofo vencedor.
  function duel(step=0){
    const ids=[14,31,32,33,34];
    if(step===ids.length){miniEnd('duel','Ponte entre as escolas');return;}
    quiz(QUESTIONS.find(q=>q.id===ids[step]),()=>duel(step+1),`<p><b>Platão × Aristóteles · rodada ${step+1}/5</b></p><p>Investigue o contraste: Formas inteligíveis e investigação das substâncias. Os dois recorrem a argumentos.</p>`);
  }
  function journal(){
    choices.classList.remove('categories');
    const concepts=CONCEPTS.map(c=>`<div class="card"><b>${c.ids.some(id=>s.read.includes(id))?c.titulo:'Conceito por descobrir'}</b><p>${c.ids.some(id=>s.read.includes(id))?c.texto:'Converse e responda perguntas para abrir esta página.'}</p></div>`).join('');
    const goals=[['Aprendiz das duas escolas',mvpDone()],['Da sombra à luz',s.flags.cave],['Olhar de naturalista',s.flags.sort],['Ponte de ideias',s.flags.duel],['Amizade com Íris',s.flags.iris],['Lições de Alexandre',s.flags.alex],['Memória de Sócrates',s.flags.socrates],['Biblioteca viva · 40 acertos únicos',s.answered.length===40],['Coroa de oliveira',complete()]];
    open('Diário do Filósofo',`<p>${s.mode==='mvp'?'MVP · 15 perguntas':'Jornada completa · 40 perguntas'} · ${s.answered.length} acertos únicos.</p><h2>Seus compromissos</h2><p>Platão: ${Math.min(3,count('Platão'))}/3 acertos. Aristóteles: ${Math.min(3,count('Aristóteles'))}/3. Primeira colheita: ${s.flags.delivery?'entregue':'3 azeitonas + 2 ervas no mercado'}.</p><p>Na jornada completa: vença os três desafios e volte a Íris após 2 comparações, a Alexandre após 2 questões de contexto e à memória de Sócrates após sua pergunta.</p><h2>Orientação</h2><p>Academia: noroeste. Liceu: nordeste. Horta e casa: oeste. Ágora: centro. Caverna: sudeste. Papiros: costa sul. Sócrates: junto à estela, sudoeste da ágora.</p><h2>Conquistas</h2>${goals.map(([name,ok])=>`<p>${ok?'✓':'○'} ${name}</p>`).join('')}<h2>Linha do tempo</h2><p>399 a.C.: morte de Sócrates.<br>c. 387 a.C.: fundação da Academia.<br>c. 367 a.C.: Aristóteles ingressa na Academia.<br>347 a.C.: morte de Platão.<br>c. 343/342 a.C.: tutoria de Alexandre.<br>c. 335 a.C.: escola de Aristóteles no Liceu.<br>322 a.C.: morte de Aristóteles.</p><p class="note">A vila e todos os diálogos são fictícios. Alexandre jovem, Platão e o Liceu não coexistiram desta maneira. Datas aproximadas e detalhes da tutoria são discutidos na historiografia.</p><h2>Conceitos descobertos</h2>${concepts}<h2>Leitura</h2><p>Platão: A República, livros IV–VII. Aristóteles: Ética a Nicômaco, livro II; Física, livro II; Analíticos Anteriores, livro I. Referências comentadas no README.</p>`);
    if(complete())body.insertAdjacentHTML('afterbegin','<p class="good">Coroa de oliveira conquistada! Você concluiu a jornada. A vila continua aberta para estudar e cultivar.</p>');
    if(s.mode==='mvp')button(mvpDone()?'MVP concluído · abrir jornada completa':'Ativar jornada completa',expand,true);
    button('Voltar à vila',close);
  }
  // Interação pelo ponto mais próximo, sem depender de uma direção específica.
  function nearest(){
    const list=[...activeNPCs().map(n=>({...n,label:n.nome,kind:'npc'})),
      ...stations.map(n=>({...n,kind:'station'})),
      ...resources.map((r,i)=>({...r,id:i,label:s.harvested.includes(i)?'Colhido · volta amanhã':r.type==='ervas'&&!s.watered.includes(i)&&s.day%3!==0?'Regar ervas':`Colher ${r.type}`,kind:'resource'}))];
    return list.map(n=>({...n,d:Math.hypot(s.x-n.x,s.y-n.y)})).filter(n=>n.d<43).sort((a,b)=>a.d-b.d)[0]||null;
  }
  function interact(){
    if(!running||dialog.open)return;
    nearby=nearest();if(!nearby){notify('Aproxime-se de alguém, de uma planta ou de um marco.');return;}
    sound();if(nearby.kind==='npc')npc(nearby);
    else if(nearby.kind==='resource')harvest(nearby.id);else station(nearby.id);
  }
  $('interact').onclick=interact;
  window.addEventListener('keydown',e=>{
    if(dialog.open)return;
    const k=e.key.toLowerCase();
    if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','e','enter','j','escape'].includes(k)){
      if(e.target instanceof HTMLButtonElement && k==='enter')return;
      e.preventDefault();if(e.repeat&&['e','enter','j','escape'].includes(k))return;
      if(k==='e'||k==='enter')interact();else if(k==='j'&&running)journal();else if(k==='escape')pause();else keys.add(k);
    }
  });
  window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur',()=>{release();if(running)save();});
  document.addEventListener('visibilitychange',()=>{release();if(running)save();last=0;});
  window.addEventListener('pagehide',()=>{if(running)save();});
  const stick=$('stick');let pointer=null;
  function moveStick(e){
    if(e.pointerId!==pointer)return;
    const r=stick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;
    const len=Math.hypot(dx,dy),scale=len>30?30/len:1;
    joy.x=dx*scale/30;joy.y=dy*scale/30;$('knob').style.transform=`translate(${joy.x*25}px,${joy.y*25}px)`;
  }
  stick.onpointerdown=e=>{if(pointer!==null)return;pointer=e.pointerId;stick.setPointerCapture(pointer);moveStick(e);};
  stick.onpointermove=moveStick;
  const stopStick=e=>{if(e.pointerId===pointer){pointer=null;release();}};
  stick.onpointerup=stopStick;stick.onpointercancel=stopStick;stick.onlostpointercapture=stopStick;
  function blocked(x,y){return x<16||x>W-16||y<30||y>568||blocks.some(b=>x+8>b.x&&x-8<b.x+b.w&&y+5>b.y&&y-5<b.y+b.h);}
  if(blocked(s.x,s.y)){s.x=190;s.y=480;}
  function update(dt){
    if(!running||dialog.open||document.hidden)return;
    let dx=joy.x+(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
    let dy=joy.y+(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
    const mag=Math.max(1,Math.hypot(dx,dy)),speed=83*(1+s.upgrades.sandalias*.3);
    dx=dx/mag*speed*dt;dy=dy/mag*speed*dt;
    if(!blocked(s.x+dx,s.y))s.x+=dx;if(!blocked(s.x,s.y+dy))s.y+=dy;
    s.time+=dt*4;if(s.time>=1320){nextDay();notify('Anoiteceu. Você descansou em casa; um novo dia começa.');}
    if(elapsed-savedAt>5){save();savedAt=elapsed;}
  }
  function hud(){
    const t=Math.floor(s.time),hour=String(Math.floor(t/60)).padStart(2,'0'),min=String(t%60).padStart(2,'0');
    $('clock').textContent=`Dia ${s.day} · ${hour}:${min} · ${s.day%3===0?'Chuva leve':'Céu limpo'}`;
    $('money').textContent=`${s.money} dracmas`;$('xp').textContent=`Sabedoria ${s.xp} · Nv. ${1+Math.floor(s.xp/100)}`;
    $('bag').textContent=`Bolsa: ${s.bag.azeitonas} azeitonas · ${s.bag.ervas} ervas · ${s.bag.papiros} papiros`;
    let task=count('Platão')<3?`Estude com Platão · ${count('Platão')}/3 acertos`:count('Aristóteles')<3?`Estude com Aristóteles · ${count('Aristóteles')}/3 acertos`:!s.flags.delivery?'Entregue 3 azeitonas e 2 ervas na ágora':s.mode==='mvp'?'MVP concluído! Abra o diário para expandir a jornada.':complete()?'Coroa de oliveira conquistada · continue explorando':'Complete os três desafios e as missões dos colegas · veja o diário';
    $('quest').textContent=`Missão · ${task}`;
    nearby=nearest();$('hint').textContent=nearby?`${nearby.label} · E / Interagir`:'';
    $('location').textContent=s.y>505?'Costa do Egeu':s.x<285&&s.y>240?'Horta das oliveiras':s.y<235?(s.x<430?'Academia de Platão':'Liceu de Aristóteles'):'Caminhos da ágora';
    if(elapsed>toastUntil)$('toast').textContent='';
  }
  // Arte pixelada autoral: retângulos e pequenos padrões sem imagens externas.
  function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
  function text(str,x,y,color='#42392a',size=10){ctx.fillStyle=color;ctx.font=`${size}px monospace`;ctx.textAlign='center';ctx.fillText(str,Math.round(x),Math.round(y));}
  function tree(x,y,fruit=true){
    rect(x-17,y+4,37,8,'#61754d');rect(x-4,y-17,8,26,'#866443');rect(x-7,y-8,4,10,'#af8652');
    rect(x-22,y-35,43,19,'#4c7050');rect(x-17,y-44,32,31,'#527e56');rect(x-9,y-49,19,32,'#648b5c');rect(x-19,y-32,13,7,'#799b64');
    if(fruit){rect(x-13,y-25,3,4,'#343f38');rect(x+9,y-32,3,4,'#343f38');rect(x+3,y-18,3,4,'#343f38');}
  }
  function person(x,y,color,player=false,ghost=false){
    const bob=player&&((keys.size>0)||Math.hypot(joy.x,joy.y)>.1)?Math.round(Math.sin(elapsed*12)):0;
    ctx.globalAlpha=ghost?.65:1;
    rect(x-8,y+3,17,5,'#53644a');rect(x-5,y-2+bob,4,8,'#765333');rect(x+2,y-2-bob,4,8,'#765333');
    rect(x-7,y-17,14,17,color);rect(x-4,y-16,3,16,player?'#b4d5cd':'#fff0cb');
    rect(x-10,y-15,3,11,'#c59569');rect(x+7,y-15,3,11,'#c59569');
    rect(x-6,y-28,12,12,'#d3a778');rect(x-6,y-29,12,4,player?'#493e30':'#d5c5a1');rect(x-7,y-25,3,6,player?'#493e30':'#d5c5a1');
    rect(x+2,y-23,2,2,'#332f2a');if(!player)rect(x-3,y-19,9,4,'#e4d4b0');
    if(player){rect(x-10,y-30,20,3,'#d8b468');rect(x-6,y-34,12,4,'#e8c77c');}ctx.globalAlpha=1;
  }
  function building(b){
    const {x,y,w,h}=b;rect(x+7,y+8,w,h,'#64714e');
    if(b.type==='temple'){
      rect(x,y,w,h,'#ddc58d');rect(x-5,y+h-5,w+10,8,'#e9d5a3');rect(x,y+h-11,w,6,'#c4a874');
      rect(x+12,y+31,w-24,h-49,'#817659');
      for(let i=17;i<w-12;i+=37){rect(x+i,y+26,14,h-38,'#f4e3b5');rect(x+i+10,y+29,4,h-42,'#cbb580');rect(x+i-3,y+25,20,5,'#fff0c8');}
      for(let i=0;i<6;i++)rect(x+i*12,y+5-i*5,w-i*24,6,'#cb895d');
      rect(x-5,y+9,w+10,10,'#efdaa3');text(b.name,x+w/2,y+21,'#655236',9);
    }else if(b.type==='home'){
      rect(x,y+10,w,h-10,'#ebce96');rect(x+39,y+34,23,31,'#6a5037');rect(x+12,y+32,16,16,'#4f7d7c');
      for(let i=0;i<5;i++)rect(x-8+i*10,y+8-i*6,w+16-i*20,7,i%2?'#a6583e':'#b56747');
    }else if(b.type==='market'){
      rect(x+8,y,w-16,h,'#9f7449');rect(x,y,w,20,'#f4d4a1');for(let i=0;i<w;i+=26)rect(x+i,y,13,23,'#a95447');
      rect(x+4,y+35,w-8,13,'#bb8f55');for(let i=10;i<w-5;i+=18)rect(x+i,y+30,9,6,i%3?'#6b8146':'#c5a159');
    }else{
      rect(x+5,y,w-10,h,'#7d806c');rect(x+18,y-12,w-36,h+10,'#8d8d76');rect(x+33,y+18,45,h-18,'#263638');
      rect(x+39,y+27,33,h-27,'#172c30');rect(x+7,y+28,20,8,'#a1a18a');rect(x+78,y+52,21,8,'#646f60');
    }
  }
  // Le décor fixe est mis en cache : seul le premier rendu le construit.
  const land=document.createElement('canvas');land.width=W;land.height=H;const lc=land.getContext('2d');
  lc.fillStyle='#8daa6c';lc.fillRect(0,0,W,H);
  for(let y=0;y<H;y+=16)for(let x=0;x<W;x+=16){
    const v=(x*17+y*31)%97;lc.fillStyle=v<40?'#96b474':'#829f64';lc.fillRect(x+(v%9),y+v%7,3,2);
  }
  lc.fillStyle='#d2bc83';lc.fillRect(215,185,525,48);lc.fillRect(448,190,48,366);lc.fillRect(122,354,742,40);lc.fillRect(120,354,38,151);lc.fillRect(843,378,38,156);lc.fillRect(698,182,35,202);
  lc.fillStyle='#e3ce95';lc.fillRect(225,191,505,4);lc.fillRect(453,230,4,321);lc.fillRect(142,359,700,4);
  for(let i=0;i<90;i++){const x=(i*73)%W,y=(i*47)%H;if((x>448&&x<496&&y>230)||(y>359&&y<390&&x>142&&x<840)){lc.fillStyle='#b5a071';lc.fillRect(x,y,4,2);}}
  lc.fillStyle='#638d7b';lc.fillRect(0,578,W,62);lc.fillStyle='#e7d29b';lc.fillRect(0,575,W,9);lc.fillStyle='#327583';lc.fillRect(0,590,W,50);
  function resize(){canvas.width=Math.max(280,Math.round(canvas.clientWidth/2));canvas.height=Math.max(160,Math.round(canvas.clientHeight/2));ctx.imageSmoothingEnabled=false;}
  new ResizeObserver(resize).observe(canvas);resize();
  function render(){
    ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;
    if(cavePhase>=0){
      rect(0,0,canvas.width,canvas.height,['#222e36','#556461','#c3bc7f'][cavePhase]);
      for(let i=0;i<8;i++)rect(i*canvas.width/8,canvas.height-i*15,canvas.width/8+1,i*15,['#454541','#7e8067','#91a569'][cavePhase]);
      rect(canvas.width-80,15,50,70,'#f5dda0');person(45+cavePhase*70,canvas.height-20-cavePhase*30,'#5b9792',true);return;
    }
    cam.x=clamp(s.x-canvas.width/2,0,Math.max(0,W-canvas.width));cam.y=clamp(s.y-canvas.height/2,0,Math.max(0,H-canvas.height));
    ctx.translate(-Math.floor(cam.x),-Math.floor(cam.y));ctx.drawImage(land,0,0);
    // Ondulações, plantações e marcos reconhecíveis.
    for(let i=0;i<25;i++)rect((i*53+elapsed*7)%W,601+(i%4)*9,17,2,'#64a2a5');
    for(let i=0;i<3;i++){rect(76+i*52,322,42,29,'#9e784c');for(let j=0;j<4;j++)rect(79+i*52,327+j*6,36,2,'#84643f');}
    rect(328,419,27,31,'#bac4a2');rect(322,448,39,7,'#ded5ad');text('MEMÓRIA',341,414,'#48533f',8);
    rect(670,266,41,17,'#936c43');rect(672,264,37,4,'#d1ae73');rect(676,261,7,4,'#51814d');rect(693,259,8,7,'#d7cfaf');
    rect(479,211,9,18,'#aa895a');rect(473,206,21,12,'#e5cd96');
    text('HORTA',148,244);text('ÁGORA',505,300);text('CASA',122,489);text('CAVERNA',870,511);
    const draws=[];
    blocks.forEach(b=>draws.push({y:b.y+b.h,fn:()=>building(b)}));
    resources.forEach((r,i)=>draws.push({y:r.y,fn:()=>{
      const used=s.harvested.includes(i);
      if(r.type==='azeitonas')tree(r.x,r.y,!used);
      else if(r.type==='ervas'){
        if(s.watered.includes(i))rect(r.x-10,r.y-4,20,8,'#725c43');
        if(!used){rect(r.x-2,r.y-15,4,17,'#426d43');rect(r.x-10,r.y-11,10,5,'#608d4f');rect(r.x+2,r.y-17,9,5,'#608d4f');rect(r.x-7,r.y-16,3,3,'#d2bd72');}
      }else if(!used){for(let j=-6;j<=6;j+=6){rect(r.x+j,r.y-23,2,25,'#466c47');rect(r.x+j-3,r.y-26,8,4,'#c3ae67');}}
    }}));
    for(const [x,y] of [[48,112],[405,112],[891,110],[48,491],[590,472],[740,468],[287,524]])draws.push({y,fn:()=>tree(x,y,false)});
    activeNPCs().forEach(n=>draws.push({y:n.y,fn:()=>{person(n.x,n.y,n.cor,false,n.id==='socrates');text(n.id==='socrates'?'MEMÓRIA':n.nome.split(' ·')[0],n.x,n.y-40,'#293c35',9);}}));
    draws.push({y:s.y,fn:()=>person(s.x,s.y,'#3e8584',true)});draws.sort((a,b)=>a.y-b.y).forEach(d=>d.fn());
    if(nearby){rect(nearby.x-3,nearby.y-49+Math.sin(elapsed*4)*2,6,6,'#ffdf7f');}
    ctx.setTransform(1,0,0,1,0,0);
    const night=clamp((s.time-1020)/300,0,.55);if(night)rect(0,0,canvas.width,canvas.height,`rgba(17,31,65,${night})`);
    if(s.day%3===0){ctx.globalAlpha=.32;for(let i=0;i<45;i++)rect((i*37+elapsed*23)%canvas.width,(i*71+elapsed*110)%canvas.height,1,6,'#d4eef0');ctx.globalAlpha=1;}
  }
  let hudTime=0;
  function frame(t){
    const dt=last?Math.min((t-last)/1000,.05):0;last=t;elapsed+=dt;update(dt);render();
    if(elapsed-hudTime>.12){hud();hudTime=elapsed;}requestAnimationFrame(frame);
  }
  // Limpa estilos transitórios ao mudar ou fechar uma janela.
  dialog.addEventListener('close',()=>choices.classList.remove('categories'));
  hud();title();requestAnimationFrame(frame);
})();
