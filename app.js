/* ════════════════════════════════════════════════════════════
   Work Order HCD  ·  app.js
   v3.0 — Multi-user, mobile-first, user management
════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   USER DATABASE
   PIN unik per akun. Role client = multi akun (per afdeling).
══════════════════════════════════════════════════════════ */
const USERS = [
  /* ── CLIENT (Afdeling 1–6 + General) ─── */
  { id:'USR-C01', pin:'110001', name:'Afdeling 1',  role:'client', dept:'Afdeling 1',  phone:'', email:'', active:true,  createdAt:'2025-01-01' },
  { id:'USR-C02', pin:'110002', name:'Afdeling 2',  role:'client', dept:'Afdeling 2',  phone:'', email:'', active:true,  createdAt:'2025-01-01' },
  { id:'USR-C03', pin:'110003', name:'Afdeling 3',  role:'client', dept:'Afdeling 3',  phone:'', email:'', active:true,  createdAt:'2025-01-01' },
  { id:'USR-C04', pin:'110004', name:'Afdeling 4',  role:'client', dept:'Afdeling 4',  phone:'', email:'', active:true,  createdAt:'2025-01-01' },
  { id:'USR-C05', pin:'110005', name:'Afdeling 5',  role:'client', dept:'Afdeling 5',  phone:'', email:'', active:true,  createdAt:'2025-01-01' },
  { id:'USR-C06', pin:'110006', name:'Afdeling 6',  role:'client', dept:'Afdeling 6',  phone:'', email:'', active:true,  createdAt:'2025-01-01' },
  { id:'USR-C07', pin:'110007', name:'General',     role:'client', dept:'General',     phone:'', email:'', active:true,  createdAt:'2025-01-01' },

  /* ── WORKER ─── */
  { id:'USR-W01', pin:'220001', name:'Mandor HCD - Deddy', role:'worker', dept:'HCD Field', phone:'', email:'', active:true, createdAt:'2025-01-01' },

  /* ── ADMIN ─── */
  { id:'USR-A01', pin:'330001', name:'Admin 1 (Tedi Wahyudi)',      role:'admin', dept:'HCD Management', phone:'', email:'', active:true, createdAt:'2025-01-01' },
  { id:'USR-A02', pin:'330002', name:'Admin 2 (Rian M. Nur Ihwan)', role:'admin', dept:'HCD Management', phone:'', email:'', active:true, createdAt:'2025-01-01' },
];
let _userIdSeq = 20;
function genUserId(role) {
  const prefix = role==='client'?'C': role==='worker'?'W':'A';
  return `USR-${prefix}${String(++_userIdSeq).padStart(2,'0')}`;
}

/* ══════════════════════════════════════════════════════════
   APP STATE
══════════════════════════════════════════════════════════ */
let currentUser  = null;
let currentPage  = null;
let selectedRole = null;
let selectedUserId = null;
const pageFilter = {};

const state = {
  tickets: [
    { id:'WO-001', title:'Perbaikan Jembatan Sungai Ciawi',    type:'perbaikan',   location:'Jl. Raya Ciawi KM 12',        desc:'Terdapat keretakan pada struktur balok jembatan sepanjang 3m.',              status:'progress', priority:'tinggi', clientId:'USR-C01', client:'Afdeling 1', created:'2025-04-15', progress:75,  workers:['Mandor HCD - Deddy'], materialReq:'MR-001', notes:'Pengerjaan sudah 75%' },
    { id:'WO-002', title:'Pembangunan Gedung Serbaguna',        type:'pembangunan', location:'Komplek Perkantoran Blok C',   desc:'Rencana pembangunan gedung serbaguna 3 lantai kapasitas 500 orang.',         status:'review',   priority:'tinggi', clientId:'USR-C02', client:'Afdeling 2', created:'2025-04-28', progress:0,   workers:[], materialReq:null, notes:'' },
    { id:'WO-003', title:'Renovasi Jalan Akses Kebun',          type:'perbaikan',   location:'Kawasan Kebun Blok A-7',       desc:'Jalan rusak parah, perlu pengaspalan ulang sepanjang 500m.',                status:'approved', priority:'sedang', clientId:'USR-C03', client:'Afdeling 3', created:'2025-04-20', progress:0,   workers:['Mandor HCD - Deddy'], materialReq:null, notes:'' },
    { id:'WO-004', title:'Pemasangan Saluran Drainase',         type:'pembangunan', location:'Blok B, Afdeling 4',           desc:'Pembangunan saluran drainase baru untuk mengatasi banjir musiman.',         status:'new',      priority:'rendah', clientId:'USR-C04', client:'Afdeling 4', created:'2025-04-30', progress:0,   workers:[], materialReq:null, notes:'' },
    { id:'WO-005', title:'Perbaikan Atap Gudang Alat',          type:'perbaikan',   location:'Gudang Alat, Afdeling 5',     desc:'Kebocoran atap gudang B pada 5 titik.',                                    status:'done',     priority:'sedang', clientId:'USR-C05', client:'Afdeling 5', created:'2025-03-10', progress:100, workers:['Mandor HCD - Deddy'], materialReq:'MR-002', notes:'Selesai sesuai jadwal' },
    { id:'WO-006', title:'Perbaikan Pompa Air Irigasi',         type:'perbaikan',   location:'Pos Irigasi Afdeling 6',      desc:'Pompa air tidak berfungsi, butuh penggantian komponen.',                   status:'new',      priority:'tinggi', clientId:'USR-C06', client:'Afdeling 6', created:'2025-05-01', progress:0,   workers:[], materialReq:null, notes:'' },
    { id:'WO-007', title:'Pemasangan Pagar Kantor General',     type:'pembangunan', location:'Kantor HCD General',          desc:'Pemasangan pagar besi baru mengelilingi area kantor.',                     status:'new',      priority:'rendah', clientId:'USR-C07', client:'General',    created:'2025-05-02', progress:0,   workers:[], materialReq:null, notes:'' },
  ],
  materialRequests: [
    { id:'MR-001', ticketId:'WO-001', ticketTitle:'Perbaikan Jembatan Sungai Ciawi', items:[{name:'Beton K-300',qty:20,unit:'m³',price:1200000},{name:'Besi Tulangan D16',qty:500,unit:'kg',price:18000},{name:'Bekisting Kayu',qty:50,unit:'lembar',price:85000}], status:'approved', submitted:'2025-04-18', notes:'Prioritas karena jembatan kritis', pr:'PR-001' },
    { id:'MR-002', ticketId:'WO-005', ticketTitle:'Perbaikan Atap Gudang Alat',      items:[{name:'Genteng Metal',qty:200,unit:'lembar',price:45000},{name:'Sealant Atap',qty:10,unit:'kg',price:120000}], status:'done', submitted:'2025-03-12', notes:'', pr:'PR-002' },
    { id:'MR-003', ticketId:'WO-003', ticketTitle:'Renovasi Jalan Akses Kebun',      items:[{name:'Aspal Hotmix',qty:50,unit:'ton',price:1800000},{name:'Base Course',qty:80,unit:'ton',price:350000},{name:'Batu Split',qty:30,unit:'m³',price:280000}], status:'review', submitted:'2025-04-22', notes:'Menunggu konfirmasi volume', pr:null },
  ],
  purchaseRequests: [
    { id:'PR-001', mrId:'MR-001', ticketId:'WO-001', title:'PR Perbaikan Jembatan', totalValue:34300000, status:'sent', sentTo:'Dept. Purchasing', date:'2025-04-19', vendor:'CV. Material Utama', notes:'Urgent' },
    { id:'PR-002', mrId:'MR-002', ticketId:'WO-005', title:'PR Atap Gudang',        totalValue:10200000, status:'sent', sentTo:'Dept. Purchasing', date:'2025-03-14', vendor:'Toko Bangunan Sejahtera', notes:'' },
  ],
};
let _woSeq=7, _mrSeq=3, _prSeq=2;

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
const fmt    = n => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
const today  = () => new Date().toISOString().split('T')[0];
const matTot = items => items.reduce((a,i)=>a+(i.qty*i.price),0);
const escHtml= s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const SL = {new:'Baru',review:'Review',approved:'Disetujui',progress:'Dalam Proses',done:'Selesai',rejected:'Ditolak',sent:'Terkirim'};
const SC = {new:'b-new',review:'b-review',approved:'b-approved',progress:'b-progress',done:'b-done',rejected:'b-rejected',sent:'b-sent'};
const PC = {tinggi:'p-high',sedang:'p-med',rendah:'p-low'};
const bdg  = s => `<span class="badge ${SC[s]||'b-new'}">${SL[s]||s}</span>`;
const pTag = p => `<span class="${PC[p]||'p-med'}">⬤ ${p}</span>`;
const initials = name => name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
const roleClass= r => r==='client'?'ua-client': r==='worker'?'ua-worker':'ua-admin';

/* ══════════════════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════════════════ */
const showModal  = html => { document.getElementById('modal-container').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeModal()">${html}</div>`; };
const closeModal = ()   => { document.getElementById('modal-container').innerHTML=''; };

/* ══════════════════════════════════════════════════════════
   MOBILE SIDEBAR
══════════════════════════════════════════════════════════ */
function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}
function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

/* ══════════════════════════════════════════════════════════
   LOGIN FLOW  (3 steps: role → user → pin)
══════════════════════════════════════════════════════════ */
function selectRole(role){
  selectedRole = role;
  const users = USERS.filter(u=>u.role===role && u.active);

  document.getElementById('step-role').classList.add('hidden');

  // If only 1 user for this role → skip user select, go straight to PIN
  if(users.length===1){
    selectedUserId = users[0].id;
    showPinStep(users[0]);
    return;
  }

  // Multiple users → show user list
  const icons={client:'🏢',worker:'👷',admin:'🛡️'};
  const labels={client:'Client',worker:'Worker',admin:'Administrator'};
  document.getElementById('su-label').textContent=`Pilih akun ${labels[role]}`;
  document.getElementById('user-list').innerHTML = users.map(u=>`
    <div class="user-item" onclick="selectUser('${u.id}')">
      <div class="user-avatar">${initials(u.name)}</div>
      <div>
        <div class="user-item-name">${escHtml(u.name)}</div>
        <div class="user-item-dept">${escHtml(u.dept)}</div>
      </div>
    </div>`).join('');
  document.getElementById('step-user').classList.remove('hidden');
}

function selectUser(userId){
  selectedUserId = userId;
  const u = USERS.find(u=>u.id===userId);
  document.getElementById('step-user').classList.add('hidden');
  showPinStep(u);
}

