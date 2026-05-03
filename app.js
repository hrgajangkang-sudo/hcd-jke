/* ══════════════════════════════════════════════════════════
   Work Order HCD JKE  ·  app.js
══════════════════════════════════════════════════════════ */

/* ── CREDENTIALS (PIN 6-digit, unik per role) ──────────── */
const CREDENTIALS = {
  client: { pin: '112233', name: 'PT. Rezeki Kencana - Afdeling',   role: 'client' },
  worker: { pin: '445566', name: 'PT. Rezeki Kencana - Mandor HCD',  role: 'worker' },
  admin:  { pin: '778899', name: 'PT. Rezeki Kencana - Admin',  role: 'admin'  },
};

/* ── STATE ─────────────────────────────────────────────── */
let currentUser = null;
let currentPage = null;
let selectedRole = null;

/* active filter per page */
const pageFilter = {};

const state = {
  tickets: [
    { id:'TKT-001', title:'Perbaikan Jembatan Sungai Ciawi',    type:'perbaikan',   location:'Jl. Raya Ciawi KM 12',          desc:'Terdapat keretakan pada struktur balok jembatan sepanjang 3m.',                            status:'progress', priority:'tinggi', client:'PT. Bangun Maju', created:'2025-04-15', progress:65,  budget:850000000,  worker:'Ahmad Surya, ST.', materialReq:'MR-001', notes:'Pengerjaan sudah 65%' },
    { id:'TKT-002', title:'Pembangunan Gedung Serbaguna',        type:'pembangunan', location:'Komplek Perkantoran Blok C',     desc:'Rencana pembangunan gedung serbaguna 3 lantai dengan kapasitas 500 orang.',                status:'review',   priority:'tinggi', client:'PT. Bangun Maju', created:'2025-04-28', progress:10,  budget:4200000000, worker:null, materialReq:null, notes:'' },
    { id:'TKT-003', title:'Renovasi Jalan Akses Pabrik',         type:'perbaikan',   location:'Kawasan Industri Blok A-7',     desc:'Jalan rusak parah, perlu pengaspalan ulang sepanjang 500m.',                              status:'approved', priority:'sedang', client:'PT. Bangun Maju', created:'2025-04-20', progress:0,   budget:320000000,  worker:'Ahmad Surya, ST.', materialReq:null, notes:'' },
    { id:'TKT-004', title:'Pemasangan Saluran Drainase',         type:'pembangunan', location:'Perumahan Griya Indah',          desc:'Pembangunan saluran drainase baru untuk mengatasi banjir musiman.',                       status:'new',      priority:'rendah', client:'PT. Bangun Maju', created:'2025-04-30', progress:0,   budget:180000000,  worker:null, materialReq:null, notes:'' },
    { id:'TKT-005', title:'Perbaikan Atap Gudang B',             type:'perbaikan',   location:'Gudang B, Komplek Industri',    desc:'Kebocoran atap gudang B pada 5 titik.',                                                   status:'done',     priority:'sedang', client:'PT. Bangun Maju', created:'2025-03-10', progress:100, budget:95000000,   worker:'Ahmad Surya, ST.', materialReq:'MR-002', notes:'Selesai sesuai jadwal' },
  ],
  materialRequests: [
    { id:'MR-001', ticketId:'TKT-001', ticketTitle:'Perbaikan Jembatan Sungai Ciawi', items:[{name:'Beton K-300',qty:20,unit:'m³',price:1200000},{name:'Besi Tulangan D16',qty:500,unit:'kg',price:18000},{name:'Bekisting Kayu',qty:50,unit:'lembar',price:85000}], status:'approved', submitted:'2025-04-18', notes:'Material prioritas karena jembatan kritis', pr:'PR-001' },
    { id:'MR-002', ticketId:'TKT-005', ticketTitle:'Perbaikan Atap Gudang B',         items:[{name:'Genteng Metal',qty:200,unit:'lembar',price:45000},{name:'Sealant Atap',qty:10,unit:'kg',price:120000}],                                                          status:'done',     submitted:'2025-03-12', notes:'', pr:'PR-002' },
    { id:'MR-003', ticketId:'TKT-003', ticketTitle:'Renovasi Jalan Akses Pabrik',     items:[{name:'Aspal Hotmix',qty:50,unit:'ton',price:1800000},{name:'Base Course',qty:80,unit:'ton',price:350000},{name:'Batu Split',qty:30,unit:'m³',price:280000}],           status:'review',   submitted:'2025-04-22', notes:'Menunggu konfirmasi volume pengukuran', pr:null },
  ],
  purchaseRequests: [
    { id:'PR-001', mrId:'MR-001', ticketId:'TKT-001', title:'PR Perbaikan Jembatan Ciawi', totalValue:34300000, status:'sent', sentTo:'Dept. Purchasing', date:'2025-04-19', vendor:'CV. Material Utama',        notes:'Urgent - jembatan kritis' },
    { id:'PR-002', mrId:'MR-002', ticketId:'TKT-005', title:'PR Atap Gudang B',            totalValue:10200000, status:'sent', sentTo:'Dept. Purchasing', date:'2025-03-14', vendor:'Toko Bangunan Sejahtera', notes:'' },
  ],
};

/* ── HELPERS ───────────────────────────────────────────── */
const fmt = n => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
const today = () => new Date().toISOString().split('T')[0];
const matTotal = items => items.reduce((a,i)=>a+i.qty*i.price,0);

const SL = { new:'Baru', review:'Review', approved:'Disetujui', progress:'Dalam Proses', done:'Selesai', rejected:'Ditolak', sent:'Terkirim' };
const SC = { new:'s-new', review:'s-review', approved:'s-approved', progress:'s-progress', done:'s-done', rejected:'s-rejected', sent:'s-sent' };
const PC = { tinggi:'prio-tinggi', sedang:'prio-sedang', rendah:'prio-rendah' };
const badge = s => `<span class="status-badge ${SC[s]||'s-new'}">${SL[s]||s}</span>`;
const prio  = p => `<span class="${PC[p]}" style="font-size:.76rem;font-weight:700">⬤ ${p}</span>`;

/* ── MODAL ─────────────────────────────────────────────── */
function showModal(html){ document.getElementById('modal-container').innerHTML=`<div class="modal-bg" onclick="if(event.target===this)closeModal()">${html}</div>`; }
function closeModal(){ document.getElementById('modal-container').innerHTML=''; }

/* ════════════════════════════════════════════════════════
   LOGIN / AUTH
════════════════════════════════════════════════════════ */
function selectRole(role) {
  selectedRole = role;
  document.getElementById('step-role').classList.add('hidden');
  document.getElementById('step-pin').classList.remove('hidden');

  const labels = { client:'🏢 Client – Divisi/Afdeling', worker:'👷 Worker – Aloysius Deddy Batuallo.', admin:'🛡️ Administrator – Tedi Wahyudi' };
  document.getElementById('pin-role-info').textContent = labels[role];

  // show hint (in real app remove this)
  document.getElementById('pin-hint').textContent = `PIN demo: ${CREDENTIALS[role].pin}`;

  // reset PIN boxes
  const boxes = document.querySelectorAll('.pin-box');
  boxes.forEach(b=>{ b.value=''; b.classList.remove('filled'); });
  document.getElementById('pin-error').classList.add('hidden');
  initPinBoxes();
  boxes[0].focus();
}

function backToRole() {
  selectedRole = null;
  document.getElementById('step-pin').classList.add('hidden');
  document.getElementById('step-role').classList.remove('hidden');
}

function initPinBoxes() {
  const boxes = [...document.querySelectorAll('.pin-box')];
  boxes.forEach((box, i) => {
    box.oninput = () => {
      // allow only digits
      box.value = box.value.replace(/\D/g,'');
      if (box.value) {
        box.classList.add('filled');
        if (i < boxes.length-1) boxes[i+1].focus();
      } else {
        box.classList.remove('filled');
      }
    };
    box.onkeydown = e => {
      if (e.key==='Backspace' && !box.value && i>0) boxes[i-1].focus();
      if (e.key==='Enter') doLogin();
    };
  });
}

function getPIN() {
  return [...document.querySelectorAll('.pin-box')].map(b=>b.value).join('');
}