function showPinStep(user){
  const icons={client:'🏢',worker:'👷',admin:'🛡️'};
  document.getElementById('pin-who').innerHTML =
    `<span style="font-size:1.1rem">${icons[user.role]}</span> ${escHtml(user.name)}`;
  document.getElementById('pin-error').classList.add('hidden');
  resetPinBoxes();
  document.getElementById('step-pin').classList.remove('hidden');
  document.querySelectorAll('.pin-box')[0].focus();
  initPinBoxes();
}

function backToRole(){
  selectedRole=null; selectedUserId=null;
  document.getElementById('step-user').classList.add('hidden');
  document.getElementById('step-pin').classList.add('hidden');
  document.getElementById('step-role').classList.remove('hidden');
}
function backToUser(){
  selectedUserId=null;
  document.getElementById('step-pin').classList.add('hidden');
  const users=USERS.filter(u=>u.role===selectedRole&&u.active);
  if(users.length===1){ backToRole(); }
  else { document.getElementById('step-user').classList.remove('hidden'); }
}

function resetPinBoxes(){
  document.querySelectorAll('.pin-box').forEach(b=>{b.value='';b.classList.remove('filled');});
}
function getPIN(){ return [...document.querySelectorAll('.pin-box')].map(b=>b.value).join(''); }

function initPinBoxes(){
  const boxes=[...document.querySelectorAll('.pin-box')];
  boxes.forEach((box,i)=>{
    box.oninput=()=>{
      box.value=box.value.replace(/\D/g,'');
      if(box.value){ box.classList.add('filled'); if(i<boxes.length-1) boxes[i+1].focus(); }
      else box.classList.remove('filled');
    };
    box.onkeydown=e=>{
      if(e.key==='Backspace'&&!box.value&&i>0) boxes[i-1].focus();
      if(e.key==='Enter') doLogin();
    };
  });
}

function doLogin(){
  const pin  = getPIN();
  const user = USERS.find(u=>u.id===selectedUserId && u.pin===pin && u.active);
  if(user){
    currentUser = user;
    document.getElementById('login-screen').style.display='none';
    document.getElementById('app').style.display='flex';

    const rl={client:'Client',worker:'Worker',admin:'Administrator'};
    document.getElementById('role-badge-wrap').innerHTML=`<span class="role-badge badge-${user.role}">${rl[user.role]}</span>`;
    document.getElementById('topbar-user-name').textContent=user.name;

    renderSidebar();
    const def={client:'my-tickets',worker:'work-list',admin:'admin-dashboard'};
    navigateTo(def[user.role]);
  } else {
    document.getElementById('pin-error').classList.remove('hidden');
    resetPinBoxes();
    document.querySelectorAll('.pin-box')[0].focus();
  }
}

function logout(){
  currentUser=null; selectedRole=null; selectedUserId=null;
  document.getElementById('app').style.display='none';
  document.getElementById('login-screen').style.display='flex';
  ['step-user','step-pin'].forEach(id=>document.getElementById(id).classList.add('hidden'));
  document.getElementById('step-role').classList.remove('hidden');
  document.getElementById('content').innerHTML='';
  closeSidebar();
}

/* ══════════════════════════════════════════════════════════
   SIDEBAR & NAVIGATION
══════════════════════════════════════════════════════════ */
const MENUS = {
  client:[
    {id:'my-tickets',      icon:'📋', label:'Work Order Saya'},
    {id:'new-ticket',      icon:'➕', label:'Buat Work Order'},
    {sep:true},
    {id:'client-progress', icon:'📊', label:'Monitor Pekerjaan'},
    {id:'client-reports',  icon:'📑', label:'Laporan'},
  ],
  worker:[
    {id:'work-list',        icon:'📋', label:'Daftar Pekerjaan'},
    {sep:true},
    {id:'material-request', icon:'📦', label:'Permintaan Material'},
    {sep:true},
    {id:'worker-progress',  icon:'📊', label:'Update Progress'},
  ],
  admin:[
    {id:'admin-dashboard',  icon:'🏠', label:'Dashboard'},
    {sep:true},
    {section:'Verifikasi'},
    {id:'admin-tickets',    icon:'📋', label:'Verifikasi WO'},
    {id:'admin-materials',  icon:'📦', label:'Verifikasi Material'},
    {sep:true},
    {section:'Purchase'},
    {id:'admin-pr',         icon:'🛒', label:'Purchase Request'},
    {sep:true},
    {section:'Master'},
    {id:'admin-users',      icon:'👥', label:'Manajemen Akun'},
    {sep:true},
    {id:'admin-reports',    icon:'📑', label:'Laporan & Export'},
  ],
};

function renderSidebar(){
  const role=currentUser.role;
  const pendT=state.tickets.filter(t=>t.status==='review').length;
  const pendM=state.materialRequests.filter(m=>m.status==='review').length;
  const newT =state.tickets.filter(t=>t.status==='new').length;

  document.getElementById('sidebar-inner').innerHTML=MENUS[role].map(m=>{
    if(m.sep)     return `<div class="nav-sep"></div>`;
    if(m.section) return `<div class="nav-section">${m.section}</div>`;
    let dot='';
    if(role==='admin'){
      if(m.id==='admin-tickets'  &&(pendT+newT)>0) dot=`<span class="notif-dot"></span>`;
      if(m.id==='admin-materials'&& pendM>0)        dot=`<span class="notif-dot"></span>`;
    }
    if(role==='worker'&&m.id==='work-list'&&(pendT+newT)>0) dot=`<span class="notif-dot"></span>`;
    return `<button class="nav-item" id="nav-${m.id}" onclick="navTo('${m.id}')">
      <span class="ni">${m.icon}</span>${m.label}${dot}
    </button>`;
  }).join('');
}

const RENDERERS = {
  'my-tickets':       pgClientTickets,
  'new-ticket':       pgNewTicket,
  'client-progress':  pgClientProgress,
  'client-reports':   pgClientReports,
  'work-list':        pgWorkList,
  'material-request': pgMaterialRequest,
  'worker-progress':  pgWorkerProgress,
  'admin-dashboard':  pgAdminDashboard,
  'admin-tickets':    pgAdminTickets,
  'admin-materials':  pgAdminMaterials,
  'admin-pr':         pgAdminPR,
  'admin-users':      pgAdminUsers,
  'admin-reports':    pgAdminReports,
};

function navTo(page){
  currentPage=page;
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const el=document.getElementById('nav-'+page);
  if(el) el.classList.add('active');
  const fn=RENDERERS[page];
  document.getElementById('content').innerHTML = fn ? fn() : `<div class="empty"><div class="empty-icon">🚧</div><p>Halaman belum tersedia</p></div>`;
  closeSidebar();
}
function navigateTo(page){ navTo(page); }

/* ══════════════════════════════════════════════════════════
   FILTER BAR
══════════════════════════════════════════════════════════ */
function buildFilter(pid, statuses, counts){
  const cur = pageFilter[pid]||'all';
  const total = Object.values(counts).reduce((a,b)=>a+b,0);
  const chips = [{key:'all',label:'Semua',cnt:total},...statuses.map(s=>({key:s,label:SL[s]||s,cnt:counts[s]||0}))];
  return `<div class="filter-bar">${chips.map(c=>`
    <button class="fchip ${c.key===cur?'active':''}" onclick="setFilter('${pid}','${c.key}')">
      ${c.label}<span class="fc">${c.cnt}</span>
    </button>`).join('')}</div>`;
}
function setFilter(pid,key){ pageFilter[pid]=key; navTo(pid); }
function applyFilter(pid,items){
  const f=pageFilter[pid]||'all';
  return f==='all' ? items : items.filter(i=>i.status===f);
}

/* ══════════════════════════════════════════════════════════
   SHARED — TICKET DETAIL MODAL
══════════════════════════════════════════════════════════ */
function showWODetail(id){
  const t=state.tickets.find(t=>t.id===id);
  const mr=t.materialReq?state.materialRequests.find(m=>m.id===t.materialReq):null;
  const wfSteps=[
    {lbl:'WO Dibuat',    done:true,                                               act:false},
    {lbl:'Review',       done:['review','approved','progress','done'].includes(t.status), act:t.status==='review'},
    {lbl:'Disetujui',    done:['approved','progress','done'].includes(t.status),          act:t.status==='approved'},
    {lbl:'Material OK',  done:mr&&['approved','done'].includes(mr.status),                act:mr&&mr.status==='review'},
    {lbl:'Dalam Proses', done:t.status==='done',                                  act:t.status==='progress'},
    {lbl:'Selesai',      done:t.status==='done',                                  act:false},
  ];
  const workerList = t.workers&&t.workers.length ? t.workers.join(', ') : '—';
  showModal(`<div class="modal modal-wide">
    <div class="modal-hdr">
      <h2>Detail Work Order — <span class="chip">${t.id}</span></h2>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem;margin-bottom:1rem">
        <div>
          <div style="font-weight:800;font-size:1rem;margin-bottom:.3rem">${escHtml(t.title)}</div>
          <div style="font-size:.75rem;color:var(--text3)">📍 ${escHtml(t.location)} &nbsp;|&nbsp; 📅 ${t.created}</div>
        </div>${bdg(t.status)}
      </div>
      <div class="wf-wrap">${wfSteps.map(s=>`
        <div class="wf-step ${s.done?'done':''} ${s.act?'active':''}">
          <div class="wf-circle">${s.done?'✓':''}</div>
          <div class="wf-lbl">${s.lbl}</div>
        </div>`).join('')}
      </div>
      <div class="info-grid">
        <div class="info-cell"><div class="info-lbl">Tipe</div><div class="info-val">${t.type}</div></div>
        <div class="info-cell"><div class="info-lbl">Prioritas</div><div class="info-val ${PC[t.priority]||'p-med'}">${t.priority}</div></div>
        <div class="info-cell"><div class="info-lbl">Pemohon</div><div class="info-val">${escHtml(t.client)}</div></div>
        <div class="info-cell"><div class="info-lbl">Petugas</div><div class="info-val">${escHtml(workerList)}</div></div>
        <div class="info-cell"><div class="info-lbl">Material</div><div class="info-val">${t.materialReq||'Belum diajukan'}</div></div>
        <div class="info-cell"><div class="info-lbl">PR</div><div class="info-val">${mr?.pr||'—'}</div></div>
      </div>
      <div style="background:var(--bg3);border-radius:var(--r2);padding:.75rem;margin-bottom:.85rem">
        <div style="font-size:.67rem;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:.3rem">Deskripsi</div>
        <div style="font-size:.82rem;line-height:1.65">${escHtml(t.desc)}</div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;font-size:.77rem;margin-bottom:.3rem">
          <span style="color:var(--text2)">Progress</span>
          <span style="font-weight:800;color:var(--orange)">${t.progress}%</span>
        </div>
        <div class="progress-wrap"><div class="progress-bar" style="width:${t.progress}%"></div></div>
      </div>
      ${t.notes?`<div style="margin-top:.65rem;font-size:.76rem;color:var(--text2);font-style:italic">"${escHtml(t.notes)}"</div>`:''}
    </div>
    <div class="modal-footer"><button class="btn btn-ghost" onclick="closeModal()">Tutup</button></div>
  </div>`);
}

/* ══════════════════════════════════════════════════════════
   CLIENT PAGES
══════════════════════════════════════════════════════════ */
function pgClientTickets(){
  const my=state.tickets.filter(t=>t.clientId===currentUser.id);
  const counts={};
  ['new','review','approved','progress','done','rejected'].forEach(s=>{counts[s]=my.filter(t=>t.status===s).length;});
  const fil=applyFilter('my-tickets',my);
  return `
  <div class="page-header">
    <div><h1>Work Order Saya</h1><p>${escHtml(currentUser.name)} — ${escHtml(currentUser.dept)}</p></div>
    <div class="hdr-actions"><button class="btn btn-primary" onclick="navTo('new-ticket')">➕ Buat Work Order</button></div>
  </div>
  <div class="stat-grid">
    <div class="stat-card"><div class="stat-lbl">Total</div><div class="stat-val">${my.length}</div></div>
    <div class="stat-card"><div class="stat-lbl">Aktif</div><div class="stat-val" style="color:var(--cyan)">${counts.progress||0}</div></div>
    <div class="stat-card"><div class="stat-lbl">Menunggu</div><div class="stat-val" style="color:var(--amber)">${(counts.new||0)+(counts.review||0)+(counts.approved||0)}</div></div>
    <div class="stat-card"><div class="stat-lbl">Selesai</div><div class="stat-val" style="color:var(--green)">${counts.done||0}</div></div>
  </div>
  ${buildFilter('my-tickets',['new','review','approved','progress','done','rejected'],counts)}
  <div class="table-wrap">
    ${fil.length===0?`<div class="empty"><div class="empty-icon">📭</div><p>Tidak ada WO dengan filter ini</p></div>`:`
    <table>
      <thead><tr><th>ID</th><th>Judul</th><th class="hide-mob">Tipe</th><th class="hide-mob">Prioritas</th><th>Status</th><th>Progress</th><th></th></tr></thead>
      <tbody>${fil.map(t=>`
        <tr>
          <td><span class="chip">${t.id}</span></td>
          <td><div style="font-weight:700;font-size:.82rem">${escHtml(t.title)}</div><div style="font-size:.7rem;color:var(--text3)">${escHtml(t.location)}</div></td>
          <td class="hide-mob" style="font-size:.74rem;color:var(--text3)">${t.type}</td>
          <td class="hide-mob">${pTag(t.priority)}</td>
          <td>${bdg(t.status)}</td>
          <td style="min-width:80px">
            <div style="display:flex;align-items:center;gap:.35rem">
              <div class="progress-wrap" style="flex:1"><div class="progress-bar" style="width:${t.progress}%"></div></div>
              <span style="font-size:.7rem;color:var(--text3);min-width:26px">${t.progress}%</span>
            </div>
          </td>
          <td><button class="btn btn-ghost btn-sm" onclick="showWODetail('${t.id}')">Detail</button></td>
        </tr>`).join('')}
      </tbody>
    </table>`}
  </div>`;
}

function pgNewTicket(){
  return `
  <div class="page-header">
    <div><h1>Buat Work Order</h1><p>Ajukan permintaan perbaikan atau pembangunan</p></div>
  </div>
  <div class="card" style="max-width:560px">
    <div class="form-group"><label>Judul Pekerjaan *</label><input type="text" id="nt-title" placeholder="cth: Perbaikan Pompa Irigasi Blok A"></div>
    <div class="form-2col">
      <div class="form-group"><label>Tipe Pekerjaan *</label>
        <select id="nt-type">
          <option value="perbaikan">Perbaikan</option>
          <option value="pembangunan">Pembangunan Baru</option>
          <option value="renovasi">Renovasi</option>
          <option value="perawatan">Perawatan Rutin</option>
        </select>
      </div>
      <div class="form-group"><label>Prioritas *</label>
        <select id="nt-priority">
          <option value="rendah">Rendah</option>
          <option value="sedang" selected>Sedang</option>
          <option value="tinggi">Tinggi</option>
        </select>
      </div>
    </div>
    <div class="form-group"><label>Lokasi / Alamat *</label><input type="text" id="nt-location" placeholder="Lokasi lengkap pekerjaan"></div>
    <div class="form-group"><label>Deskripsi Lengkap *</label><textarea id="nt-desc" rows="4" placeholder="Jelaskan kondisi saat ini, kerusakan, dan urgensi..."></textarea></div>
    <div style="display:flex;gap:.6rem;margin-top:.25rem">
      <button class="btn btn-primary" onclick="submitNewTicket()">📤 Kirim Work Order</button>
      <button class="btn btn-ghost"   onclick="navTo('my-tickets')">Batal</button>
    </div>
  </div>`;
}

function submitNewTicket(){
  const title=document.getElementById('nt-title').value.trim();
  const desc =document.getElementById('nt-desc').value.trim();
  const loc  =document.getElementById('nt-location').value.trim();
  if(!title||!desc||!loc){alert('Mohon lengkapi semua field wajib (*)');return;}
  const id=`WO-${String(++_woSeq).padStart(3,'0')}`;
  state.tickets.push({
    id,title,type:document.getElementById('nt-type').value,
    location:loc,desc,status:'new',
    priority:document.getElementById('nt-priority').value,
    clientId:currentUser.id, client:currentUser.name,
    created:today(), progress:0, workers:[], materialReq:null, notes:''
  });
  renderSidebar();
  showModal(`<div class="modal">
    <div class="modal-hdr"><h2>✅ Work Order Terkirim</h2><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <p style="font-size:.88rem;line-height:1.65;margin-bottom:1rem">Work Order <strong>${id}</strong> berhasil dibuat dan akan segera ditinjau.</p>
      <div class="timeline">
        <div class="tl-item"><div class="tl-dot tl-green"></div><div><div class="tl-ttl">WO diterima — Status: Baru</div></div></div>
        <div class="tl-item"><div class="tl-dot tl-amber"></div><div><div class="tl-ttl">Menunggu review Worker &amp; Admin</div></div></div>
        <div class="tl-item"><div class="tl-dot tl-gray"></div><div><div class="tl-ttl">Penugasan &amp; pengerjaan</div></div></div>
      </div>
    </div>
    <div class="modal-footer"><button class="btn btn-primary" onclick="closeModal();navTo('my-tickets')">Lihat WO Saya</button></div>
  </div>`);
}

function pgClientProgress(){
  const active=state.tickets.filter(t=>t.clientId===currentUser.id&&['progress','approved'].includes(t.status));
  const counts={approved:active.filter(t=>t.status==='approved').length,progress:active.filter(t=>t.status==='progress').length};
  const fil=applyFilter('client-progress',active);
  return `
  <div class="page-header"><div><h1>Monitor Pekerjaan</h1><p>Progress pekerjaan secara real-time</p></div></div>
  ${buildFilter('client-progress',['approved','progress'],counts)}
  ${fil.length===0?`<div class="empty"><div class="empty-icon">📊</div><p>Tidak ada pekerjaan aktif</p></div>`
  :fil.map(t=>`
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;margin-bottom:.85rem">
      <div>
        <span class="chip" style="margin-bottom:.3rem">${t.id}</span>
        <div style="font-weight:800;font-size:.95rem;margin:.25rem 0">${escHtml(t.title)}</div>
        <div style="font-size:.74rem;color:var(--text3)">📍 ${escHtml(t.location)}</div>
        <div style="font-size:.74rem;color:var(--text3);margin-top:.15rem">
          👷 ${t.workers&&t.workers.length?t.workers.join(', '):'Belum ditugaskan'}
        </div>
      </div>${bdg(t.status)}
    </div>
    <div style="margin-bottom:.5rem">
      <div style="display:flex;justify-content:space-between;font-size:.76rem;margin-bottom:.28rem">
        <span style="color:var(--text2)">Progress</span>
        <span style="font-weight:800;color:var(--orange)">${t.progress}%</span>
      </div>
      <div class="progress-wrap"><div class="progress-bar" style="width:${t.progress}%"></div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;font-size:.76rem">
      <div style="color:var(--text3)">Material: <span style="color:var(--text2);font-weight:600">${t.materialReq?'Sudah diajukan':'Belum'}</span></div>
      <div style="color:var(--text3)">Catatan: <span style="color:var(--text2);font-weight:600">${escHtml(t.notes)||'—'}</span></div>
    </div>
  </div>`).join('')}`;
}