function doLogin() {
  const cred = CREDENTIALS[selectedRole];
  const pin  = getPIN();
  if (pin === cred.pin) {
    currentUser = { name: cred.name, role: cred.role };
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    const rl = { client:'Client', worker:'Worker', admin:'Administrator' };
    document.getElementById('role-badge-wrap').innerHTML = `<span class="role-badge badge-${cred.role}">${rl[cred.role]}</span>`;
    document.getElementById('topbar-user-name').textContent = cred.name;
    renderSidebar();
    const def = { client:'my-tickets', worker:'work-list', admin:'admin-dashboard' };
    navigateTo(def[cred.role]);
  } else {
    document.getElementById('pin-error').classList.remove('hidden');
    document.querySelectorAll('.pin-box').forEach(b=>{ b.value=''; b.classList.remove('filled'); });
    document.querySelectorAll('.pin-box')[0].focus();
  }
}

function logout() {
  currentUser = null; selectedRole = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('step-pin').classList.add('hidden');
  document.getElementById('step-role').classList.remove('hidden');
  document.getElementById('content').innerHTML = '';
}

/* ════════════════════════════════════════════════════════
   SIDEBAR & NAV
════════════════════════════════════════════════════════ */
const MENUS = {
  client:[
    {id:'my-tickets',icon:'📋',label:'Tiket Saya'},
    {id:'new-ticket',icon:'➕',label:'Buat Permintaan'},
    {sep:true},
    {id:'client-progress',icon:'📊',label:'Monitor Proyek'},
    {id:'client-reports',icon:'📑',label:'Laporan'},
  ],
  worker:[
    {id:'work-list',icon:'📋',label:'Daftar Pekerjaan'},
    {sep:true},
    {id:'material-request',icon:'📦',label:'Permintaan Material'},
    {sep:true},
    {id:'worker-progress',icon:'📊',label:'Update Progress'},
  ],
  admin:[
    {id:'admin-dashboard',icon:'🛡️',label:'Dashboard'},
    {sep:true},
    {section:'Verifikasi'},
    {id:'admin-tickets',icon:'📋',label:'Verifikasi Tiket'},
    {id:'admin-materials',icon:'📦',label:'Verifikasi Material'},
    {sep:true},
    {section:'Purchase'},
    {id:'admin-pr',icon:'🛒',label:'Purchase Request'},
    {sep:true},
    {id:'admin-reports',icon:'📑',label:'Laporan & Analitik'},
  ],
};

function renderSidebar() {
  const role = currentUser.role;
  const pendT = state.tickets.filter(t=>t.status==='review').length;
  const pendM = state.materialRequests.filter(m=>m.status==='review').length;

  document.getElementById('sidebar').innerHTML = MENUS[role].map(m=>{
    if(m.sep)     return `<div class="nav-sep"></div>`;
    if(m.section) return `<div class="nav-section">${m.section}</div>`;
    let notif='';
    if(role==='admin'){
      if(m.id==='admin-tickets'   && pendT>0) notif=`<span class="notif-dot"></span>`;
      if(m.id==='admin-materials' && pendM>0) notif=`<span class="notif-dot"></span>`;
    }
    // worker: show dot on work-list if there are review tickets
    if(role==='worker' && m.id==='work-list' && pendT>0) notif=`<span class="notif-dot"></span>`;
    return `<button class="nav-item" id="nav-${m.id}" onclick="navigateTo('${m.id}')">
      <span class="ni">${m.icon}</span>${m.label}${notif}
    </button>`;
  }).join('');
}

const RENDERERS = {
  'my-tickets':       renderClientTickets,
  'new-ticket':       renderNewTicket,
  'client-progress':  renderClientProgress,
  'client-reports':   renderClientReports,
  'work-list':        renderWorkList,
  'material-request': renderMaterialRequest,
  'worker-progress':  renderWorkerProgress,
  'admin-dashboard':  renderAdminDashboard,
  'admin-tickets':    renderAdminTickets,
  'admin-materials':  renderAdminMaterials,
  'admin-pr':         renderAdminPR,
  'admin-reports':    renderAdminReports,
};

function navigateTo(page){
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const el = document.getElementById('nav-'+page);
  if(el) el.classList.add('active');
  document.getElementById('content').innerHTML = RENDERERS[page] ? RENDERERS[page]() : `<div class="empty-state"><div class="empty-icon">🚧</div><p>Halaman belum tersedia</p></div>`;
}

/* ── FILTER BAR helper ──────────────────────────────── */
function buildFilterBar(pageId, allStatuses, counts, extra=[]) {
  const current = pageFilter[pageId] || 'all';
  const chips = [
    {key:'all', label:'Semua', count: Object.values(counts).reduce((a,b)=>a+b,0)},
    ...allStatuses.map(s=>({key:s, label:SL[s]||s, count: counts[s]||0})),
    ...extra,
  ];
  return `<div class="filter-bar">
    ${chips.map(c=>`
      <button class="filter-chip ${c.key===current?'active':''}"
        onclick="setFilter('${pageId}','${c.key}')">
        ${c.label}
        <span class="fc-count">${c.count}</span>
      </button>`).join('')}
  </div>`;
}

function setFilter(pageId, key){
  pageFilter[pageId] = key;
  navigateTo(pageId);
}

function applyFilter(pageId, items, key='status'){
  const f = pageFilter[pageId] || 'all';
  if(f==='all') return items;
  return items.filter(i=>i[key]===f);
}