function pgClientReports(){
  const my=state.tickets.filter(t=>t.clientId===currentUser.id);
  const counts={};
  ['new','review','approved','progress','done','rejected'].forEach(s=>{counts[s]=my.filter(t=>t.status===s).length;});
  const fil=applyFilter('client-reports',my);
  return `
  <div class="page-header"><div><h1>Laporan</h1><p>Riwayat semua Work Order</p></div></div>
  <div class="stat-grid">
    <div class="stat-card"><div class="stat-lbl">Total WO</div><div class="stat-val">${my.length}</div></div>
    <div class="stat-card"><div class="stat-lbl">Selesai</div><div class="stat-val" style="color:var(--green)">${counts.done||0}</div>
      <div class="stat-sub">${my.length?Math.round((counts.done||0)/my.length*100):0}% rate</div></div>
  </div>
  ${buildFilter('client-reports',['new','review','approved','progress','done','rejected'],counts)}
  <div class="table-wrap">
    <table>
      <thead><tr><th>ID</th><th>Judul</th><th class="hide-mob">Tipe</th><th>Status</th><th class="hide-mob">Tanggal</th></tr></thead>
      <tbody>${fil.map(t=>`
        <tr>
          <td><span class="chip">${t.id}</span></td>
          <td style="font-size:.81rem;font-weight:600">${escHtml(t.title)}</td>
          <td class="hide-mob" style="font-size:.73rem;color:var(--text3)">${t.type}</td>
          <td>${bdg(t.status)}</td>
          <td class="hide-mob" style="font-size:.73rem;color:var(--text3)">${t.created}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

/* ══════════════════════════════════════════════════════════
   WORKER PAGES
══════════════════════════════════════════════════════════ */
function pgWorkList(){
  // Worker sees ALL tickets (all clients)
  const all=state.tickets.filter(t=>['new','review','approved','progress','done'].includes(t.status));
  const counts={};
  ['new','review','approved','progress','done'].forEach(s=>{counts[s]=state.tickets.filter(t=>t.status===s).length;});
  const fil=applyFilter('work-list',all);
  return `
  <div class="page-header"><div><h1>Daftar Pekerjaan</h1><p>Semua Work Order yang perlu ditangani</p></div></div>
  <div class="stat-grid">
    <div class="stat-card"><div class="stat-lbl">Baru / Review</div><div class="stat-val" style="color:var(--amber)">${(counts.new||0)+(counts.review||0)}</div></div>
    <div class="stat-card"><div class="stat-lbl">Disetujui</div><div class="stat-val" style="color:var(--blue)">${counts.approved||0}</div></div>
    <div class="stat-card"><div class="stat-lbl">Dalam Proses</div><div class="stat-val" style="color:var(--cyan)">${counts.progress||0}</div></div>
    <div class="stat-card"><div class="stat-lbl">Selesai</div><div class="stat-val" style="color:var(--green)">${counts.done||0}</div></div>
  </div>
  ${buildFilter('work-list',['new','review','approved','progress','done'],counts)}
  <div class="table-wrap">
    ${fil.length===0?`<div class="empty"><div class="empty-icon">📭</div><p>Tidak ada WO dengan filter ini</p></div>`:`
    <table>
      <thead><tr><th>ID</th><th>Judul</th><th class="hide-mob">Pemohon</th><th class="hide-mob">Prioritas</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody>${fil.map(t=>`
        <tr>
          <td><span class="chip">${t.id}</span></td>
          <td><div style="font-weight:700;font-size:.82rem">${escHtml(t.title)}</div><div style="font-size:.7rem;color:var(--text3)">📍 ${escHtml(t.location)}</div></td>
          <td class="hide-mob" style="font-size:.78rem">${escHtml(t.client)}</td>
          <td class="hide-mob">${pTag(t.priority)}</td>
          <td>${bdg(t.status)}</td>
          <td>
            <div style="display:flex;gap:.3rem;flex-wrap:wrap">
              <button class="btn btn-ghost btn-sm" onclick="showWODetail('${t.id}')">Detail</button>
              ${(t.status==='new'||t.status==='review')?`<button class="btn btn-warning btn-sm" onclick="workerVerify('${t.id}')">✓ Verifikasi</button>`:''}
              ${t.status==='approved'&&!t.materialReq?`<button class="btn btn-primary btn-sm" onclick="showMRForm('${t.id}')">📦 Material</button>`:''}
              ${t.status==='progress'?`<button class="btn btn-success btn-sm" onclick="showProgressUpdate('${t.id}')">📊 Update</button>`:''}
            </div>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`}
  </div>`;
}

/* Worker: verifikasi — tambah pekerja bebas */
function workerVerify(id){
  const t=state.tickets.find(t=>t.id===id);
  const existingWorkers = t.workers||[];
  showModal(`<div class="modal">
    <div class="modal-hdr"><h2>Verifikasi Work Order</h2><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div style="background:var(--bg3);border-radius:var(--r2);padding:.75rem;margin-bottom:1rem;font-size:.82rem">
        <div style="font-weight:800">${escHtml(t.title)}</div>
        <div style="color:var(--text3);margin-top:.15rem">${t.id} • ${escHtml(t.location)}</div>
      </div>

      <div class="form-group">
        <label>Petugas yang Ditugaskan</label>
        <div class="worker-tags" id="worker-tags">
          ${existingWorkers.map(w=>`<span class="wtag">${escHtml(w)}<button class="wtag-remove" onclick="removeWorkerTag(this)">×</button></span>`).join('')}
        </div>
        <div style="display:flex;gap:.45rem">
          <input type="text" id="worker-input" placeholder="Tambah nama petugas..." style="flex:1"
            onkeydown="if(event.key==='Enter'){event.preventDefault();addWorkerTag();}">
          <button class="btn btn-ghost btn-sm" onclick="addWorkerTag()">+ Tambah</button>
        </div>
      </div>

      <div class="form-group">
        <label>Catatan Verifikasi Lapangan</label>
        <textarea id="vf-notes" rows="3" placeholder="Hasil tinjauan lapangan...">${escHtml(t.notes)}</textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Batal</button>
      <button class="btn btn-warning" onclick="confirmVerify('${id}')">✓ Kirim ke Admin</button>
    </div>
  </div>`);
}

function addWorkerTag(){
  const inp=document.getElementById('worker-input');
  const val=inp.value.trim();
  if(!val)return;
  const tag=document.createElement('span');
  tag.className='wtag';
  tag.innerHTML=`${escHtml(val)}<button class="wtag-remove" onclick="removeWorkerTag(this)">×</button>`;
  document.getElementById('worker-tags').appendChild(tag);
  inp.value='';
}
function removeWorkerTag(btn){ btn.closest('.wtag').remove(); }
function getWorkerTags(){ return [...document.querySelectorAll('#worker-tags .wtag')].map(el=>el.childNodes[0].textContent.trim()).filter(Boolean); }

function confirmVerify(id){
  const t=state.tickets.find(t=>t.id===id);
  const workers=getWorkerTags();
  t.workers=workers;
  t.notes=document.getElementById('vf-notes').value;
  t.status='review';
  closeModal();
  renderSidebar();
  navTo(currentPage);
}

/* Material Request Form */
function showMRForm(ticketId){
  const t=state.tickets.find(t=>t.id===ticketId);
  showModal(`<div class="modal modal-wide">
    <div class="modal-hdr"><h2>Ajukan Permintaan Material</h2><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div style="background:var(--bg3);border-radius:var(--r2);padding:.7rem;margin-bottom:1rem;font-size:.81rem">
        <div style="font-weight:800">${escHtml(t.title)}</div>
        <div style="color:var(--text3);margin-top:.15rem">${t.id} • ${escHtml(t.location)}</div>
      </div>
      <div id="mr-items">${mrRowHTML()}</div>
      <button class="btn btn-ghost btn-sm" onclick="addMRRow()" style="margin-bottom:.85rem">+ Tambah Material</button>
      <div class="form-group"><label>Catatan</label><textarea id="mr-notes" rows="2" placeholder="Catatan tambahan..."></textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost"   onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="submitMR('${ticketId}')">📤 Kirim ke Admin</button>
    </div>
  </div>`);
}

function mrRowHTML(){
  return `<div class="mr-row">
    <div class="form-group" style="margin:0"><label>Nama Material</label><input type="text" class="mr-name" placeholder="cth: Beton K-300"></div>
    <div class="form-group" style="margin:0"><label>Qty</label><input type="number" class="mr-qty" placeholder="0" min="0"></div>
    <div class="form-group" style="margin:0"><label>Satuan</label><input type="text" class="mr-unit" placeholder="m³"></div>
    <button class="btn btn-ghost btn-sm" style="padding:.3rem .5rem;margin-top:1.35rem" onclick="this.closest('.mr-row').remove()">✕</button>
  </div>`;
}
function addMRRow(){ document.getElementById('mr-items').insertAdjacentHTML('beforeend',mrRowHTML()); }

function submitMR(ticketId){
  const items=[...document.querySelectorAll('.mr-row')].map(el=>({
    name:el.querySelector('.mr-name').value.trim(),
    qty:parseFloat(el.querySelector('.mr-qty').value)||0,
    unit:el.querySelector('.mr-unit').value.trim(),
    price:0,
  })).filter(i=>i.name);
  if(!items.length){alert('Tambahkan minimal 1 material');return;}
  const id=`MR-${String(++_mrSeq).padStart(3,'0')}`;
  const t=state.tickets.find(t=>t.id===ticketId);
  state.materialRequests.push({id,ticketId,ticketTitle:t.title,items,status:'review',submitted:today(),notes:document.getElementById('mr-notes').value,pr:null});
  t.materialReq=id;
  closeModal();
  renderSidebar();
  alert(`✅ Permintaan material ${id} berhasil diajukan ke Administrator.`);
  navTo(currentPage);
}

/* Progress Update — tombol 25/50/75/100 */
function showProgressUpdate(id){
  const t=state.tickets.find(t=>t.id===id);
  const existWorkers=t.workers&&t.workers.length?t.workers:[];
  showModal(`<div class="modal">
    <div class="modal-hdr"><h2>Update Progress</h2><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div style="font-weight:800;margin-bottom:.85rem">${escHtml(t.title)}</div>

      <div class="form-group">
        <label>Progress Pekerjaan</label>
        <div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:.5rem">
          <span style="color:var(--text2)">Progress saat ini</span>
          <span id="prog-disp" style="font-weight:800;color:var(--orange)">${t.progress}%</span>
        </div>
        <div class="progress-wrap" style="margin-bottom:.75rem">
          <div class="progress-bar" id="prog-preview" style="width:${t.progress}%"></div>
        </div>
        <div class="progress-steps">
          ${[25,50,75,100].map(v=>`<button class="prog-btn ${t.progress===v?'active':''}" id="pbtn-${v}" onclick="setProgVal(${v})">${v}%</button>`).join('')}
        </div>
        <input type="hidden" id="prog-val" value="${t.progress}">
      </div>

      <div class="form-group">
        <label>Petugas yang Bekerja</label>
        <div class="worker-tags" id="worker-tags-prog">
          ${existWorkers.map(w=>`<span class="wtag">${escHtml(w)}<button class="wtag-remove" onclick="removeWorkerTag(this)">×</button></span>`).join('')}
        </div>
        <div style="display:flex;gap:.45rem">
          <input type="text" id="worker-input-prog" placeholder="Tambah nama petugas..." style="flex:1"
            onkeydown="if(event.key==='Enter'){event.preventDefault();addWorkerTagProg();}">
          <button class="btn btn-ghost btn-sm" onclick="addWorkerTagProg()">+ Tambah</button>
        </div>
      </div>

      <div class="form-group"><label>Catatan Kemajuan</label>
        <textarea id="prog-notes" rows="3" placeholder="Deskripsi pekerjaan hari ini...">${escHtml(t.notes)}</textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost"   onclick="closeModal()">Batal</button>
      <button class="btn btn-success" onclick="saveProgress('${id}')">💾 Simpan Update</button>
    </div>
  </div>`);
}

function setProgVal(v){
  document.getElementById('prog-val').value=v;
  document.getElementById('prog-disp').textContent=v+'%';
  document.getElementById('prog-preview').style.width=v+'%';
  [25,50,75,100].forEach(x=>{
    const b=document.getElementById('pbtn-'+x);
    if(b) b.classList.toggle('active',x===v);
  });
}

function addWorkerTagProg(){
  const inp=document.getElementById('worker-input-prog');
  const val=inp.value.trim();
  if(!val)return;
  const tag=document.createElement('span');
  tag.className='wtag';
  tag.innerHTML=`${escHtml(val)}<button class="wtag-remove" onclick="removeWorkerTag(this)">×</button>`;
  document.getElementById('worker-tags-prog').appendChild(tag);
  inp.value='';
}
function getWorkerTagsProg(){ return [...document.querySelectorAll('#worker-tags-prog .wtag')].map(el=>el.childNodes[0].textContent.trim()).filter(Boolean); }

function saveProgress(id){
  const t=state.tickets.find(t=>t.id===id);
  t.progress=parseInt(document.getElementById('prog-val').value)||0;
  t.notes=document.getElementById('prog-notes').value;
  const w=getWorkerTagsProg();
  if(w.length) t.workers=w;
  if(t.progress===100) t.status='done';
  closeModal();
  navTo(currentPage);
}

function pgMaterialRequest(){
  const mrs=state.materialRequests;
  const counts={review:mrs.filter(m=>m.status==='review').length,approved:mrs.filter(m=>m.status==='approved').length,done:mrs.filter(m=>m.status==='done').length,rejected:mrs.filter(m=>m.status==='rejected').length};
  const fil=applyFilter('material-request',mrs);
  return `
  <div class="page-header"><div><h1>Permintaan Material</h1><p>Material yang telah diajukan</p></div></div>
  <div class="stat-grid">
    <div class="stat-card"><div class="stat-lbl">Total</div><div class="stat-val">${mrs.length}</div></div>
    <div class="stat-card"><div class="stat-lbl">Menunggu</div><div class="stat-val" style="color:var(--amber)">${counts.review}</div></div>
    <div class="stat-card"><div class="stat-lbl">Disetujui</div><div class="stat-val" style="color:var(--green)">${counts.approved}</div></div>
  </div>
  ${buildFilter('material-request',['review','approved','done','rejected'],counts)}
  ${fil.length===0?`<div class="empty"><div class="empty-icon">📦</div><p>Tidak ada data</p></div>`:
  fil.map(mr=>`
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;margin-bottom:.8rem">
      <div>
        <span class="chip" style="margin-bottom:.3rem">${mr.id}</span>
        <div style="font-weight:800;margin:.25rem 0">${escHtml(mr.ticketTitle)}</div>
        <div style="font-size:.73rem;color:var(--text3)">WO: ${mr.ticketId} • ${mr.submitted}</div>
      </div>${bdg(mr.status)}
    </div>
    <table style="font-size:.76rem">
      <thead><tr><th>Material</th><th>Qty</th><th>Satuan</th></tr></thead>
      <tbody>${mr.items.map(i=>`<tr><td>${escHtml(i.name)}</td><td>${i.qty}</td><td>${escHtml(i.unit)}</td></tr>`).join('')}</tbody>
    </table>
    ${mr.notes?`<div style="margin-top:.6rem;font-size:.74rem;color:var(--text2);font-style:italic">"${escHtml(mr.notes)}"</div>`:''}
  </div>`).join('')}`;
}

function pgWorkerProgress(){
  // FIX: show all progress tickets, not just ones assigned to current worker name
  const jobs=state.tickets.filter(t=>t.status==='progress');
  return `
  <div class="page-header"><div><h1>Update Progress</h1><p>Pekerjaan yang sedang berlangsung</p></div></div>
  ${jobs.length===0?`<div class="empty"><div class="empty-icon">✅</div><p>Tidak ada pekerjaan dalam proses saat ini</p></div>`
  :jobs.map(t=>`
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;margin-bottom:.8rem">
      <div>
        <span class="chip" style="margin-bottom:.25rem">${t.id}</span>
        <div style="font-weight:800;font-size:.9rem;margin:.25rem 0">${escHtml(t.title)}</div>
        <div style="font-size:.73rem;color:var(--text3)">📍 ${escHtml(t.location)} • ${escHtml(t.client)}</div>
        <div style="font-size:.73rem;color:var(--text3);margin-top:.1rem">
          👷 ${t.workers&&t.workers.length?escHtml(t.workers.join(', ')):'Belum ditugaskan'}
        </div>
      </div>${bdg(t.status)}
    </div>
    <div style="margin-bottom:.75rem">
      <div style="display:flex;justify-content:space-between;font-size:.77rem;margin-bottom:.28rem">
        <span style="color:var(--text2)">Progress</span>
        <span style="font-weight:800;color:var(--orange)">${t.progress}%</span>
      </div>
      <div class="progress-wrap"><div class="progress-bar" style="width:${t.progress}%"></div></div>
    </div>
    <button class="btn btn-success btn-sm" onclick="showProgressUpdate('${t.id}')">📊 Update Progress</button>
  </div>`).join('')}`;
}

/* ══════════════════════════════════════════════════════════
   ADMIN PAGES
══════════════════════════════════════════════════════════ */
function pgAdminDashboard(){
  const pendT =state.tickets.filter(t=>['new','review'].includes(t.status)).length;
  const pendM =state.materialRequests.filter(m=>m.status==='review').length;
  const active=state.tickets.filter(t=>t.status==='progress').length;
  const totalPR=state.purchaseRequests.reduce((a,p)=>a+p.totalValue,0);
  const sBar=s=>{
    const c=state.tickets.filter(t=>t.status===s).length;
    const pct=state.tickets.length?Math.round(c/state.tickets.length*100):0;
    return `<div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.5rem">
      ${bdg(s)}
      <div class="progress-wrap" style="flex:1"><div class="progress-bar" style="width:${pct}%"></div></div>
      <span style="font-size:.74rem;color:var(--text3);min-width:18px;text-align:right">${c}</span>
    </div>`;
  };
  return `
  <div class="page-header"><div><h1>Dashboard</h1><p>Ringkasan Work Order HCD</p></div></div>
  <div class="stat-grid">
    <div class="stat-card" style="border-left:3px solid var(--amber)">
      <div class="stat-lbl">Perlu Tindakan</div>
      <div class="stat-val" style="color:var(--amber)">${pendT+pendM}</div>
      <div class="stat-sub">${pendT} WO · ${pendM} Material</div>
    </div>
    <div class="stat-card" style="border-left:3px solid var(--cyan)">
      <div class="stat-lbl">Proyek Aktif</div>
      <div class="stat-val" style="color:var(--cyan)">${active}</div>
      <div class="stat-sub">Sedang berjalan</div>
    </div>
    <div class="stat-card" style="border-left:3px solid var(--green)">
      <div class="stat-lbl">Total WO</div>
      <div class="stat-val">${state.tickets.length}</div>
      <div class="stat-sub">${state.tickets.filter(t=>t.status==='done').length} selesai</div>
    </div>
    <div class="stat-card" style="border-left:3px solid var(--orange)">
      <div class="stat-lbl">Total PR</div>
      <div class="stat-val" style="font-size:1rem;color:var(--orange)">${fmt(totalPR)}</div>
      <div class="stat-sub">${state.purchaseRequests.length} purchase request</div>
    </div>
  </div>
  <div class="two-col">
    <div class="card">
      <div class="card-hdr"><div class="card-title">Distribusi Status WO</div></div>
      ${['new','review','approved','progress','done','rejected'].map(sBar).join('')}
    </div>
    <div class="card">
      <div class="card-hdr"><div class="card-title">Alur Kerja</div></div>
      <div class="timeline">
        <div class="tl-item"><div class="tl-dot tl-green"></div><div><div class="tl-ttl">Client buat Work Order</div><div class="tl-desc">${state.tickets.length} total WO</div></div></div>
        <div class="tl-item"><div class="tl-dot ${pendT>0?'tl-amber':'tl-green'}"></div><div><div class="tl-ttl">Worker verifikasi lapangan</div><div class="tl-desc">${pendT} menunggu review</div></div></div>
        <div class="tl-item"><div class="tl-dot ${pendM>0?'tl-amber':'tl-green'}"></div><div><div class="tl-ttl">Material diajukan</div><div class="tl-desc">${pendM} MR perlu persetujuan</div></div></div>
        <div class="tl-item"><div class="tl-dot tl-orange"></div><div><div class="tl-ttl">Admin buat Purchase Request</div><div class="tl-desc">${state.purchaseRequests.length} PR terkirim</div></div></div>
        <div class="tl-item"><div class="tl-dot tl-green"></div><div><div class="tl-ttl">Pekerjaan selesai</div><div class="tl-desc">${state.tickets.filter(t=>t.status==='done').length} WO selesai</div></div></div>
      </div>
    </div>
  </div>`;
}

function pgAdminTickets(){
  const all=state.tickets;
  const counts={};
  ['new','review','approved','progress','done','rejected'].forEach(s=>{counts[s]=all.filter(t=>t.status===s).length;});
  const fil=applyFilter('admin-tickets',all);
  return `
  <div class="page-header"><div><h1>Verifikasi Work Order</h1><p>Setujui atau tolak permintaan pekerjaan</p></div></div>
  ${buildFilter('admin-tickets',['new','review','approved','progress','done','rejected'],counts)}
  <div class="table-wrap">
    ${fil.length===0?`<div class="empty"><div class="empty-icon">📭</div><p>Tidak ada WO dengan filter ini</p></div>`:`
    <table>
      <thead><tr><th>ID</th><th>Judul</th><th class="hide-mob">Pemohon</th><th class="hide-mob">Prioritas</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody>${fil.map(t=>`
        <tr>
          <td><span class="chip">${t.id}</span></td>
          <td><div style="font-weight:700;font-size:.82rem">${escHtml(t.title)}</div><div style="font-size:.7rem;color:var(--text3)">📍 ${escHtml(t.location)}</div></td>
          <td class="hide-mob" style="font-size:.77rem">${escHtml(t.client)}</td>
          <td class="hide-mob">${pTag(t.priority)}</td>
          <td>${bdg(t.status)}</td>
          <td>
            <div style="display:flex;gap:.3rem;flex-wrap:wrap">
              <button class="btn btn-ghost btn-sm" onclick="showWODetail('${t.id}')">Detail</button>
              ${t.status==='review'?`<button class="btn btn-success btn-sm" onclick="adminApproveWO('${t.id}')">✓ Setujui</button><button class="btn btn-danger btn-sm" onclick="adminRejectWO('${t.id}')">✕ Tolak</button>`:''}
              ${t.status==='approved'?`<button class="btn btn-primary btn-sm" onclick="adminStartWork('${t.id}')">▶ Mulai</button>`:''}
            </div>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`}
  </div>`;
}

function adminApproveWO(id){ const t=state.tickets.find(t=>t.id===id); if(confirm(`Setujui WO "${t.title}"?`)){ t.status='approved'; renderSidebar(); navTo(currentPage); } }
function adminRejectWO(id){  const t=state.tickets.find(t=>t.id===id); if(confirm(`Tolak WO "${t.title}"?`)){   t.status='rejected'; renderSidebar(); navTo(currentPage); } }
function adminStartWork(id){ const t=state.tickets.find(t=>t.id===id); if(confirm(`Mulai pekerjaan "${t.title}"?`)){ t.status='progress'; navTo(currentPage); } }

function pgAdminMaterials(){
  const mrs=state.materialRequests;
  const counts={review:mrs.filter(m=>m.status==='review').length,approved:mrs.filter(m=>m.status==='approved').length,done:mrs.filter(m=>m.status==='done').length,rejected:mrs.filter(m=>m.status==='rejected').length};
  const fil=applyFilter('admin-materials',mrs);
  return `
  <div class="page-header"><div><h1>Verifikasi Material</h1><p>Tinjau dan setujui permintaan material</p></div></div>
  ${buildFilter('admin-materials',['review','approved','done','rejected'],counts)}
  ${fil.length===0?`<div class="empty"><div class="empty-icon">📦</div><p>Tidak ada data</p></div>`:
  fil.map(mr=>`
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;margin-bottom:.85rem">
      <div>
        <span class="chip" style="margin-bottom:.3rem">${mr.id}</span>
        <div style="font-weight:800;margin:.2rem 0">${escHtml(mr.ticketTitle)}</div>
        <div style="font-size:.73rem;color:var(--text3)">WO: ${mr.ticketId} • ${mr.submitted}</div>
        ${mr.notes?`<div style="font-size:.73rem;color:var(--text2);margin-top:.2rem;font-style:italic">"${escHtml(mr.notes)}"</div>`:''}
      </div>${bdg(mr.status)}
    </div>
    <table style="font-size:.76rem;margin-bottom:.8rem">
      <thead><tr><th>Material</th><th>Qty</th><th>Satuan</th></tr></thead>
      <tbody>${mr.items.map(i=>`<tr><td>${escHtml(i.name)}</td><td>${i.qty}</td><td>${escHtml(i.unit)}</td></tr>`).join('')}</tbody>
    </table>
    ${mr.status==='review'?`<div style="display:flex;gap:.5rem">
      <button class="btn btn-success btn-sm" onclick="adminApproveMR('${mr.id}')">✓ Setujui</button>
      <button class="btn btn-danger btn-sm"  onclick="adminRejectMR('${mr.id}')">✕ Tolak</button>
    </div>`:mr.status==='approved'&&!mr.pr?`<button class="btn btn-primary btn-sm" onclick="showCreatePR('${mr.id}')">🛒 Buat Purchase Request</button>`
    :mr.pr?`<span style="font-size:.77rem;color:var(--green)">✓ PR dibuat: ${mr.pr}</span>`:''}
  </div>`).join('')}`;
}

function adminApproveMR(id){ state.materialRequests.find(m=>m.id===id).status='approved'; renderSidebar(); navTo(currentPage); }
function adminRejectMR(id){  state.materialRequests.find(m=>m.id===id).status='rejected'; renderSidebar(); navTo(currentPage); }

function showCreatePR(mrId){
  const mr=state.materialRequests.find(m=>m.id===mrId);
  showModal(`<div class="modal">
    <div class="modal-hdr"><h2>Buat Purchase Request</h2><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div style="background:var(--bg3);border-radius:var(--r2);padding:.75rem;margin-bottom:1rem;font-size:.81rem">
        <div style="font-weight:800">${escHtml(mr.ticketTitle)}</div>
        <div style="color:var(--text3);margin-top:.15rem">${mr.id} • ${mr.items.length} item material</div>
      </div>
      <div class="form-group"><label>Vendor / Supplier</label><input type="text" id="pr-vendor" placeholder="Nama vendor/supplier"></div>
      <div class="form-group"><label>Total Nilai (Rp)</label><input type="number" id="pr-value" placeholder="0" min="0"></div>
      <div class="form-group"><label>Kirim Ke (Dept.)</label><input type="text" id="pr-dept" value="Dept. Purchasing"></div>
      <div class="form-group"><label>Catatan untuk Purchasing</label><textarea id="pr-notes" rows="3" placeholder="Catatan..."></textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost"   onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="submitPR('${mrId}')">🛒 Kirim PR</button>
    </div>
  </div>`);
}

function submitPR(mrId){
  const mr=state.materialRequests.find(m=>m.id===mrId);
  const t=state.tickets.find(t=>t.id===mr.ticketId);
  const id=`PR-${String(++_prSeq).padStart(3,'0')}`;
  const dept=document.getElementById('pr-dept').value;
  const totalValue=parseFloat(document.getElementById('pr-value').value)||0;
  state.purchaseRequests.push({id,mrId,ticketId:mr.ticketId,title:`PR ${mr.ticketTitle}`,totalValue,status:'sent',sentTo:dept,date:today(),vendor:document.getElementById('pr-vendor').value,notes:document.getElementById('pr-notes').value});
  mr.status='done'; mr.pr=id;
  if(t) t.status='progress';
  closeModal();
  renderSidebar();
  alert(`✅ Purchase Request ${id} berhasil dikirim ke ${dept}`);
  navTo(currentPage);
}

function pgAdminPR(){
  const prs=state.purchaseRequests;
  const totalVal=prs.reduce((a,p)=>a+p.totalValue,0);
  return `
  <div class="page-header"><div><h1>Purchase Request</h1><p>PR yang telah dikirim ke Purchasing</p></div></div>
  <div class="stat-grid">
    <div class="stat-card"><div class="stat-lbl">Total PR</div><div class="stat-val">${prs.length}</div></div>
    <div class="stat-card"><div class="stat-lbl">Total Nilai</div><div class="stat-val" style="font-size:1rem;color:var(--green)">${fmt(totalVal)}</div></div>
  </div>
  ${prs.length===0?`<div class="empty"><div class="empty-icon">🛒</div><p>Belum ada Purchase Request</p></div>`
  :prs.map(pr=>`
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem">
      <div>
        <span class="chip" style="margin-bottom:.3rem">${pr.id}</span>
        <div style="font-weight:800;margin:.25rem 0">${escHtml(pr.title)}</div>
        <div style="font-size:.73rem;color:var(--text3)">WO: ${pr.ticketId} · MR: ${pr.mrId} · ${pr.date}</div>
        <div style="font-size:.73rem;color:var(--text3);margin-top:.1rem">
          Vendor: <span style="color:var(--text2)">${escHtml(pr.vendor||'—')}</span> · Ke: <span style="color:var(--text2)">${escHtml(pr.sentTo)}</span>
        </div>
        ${pr.notes?`<div style="font-size:.73rem;font-style:italic;color:var(--text2);margin-top:.25rem">"${escHtml(pr.notes)}"</div>`:''}
      </div>
      <div style="text-align:right;flex-shrink:0">
        ${bdg('sent')}
        ${pr.totalValue?`<div style="font-size:.95rem;font-weight:800;color:var(--orange);margin-top:.35rem">${fmt(pr.totalValue)}</div>`:''}
      </div>
    </div>
  </div>`).join('')}`;
}

/* ══════════════════════════════════════════════════════════
   ADMIN — USER MANAGEMENT
══════════════════════════════════════════════════════════ */
function pgAdminUsers(){
  const roleFilter = pageFilter['admin-users-role']||'all';
  const clients=USERS.filter(u=>u.role==='client');
  const workers=USERS.filter(u=>u.role==='worker');
  const admins =USERS.filter(u=>u.role==='admin');
  const shown = roleFilter==='all' ? USERS :
                roleFilter==='client' ? clients :
                roleFilter==='worker' ? workers : admins;

  return `
  <div class="page-header">
    <div><h1>Manajemen Akun</h1><p>Kelola user Client, Worker, dan Admin</p></div>
    <div class="hdr-actions">
      <button class="btn btn-primary" onclick="showAddUser()">➕ Tambah Akun</button>
    </div>
  </div>
  <div class="stat-grid">
    <div class="stat-card"><div class="stat-lbl">Total Akun</div><div class="stat-val">${USERS.length}</div></div>
    <div class="stat-card"><div class="stat-lbl">Client</div><div class="stat-val" style="color:var(--green)">${clients.length}</div></div>
    <div class="stat-card"><div class="stat-lbl">Worker</div><div class="stat-val" style="color:var(--amber)">${workers.length}</div></div>
    <div class="stat-card"><div class="stat-lbl">Admin</div><div class="stat-val" style="color:var(--orange)">${admins.length}</div></div>
  </div>

  <div class="filter-bar">
    ${['all','client','worker','admin'].map(r=>`
      <button class="fchip ${roleFilter===r?'active':''}" onclick="setUserRoleFilter('${r}')">
        ${r==='all'?'Semua':r.charAt(0).toUpperCase()+r.slice(1)}
        <span class="fc">${r==='all'?USERS.length:USERS.filter(u=>u.role===r).length}</span>
      </button>`).join('')}
  </div>

  <div class="table-wrap">
    <table>
      <thead><tr><th></th><th>Nama</th><th>Role</th><th class="hide-mob">Departemen</th><th>Status</th><th class="hide-mob">PIN</th><th>Aksi</th></tr></thead>
      <tbody>${shown.map(u=>`
        <tr>
          <td><div class="user-table-avatar ${roleClass(u.role)}">${initials(u.name)}</div></td>
          <td>
            <div style="font-weight:700;font-size:.83rem">${escHtml(u.name)}</div>
            <div style="font-size:.7rem;color:var(--text3)">${u.id}</div>
          </td>
          <td><span class="badge ${u.role==='client'?'b-done':u.role==='worker'?'b-review':'b-sent'}">${u.role}</span></td>
          <td class="hide-mob" style="font-size:.78rem;color:var(--text2)">${escHtml(u.dept)}</td>
          <td><span class="badge ${u.active?'b-active':'b-inactive'}">${u.active?'Aktif':'Nonaktif'}</span></td>
          <td class="hide-mob">
            <span class="pin-display" id="pin-disp-${u.id}">••••••</span>
            <button class="pin-toggle" onclick="togglePinView('${u.id}','${u.pin}')" title="Tampilkan PIN">👁</button>
          </td>
          <td>
            <div style="display:flex;gap:.3rem;flex-wrap:wrap">
              <button class="btn btn-ghost btn-sm" onclick="showEditUser('${u.id}')">✏️ Edit</button>
              ${u.id!==currentUser.id?`<button class="btn ${u.active?'btn-danger':'btn-success'} btn-sm" onclick="toggleUserActive('${u.id}')">${u.active?'Nonaktifkan':'Aktifkan'}</button>`:''}
              ${u.role!=='admin'?`<button class="btn btn-danger btn-sm" onclick="deleteUser('${u.id}')">🗑</button>`:''}
            </div>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

function setUserRoleFilter(r){ pageFilter['admin-users-role']=r; navTo('admin-users'); }

function togglePinView(id, pin){
  const el=document.getElementById('pin-disp-'+id);
  if(!el) return;
  el.textContent = el.textContent.includes('•') ? pin : '••••••';
}

function showAddUser(){
  showModal(`<div class="modal">
    <div class="modal-hdr"><h2>Tambah Akun Baru</h2><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="form-group"><label>Nama Lengkap *</label><input type="text" id="au-name" placeholder="cth: Afdeling 8 / Budi Santoso, ST."></div>
      <div class="form-2col">
        <div class="form-group"><label>Role *</label>
          <select id="au-role">
            <option value="client">Client</option>
            <option value="worker">Worker</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div class="form-group"><label>Departemen *</label><input type="text" id="au-dept" placeholder="cth: Afdeling 8"></div>
      </div>
      <div class="form-2col">
        <div class="form-group"><label>PIN 6-Digit *</label>
          <input type="text" id="au-pin" maxlength="6" placeholder="6 digit angka" inputmode="numeric"
            oninput="this.value=this.value.replace(/\D/g,'')">
        </div>
        <div class="form-group"><label>Konfirmasi PIN *</label>
          <input type="text" id="au-pin2" maxlength="6" placeholder="Ulangi PIN" inputmode="numeric"
            oninput="this.value=this.value.replace(/\D/g,'')">
        </div>
      </div>
      <div class="form-2col">
        <div class="form-group"><label>No. HP</label><input type="text" id="au-phone" placeholder="08xx..."></div>
        <div class="form-group"><label>Email</label><input type="email" id="au-email" placeholder="email@domain.com"></div>
      </div>
      <div id="au-error" style="color:var(--red);font-size:.78rem;margin-top:.25rem"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost"   onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="saveNewUser()">✅ Simpan Akun</button>
    </div>
  </div>`);
}

function saveNewUser(){
  const name =document.getElementById('au-name').value.trim();
  const role =document.getElementById('au-role').value;
  const dept =document.getElementById('au-dept').value.trim();
  const pin  =document.getElementById('au-pin').value.trim();
  const pin2 =document.getElementById('au-pin2').value.trim();
  const phone=document.getElementById('au-phone').value.trim();
  const email=document.getElementById('au-email').value.trim();
  const errEl=document.getElementById('au-error');

  if(!name||!dept||!pin||!pin2){ errEl.textContent='Mohon lengkapi semua field wajib (*)'; return; }
  if(pin.length!==6||!/^\d{6}$/.test(pin)){ errEl.textContent='PIN harus tepat 6 digit angka'; return; }
  if(pin!==pin2){ errEl.textContent='Konfirmasi PIN tidak cocok'; return; }
  if(USERS.some(u=>u.pin===pin)){ errEl.textContent='PIN sudah digunakan oleh akun lain. Pilih PIN yang berbeda.'; return; }

  const id=genUserId(role);
  USERS.push({id,pin,name,role,dept,phone,email,active:true,createdAt:today()});
  closeModal();
  renderSidebar();
  navTo('admin-users');
  alert(`✅ Akun "${name}" berhasil ditambahkan.\nID: ${id} | PIN: ${pin}`);
}

function showEditUser(id){
  const u=USERS.find(u=>u.id===id);
  showModal(`<div class="modal">
    <div class="modal-hdr"><h2>Edit Akun — ${escHtml(u.name)}</h2><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem;padding:.65rem;background:var(--bg3);border-radius:var(--r2)">
        <div class="user-table-avatar ${roleClass(u.role)}" style="width:38px;height:38px">${initials(u.name)}</div>
        <div>
          <div style="font-size:.7rem;font-family:'JetBrains Mono';color:var(--text3)">${u.id}</div>
          <span class="badge ${u.role==='client'?'b-done':u.role==='worker'?'b-review':'b-sent'}" style="margin-top:.2rem">${u.role}</span>
        </div>
      </div>
      <div class="form-group"><label>Nama Lengkap *</label><input type="text" id="eu-name" value="${escHtml(u.name)}"></div>
      <div class="form-group"><label>Departemen *</label><input type="text" id="eu-dept" value="${escHtml(u.dept)}"></div>
      <div class="form-2col">
        <div class="form-group"><label>No. HP</label><input type="text" id="eu-phone" value="${escHtml(u.phone)}"></div>
        <div class="form-group"><label>Email</label><input type="email" id="eu-email" value="${escHtml(u.email)}"></div>
      </div>
      <div style="background:var(--bg3);border-radius:var(--r2);padding:.75rem;margin-top:.5rem">
        <div style="font-size:.72rem;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:.6rem">Ganti PIN (opsional)</div>
        <div class="form-2col">
          <div class="form-group" style="margin:0"><label>PIN Baru (6 digit)</label>
            <input type="text" id="eu-pin" maxlength="6" placeholder="Kosongkan jika tidak ganti"
              inputmode="numeric" oninput="this.value=this.value.replace(/\D/g,'')">
          </div>
          <div class="form-group" style="margin:0"><label>Konfirmasi PIN</label>
            <input type="text" id="eu-pin2" maxlength="6" placeholder="Ulangi PIN baru"
              inputmode="numeric" oninput="this.value=this.value.replace(/\D/g,'')">
          </div>
        </div>
      </div>
      <div id="eu-error" style="color:var(--red);font-size:.78rem;margin-top:.5rem"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost"   onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="saveEditUser('${id}')">💾 Simpan Perubahan</button>
    </div>
  </div>`);
}

function saveEditUser(id){
  const u    =USERS.find(u=>u.id===id);
  const name =document.getElementById('eu-name').value.trim();
  const dept =document.getElementById('eu-dept').value.trim();
  const phone=document.getElementById('eu-phone').value.trim();
  const email=document.getElementById('eu-email').value.trim();
  const pin  =document.getElementById('eu-pin').value.trim();
  const pin2 =document.getElementById('eu-pin2').value.trim();
  const errEl=document.getElementById('eu-error');

  if(!name||!dept){ errEl.textContent='Nama dan departemen wajib diisi'; return; }

  if(pin){
    if(pin.length!==6||!/^\d{6}$/.test(pin)){ errEl.textContent='PIN harus tepat 6 digit angka'; return; }
    if(pin!==pin2){ errEl.textContent='Konfirmasi PIN tidak cocok'; return; }
    if(USERS.some(u=>u.pin===pin && u.id!==id)){ errEl.textContent='PIN sudah digunakan akun lain'; return; }
    u.pin=pin;
  }

  u.name=name; u.dept=dept; u.phone=phone; u.email=email;
  closeModal();
  navTo('admin-users');
  alert(`✅ Akun "${name}" berhasil diperbarui.`);
}

function toggleUserActive(id){
  const u=USERS.find(u=>u.id===id);
  const action=u.active?'nonaktifkan':'aktifkan';
  if(confirm(`${action.charAt(0).toUpperCase()+action.slice(1)} akun "${u.name}"?`)){
    u.active=!u.active;
    navTo('admin-users');
  }
}

function deleteUser(id){
  const u=USERS.find(u=>u.id===id);
  if(u.role==='admin'){ alert('Akun Admin tidak dapat dihapus.'); return; }
  if(confirm(`Hapus permanen akun "${u.name}"? Tindakan ini tidak dapat diurungkan.`)){
    const idx=USERS.findIndex(u=>u.id===id);
    if(idx>-1) USERS.splice(idx,1);
    navTo('admin-users');
  }
}

/* ══════════════════════════════════════════════════════════
   ADMIN — REPORTS & EXPORT
══════════════════════════════════════════════════════════ */
function pgAdminReports(){
  const all=state.tickets;
  const done=all.filter(t=>t.status==='done');
  const totalPR=state.purchaseRequests.reduce((a,p)=>a+p.totalValue,0);
  const counts={};
  ['new','review','approved','progress','done','rejected'].forEach(s=>{counts[s]=all.filter(t=>t.status===s).length;});
  const fil=applyFilter('admin-reports',all);

  const sBar=s=>{
    const c=all.filter(t=>t.status===s).length;
    const pct=all.length?Math.round(c/all.length*100):0;
    return `<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.45rem;font-size:.78rem">
      <span style="min-width:90px">${bdg(s)}</span>
      <div class="progress-wrap" style="flex:1"><div class="progress-bar" style="width:${pct}%"></div></div>
      <span style="color:var(--text3);min-width:22px;text-align:right">${c}</span>
    </div>`;
  };
  const tBar=type=>{
    const c=all.filter(t=>t.type===type).length;
    const pct=all.length?Math.round(c/all.length*100):0;
    return `<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.45rem;font-size:.78rem">
      <span style="min-width:90px;color:var(--text2)">${type}</span>
      <div class="progress-wrap" style="flex:1"><div class="progress-bar" style="width:${pct}%"></div></div>
      <span style="color:var(--text3);min-width:22px;text-align:right">${c}</span>
    </div>`;
  };
  return `
  <div class="page-header">
    <div><h1>Laporan &amp; Analitik</h1><p>Overview semua Work Order</p></div>
    <div class="hdr-actions">
      <button class="btn btn-success" onclick="exportExcel()">📊 Excel</button>
      <button class="btn btn-danger"  onclick="exportPDF()">📄 PDF</button>
    </div>
  </div>
  <div class="stat-grid">
    <div class="stat-card"><div class="stat-lbl">Total WO</div><div class="stat-val">${all.length}</div></div>
    <div class="stat-card"><div class="stat-lbl">Selesai</div><div class="stat-val" style="color:var(--green)">${done.length}</div><div class="stat-sub">${all.length?Math.round(done.length/all.length*100):0}% completion</div></div>
    <div class="stat-card"><div class="stat-lbl">Total Akun</div><div class="stat-val">${USERS.length}</div></div>
    <div class="stat-card"><div class="stat-lbl">Total PR</div><div class="stat-val" style="font-size:1rem;color:var(--orange)">${fmt(totalPR)}</div></div>
  </div>
  <div class="two-col" style="margin-bottom:.85rem">
    <div class="card"><div class="card-hdr"><div class="card-title">Distribusi Status</div></div>${['new','review','approved','progress','done','rejected'].map(sBar).join('')}</div>
    <div class="card"><div class="card-hdr"><div class="card-title">Distribusi Tipe</div></div>${['perbaikan','pembangunan','renovasi','perawatan'].map(tBar).join('')}</div>
  </div>
  ${buildFilter('admin-reports',['new','review','approved','progress','done','rejected'],counts)}
  <div class="table-wrap">
    <table>
      <thead><tr><th>ID</th><th>Judul</th><th class="hide-mob">Pemohon</th><th class="hide-mob">Petugas</th><th>Progress</th><th>Status</th></tr></thead>
      <tbody>${fil.map(t=>`
        <tr>
          <td><span class="chip">${t.id}</span></td>
          <td style="font-size:.81rem;font-weight:700">${escHtml(t.title)}<div style="font-size:.7rem;color:var(--text3)">${escHtml(t.location)}</div></td>
          <td class="hide-mob" style="font-size:.76rem">${escHtml(t.client)}</td>
          <td class="hide-mob" style="font-size:.76rem">${t.workers&&t.workers.length?escHtml(t.workers.join(', ')):'—'}</td>
          <td style="min-width:70px">
            <div class="progress-wrap"><div class="progress-bar" style="width:${t.progress}%"></div></div>
            <div style="font-size:.69rem;color:var(--text3);text-align:center;margin-top:.2rem">${t.progress}%</div>
          </td>
          <td>${bdg(t.status)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

/* ══════════════════════════════════════════════════════════
   EXPORT FUNCTIONS
══════════════════════════════════════════════════════════ */
function exportExcel(){
  const wb=XLSX.utils.book_new();

  // Sheet 1: Work Orders
  const wo=[
    ['ID','Judul','Tipe','Lokasi','Pemohon','Petugas','Prioritas','Status','Progress (%)','Tgl Dibuat','Catatan'],
    ...state.tickets.map(t=>[t.id,t.title,t.type,t.location,t.client,(t.workers||[]).join(', '),t.priority,SL[t.status]||t.status,t.progress,t.created,t.notes])
  ];
  const ws1=XLSX.utils.aoa_to_sheet(wo);
  ws1['!cols']=[{wch:10},{wch:35},{wch:15},{wch:30},{wch:15},{wch:25},{wch:10},{wch:15},{wch:12},{wch:14},{wch:30}];
  XLSX.utils.book_append_sheet(wb,ws1,'Work Orders');

  // Sheet 2: Material
  const mr=[['MR ID','WO ID','Judul WO','Material','Qty','Satuan','Status','Diajukan']];
  state.materialRequests.forEach(m=>{
    m.items.forEach((item,i)=>{
      mr.push([i===0?m.id:'',i===0?m.ticketId:'',i===0?m.ticketTitle:'',item.name,item.qty,item.unit,i===0?(SL[m.status]||m.status):'',i===0?m.submitted:'']);
    });
  });
  const ws2=XLSX.utils.aoa_to_sheet(mr);
  ws2['!cols']=[{wch:10},{wch:10},{wch:35},{wch:25},{wch:8},{wch:10},{wch:14},{wch:14}];
  XLSX.utils.book_append_sheet(wb,ws2,'Material Requests');

  // Sheet 3: PR
  const pr=[
    ['PR ID','MR ID','WO ID','Judul','Total Nilai','Vendor','Kirim Ke','Tanggal','Status'],
    ...state.purchaseRequests.map(p=>[p.id,p.mrId,p.ticketId,p.title,p.totalValue,p.vendor,p.sentTo,p.date,SL[p.status]||p.status])
  ];
  const ws3=XLSX.utils.aoa_to_sheet(pr);
  ws3['!cols']=[{wch:10},{wch:10},{wch:10},{wch:35},{wch:18},{wch:25},{wch:20},{wch:14},{wch:12}];
  XLSX.utils.book_append_sheet(wb,ws3,'Purchase Requests');

  // Sheet 4: Users
  const usr=[
    ['ID','Nama','Role','Departemen','No. HP','Email','Status','Tgl Dibuat'],
    ...USERS.map(u=>[u.id,u.name,u.role,u.dept,u.phone,u.email,u.active?'Aktif':'Nonaktif',u.createdAt])
  ];
  const ws4=XLSX.utils.aoa_to_sheet(usr);
  ws4['!cols']=[{wch:12},{wch:30},{wch:10},{wch:20},{wch:16},{wch:28},{wch:12},{wch:14}];
  XLSX.utils.book_append_sheet(wb,ws4,'Users');

  // Sheet 5: Summary
  const all=state.tickets;
  const sum=[
    ['LAPORAN WORK ORDER HCD'],
    ['Digenerate pada:', new Date().toLocaleString('id-ID')],
    ['Digenerate oleh:', currentUser.name],
    [''],
    ['STATISTIK'],
    ['Total Work Order', all.length],
    ['WO Selesai', all.filter(t=>t.status==='done').length],
    ['Completion Rate', all.length?Math.round(all.filter(t=>t.status==='done').length/all.length*100)+'%':'0%'],
    ['Total PR', state.purchaseRequests.length],
    ['Total Nilai PR', state.purchaseRequests.reduce((a,p)=>a+p.totalValue,0)],
    ['Total User', USERS.length],
    [''],
    ['STATUS BREAKDOWN'],
    ...['new','review','approved','progress','done','rejected'].map(s=>[SL[s], all.filter(t=>t.status===s).length]),
  ];
  const ws5=XLSX.utils.aoa_to_sheet(sum);
  ws5['!cols']=[{wch:25},{wch:20}];
  XLSX.utils.book_append_sheet(wb,ws5,'Ringkasan');

  XLSX.writeFile(wb,`WorkOrderHCD_${today()}.xlsx`);
}

function exportPDF(){
  const all=state.tickets;
  const done=all.filter(t=>t.status==='done');
  const totalPR=state.purchaseRequests.reduce((a,p)=>a+p.totalValue,0);

  const html=`<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>Laporan Work Order HCD</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',sans-serif;color:#111827;font-size:11px;padding:20px}
  .hdr{display:flex;align-items:center;gap:10px;margin-bottom:4px;padding-bottom:12px;border-bottom:2px solid #f97316}
  .hdr-logo{width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#f97316,#dc2626);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;flex-shrink:0}
  .hdr-title{font-size:16px;font-weight:800;color:#111827}
  .hdr-sub{font-size:9.5px;color:#6b7280;margin-top:2px}
  .meta{font-size:9px;color:#9ca3af;margin-bottom:18px;margin-top:6px}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:18px}
  .stat{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px;text-align:center}
  .slbl{font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;font-weight:700;margin-bottom:3px}
  .sval{font-size:18px;font-weight:800;color:#f97316}
  h2{font-size:11px;font-weight:800;color:#111827;margin:14px 0 7px;padding-bottom:3px;border-bottom:2px solid #f97316}
  table{width:100%;border-collapse:collapse;font-size:9px;margin-bottom:14px}
  th{background:#1f2937;color:#fff;padding:5px 7px;text-align:left;font-weight:700;font-size:8px;text-transform:uppercase;letter-spacing:.04em}
  td{padding:4.5px 7px;border-bottom:1px solid #f3f4f6;vertical-align:top}
  tr:nth-child(even) td{background:#f9fafb}
  .b{display:inline-block;padding:1px 5px;border-radius:10px;font-size:7.5px;font-weight:800;text-transform:uppercase}
  .b-new{background:#f3e8ff;color:#7c3aed} .b-review{background:#fef3c7;color:#d97706}
  .b-approved{background:#dbeafe;color:#1d4ed8} .b-progress{background:#cffafe;color:#0e7490}
  .b-done{background:#d1fae5;color:#065f46} .b-rejected{background:#fee2e2;color:#b91c1c}
  .b-sent{background:#ffedd5;color:#c2410c}
  .footer{margin-top:20px;text-align:center;font-size:8.5px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:8px}
  @media print{body{padding:0}}
</style></head>
<body>
<div class="hdr">
  <div class="hdr-logo">🏗</div>
  <div>
    <div class="hdr-title">Work Order HCD</div>
    <div class="hdr-sub">Laporan Project Management System</div>
  </div>
</div>
<div class="meta">Digenerate oleh: ${currentUser.name} &nbsp;|&nbsp; ${new Date().toLocaleString('id-ID')}</div>

<div class="stats">
  <div class="stat"><div class="slbl">Total WO</div><div class="sval">${all.length}</div></div>
  <div class="stat"><div class="slbl">Selesai</div><div class="sval" style="color:#059669">${done.length}</div></div>
  <div class="stat"><div class="slbl">Aktif</div><div class="sval" style="color:#0891b2">${all.filter(t=>t.status==='progress').length}</div></div>
  <div class="stat"><div class="slbl">Total PR</div><div class="sval" style="font-size:11px">${fmt(totalPR)}</div></div>
</div>

<h2>Daftar Work Order</h2>
<table>
  <thead><tr><th>ID</th><th>Judul</th><th>Tipe</th><th>Pemohon</th><th>Petugas</th><th>Prioritas</th><th>Status</th><th>Progress</th></tr></thead>
  <tbody>${all.map(t=>`<tr>
    <td><b>${t.id}</b></td>
    <td>${t.title}<br><span style="color:#9ca3af;font-size:8px">📍 ${t.location}</span></td>
    <td>${t.type}</td>
    <td>${t.client}</td>
    <td>${(t.workers||[]).join(', ')||'—'}</td>
    <td style="color:${t.priority==='tinggi'?'#dc2626':t.priority==='sedang'?'#d97706':'#16a34a'};font-weight:700">${t.priority}</td>
    <td><span class="b b-${t.status}">${SL[t.status]||t.status}</span></td>
    <td>${t.progress}%</td>
  </tr>`).join('')}</tbody>
</table>

<h2>Material Request</h2>
<table>
  <thead><tr><th>MR ID</th><th>WO ID</th><th>Material</th><th>Qty</th><th>Satuan</th><th>Status</th></tr></thead>
  <tbody>${state.materialRequests.flatMap(mr=>mr.items.map((item,i)=>`<tr>
    <td>${i===0?`<b>${mr.id}</b>`:''}</td>
    <td>${i===0?mr.ticketId:''}</td>
    <td>${item.name}</td><td>${item.qty}</td><td>${item.unit}</td>
    <td>${i===0?`<span class="b b-${mr.status}">${SL[mr.status]||mr.status}</span>`:''}</td>
  </tr>`)).join('')}</tbody>
</table>

<h2>Purchase Request</h2>
<table>
  <thead><tr><th>PR ID</th><th>Judul</th><th>Vendor</th><th>Kirim Ke</th><th>Tanggal</th><th>Total Nilai</th></tr></thead>
  <tbody>${state.purchaseRequests.map(pr=>`<tr>
    <td><b>${pr.id}</b></td><td>${pr.title}</td>
    <td>${pr.vendor||'—'}</td><td>${pr.sentTo}</td><td>${pr.date}</td>
    <td><b>${fmt(pr.totalValue)}</b></td>
  </tr>`).join('')}</tbody>
</table>

<h2>Daftar Akun</h2>
<table>
  <thead><tr><th>ID</th><th>Nama</th><th>Role</th><th>Departemen</th><th>Status</th></tr></thead>
  <tbody>${USERS.map(u=>`<tr>
    <td style="font-family:monospace">${u.id}</td>
    <td><b>${u.name}</b></td>
    <td><span class="b b-${u.role==='client'?'done':u.role==='worker'?'review':'sent'}">${u.role}</span></td>
    <td>${u.dept}</td>
    <td><span class="b ${u.active?'b-done':'b-rejected'}">${u.active?'Aktif':'Nonaktif'}</span></td>
  </tr>`).join('')}</tbody>
</table>

<div class="footer">Work Order HCD · Project Management System · Laporan otomatis — Dilarang disebarluaskan</div>
</body></html>`;

  const win=window.open('','_blank');
  win.document.write(html);
  win.document.close();
  win.onload=()=>{ win.focus(); win.print(); };
}