/* ════════════════════════════════════════════════════════
   SHARED DETAIL MODAL
════════════════════════════════════════════════════════ */
function showTicketDetail(id){
  const t  = state.tickets.find(t=>t.id===id);
  const mr = t.materialReq ? state.materialRequests.find(m=>m.id===t.materialReq) : null;
  const steps = [
    {label:'Tiket Dibuat',   done:true, active:false},
    {label:'Review Worker',  done:['review','approved','progress','done'].includes(t.status), active:t.status==='review'},
    {label:'Disetujui Admin',done:['approved','progress','done'].includes(t.status), active:t.status==='approved'},
    {label:'Material OK',    done:mr&&['approved','done'].includes(mr.status), active:mr&&mr.status==='review'},
    {label:'Dalam Proses',   done:t.status==='done', active:t.status==='progress'},
    {label:'Selesai',        done:t.status==='done', active:false},
  ];
  showModal(`<div class="modal modal-wide">
    <div class="modal-hdr"><h2>Detail Tiket — ${t.id}</h2><button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem">
        <div>
          <div style="font-weight:700;font-size:1rem;margin-bottom:.35rem">${t.title}</div>
          <div style="font-size:.76rem;color:var(--text3)">📍 ${t.location} &nbsp;|&nbsp; 📅 ${t.created}</div>
        </div>${badge(t.status)}
      </div>
      <div class="wf-steps">
        ${steps.map(s=>`<div class="wf-step ${s.done?'done':''} ${s.active?'active':''}">
          <div class="wf-circle">${s.done?'✓':''}</div>
          <div class="wf-label">${s.label}</div>
        </div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem;font-size:.8rem;margin-bottom:1rem">
        ${ic('Tipe',t.type)} ${ic('Prioritas',`<span class="${PC[t.priority]}">${t.priority}</span>`)}
        ${ic('Anggaran',`<span style="color:var(--accent)">${fmt(t.budget)}</span>`)} ${ic('Worker',t.worker||'Belum ditugaskan')}
        ${ic('Material',t.materialReq||'Belum diajukan')} ${ic('PR', mr?.pr||'Belum ada')}
      </div>
      <div style="background:var(--bg3);border-radius:6px;padding:.75rem;margin-bottom:.75rem">
        <div style="color:var(--text3);font-size:.7rem;margin-bottom:.3rem">DESKRIPSI</div>
        <div style="font-size:.82rem;line-height:1.6">${t.desc}</div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:.3rem">
          <span style="color:var(--text2)">Progress</span>
          <span style="font-weight:700;color:var(--cyan)">${t.progress}%</span>
        </div>
        <div class="progress-wrap"><div class="progress-bar" style="width:${t.progress}%"></div></div>
      </div>
      ${t.notes?`<div style="margin-top:.65rem;font-size:.76rem;color:var(--text2);font-style:italic">"${t.notes}"</div>`:''}
    </div>
    <div class="modal-footer"><button class="btn btn-ghost" onclick="closeModal()">Tutup</button></div>
  </div>`);
}
const ic = (l,v) => `<div style="background:var(--bg3);border-radius:5px;padding:.55rem .65rem"><div style="color:var(--text3);font-size:.69rem;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.2rem">${l}</div><div style="font-weight:600">${v}</div></div>`;

/* ════════════════════════════════════════════════════════
   CLIENT PAGES
════════════════════════════════════════════════════════ */
function renderClientTickets(){
  const all = state.tickets.filter(t=>t.client===currentUser.name);
  const counts = {};
  ['new','review','approved','progress','done','rejected'].forEach(s=>{ counts[s]=all.filter(t=>t.status===s).length; });
  const filtered = applyFilter('my-tickets', all);

  return `
  <div class="page-header">
    <div><h1>Tiket Saya</h1><p>Daftar semua permintaan pembangunan &amp; perbaikan</p></div>
    <button class="btn btn-primary" onclick="navigateTo('new-ticket')">➕ Buat Permintaan</button>
  </div>
  <div class="stat-grid">
    <div class="stat-card"><div class="stat-label">Total</div><div class="stat-val">${all.length}</div></div>
    <div class="stat-card"><div class="stat-label">Aktif</div><div class="stat-val" style="color:var(--cyan)">${counts.progress||0}</div></div>
    <div class="stat-card"><div class="stat-label">Menunggu</div><div class="stat-val" style="color:var(--amber)">${(counts.new||0)+(counts.review||0)+(counts.approved||0)}</div></div>
    <div class="stat-card"><div class="stat-label">Selesai</div><div class="stat-val" style="color:var(--green)">${counts.done||0}</div></div>
  </div>
  ${buildFilterBar('my-tickets',['new','review','approved','progress','done','rejected'],counts)}
  <div class="card" style="padding:0;overflow:hidden">
    ${filtered.length===0 ? `<div class="empty-state"><div class="empty-icon">📭</div><p>Tidak ada tiket dengan filter ini</p></div>` : `
    <table>
      <thead><tr><th>ID</th><th>Judul</th><th>Tipe</th><th>Prioritas</th><th>Status</th><th>Progress</th><th></th></tr></thead>
      <tbody>${filtered.map(t=>`
        <tr>
          <td><span class="chip">${t.id}</span></td>
          <td><div style="font-weight:600;font-size:.83rem">${t.title}</div><div style="font-size:.71rem;color:var(--text3)">${t.location}</div></td>
          <td style="font-size:.76rem;color:var(--text3)">${t.type}</td>
          <td>${prio(t.priority)}</td>
          <td>${badge(t.status)}</td>
          <td style="min-width:100px">
            <div style="display:flex;align-items:center;gap:.4rem">
              <div class="progress-wrap" style="flex:1"><div class="progress-bar" style="width:${t.progress}%"></div></div>
              <span style="font-size:.71rem;color:var(--text3);min-width:26px">${t.progress}%</span>
            </div>
          </td>
          <td><button class="btn btn-ghost btn-sm" onclick="showTicketDetail('${t.id}')">Detail</button></td>
        </tr>`).join('')}
      </tbody>
    </table>`}
  </div>`;
}

function renderNewTicket(){
  return `
  <div class="page-header">
    <div><h1>Buat Permintaan Baru</h1><p>Ajukan permintaan pembangunan atau perbaikan</p></div>
  </div>
  <div class="card" style="max-width:580px">
    <div class="form-group"><label>Judul Permintaan *</label><input type="text" id="nt-title" placeholder="cth: Perbaikan Jembatan Blok C"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.85rem">
      <div class="form-group"><label>Tipe Pekerjaan *</label>
        <select id="nt-type"><option value="perbaikan">Perbaikan</option><option value="pembangunan">Pembangunan Baru</option><option value="renovasi">Renovasi</option><option value="perawatan">Perawatan Rutin</option></select>
      </div>
      <div class="form-group"><label>Prioritas *</label>
        <select id="nt-priority"><option value="rendah">Rendah</option><option value="sedang" selected>Sedang</option><option value="tinggi">Tinggi</option></select>
      </div>
    </div>
    <div class="form-group"><label>Lokasi / Alamat *</label><input type="text" id="nt-location" placeholder="Alamat lengkap lokasi pekerjaan"></div>
    <div class="form-group"><label>Estimasi Anggaran (Rp)</label><input type="number" id="nt-budget" placeholder="cth: 500000000"></div>
    <div class="form-group"><label>Deskripsi Lengkap *</label><textarea id="nt-desc" rows="4" placeholder="Jelaskan kondisi saat ini, ruang lingkup pekerjaan, dan urgensi..."></textarea></div>
    <div style="display:flex;gap:.65rem;margin-top:.25rem">
      <button class="btn btn-primary" onclick="submitNewTicket()">📤 Kirim Permintaan</button>
      <button class="btn btn-ghost"   onclick="navigateTo('my-tickets')">Batal</button>
    </div>
  </div>`;
}

function submitNewTicket(){
  const title=document.getElementById('nt-title').value.trim();
  const desc=document.getElementById('nt-desc').value.trim();
  const location=document.getElementById('nt-location').value.trim();
  if(!title||!desc||!location){alert('Mohon lengkapi semua field wajib (*)');return;}
  const id='TKT-'+(100+state.tickets.length);
  state.tickets.push({
    id,title,type:document.getElementById('nt-type').value,
    location,desc,status:'new',
    priority:document.getElementById('nt-priority').value,
    client:currentUser.name,created:today(),
    progress:0,budget:parseInt(document.getElementById('nt-budget').value)||0,
    worker:null,materialReq:null,notes:''
  });
  renderSidebar();
  showModal(`<div class="modal"><div class="modal-hdr"><h2>✅ Permintaan Terkirim</h2><button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <p style="font-size:.88rem;line-height:1.65;margin-bottom:1.1rem">Tiket <strong>${id}</strong> berhasil dibuat dan akan segera ditinjau oleh Administrator &amp; Worker.</p>
      <div class="timeline">
        <div class="tl-item"><div class="tl-dot tl-green"></div><div><div class="tl-title">Permintaan diterima — Status: Baru</div></div></div>
        <div class="tl-item"><div class="tl-dot tl-amber"></div><div><div class="tl-title">Menunggu review Administrator &amp; Worker</div></div></div>
        <div class="tl-item"><div class="tl-dot tl-gray"></div><div><div class="tl-title">Penugasan &amp; pengerjaan</div></div></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" onclick="closeModal();navigateTo('my-tickets')">Lihat Tiket Saya</button>
    </div>
  </div>`);
}

function renderClientProgress(){
  const active = state.tickets.filter(t=>['progress','approved'].includes(t.status));
  const counts = { approved: active.filter(t=>t.status==='approved').length, progress: active.filter(t=>t.status==='progress').length };
  const filtered = applyFilter('client-progress', active);
  return `
  <div class="page-header"><div><h1>Monitor Proyek</h1><p>Pantau progress pekerjaan secara real-time</p></div></div>
  ${buildFilterBar('client-progress',['approved','progress'],counts)}
  ${filtered.length===0?`<div class="empty-state"><div class="empty-icon">📊</div><p>Tidak ada proyek aktif</p></div>`
  :filtered.map(t=>`
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.9rem">
      <div>
        <span class="chip" style="margin-bottom:.35rem">${t.id}</span>
        <div style="font-size:.97rem;font-weight:700;margin:.3rem 0">${t.title}</div>
        <div style="font-size:.76rem;color:var(--text3)">📍 ${t.location} &nbsp;•&nbsp; 👷 ${t.worker||'Belum ditugaskan'}</div>
      </div>${badge(t.status)}
    </div>
    <div style="margin-bottom:.75rem">
      <div style="display:flex;justify-content:space-between;font-size:.77rem;margin-bottom:.3rem">
        <span style="color:var(--text2)">Progress Keseluruhan</span>
        <span style="font-weight:700;color:var(--cyan)">${t.progress}%</span>
      </div>
      <div class="progress-wrap"><div class="progress-bar" style="width:${t.progress}%"></div></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.65rem;font-size:.78rem">
      <div><div style="color:var(--text3)">Anggaran</div><div style="font-weight:600;margin-top:.2rem">${fmt(t.budget)}</div></div>
      <div><div style="color:var(--text3)">Material</div><div style="font-weight:600;margin-top:.2rem">${t.materialReq?'Sudah diajukan':'Belum'}</div></div>
      <div><div style="color:var(--text3)">Catatan</div><div style="font-weight:600;margin-top:.2rem;color:var(--text2)">${t.notes||'—'}</div></div>
    </div>
  </div>`).join('')}`;
}

function renderClientReports(){
  const all=state.tickets.filter(t=>t.client===currentUser.name);
  const done=all.filter(t=>t.status==='done');
  const totalBudget=all.reduce((a,t)=>a+t.budget,0);
  const counts={};
  ['new','review','approved','progress','done','rejected'].forEach(s=>{counts[s]=all.filter(t=>t.status===s).length;});
  const filtered=applyFilter('client-reports',all);
  return `
  <div class="page-header"><div><h1>Laporan Proyek</h1><p>Ringkasan semua kegiatan dan anggaran</p></div></div>
  <div class="stat-grid">
    <div class="stat-card"><div class="stat-label">Total Proyek</div><div class="stat-val">${all.length}</div></div>
    <div class="stat-card"><div class="stat-label">Selesai</div><div class="stat-val" style="color:var(--green)">${done.length}</div><div class="stat-sub">${all.length?Math.round(done.length/all.length*100):0}% rate</div></div>
    <div class="stat-card"><div class="stat-label">Total Anggaran</div><div class="stat-val" style="font-size:1rem;color:var(--accent)">${fmt(totalBudget)}</div></div>
  </div>
  ${buildFilterBar('client-reports',['new','review','approved','progress','done','rejected'],counts)}
  <div class="card" style="padding:0;overflow:hidden">
    <table>
      <thead><tr><th>ID</th><th>Judul</th><th>Tipe</th><th>Status</th><th>Anggaran</th><th>Tanggal</th></tr></thead>
      <tbody>${filtered.map(t=>`
        <tr>
          <td><span class="chip">${t.id}</span></td>
          <td style="font-size:.82rem">${t.title}</td>
          <td style="font-size:.75rem;color:var(--text3)">${t.type}</td>
          <td>${badge(t.status)}</td>
          <td style="font-family:'DM Mono',monospace;font-size:.77rem">${fmt(t.budget)}</td>
          <td style="font-size:.75rem;color:var(--text3)">${t.created}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

/* ════════════════════════════════════════════════════════
   WORKER PAGES
════════════════════════════════════════════════════════ */
function renderWorkList(){
  // Worker sees ALL tickets that are new, review, approved, or progress
  const all = state.tickets.filter(t=>['new','review','approved','progress','done'].includes(t.status));
  const counts={};
  ['new','review','approved','progress','done'].forEach(s=>{counts[s]=state.tickets.filter(t=>t.status===s).length;});
  const filtered = applyFilter('work-list', all);

  return `
  <div class="page-header"><div><h1>Daftar Pekerjaan</h1><p>Semua permintaan pekerjaan yang perlu ditangani</p></div></div>
  <div class="stat-grid">
    <div class="stat-card"><div class="stat-label">Perlu Review</div><div class="stat-val" style="color:var(--amber)">${counts.new+counts.review}</div></div>
    <div class="stat-card"><div class="stat-label">Disetujui</div><div class="stat-val" style="color:var(--accent)">${counts.approved}</div></div>
    <div class="stat-card"><div class="stat-label">Dalam Proses</div><div class="stat-val" style="color:var(--cyan)">${counts.progress}</div></div>
    <div class="stat-card"><div class="stat-label">Selesai</div><div class="stat-val" style="color:var(--green)">${counts.done}</div></div>
  </div>
  ${buildFilterBar('work-list',['new','review','approved','progress','done'],counts)}
  <div class="card" style="padding:0;overflow:hidden">
    ${filtered.length===0?`<div class="empty-state"><div class="empty-icon">📭</div><p>Tidak ada pekerjaan dengan filter ini</p></div>`:
    `<table>
      <thead><tr><th>ID</th><th>Judul</th><th>Client</th><th>Prioritas</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody>${filtered.map(t=>`
        <tr>
          <td><span class="chip">${t.id}</span></td>
          <td><div style="font-weight:600;font-size:.83rem">${t.title}</div><div style="font-size:.71rem;color:var(--text3)">📍 ${t.location}</div></td>
          <td style="font-size:.79rem">${t.client}</td>
          <td>${prio(t.priority)}</td>
          <td>${badge(t.status)}</td>
          <td>
            <div style="display:flex;gap:.35rem;flex-wrap:wrap">
              <button class="btn btn-ghost btn-sm" onclick="showTicketDetail('${t.id}')">Detail</button>
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

function workerVerify(id){
  const t=state.tickets.find(t=>t.id===id);
  showModal(`<div class="modal">
    <div class="modal-hdr"><h2>Verifikasi Pekerjaan</h2><button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div style="background:var(--bg3);border-radius:6px;padding:.75rem;margin-bottom:1rem;font-size:.82rem">
        <div style="font-weight:700">${t.title}</div>
        <div style="color:var(--text3);margin-top:.2rem">${t.id} &nbsp;•&nbsp; ${t.location}</div>
      </div>
      <div class="form-group"><label>Worker yang Ditugaskan</label><input type="text" id="vf-worker" value="${currentUser.name}"></div>
      <div class="form-group"><label>Catatan Verifikasi Lapangan</label><textarea id="vf-notes" rows="3" placeholder="Hasil tinjauan lapangan..."></textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Batal</button>
      <button class="btn btn-warning" onclick="confirmVerify('${id}')">✓ Konfirmasi &amp; Kirim ke Admin</button>
    </div>
  </div>`);
}

function confirmVerify(id){
  const t=state.tickets.find(t=>t.id===id);
  t.worker=document.getElementById('vf-worker').value;
  t.notes =document.getElementById('vf-notes').value;
  t.status='review';  // goes to admin for final approval
  closeModal();
  renderSidebar();
  navigateTo(currentPage);
}

function showMRForm(ticketId){
  const t=state.tickets.find(t=>t.id===ticketId);
  showModal(`<div class="modal modal-wide">
    <div class="modal-hdr"><h2>Ajukan Permintaan Material</h2><button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div style="background:var(--bg3);border-radius:6px;padding:.7rem;margin-bottom:1rem;font-size:.81rem">
        <div style="font-weight:700">${t.title}</div>
        <div style="color:var(--text3);margin-top:.15rem">${t.id} • ${t.location}</div>
      </div>
      <div id="mr-items">${mrRow()}</div>
      <button class="btn btn-ghost btn-sm" onclick="addMRItem()" style="margin-bottom:.85rem">+ Tambah Material</button>
      <div class="form-group"><label>Catatan</label><textarea id="mr-notes" rows="2" placeholder="Catatan tambahan..."></textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost"   onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="submitMR('${ticketId}')">📤 Kirim ke Administrator</button>
    </div>
  </div>`);
}

function mrRow(){
  return `<div class="mr-row">
    <div class="form-group" style="margin:0"><label>Nama Material</label><input type="text" class="mr-name" placeholder="cth: Beton K-300"></div>
    <div class="form-group" style="margin:0"><label>Qty</label><input type="number" class="mr-qty" placeholder="0"></div>
    <div class="form-group" style="margin:0"><label>Satuan</label><input type="text" class="mr-unit" placeholder="m³"></div>
    <div class="form-group" style="margin:0"><label>Harga/Sat</label><input type="number" class="mr-price" placeholder="0"></div>
    <button class="btn btn-ghost btn-sm" style="padding:.35rem .55rem;margin-top:1.4rem" onclick="this.closest('.mr-row').remove()">✕</button>
  </div>`;
}
function addMRItem(){ document.getElementById('mr-items').insertAdjacentHTML('beforeend',mrRow()); }

function submitMR(ticketId){
  const items=[...document.querySelectorAll('.mr-row')].map(el=>({
    name:el.querySelector('.mr-name').value,
    qty:parseFloat(el.querySelector('.mr-qty').value)||0,
    unit:el.querySelector('.mr-unit').value,
    price:parseFloat(el.querySelector('.mr-price').value)||0,
  })).filter(i=>i.name);
  if(!items.length){alert('Tambahkan minimal 1 material');return;}
  const id='MR-'+(100+state.materialRequests.length);
  const t=state.tickets.find(t=>t.id===ticketId);
  state.materialRequests.push({id,ticketId,ticketTitle:t.title,items,status:'review',submitted:today(),notes:document.getElementById('mr-notes').value,pr:null});
  t.materialReq=id;
  closeModal();
  renderSidebar();
  alert(`✅ Permintaan material ${id} berhasil diajukan ke Administrator.`);
  navigateTo(currentPage);
}

function showProgressUpdate(id){
  const t=state.tickets.find(t=>t.id===id);
  showModal(`<div class="modal">
    <div class="modal-hdr"><h2>Update Progress Pekerjaan</h2><button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div style="font-weight:700;margin-bottom:.85rem">${t.title}</div>
      <div class="form-group">
        <label>Progress (%)</label>
        <input type="range" id="prog-val" min="0" max="100" value="${t.progress}" oninput="document.getElementById('prog-disp').textContent=this.value+'%'" style="margin:.4rem 0">
        <div id="prog-disp" style="text-align:center;font-size:1.3rem;font-weight:700;color:var(--cyan)">${t.progress}%</div>
      </div>
      <div class="form-group"><label>Catatan Kemajuan</label><textarea id="prog-notes" rows="3" placeholder="Deskripsi pekerjaan hari ini...">${t.notes}</textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost"   onclick="closeModal()">Batal</button>
      <button class="btn btn-success" onclick="saveProgress('${id}')">💾 Simpan Update</button>
    </div>
  </div>`);
}

function saveProgress(id){
  const t=state.tickets.find(t=>t.id===id);
  t.progress=parseInt(document.getElementById('prog-val').value);
  t.notes=document.getElementById('prog-notes').value;
  if(t.progress===100) t.status='done';
  closeModal();
  navigateTo(currentPage);
}

function renderMaterialRequest(){
  const mrs=state.materialRequests;
  const counts={review:mrs.filter(m=>m.status==='review').length,approved:mrs.filter(m=>m.status==='approved').length,done:mrs.filter(m=>m.status==='done').length,rejected:mrs.filter(m=>m.status==='rejected').length};
  const filtered=applyFilter('material-request',mrs);
  return `
  <div class="page-header"><div><h1>Permintaan Material</h1><p>Kelola semua permintaan material</p></div></div>
  <div class="stat-grid">
    <div class="stat-card"><div class="stat-label">Total MR</div><div class="stat-val">${mrs.length}</div></div>
    <div class="stat-card"><div class="stat-label">Menunggu</div><div class="stat-val" style="color:var(--amber)">${counts.review}</div></div>
    <div class="stat-card"><div class="stat-label">Disetujui</div><div class="stat-val" style="color:var(--green)">${counts.approved}</div></div>
    <div class="stat-card"><div class="stat-label">Selesai PR</div><div class="stat-val" style="color:var(--cyan)">${counts.done}</div></div>
  </div>
  ${buildFilterBar('material-request',['review','approved','done','rejected'],counts)}
  ${filtered.map(mr=>`
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.8rem">
      <div>
        <span class="chip" style="margin-bottom:.3rem">${mr.id}</span>
        <div style="font-weight:700;margin:.25rem 0">${mr.ticketTitle}</div>
        <div style="font-size:.74rem;color:var(--text3)">Tiket: ${mr.ticketId} &nbsp;•&nbsp; Diajukan: ${mr.submitted}${mr.pr?` &nbsp;•&nbsp; PR: ${mr.pr}`:''}</div>
      </div>
      <div style="text-align:right">${badge(mr.status)}<div style="font-size:.88rem;font-weight:700;color:var(--accent);margin-top:.4rem">${fmt(matTotal(mr.items))}</div></div>
    </div>
    <table style="font-size:.77rem">
      <thead><tr><th>Material</th><th>Qty</th><th>Satuan</th><th>Harga/Sat</th><th>Subtotal</th></tr></thead>
      <tbody>${mr.items.map(i=>`<tr><td>${i.name}</td><td>${i.qty}</td><td>${i.unit}</td><td>${fmt(i.price)}</td><td style="font-weight:600">${fmt(i.qty*i.price)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="4" style="font-weight:700;padding-top:.65rem;color:var(--text2)">Total Nilai</td><td style="font-weight:700;padding-top:.65rem;color:var(--accent)">${fmt(matTotal(mr.items))}</td></tr></tfoot>
    </table>
  </div>`).join('')}
  ${filtered.length===0?`<div class="empty-state"><div class="empty-icon">📦</div><p>Tidak ada data dengan filter ini</p></div>`:''}`;
}

function renderWorkerProgress(){
  const jobs=state.tickets.filter(t=>t.worker===currentUser.name&&t.status==='progress');
  return `
  <div class="page-header"><div><h1>Update Progress</h1><p>Perbarui kemajuan pekerjaan yang ditugaskan</p></div></div>
  ${jobs.length===0?`<div class="empty-state"><div class="empty-icon">✅</div><p>Tidak ada pekerjaan aktif yang ditugaskan ke Anda</p></div>`
  :jobs.map(t=>`
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
      <div><span class="chip">${t.id}</span> <strong style="margin-left:.4rem">${t.title}</strong></div>
      ${badge(t.status)}
    </div>
    <div style="margin:.75rem 0">
      <div style="display:flex;justify-content:space-between;font-size:.79rem;margin-bottom:.3rem">
        <span style="color:var(--text2)">Progress</span><span style="font-weight:700;color:var(--cyan)">${t.progress}%</span>
      </div>
      <div class="progress-wrap"><div class="progress-bar" style="width:${t.progress}%"></div></div>
    </div>
    <button class="btn btn-success btn-sm" onclick="showProgressUpdate('${t.id}')">📊 Update Progress</button>
  </div>`).join('')}`;
}

/* ════════════════════════════════════════════════════════
   ADMIN PAGES
════════════════════════════════════════════════════════ */
function renderAdminDashboard(){
  const pendT=state.tickets.filter(t=>t.status==='review').length;
  const pendM=state.materialRequests.filter(m=>m.status==='review').length;
  const active=state.tickets.filter(t=>t.status==='progress').length;
  const totalPR=state.purchaseRequests.reduce((a,p)=>a+p.totalValue,0);
  const statusBar=s=>{
    const c=state.tickets.filter(t=>t.status===s).length;
    const pct=state.tickets.length?Math.round(c/state.tickets.length*100):0;
    return `<div style="display:flex;align-items:center;gap:.65rem;margin-bottom:.55rem">
      ${badge(s)}
      <div class="progress-wrap" style="flex:1"><div class="progress-bar" style="width:${pct}%"></div></div>
      <span style="font-size:.76rem;color:var(--text3);min-width:18px;text-align:right">${c}</span>
    </div>`;
  };
  return `
  <div class="page-header"><div><h1>Dashboard Administrator</h1><p>Ringkasan keseluruhan sistem proyek</p></div></div>
  <div class="stat-grid">
    <div class="stat-card" style="border-left:3px solid var(--amber)"><div class="stat-label">Tiket Pending</div><div class="stat-val" style="color:var(--amber)">${pendT}</div><div class="stat-sub">Menunggu verifikasi</div></div>
    <div class="stat-card" style="border-left:3px solid var(--purple)"><div class="stat-label">Material Pending</div><div class="stat-val" style="color:var(--purple)">${pendM}</div><div class="stat-sub">Perlu persetujuan</div></div>
    <div class="stat-card" style="border-left:3px solid var(--cyan)"><div class="stat-label">Proyek Aktif</div><div class="stat-val" style="color:var(--cyan)">${active}</div><div class="stat-sub">Sedang berjalan</div></div>
    <div class="stat-card" style="border-left:3px solid var(--green)"><div class="stat-label">Total PR</div><div class="stat-val" style="font-size:1rem;color:var(--green)">${fmt(totalPR)}</div><div class="stat-sub">${state.purchaseRequests.length} purchase request</div></div>
  </div>
  <div class="two-col">
    <div class="card">
      <div class="card-header"><div class="card-title">Distribusi Status Tiket</div></div>
      ${['new','review','approved','progress','done','rejected'].map(statusBar).join('')}
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">Alur Kerja Sistem</div></div>
      <div class="timeline">
        <div class="tl-item"><div class="tl-dot tl-green"></div><div><div class="tl-title">Client mengajukan tiket</div><div class="tl-desc">${state.tickets.length} total tiket masuk</div></div></div>
        <div class="tl-item"><div class="tl-dot ${pendT>0?'tl-amber':'tl-green'}"></div><div><div class="tl-title">Worker verifikasi lapangan</div><div class="tl-desc">${pendT} menunggu review</div></div></div>
        <div class="tl-item"><div class="tl-dot ${pendM>0?'tl-amber':'tl-green'}"></div><div><div class="tl-title">Permintaan material diajukan</div><div class="tl-desc">${pendM} MR menunggu persetujuan</div></div></div>
        <div class="tl-item"><div class="tl-dot tl-blue"></div><div><div class="tl-title">Admin verifikasi &amp; buat PR</div><div class="tl-desc">${state.purchaseRequests.length} PR sudah terkirim</div></div></div>
        <div class="tl-item"><div class="tl-dot tl-green"></div><div><div class="tl-title">Pekerjaan berlangsung</div><div class="tl-desc">${active} proyek aktif berjalan</div></div></div>
      </div>
    </div>
  </div>`;
}

function renderAdminTickets(){
  const all=state.tickets;
  const counts={};
  ['new','review','approved','progress','done','rejected'].forEach(s=>{counts[s]=all.filter(t=>t.status===s).length;});
  const filtered=applyFilter('admin-tickets',all);
  return `
  <div class="page-header"><div><h1>Verifikasi Tiket</h1><p>Tinjau dan setujui semua permintaan pekerjaan</p></div></div>
  ${buildFilterBar('admin-tickets',['new','review','approved','progress','done','rejected'],counts)}
  <div class="card" style="padding:0;overflow:hidden">
    ${filtered.length===0?`<div class="empty-state"><div class="empty-icon">📭</div><p>Tidak ada tiket dengan filter ini</p></div>`:
    `<table>
      <thead><tr><th>ID</th><th>Judul</th><th>Client</th><th>Worker</th><th>Prioritas</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody>${filtered.map(t=>`
        <tr>
          <td><span class="chip">${t.id}</span></td>
          <td><div style="font-weight:600;font-size:.83rem">${t.title}</div><div style="font-size:.71rem;color:var(--text3)">📍 ${t.location}</div></td>
          <td style="font-size:.78rem">${t.client}</td>
          <td style="font-size:.77rem">${t.worker||'<span style="color:var(--text3)">—</span>'}</td>
          <td>${prio(t.priority)}</td>
          <td>${badge(t.status)}</td>
          <td><div style="display:flex;gap:.3rem;flex-wrap:wrap">
            <button class="btn btn-ghost btn-sm" onclick="showTicketDetail('${t.id}')">Detail</button>
            ${t.status==='review'?`<button class="btn btn-success btn-sm" onclick="adminApproveTicket('${t.id}')">✓ Setujui</button><button class="btn btn-danger btn-sm" onclick="adminRejectTicket('${t.id}')">✕ Tolak</button>`:''}
            ${t.status==='approved'?`<button class="btn btn-primary btn-sm" onclick="adminStartWork('${t.id}')">▶ Mulai</button>`:''}
          </div></td>
        </tr>`).join('')}
      </tbody>
    </table>`}
  </div>`;
}

function adminApproveTicket(id){ const t=state.tickets.find(t=>t.id===id); if(confirm(`Setujui pekerjaan "${t.title}"?`)){ t.status='approved'; renderSidebar(); navigateTo(currentPage); } }
function adminRejectTicket(id){ const t=state.tickets.find(t=>t.id===id); if(confirm(`Tolak pekerjaan "${t.title}"?`)){ t.status='rejected'; renderSidebar(); navigateTo(currentPage); } }
function adminStartWork(id){ const t=state.tickets.find(t=>t.id===id); if(confirm(`Mulai pekerjaan "${t.title}"?`)){ t.status='progress'; navigateTo(currentPage); } }

function renderAdminMaterials(){
  const mrs=state.materialRequests;
  const counts={review:mrs.filter(m=>m.status==='review').length,approved:mrs.filter(m=>m.status==='approved').length,done:mrs.filter(m=>m.status==='done').length,rejected:mrs.filter(m=>m.status==='rejected').length};
  const filtered=applyFilter('admin-materials',mrs);
  return `
  <div class="page-header"><div><h1>Verifikasi Material</h1><p>Tinjau dan setujui permintaan material</p></div></div>
  ${buildFilterBar('admin-materials',['review','approved','done','rejected'],counts)}
  ${filtered.map(mr=>`
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.85rem">
      <div>
        <span class="chip" style="margin-bottom:.3rem">${mr.id}</span>
        <div style="font-weight:700;margin:.25rem 0">${mr.ticketTitle}</div>
        <div style="font-size:.74rem;color:var(--text3)">Tiket: ${mr.ticketId} &nbsp;•&nbsp; Diajukan: ${mr.submitted}</div>
        ${mr.notes?`<div style="font-size:.75rem;color:var(--text2);margin-top:.25rem;font-style:italic">"${mr.notes}"</div>`:''}
      </div>
      <div style="text-align:right">${badge(mr.status)}<div style="font-size:.9rem;font-weight:700;color:var(--accent);margin-top:.4rem">${fmt(matTotal(mr.items))}</div></div>
    </div>
    <table style="font-size:.77rem;margin-bottom:.85rem">
      <thead><tr><th>Material</th><th>Qty</th><th>Satuan</th><th>Harga/Sat</th><th>Subtotal</th></tr></thead>
      <tbody>${mr.items.map(i=>`<tr><td>${i.name}</td><td>${i.qty}</td><td>${i.unit}</td><td>${fmt(i.price)}</td><td style="font-weight:600">${fmt(i.qty*i.price)}</td></tr>`).join('')}</tbody>
    </table>
    ${mr.status==='review'?`<div style="display:flex;gap:.55rem">
      <button class="btn btn-success btn-sm" onclick="adminApproveMR('${mr.id}')">✓ Setujui Material</button>
      <button class="btn btn-danger btn-sm"  onclick="adminRejectMR('${mr.id}')">✕ Tolak</button>
    </div>`:mr.status==='approved'&&!mr.pr?`<button class="btn btn-primary btn-sm" onclick="showCreatePR('${mr.id}')">🛒 Buat Purchase Request</button>`
    :mr.pr?`<span style="font-size:.78rem;color:var(--green)">✓ PR sudah dibuat: ${mr.pr}</span>`:''}
  </div>`).join('')}
  ${filtered.length===0?`<div class="empty-state"><div class="empty-icon">📦</div><p>Tidak ada data dengan filter ini</p></div>`:''}`;
}

function adminApproveMR(id){ state.materialRequests.find(m=>m.id===id).status='approved'; renderSidebar(); navigateTo(currentPage); }
function adminRejectMR(id){ state.materialRequests.find(m=>m.id===id).status='rejected'; renderSidebar(); navigateTo(currentPage); }

function showCreatePR(mrId){
  const mr=state.materialRequests.find(m=>m.id===mrId);
  const total=matTotal(mr.items);
  showModal(`<div class="modal">
    <div class="modal-hdr"><h2>Buat Purchase Request</h2><button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div style="background:var(--bg3);border-radius:6px;padding:.75rem;margin-bottom:1rem;font-size:.81rem">
        <div style="font-weight:700">${mr.ticketTitle}</div>
        <div style="color:var(--accent);margin-top:.2rem;font-size:.9rem;font-weight:700">${fmt(total)}</div>
      </div>
      <div class="form-group"><label>Vendor / Supplier</label><input type="text" id="pr-vendor" placeholder="Nama vendor/supplier"></div>
      <div class="form-group"><label>Kirim Ke (Dept.)</label><input type="text" id="pr-dept" value="Dept. Purchasing"></div>
      <div class="form-group"><label>Catatan untuk Purchasing</label><textarea id="pr-notes" rows="3" placeholder="Catatan khusus..."></textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost"   onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="submitPR('${mrId}',${total})">🛒 Kirim Purchase Request</button>
    </div>
  </div>`);
}

function submitPR(mrId,total){
  const mr=state.materialRequests.find(m=>m.id===mrId);
  const t=state.tickets.find(t=>t.id===mr.ticketId);
  const id='PR-'+(100+state.purchaseRequests.length);
  const dept=document.getElementById('pr-dept').value;
  state.purchaseRequests.push({id,mrId,ticketId:mr.ticketId,title:`PR ${mr.ticketTitle}`,totalValue:total,status:'sent',sentTo:dept,date:today(),vendor:document.getElementById('pr-vendor').value,notes:document.getElementById('pr-notes').value});
  mr.status='done'; mr.pr=id;
  if(t) t.status='progress';
  closeModal();
  renderSidebar();
  alert(`✅ Purchase Request ${id} berhasil dikirim ke ${dept}`);
  navigateTo(currentPage);
}

function renderAdminPR(){
  const prs=state.purchaseRequests;
  const totalVal=prs.reduce((a,p)=>a+p.totalValue,0);
  return `
  <div class="page-header">
    <div><h1>Purchase Request</h1><p>Semua PR yang telah dikirim ke Purchasing</p></div>
  </div>
  <div class="stat-grid">
    <div class="stat-card"><div class="stat-label">Total PR</div><div class="stat-val">${prs.length}</div></div>
    <div class="stat-card"><div class="stat-label">Total Nilai</div><div class="stat-val" style="font-size:1rem;color:var(--green)">${fmt(totalVal)}</div></div>
  </div>
  ${prs.length===0?`<div class="empty-state"><div class="empty-icon">🛒</div><p>Belum ada Purchase Request</p></div>`
  :prs.map(pr=>`
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <span class="chip" style="margin-bottom:.35rem">${pr.id}</span>
        <div style="font-weight:700;margin:.3rem 0">${pr.title}</div>
        <div style="font-size:.74rem;color:var(--text3)">Tiket: ${pr.ticketId} &nbsp;•&nbsp; MR: ${pr.mrId} &nbsp;•&nbsp; ${pr.date}</div>
        <div style="font-size:.74rem;color:var(--text3);margin-top:.12rem">Vendor: <span style="color:var(--text2)">${pr.vendor||'—'}</span> &nbsp;•&nbsp; Ke: <span style="color:var(--text2)">${pr.sentTo}</span></div>
        ${pr.notes?`<div style="font-size:.74rem;font-style:italic;color:var(--text2);margin-top:.3rem">"${pr.notes}"</div>`:''}
      </div>
      <div style="text-align:right">${badge('sent')}<div style="font-size:1rem;font-weight:700;color:var(--accent);margin-top:.4rem">${fmt(pr.totalValue)}</div></div>
    </div>
  </div>`).join('')}`;
}

/* ════════════════════════════════════════════════════════
   ADMIN REPORTS  (with Export)
════════════════════════════════════════════════════════ */
function renderAdminReports(){
  const all=state.tickets;
  const done=all.filter(t=>t.status==='done');
  const totalBudget=all.reduce((a,t)=>a+t.budget,0);
  const totalPR=state.purchaseRequests.reduce((a,p)=>a+p.totalValue,0);
  const counts={};
  ['new','review','approved','progress','done','rejected'].forEach(s=>{counts[s]=all.filter(t=>t.status===s).length;});
  const filtered=applyFilter('admin-reports',all);

  const statusBar=s=>{
    const c=all.filter(t=>t.status===s).length;
    const pct=all.length?Math.round(c/all.length*100):0;
    return `<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem;font-size:.79rem">
      <span style="min-width:90px">${badge(s)}</span>
      <div class="progress-wrap" style="flex:1"><div class="progress-bar" style="width:${pct}%"></div></div>
      <span style="color:var(--text3);min-width:24px;text-align:right">${c}</span>
    </div>`;
  };
  const typeDist=['perbaikan','pembangunan','renovasi','perawatan'].map(type=>{
    const c=all.filter(t=>t.type===type).length;
    const pct=all.length?Math.round(c/all.length*100):0;
    return `<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem;font-size:.79rem">
      <span style="min-width:90px;color:var(--text2)">${type}</span>
      <div class="progress-wrap" style="flex:1"><div class="progress-bar" style="width:${pct}%"></div></div>
      <span style="color:var(--text3);min-width:24px;text-align:right">${c}</span>
    </div>`;
  }).join('');

  return `
  <div class="page-header">
    <div><h1>Laporan &amp; Analitik</h1><p>Overview keseluruhan sistem</p></div>
    <div class="page-header-actions">
      <button class="btn btn-success" onclick="exportExcel()">📊 Export Excel</button>
      <button class="btn btn-danger"  onclick="exportPDF()">📄 Export PDF</button>
    </div>
  </div>
  <div class="stat-grid">
    <div class="stat-card"><div class="stat-label">Total Proyek</div><div class="stat-val">${all.length}</div></div>
    <div class="stat-card"><div class="stat-label">Completion Rate</div><div class="stat-val" style="color:var(--green)">${all.length?Math.round(done.length/all.length*100):0}%</div></div>
    <div class="stat-card"><div class="stat-label">Total Anggaran</div><div class="stat-val" style="font-size:1rem;color:var(--accent)">${fmt(totalBudget)}</div></div>
    <div class="stat-card"><div class="stat-label">Total PR</div><div class="stat-val" style="font-size:1rem;color:var(--green)">${fmt(totalPR)}</div></div>
  </div>
  <div class="two-col" style="margin-bottom:1rem">
    <div class="card"><div class="card-header"><div class="card-title">Distribusi Status Tiket</div></div>${['new','review','approved','progress','done','rejected'].map(statusBar).join('')}</div>
    <div class="card"><div class="card-header"><div class="card-title">Distribusi Tipe Pekerjaan</div></div>${typeDist}</div>
  </div>
  ${buildFilterBar('admin-reports',['new','review','approved','progress','done','rejected'],counts)}
  <div class="card" style="padding:0;overflow:hidden">
    <table>
      <thead><tr><th>ID</th><th>Judul</th><th>Tipe</th><th>Client</th><th>Worker</th><th>Anggaran</th><th>Progress</th><th>Status</th></tr></thead>
      <tbody>${filtered.map(t=>`
        <tr>
          <td><span class="chip">${t.id}</span></td>
          <td style="font-size:.81rem;font-weight:600">${t.title}</td>
          <td style="font-size:.74rem;color:var(--text3)">${t.type}</td>
          <td style="font-size:.77rem">${t.client}</td>
          <td style="font-size:.77rem">${t.worker||'—'}</td>
          <td style="font-family:'DM Mono',monospace;font-size:.75rem">${fmt(t.budget)}</td>
          <td><div class="progress-wrap" style="min-width:60px"><div class="progress-bar" style="width:${t.progress}%"></div></div><div style="font-size:.7rem;color:var(--text3);text-align:center">${t.progress}%</div></td>
          <td>${badge(t.status)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

/* ════════════════════════════════════════════════════════
   EXPORT FUNCTIONS
════════════════════════════════════════════════════════ */
function exportExcel(){
  const wb = XLSX.utils.book_new();

  /* Sheet 1: Tiket */
  const ticketData = [
    ['ID','Judul','Tipe','Lokasi','Client','Worker','Prioritas','Status','Progress (%)','Anggaran (Rp)','Tanggal Dibuat','Catatan'],
    ...state.tickets.map(t=>[t.id,t.title,t.type,t.location,t.client,t.worker||'',t.priority,SL[t.status]||t.status,t.progress,t.budget,t.created,t.notes])
  ];
  const ws1=XLSX.utils.aoa_to_sheet(ticketData);
  ws1['!cols']=[{wch:10},{wch:35},{wch:15},{wch:30},{wch:20},{wch:20},{wch:10},{wch:15},{wch:12},{wch:20},{wch:14},{wch:30}];
  XLSX.utils.book_append_sheet(wb,ws1,'Tiket Proyek');

  /* Sheet 2: Material Request */
  const mrRows=[['MR ID','Tiket ID','Judul Tiket','Material','Qty','Satuan','Harga/Sat (Rp)','Subtotal (Rp)','Status','Diajukan']];
  state.materialRequests.forEach(mr=>{
    mr.items.forEach((item,i)=>{
      mrRows.push([i===0?mr.id:'',i===0?mr.ticketId:'',i===0?mr.ticketTitle:'',item.name,item.qty,item.unit,item.price,item.qty*item.price,i===0?(SL[mr.status]||mr.status):'',i===0?mr.submitted:'']);
    });
    mrRows.push(['','','','TOTAL','','','',mr.items.reduce((a,i)=>a+i.qty*i.price,0),'','']);
  });
  const ws2=XLSX.utils.aoa_to_sheet(mrRows);
  ws2['!cols']=[{wch:10},{wch:10},{wch:35},{wch:25},{wch:8},{wch:10},{wch:18},{wch:18},{wch:14},{wch:14}];
  XLSX.utils.book_append_sheet(wb,ws2,'Permintaan Material');

  /* Sheet 3: Purchase Request */
  const prData=[
    ['PR ID','MR ID','Tiket ID','Judul','Total Nilai (Rp)','Vendor','Dikirim Ke','Tanggal','Status','Catatan'],
    ...state.purchaseRequests.map(p=>[p.id,p.mrId,p.ticketId,p.title,p.totalValue,p.vendor,p.sentTo,p.date,SL[p.status]||p.status,p.notes])
  ];
  const ws3=XLSX.utils.aoa_to_sheet(prData);
  ws3['!cols']=[{wch:10},{wch:10},{wch:10},{wch:35},{wch:20},{wch:25},{wch:20},{wch:14},{wch:12},{wch:30}];
  XLSX.utils.book_append_sheet(wb,ws3,'Purchase Request');

  /* Sheet 4: Summary */
  const all=state.tickets;
  const done=all.filter(t=>t.status==='done');
  const sumData=[
    ['LAPORAN RINGKASAN CIVILTRACK PRO'],
    ['Digenerate pada:', new Date().toLocaleString('id-ID')],
    [''],
    ['STATISTIK TIKET'],
    ['Total Tiket', all.length],
    ['Selesai', done.length],
    ['Completion Rate', all.length?Math.round(done.length/all.length*100)+'%':'0%'],
    ['Total Anggaran (Rp)', all.reduce((a,t)=>a+t.budget,0)],
    [''],
    ['STATUS BREAKDOWN'],
    ...['new','review','approved','progress','done','rejected'].map(s=>[SL[s],all.filter(t=>t.status===s).length]),
    [''],
    ['PURCHASE REQUEST'],
    ['Total PR', state.purchaseRequests.length],
    ['Total Nilai PR (Rp)', state.purchaseRequests.reduce((a,p)=>a+p.totalValue,0)],
  ];
  const ws4=XLSX.utils.aoa_to_sheet(sumData);
  ws4['!cols']=[{wch:25},{wch:20}];
  XLSX.utils.book_append_sheet(wb,ws4,'Ringkasan');

  XLSX.writeFile(wb,`CivilTrack_Laporan_${today()}.xlsx`);
}

function exportPDF(){
  const all=state.tickets;
  const done=all.filter(t=>t.status==='done');
  const totalBudget=all.reduce((a,t)=>a+t.budget,0);
  const totalPR=state.purchaseRequests.reduce((a,p)=>a+p.totalValue,0);

  const html=`<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>Laporan CivilTrack Pro</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',sans-serif;color:#1a2035;font-size:11px;padding:24px}
  h1{font-size:18px;color:#1a2035;margin-bottom:2px}
  .sub{font-size:10px;color:#6b7a94;margin-bottom:20px}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}
  .stat{background:#f0f4ff;border-radius:8px;padding:12px;text-align:center}
  .stat-lbl{font-size:9px;color:#6b7a94;text-transform:uppercase;letter-spacing:.05em;font-weight:700;margin-bottom:4px}
  .stat-val{font-size:20px;font-weight:800;color:#2d5ab0}
  h2{font-size:12px;font-weight:700;color:#1a2035;margin:16px 0 8px;padding-bottom:4px;border-bottom:2px solid #4f8ef7}
  table{width:100%;border-collapse:collapse;font-size:9.5px;margin-bottom:16px}
  th{background:#1a2035;color:#fff;padding:6px 8px;text-align:left;font-weight:700;font-size:8.5px;text-transform:uppercase;letter-spacing:.04em}
  td{padding:5px 8px;border-bottom:1px solid #e0e8f8;vertical-align:top}
  tr:nth-child(even) td{background:#f7f9ff}
  .badge{display:inline-block;padding:1px 6px;border-radius:10px;font-size:8px;font-weight:700}
  .b-new{background:#e8e0ff;color:#7a5ed0} .b-review{background:#fff3d0;color:#c8861a}
  .b-approved{background:#dce8ff;color:#2d5ab0} .b-progress{background:#d0f8f7;color:#1a9e99}
  .b-done{background:#d0f5e8;color:#1a9e66} .b-rejected{background:#ffd0d0;color:#c83a3a}
  .b-sent{background:#dce8ff;color:#2d5ab0}
  .footer{margin-top:24px;text-align:center;font-size:9px;color:#9ba8c0;border-top:1px solid #e0e8f8;padding-top:10px}
  @media print{body{padding:0}}
</style></head>
<body>
<h1>🏗️ CivilTrack Pro — Laporan Proyek</h1>
<div class="sub">Digenerate oleh: ${currentUser.name} &nbsp;|&nbsp; ${new Date().toLocaleString('id-ID')}</div>

<div class="stats">
  <div class="stat"><div class="stat-lbl">Total Tiket</div><div class="stat-val">${all.length}</div></div>
  <div class="stat"><div class="stat-lbl">Completion Rate</div><div class="stat-val">${all.length?Math.round(done.length/all.length*100):0}%</div></div>
  <div class="stat"><div class="stat-lbl">Total Anggaran</div><div class="stat-val" style="font-size:12px">${fmt(totalBudget)}</div></div>
  <div class="stat"><div class="stat-lbl">Total PR</div><div class="stat-val" style="font-size:12px">${fmt(totalPR)}</div></div>
</div>

<h2>Daftar Tiket Proyek</h2>
<table>
  <thead><tr><th>ID</th><th>Judul</th><th>Tipe</th><th>Client</th><th>Worker</th><th>Prioritas</th><th>Status</th><th>Progress</th><th>Anggaran</th></tr></thead>
  <tbody>${all.map(t=>`<tr>
    <td><b>${t.id}</b></td>
    <td>${t.title}<br><span style="color:#9ba8c0;font-size:8.5px">📍 ${t.location}</span></td>
    <td>${t.type}</td><td>${t.client}</td><td>${t.worker||'—'}</td>
    <td style="color:${t.priority==='tinggi'?'#c83a3a':t.priority==='sedang'?'#c8861a':'#1a9e66'};font-weight:700">${t.priority}</td>
    <td><span class="badge b-${t.status}">${SL[t.status]||t.status}</span></td>
    <td>${t.progress}%</td>
    <td style="font-size:8.5px">${fmt(t.budget)}</td>
  </tr>`).join('')}</tbody>
</table>

<h2>Permintaan Material</h2>
<table>
  <thead><tr><th>MR ID</th><th>Tiket</th><th>Material</th><th>Qty</th><th>Satuan</th><th>Harga/Sat</th><th>Subtotal</th><th>Status</th></tr></thead>
  <tbody>${state.materialRequests.flatMap(mr=>mr.items.map((item,i)=>`<tr>
    <td>${i===0?`<b>${mr.id}</b>`:''}</td>
    <td>${i===0?mr.ticketId:''}</td>
    <td>${item.name}</td><td>${item.qty}</td><td>${item.unit}</td>
    <td>${fmt(item.price)}</td><td><b>${fmt(item.qty*item.price)}</b></td>
    <td>${i===0?`<span class="badge b-${mr.status}">${SL[mr.status]||mr.status}</span>`:''}</td>
  </tr>`)).join('')}</tbody>
</table>

<h2>Purchase Request</h2>
<table>
  <thead><tr><th>PR ID</th><th>Judul</th><th>Vendor</th><th>Dikirim Ke</th><th>Tanggal</th><th>Total Nilai</th><th>Status</th></tr></thead>
  <tbody>${state.purchaseRequests.map(pr=>`<tr>
    <td><b>${pr.id}</b></td><td>${pr.title}</td>
    <td>${pr.vendor||'—'}</td><td>${pr.sentTo}</td><td>${pr.date}</td>
    <td><b>${fmt(pr.totalValue)}</b></td>
    <td><span class="badge b-sent">${SL[pr.status]||pr.status}</span></td>
  </tr>`).join('')}</tbody>
</table>

<div class="footer">CivilTrack Pro · Civil Engineering Project Management System · Laporan ini dibuat secara otomatis</div>
</body></html>`;

  const win=window.open('','_blank');
  win.document.write(html);
  win.document.close();
  win.onload=()=>{ win.focus(); win.print(); };
}
