import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, DoorOpen, Key, MessageSquare,
  UserCheck, Banknote, Wrench, LogOut, Plus, X,
  Search, AlertCircle, CheckCircle, XCircle,
  Building2, Edit, RefreshCw, Activity, Calendar, PackageCheck, QrCode, Lock, ShieldCheck, Check, Camera, Moon, Sun
} from 'lucide-react';
import QRCameraScanner from './QRCameraScanner.jsx';
import { useTheme } from '../ThemeContext.jsx';

const API = (url, method = 'GET', body = null) =>
  fetch(url, {
    method,
    credentials: 'include',  // send HttpOnly cookie automatically
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e.error || 'Error')));

function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto pt-10">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800">
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">{title}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="px-6 py-6 bg-white dark:bg-slate-900">{children}</div>
      </div>
    </div>
  );
}

function Badge({ color, children }) {
  const c = { 
    green:'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', 
    red:'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800', 
    blue:'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800', 
    yellow:'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800', 
    orange:'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800', 
    gray:'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700', 
    purple:'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-800' 
  };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${c[color]||c.gray}`}>{children}</span>;
}

function Inp({ label, ...p }) {
  return <div className="mb-4"><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label><input {...p} className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50 dark:bg-slate-700 dark:text-white focus:bg-white dark:focus:bg-slate-600 transition-all shadow-sm" /></div>;
}
function Sel({ label, children, ...p }) {
  return <div className="mb-4"><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label><select {...p} className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-700 dark:text-white focus:bg-white dark:focus:bg-slate-600 transition-all shadow-sm">{children}</select></div>;
}
function Txa({ label, ...p }) {
  return <div className="mb-4"><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label><textarea {...p} rows={3} className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-700 dark:text-white focus:bg-white dark:focus:bg-slate-600 resize-none transition-all shadow-sm" /></div>;
}

function StatCard({ icon: Icon, label, value, sub, colors }) {
  return (
    <div className={`relative bg-gradient-to-br ${colors} rounded-3xl p-6 shadow-lg overflow-hidden flex flex-col justify-between group cursor-default transition-transform hover:scale-[1.02]`}>
      <div className="absolute -right-6 -bottom-6 opacity-20 transform group-hover:scale-110 transition-transform duration-500"><Icon size={120}/></div>
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner text-white"><Icon size={24} /></div>
      </div>
      <div className="relative z-10">
        <p className="text-4xl font-black text-white tracking-tight mb-1">{value ?? '—'}</p>
        <p className="text-sm font-bold text-white/90 drop-shadow-sm">{label}</p>
        {sub && <p className="text-xs font-semibold text-white/70 mt-1 uppercase tracking-wider">{sub}</p>}
      </div>
    </div>
  );
}

const sevBadge = s => s==='Critical'?<Badge color="red">{s}</Badge>:s==='High'?<Badge color="orange">{s}</Badge>:s==='Medium'?<Badge color="yellow">{s}</Badge>:<Badge color="gray">{s}</Badge>;
const stsBadge = s => (s==='Active'||s==='Open'||s==='Paid')?<Badge color="green">{s}</Badge>:(s==='In Progress'||s==='Pending')?<Badge color="blue">{s}</Badge>:(s==='Resolved'||s==='Completed')?<Badge color="purple">{s}</Badge>:(s==='Rejected'||s==='Closed'||s==='Overdue')?<Badge color="red">{s}</Badge>:<Badge color="gray">{s}</Badge>;

function TblWrap({children, empty}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden fade-in animate-in">
      <div className="overflow-x-auto"><table className="w-full text-sm">{children}</table></div>
      {empty && <div className="py-16 text-center text-slate-400 font-medium"><p>{empty}</p></div>}
    </div>
  );
}

function AddBtn({label, onClick}) {
  return (
    <button onClick={onClick} className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-md shadow-blue-500/30 transition-all hover:shadow-lg">
      <Plus size={18}/>{label}
    </button>
  );
}

export default function AdminDashboard({ onLogout }) {
  const { dark, toggle: toggleTheme } = useTheme();
  const [section,     setSection]     = useState('overview');
  const [loading,     setLoading]     = useState(true);
  const [toast,       setToast]       = useState(null);
  const [members,     setMembers]     = useState([]);
  const [rooms,       setRooms]       = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [complaints,  setComplaints]  = useState([]);
  const [visitors,    setVisitors]    = useState([]);
  const [fees,        setFees]        = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [furniture,   setFurniture]   = useState([]);
  const [scans,       setScans]       = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [feeCats,     setFeeCats]     = useState([]);
  const [stats,       setStats]       = useState(null);
  const [search,      setSearch]      = useState('');
  const [modal,       setModal]       = useState(null);
  const [selected,    setSelected]    = useState(null);

  const [memberForm,  setMemberForm]  = useState({ Name:'', Email:'', ContactNumber:'', Department:'', YearOfStudy:'', PurposeOfStay:'Resident Student', IdentificationNumber:'', Gender:'Male', Age:'', DateOfBirth:'', AllocatedDate:'', createLogin:false, Username:'', Password:'' });
  const [allocForm,   setAllocForm]   = useState({ MemberID:'', RoomID:'', CheckInDate:new Date().toISOString().slice(0,10), AllocatedBy:'' });
  const [upForm,      setUpForm]      = useState({ Status:'', AssignedTo:'', ResolutionRemarks:'', qrCode:'' });
  const [feeForm,     setFeeForm]     = useState({ MemberID:'', FeeCategoryID:'', AmountPaid:'', PaymentDate:new Date().toISOString().slice(0,10), Status:'Paid' });
  const [gateScan,    setGateScan]    = useState({ qrCode:'', result:null });
  const [maintScan,   setMaintScan]   = useState({ qrCode:'', result:null });
  const [gateCam,     setGateCam]     = useState(false);
  const [maintCam,    setMaintCam]    = useState(false);
  
  const [sortConfig,  setSortConfig]  = useState(null);
  const handleSort = (key) => setSortConfig(p => ({ key, dir: p?.key === key && p.dir === 'asc' ? 'desc' : 'asc' }));
  const getSorted = (list) => {
    if (!sortConfig) return list;
    return [...list].sort((a,b) => {
      let valA = a[sortConfig.key] ?? '';
      let valB = b[sortConfig.key] ?? '';
      if(typeof valA==='string') valA=valA.toLowerCase();
      if(typeof valB==='string') valB=valB.toLowerCase();
      if(valA < valB) return sortConfig.dir === 'asc' ? -1 : 1;
      if(valA > valB) return sortConfig.dir === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const [cpForm,      setCpForm]      = useState({ oldPassword:'', newPassword:'', confirmPassword:'' });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [m,r,a,c,v,f,mx,cats,fc,st,furn,scn] = await Promise.all([
        API('/api/members'), API('/api/rooms'), API('/api/allocations'), API('/api/complaints'),
        API('/api/visitors'), API('/api/fees'), API('/api/maintenance'),
        API('/api/complaints/categories'), API('/api/fees/categories'), API('/api/stats'),
        API('/api/furniture'), API('/api/scans')
      ]);
      setMembers(m); setRooms(r); setAllocations(a); setComplaints(c);
      setVisitors(v); setFees(f); setMaintenance(mx);
      setFurniture(furn||[]); setScans(scn||[]);
      setCategories(cats); setFeeCats(fc); setStats(st);
    } catch(e) { showToast(String(e),'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(()=>{ fetchAll(); },[fetchAll]);

  const handleAddMember = async () => {
    const qr = memberForm.QRCode || `QR-${Date.now()}`;
    try {
      const res = await API('/api/members','POST',{...memberForm,QRCode:qr});
      
      const username = (memberForm.createLogin && memberForm.Username) ? memberForm.Username : memberForm.IdentificationNumber;
      const password = (memberForm.createLogin && memberForm.Password) ? memberForm.Password : memberForm.ContactNumber;

      if (username && password) {
        await API('/api/auth/register', 'POST', { username, password, role: 'Regular', memberId: res.id });
      }

      showToast('Member added'); closeModal(); fetchAll();
    } catch(e) { showToast(String(e),'error'); }
  };
  const handleAllocate = async () => {
    try { await API('/api/allocations','POST',allocForm); showToast('Room allocated'); closeModal(); fetchAll(); }
    catch(e) { showToast(String(e),'error'); }
  };
  const handleCheckout = async (a) => {
    try { await API(`/api/allocations/${a.AllocationID}`,'PATCH',{AllocationStatus:'Completed'}); showToast('Checked out'); fetchAll(); }
    catch(e) { showToast(String(e),'error'); }
  };
  const handleUpdateComplaint = async () => {
    try { await API(`/api/complaints/${selected.ComplaintID}`,'PATCH',upForm); showToast('Complaint updated'); closeModal(); fetchAll(); }
    catch(e) { showToast(String(e),'error'); }
  };
  const handleDeleteMember = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this resident? This will wipe all their allocations, fees, and system history forever!')) return;
    try {
      await API(`/api/members/${id}`, 'DELETE');
      showToast('Resident profile securely annihilated', 'success');
      closeModal(); fetchAll();
    } catch(e) { showToast(String(e), 'error'); }
  };
  const handleVisitorCheckout = async (v) => {
    try { await API(`/api/visitors/${v.VisitorID}`,'PATCH',{}); showToast('Visitor checked out'); fetchAll(); }
    catch(e) { showToast(String(e),'error'); }
  };
  const handleUpdateMaint = async () => {
    try {
      if (upForm.Status === 'Completed') {
        return showToast('Security policy mandates verifying physical QR tags via the Maintenance Scanner to close a work order!', 'error');
      } else {
        await API(`/api/maintenance/${selected.RequestID}`, 'PATCH', { 
          Status: upForm.Status, AssignedTo: upForm.AssignedTo, ResolutionRemarks: upForm.ResolutionRemarks 
        });
        showToast('Work Order Updated!', 'success');
      }
      closeModal();
      fetchAll();
    } catch(e) { showToast(String(e), 'error'); }
  };

  const handleGateScan = async (directCode) => {
    const code = directCode || gateScan.qrCode;
    if (!code) return;
    try {
      const res = await API('/api/scans/gate', 'POST', { qrCode: code });
      setGateScan(p => ({ ...p, result: { type: 'success', data: res.member }, qrCode: '' }));
      showToast('Scan Authorized', 'success');
      fetchAll();
    } catch(e) {
      setGateScan(p => ({ ...p, result: { type: 'error', error: e.message || e } }));
      showToast('Scan Rejected', 'error');
    }
  };

  const handleMaintScan = async (directCode) => {
    const code = directCode || maintScan.qrCode;
    if (!code) return;
    try {
      const data = await API('/api/scans/maintenance', 'POST', { qrCode: code });
      setMaintScan(p => ({ ...p, result: { type: 'success', message: data.message }, qrCode: '' }));
      showToast('Validation Success', 'success');
      fetchAll();
    } catch(e) {
      setMaintScan(p => ({ ...p, result: { type: 'error', error: e.message || String(e) } }));
      showToast('Validation Failed', 'error');
    }
  };

  const handleAddFee = async () => {
    try { await API('/api/fees','POST',feeForm); showToast('Payment recorded'); closeModal(); fetchAll(); }
    catch(e) { showToast(String(e),'error'); }
  };

  const navItems = [
    {id:'overview',    label:'Overview',    icon:LayoutDashboard},
    {id:'members',     label:'Members',     icon:Users},
    {id:'rooms',       label:'Rooms',       icon:DoorOpen},
    {id:'allocations', label:'Allocations', icon:Key},
    {id:'complaints',  label:'Complaints',  icon:MessageSquare},
    {id:'visitors',    label:'Visitors',    icon:UserCheck},
    {id:'fees',        label:'Fee Payments',icon:Banknote},
    {id:'maintenance', label:'Maintenance', icon:Wrench},
    {id:'furniture',   label:'Inventory',   icon:PackageCheck},
    {id:'gatescanner', label:'Gate Scanner',icon:ShieldCheck},
    {id:'maintscanner',label:'Maintenance Verify',icon:PackageCheck},
    {id:'scans',       label:'QR Logs',     icon:QrCode},
  ];

  const handleChangePassword = async () => {
    if (cpForm.newPassword !== cpForm.confirmPassword) return alert('Passwords do not match');
    try {
      await API('/api/auth/change-password', 'POST', { oldPassword: cpForm.oldPassword, newPassword: cpForm.newPassword });
      alert('Password updated successfully!');
      setModal(null);
      setCpForm({ oldPassword:'', newPassword:'', confirmPassword:'' });
    } catch(e) { alert(e); }
  };

  const filt = (arr,keys) => arr.filter(i=>keys.some(k=>String(i[k]||'').toLowerCase().includes(search.toLowerCase())));

  const renderOverview = () => (
    <div className="space-y-8 fade-in animate-in">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        <StatCard icon={Users}       label="Total Members"    value={stats?.members?.total}        sub={`${stats?.members?.active??0} active accounts`} colors="from-blue-500 to-indigo-600" />
        <StatCard icon={Key}         label="Active Allocs"    value={stats?.allocations?.active}    sub={`${stats?.allocations?.total??0} total records`} colors="from-emerald-400 to-emerald-600" />
        <StatCard icon={DoorOpen}    label="Available Rooms"  value={stats?.rooms?.available}       sub={`${stats?.rooms?.total??0} physical rooms`}    colors="from-cyan-400 to-blue-500" />
        <StatCard icon={AlertCircle} label="Open Complaints"  value={stats?.complaints?.open}       sub={`${stats?.complaints?.total??0} total history`} colors="from-amber-400 to-orange-500" />
        <StatCard icon={Wrench}      label="Pending Maint."   value={stats?.maintenance?.pending}   sub={`${stats?.maintenance?.total??0} work orders`} colors="from-rose-400 to-red-600" />
        <StatCard icon={UserCheck}   label="Total Visitors"   value={stats?.visitors?.total}        sub="all-time registrations"                         colors="from-purple-500 to-pink-600" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2"><div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl"><AlertCircle size={18}/></div> Recent Complaints</h3>
            <button onClick={()=>setSection('complaints')} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800">View All</button>
          </div>
          <div className="space-y-3">
            {complaints.slice(0,5).map(c=>(
              <div key={c.ComplaintID} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <div><p className="font-bold text-slate-800 dark:text-white">{c.MemberName}</p><p className="text-sm text-slate-500">{c.CategoryName} — <span className="italic">{(c.Description||'').slice(0,40)}{c.Description?.length>40?'...':''}</span></p></div>
                {sevBadge(c.Severity)}
              </div>
            ))}
            {complaints.length===0&&<p className="text-slate-400 text-sm italic p-4 text-center">No complaints registered</p>}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2"><div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl"><Key size={18}/></div> Recent Allocations</h3>
            <button onClick={()=>setSection('allocations')} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800">View All</button>
          </div>
          <div className="space-y-3">
            {allocations.slice(0,5).map(a=>(
              <div key={a.AllocationID} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <div><p className="font-bold text-slate-800 dark:text-white">{a.MemberName}</p><p className="text-sm text-slate-500 font-medium text-indigo-600 dark:text-indigo-400">{a.HostelName} — Room {a.RoomNumber}</p></div>
                {stsBadge(a.AllocationStatus)}
              </div>
            ))}
            {allocations.length===0&&<p className="text-slate-400 text-sm italic p-4 text-center">No active allocations</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const tblHead = (cols) => <thead><tr className="bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-sm border-b border-slate-100 dark:border-slate-700">{cols.map(h => {
    const label = typeof h === 'string' ? h : h.label;
    const key = typeof h === 'string' ? null : h.key;
    return <th key={label} onClick={() => key && handleSort(key)} className={`text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${key ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 transition-colors select-none' : ''}`}>{label} {sortConfig?.key === key && (sortConfig.dir === 'asc' ? '↑' : '↓')}</th>;
  })}</tr></thead>;

  const searchBar = (ph) => (
    <div className="relative flex-1 min-w-48 max-w-md">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={ph}
        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 shadow-sm rounded-2xl text-sm font-medium text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
      />
    </div>
  );

  const renderMembers = () => {
    const list = getSorted(filt(members,['Name','Email','PurposeOfStay']));
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          {searchBar("Search members by name, email...")}
          <AddBtn label="Register Member" onClick={()=>setModal('addMember')} />
        </div>
        <TblWrap empty={list.length===0?'No members found':null}>
          {tblHead(['#', {label:'ID', key:'IdentificationNumber'}, {label:'Profile', key:'Name'}, {label:'Contact', key:'ContactNumber'}, {label:'Purpose', key:'PurposeOfStay'}, 'Status', 'Actions'])}
          <tbody>{list.map((m, i)=>(
            <tr key={m.MemberID} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
              <td className="px-6 py-5 text-slate-400 font-bold text-xs">{i + 1}</td>
              <td className="px-6 py-5 text-slate-600 dark:text-slate-300 font-black text-xs font-mono tracking-wider">{m.IdentificationNumber}</td>
              <td className="px-6 py-5">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-200 dark:from-indigo-800 dark:to-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black shadow-sm border border-blue-50 dark:border-blue-800">{m.Name?.charAt(0)}</div>
                   <div><p className="font-bold text-slate-800 dark:text-white">{m.Name}</p><p className="text-xs font-semibold text-slate-500">{m.Department || 'No Dept'}</p></div>
                 </div>
              </td>
              <td className="px-6 py-5 text-slate-600 dark:text-slate-300"><div><p className="font-semibold">{m.ContactNumber}</p><p className="text-xs">{m.Email}</p></div></td>
              <td className="px-6 py-5 font-medium text-slate-700 dark:text-slate-300">{m.PurposeOfStay}</td>
              <td className="px-6 py-5">{m.IsActive?<Badge color="green">Active</Badge>:<Badge color="red">Inactive</Badge>}</td>
              <td className="px-6 py-5"><button onClick={()=> { setSelected(m); setModal('memberDetails'); }} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 text-xs rounded-xl font-bold transition-all">Details</button></td>
            </tr>
          ))}</tbody>
        </TblWrap>
      </div>
    );
  };

  const renderRooms = () => {
    const list = filt(rooms,['RoomNumber','HostelName','TypeName','RoomStatus']);
    return (
      <div className="space-y-6 fade-in animate-in">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center">{searchBar("Search rooms by number, hostel...")}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {list.map(r=>(
            <div key={r.RoomID} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-black text-slate-800 dark:text-white text-xl">Room {r.RoomNumber}</h4>
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">{r.HostelName}</p>
                </div>
                {r.RoomStatus==='Available'?<Badge color="green">Available</Badge>:r.RoomStatus==='Occupied'?<Badge color="orange">Occupied</Badge>:<Badge color="red">{r.RoomStatus}</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-medium border border-slate-100 dark:border-slate-700 mb-4">
                <div><span className="text-slate-400 block text-xs">Type</span>{r.TypeName}</div>
                <div><span className="text-slate-400 block text-xs">Floor</span>Level {r.Floor}</div>
                <div><span className="text-slate-400 block text-xs">Capacity</span>{r.MaxCapacity} beds</div>
                <div><span className="text-slate-400 block text-xs">Occupied</span>{r.CurrentOccupancy} beds</div>
              </div>
              <div><div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden ring-1 ring-inset ring-slate-200 dark:ring-slate-600"><div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full h-2.5" style={{width:`${r.MaxCapacity>0?(r.CurrentOccupancy/r.MaxCapacity)*100:0}%`}}/></div></div>
            </div>
          ))}
          {list.length===0&&<div className="col-span-1 md:col-span-2 xl:col-span-3 text-center py-20 text-slate-400 font-medium bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">No rooms met your search criteria.</div>}
        </div>
      </div>
    );
  };

  const renderAllocations = () => {
    const list = getSorted(filt(allocations,['MemberName','HostelName','RoomNumber','AllocationStatus']));
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          {searchBar("Search allocations...")}
          <AddBtn label="Allocate Room" onClick={()=>setModal('allocate')} />
        </div>
        <TblWrap empty={list.length===0?'No active allocations':null}>
          {tblHead(['#', {label:'Member', key:'MemberName'}, {label:'Details', key:'RoomNumber'}, {label:'Dates', key:'CheckInDate'}, {label:'Status', key:'AllocationStatus'}, 'Actions'])}
          <tbody>{list.map((a, i)=>(
            <tr key={a.AllocationID} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
              <td className="px-6 py-5 text-slate-400 font-bold text-xs">{i + 1}</td>
              <td className="px-6 py-5 font-bold text-slate-800 dark:text-white">{a.MemberName}</td>
              <td className="px-6 py-5"><div><p className="font-semibold text-indigo-600 dark:text-indigo-400">Room {a.RoomNumber}</p><p className="text-xs text-slate-500">{a.HostelName}</p></div></td>
              <td className="px-6 py-5 text-slate-600 font-medium text-sm">
                <div className="flex items-center gap-2"><Calendar size={14} className="text-slate-400"/>In: {a.CheckInDate?new Date(a.CheckInDate).toLocaleDateString():'—'}</div>
                {a.CheckOutDate && <div className="flex items-center gap-2 mt-1 xl:mt-0"><Calendar size={14} className="text-slate-400"/>Out: {new Date(a.CheckOutDate).toLocaleDateString()}</div>}
              </td>
              <td className="px-6 py-5">{stsBadge(a.AllocationStatus)}</td>
              <td className="px-6 py-5">
                {a.AllocationStatus==='Active' ? <button onClick={()=>handleCheckout(a)} className="text-xs bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 px-4 py-2 rounded-xl font-bold uppercase tracking-wider transition-colors shadow-sm">Checkout</button> : <span className="text-slate-400 text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">Concluded</span>}
              </td>
            </tr>
          ))}</tbody>
        </TblWrap>
      </div>
    );
  };

  const renderComplaints = () => {
    const list = getSorted(filt(complaints,['MemberName','CategoryName','Description','Status']));
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center">{searchBar("Search complaints...")}</div>
        <TblWrap empty={list.length===0?'No complaints log':null}>
          {tblHead(['#', {label:'CID', key:'ComplaintID'}, {label:'Reported By', key:'MemberName'}, {label:'Category', key:'CategoryName'}, 'Description', {label:'Severity', key:'Severity'}, {label:'Status', key:'Status'}, 'Action'])}
          <tbody>{list.map((c, i)=>(
            <tr key={c.ComplaintID} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
              <td className="px-6 py-5 text-slate-400 font-bold text-xs">{i + 1}</td>
              <td className="px-6 py-5 text-slate-400 font-bold text-xs">#{c.ComplaintID}</td>
              <td className="px-6 py-5 font-bold text-slate-800 dark:text-white"><div><p>{c.MemberName}</p><p className="text-xs font-medium text-slate-400 mt-1">{c.RaisedDate?new Date(c.RaisedDate).toLocaleDateString():'—'}</p></div></td>
              <td className="px-6 py-5 font-bold text-indigo-600 dark:text-indigo-400">{c.CategoryName}</td>
              <td className="px-6 py-5 text-slate-600 max-w-xs"><span className="truncate block font-medium bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300" title={c.Description}>{c.Description}</span></td>
              <td className="px-6 py-5">{sevBadge(c.Severity)}</td>
              <td className="px-6 py-5">{stsBadge(c.Status)}</td>
              <td className="px-6 py-5"><button onClick={()=>{setSelected(c);setUpForm({Status:c.Status,AssignedTo:c.AssignedTo||'',ResolutionRemarks:c.ResolutionRemarks||''});setModal('complaint');}} className="text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"><Edit size={14}/> Edit</button></td>
            </tr>
          ))}</tbody>
        </TblWrap>
      </div>
    );
  };

  const renderVisitors = () => {
    const list = getSorted(filt(visitors,['MemberName','VisitorName','Relation','Purpose']));
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center">{searchBar("Search visitors log...")}</div>
        <TblWrap empty={list.length===0?'Empty visitor log':null}>
          {tblHead(['#', {label:'LogID', key:'VisitorID'}, {label:'Resident', key:'MemberName'}, {label:'Visitor', key:'VisitorName'}, {label:'Relation', key:'Relation'}, {label:'Timeline', key:'InDateTime'}, {label:'Status', key:'OutDateTime'}])}
          <tbody>{list.map((v, i)=>(
            <tr key={v.VisitorID} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
              <td className="px-6 py-5 text-slate-400 font-bold text-xs">{i + 1}</td>
              <td className="px-6 py-5 text-slate-400 font-bold text-xs">#{v.VisitorID}</td>
              <td className="px-6 py-5 font-black text-indigo-700 bg-indigo-50/30">{v.MemberName}</td>
              <td className="px-6 py-5 font-bold text-slate-800 dark:text-white">{v.VisitorName}</td>
              <td className="px-6 py-5"><Badge color="gray">{v.Relation}</Badge><p className="text-xs font-medium text-slate-500 mt-2 truncate max-w-[150px]">{v.Purpose}</p></td>
              <td className="px-6 py-5 text-slate-600 font-medium text-sm">
                <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><CheckCircle size={14}/>{v.InDateTime?new Date(v.InDateTime).toLocaleString():'—'}</span>
                {v.OutDateTime && <span className="flex items-center gap-2 text-slate-400 mt-1"><CheckCircle size={14}/>{new Date(v.OutDateTime).toLocaleString()}</span>}
              </td>
              <td className="px-6 py-5">{!v.OutDateTime?<button onClick={()=>handleVisitorCheckout(v)} className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 shadow-sm px-4 py-2 rounded-xl font-bold uppercase tracking-wider transition-colors">Complete Visit</button>:<Badge color="gray">Concluded</Badge>}</td>
            </tr>
          ))}</tbody>
        </TblWrap>
      </div>
    );
  };

  const renderFees = () => {
    const list = getSorted(filt(fees,['MemberName','CategoryName','Status']));
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          {searchBar("Search invoices & receipts...")}
          <AddBtn label="Record Payment" onClick={()=>setModal('addFee')} />
        </div>
        <TblWrap empty={list.length===0?'No payments recorded':null}>
          {tblHead(['#', {label:'Receipt', key:'PaymentID'}, {label:'Payer', key:'MemberName'}, {label:'Category', key:'CategoryName'}, {label:'Amount', key:'AmountPaid'}, {label:'Date', key:'PaymentDate'}, {label:'Status', key:'Status'}])}
          <tbody>{list.map((f, i)=>(
            <tr key={f.PaymentID} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
              <td className="px-6 py-5 text-slate-400 font-bold text-xs">{i + 1}</td>
              <td className="px-6 py-5 text-slate-400 font-bold text-xs uppercase">RCPT-{f.PaymentID}</td>
              <td className="px-6 py-5 font-bold text-slate-800 dark:text-white">{f.MemberName}</td>
              <td className="px-6 py-5 font-bold text-indigo-600 dark:text-indigo-400">{f.CategoryName}</td>
              <td className="px-6 py-5 font-black text-emerald-600 dark:text-emerald-400 text-lg">₹{Number(f.AmountPaid).toLocaleString()}</td>
              <td className="px-6 py-5 text-slate-600 font-medium text-sm">{f.PaymentDate?new Date(f.PaymentDate).toLocaleDateString():'—'}</td>
              <td className="px-6 py-5">{stsBadge(f.Status)}</td>
            </tr>
          ))}</tbody>
        </TblWrap>
      </div>
    );
  };

  const renderMaintenance = () => {
    const list = getSorted(filt(maintenance,['RequestedByName','RoomNumber','Description','Status']));
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center">{searchBar("Search work orders...")}</div>
        <TblWrap empty={list.length===0?'No pending work orders':null}>
          {tblHead(['#', {label:'WO #', key:'RequestID'}, {label:'Target', key:'RoomNumber'}, {label:'Requested By', key:'RequestedByName'}, 'Details', {label:'Status', key:'Status'}, 'Actions'])}
          <tbody>{list.map((mx, i)=>(
            <tr key={mx.RequestID} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
              <td className="px-6 py-5 text-slate-400 font-bold text-xs">{i + 1}</td>
              <td className="px-6 py-5 text-slate-400 font-bold text-xs uppercase">WO-{mx.RequestID}</td>
              <td className="px-6 py-5 font-black text-rose-600">Room {mx.RoomNumber}</td>
              <td className="px-6 py-5 font-bold text-slate-800 dark:text-white"><div><p>{mx.RequestedByName}</p><p className="text-xs font-medium text-slate-400 mt-1">{mx.RequestDate?new Date(mx.RequestDate).toLocaleDateString():'—'}</p></div></td>
              <td className="px-6 py-5 text-slate-600 max-w-xs"><span className="truncate block font-medium bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300" title={mx.Description}>{mx.Description}</span></td>
              <td className="px-6 py-5">{stsBadge(mx.Status)}</td>
              <td className="px-6 py-5"><button onClick={()=>{setSelected(mx);setUpForm({Status:mx.Status,AssignedTo:mx.AssignedTo||'',ResolutionRemarks:''});setModal('maintenance');}} className="text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"><Edit size={14}/> Manage</button></td>
            </tr>
          ))}</tbody>
        </TblWrap>
      </div>
    );
  };

  const renderFurniture = () => {
    const list = getSorted(filt(furniture,['TypeName','RoomNumber','HostelName','SerialNumber','FurnitureCondition']));
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center">{searchBar("Search furniture inventory...")}</div>
        <TblWrap empty={list.length===0?'No furniture items tracked':null}>
          {tblHead(['#', {label:'Asset', key:'FurnitureItemID'}, {label:'Type', key:'TypeName'}, {label:'Location', key:'RoomNumber'}, {label:'Condition', key:'FurnitureCondition'}, 'Remarks'])}
          <tbody>{list.map((f, i)=>(
            <tr key={f.FurnitureItemID} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
              <td className="px-6 py-5 text-slate-400 font-bold text-xs">{i + 1}</td>
              <td className="px-6 py-5 text-slate-400 font-bold text-xs">ASSET-{f.FurnitureItemID}</td>
              <td className="px-6 py-5 font-black text-slate-800 bg-slate-50/30">{f.TypeName}</td>
              <td className="px-6 py-5 font-bold text-indigo-700">Room {f.RoomNumber} <span className="font-medium text-slate-500 block text-xs mt-1">{f.HostelName}</span></td>
              <td className="px-6 py-5"><Badge color="gray">{f.SerialNumber||'N/A'}</Badge></td>
              <td className="px-6 py-5">{f.FurnitureCondition==='New'||f.FurnitureCondition==='Good'?<Badge color="green">{f.FurnitureCondition}</Badge>:<Badge color="red">{f.FurnitureCondition}</Badge>}</td>
              <td className="px-6 py-5 text-xs text-slate-500 font-medium italic max-w-[150px] truncate">{f.Remarks||'—'}</td>
            </tr>
          ))}</tbody>
        </TblWrap>
      </div>
    );
  };

  const renderScans = () => {
    const list = getSorted(filt(scans,['QRCode','ScanType','ScannedBy','Location']));
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center">{searchBar("Search global QR scans...")}</div>
        <TblWrap empty={list.length===0?'No scan history':null}>
          {tblHead(['#', {label:'Scan ID', key:'ScanID'}, {label:'Date', key:'ScanDateTime'}, {label:'Target', key:'ScanType'}, {label:'Scanned By', key:'ScannedBy'}, {label:'Security Point', key:'Location'}, {label:'Payload', key:'QRCode'}])}
          <tbody>{list.map((s, i)=>(
            <tr key={s.ScanID} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
              <td className="px-6 py-5 text-slate-400 font-bold text-xs">{i + 1}</td>
              <td className="px-6 py-5 text-slate-400 font-bold text-xs">LOG-{s.ScanID}</td>
              <td className="px-6 py-5 text-slate-600 dark:text-slate-300 font-medium text-sm flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500"/>{new Date(s.ScanDateTime).toLocaleString()}</td>
              <td className="px-6 py-5">{s.ScanType==='Room'?<Badge color="purple">Room</Badge>:<Badge color="blue">Member</Badge>}</td>
              <td className="px-6 py-5 font-bold text-slate-800 dark:text-white">{s.ScannedBy}</td>
              <td className="px-6 py-5 text-sm font-semibold text-slate-600 dark:text-slate-300">{s.Location||'Unknown Location'}</td>
              <td className="px-6 py-5"><code className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-1 rounded text-xs font-mono">{s.QRCode}</code></td>
            </tr>
          ))}</tbody>
        </TblWrap>
      </div>
    );
  };

  const renderGateScanner = () => (
    <div className="max-w-xl mx-auto mt-12 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 flex flex-col items-center">
      <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-indigo-50 dark:ring-indigo-900/50"><ShieldCheck size={40}/></div>
      <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Gate Security Scanner</h2>
      <p className="text-slate-500 dark:text-slate-400 font-medium text-center mb-8">Scan a Resident's Digital Pass to log gate entry/exit and verify their identity instantly.</p>
      
      {!gateCam ? (
        <div className="w-full space-y-4 mb-8">
          <div className="w-full flex gap-3">
            <input 
              autoFocus
              className="flex-1 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white font-bold px-5 py-4 rounded-xl outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-center text-lg tracking-widest placeholder-slate-400 dark:placeholder-slate-500"
              placeholder="Paste QR code payload..."
              value={gateScan.qrCode}
              onChange={e => setGateScan(p=>({...p, qrCode: e.target.value}))}
              onKeyDown={e => e.key === 'Enter' && handleGateScan()}
            />
            <button onClick={handleGateScan} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 rounded-xl transition-all shadow-md shadow-indigo-500/20">Verify</button>
          </div>
          <button
            onClick={() => { setGateScan(p=>({...p,result:null})); setGateCam(true); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
          >
            <Camera size={18}/> Use Camera to Scan
          </button>
        </div>
      ) : (
        <div className="w-full mb-8">
          <QRCameraScanner
            active={gateCam}
            onScan={(text) => {
              setGateScan(p => ({ ...p, qrCode: text }));
              setGateCam(false);
              // Auto-trigger verify after camera reads
              setTimeout(() => handleGateScan(text), 100);
            }}
            onStop={() => setGateCam(false)}
          />
        </div>
      )}

      {gateScan.result && (
        <div className={`w-full p-6 rounded-2xl border-2 flex items-start gap-4 ${gateScan.result.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
           {gateScan.result.type === 'success' ? <CheckCircle size={32} className="text-emerald-500 flex-shrink-0"/> : <XCircle size={32} className="text-red-500 flex-shrink-0"/>}
           <div>
             <h3 className="font-black text-xl mb-1">{gateScan.result.type === 'success' ? 'Access Granted' : 'Access Denied'}</h3>
             {gateScan.result.type === 'success' ? (
               <div className="text-sm font-bold flex flex-col gap-1 mt-3">
                 <p className="text-emerald-900 text-lg">{gateScan.result.data.Name}</p>
                 <p className="opacity-80 border-t border-emerald-200 pt-2 mt-1">{gateScan.result.data.Hostel} — Room {gateScan.result.data.Room}</p>
                 <p className="opacity-80">{gateScan.result.data.Department}</p>
               </div>
             ) : (
               <p className="text-sm font-bold opacity-80 mt-1">{gateScan.result.error}</p>
             )}
           </div>
        </div>
      )}
    </div>
  );

  const renderMaintScanner = () => (
    <div className="max-w-xl mx-auto mt-12 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 flex flex-col items-center">
      <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-rose-50 dark:ring-rose-900/50"><Wrench size={40}/></div>
      <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Maintenance Verification Scanner</h2>
      <p className="text-slate-500 dark:text-slate-400 font-medium text-center mb-8">Scan a Resident's QR (for occupied rooms) or a Room QR (for vacant ones) to automatically verify and close active work orders.</p>
      
      {!maintCam ? (
        <div className="w-full space-y-4 mb-8">
          <div className="w-full flex gap-3">
            <input 
              autoFocus
              className="flex-1 bg-slate-50 border-2 border-slate-200 text-slate-800 font-bold px-5 py-4 rounded-xl outline-none focus:border-rose-500 focus:bg-white transition-all text-center text-lg tracking-widest placeholder-slate-400"
              placeholder="Paste QR code payload..."
              value={maintScan.qrCode}
              onChange={e => setMaintScan(p=>({...p, qrCode: e.target.value}))}
              onKeyDown={e => e.key === 'Enter' && handleMaintScan()}
            />
            <button onClick={handleMaintScan} className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 rounded-xl transition-all shadow-md shadow-rose-500/20">Verify</button>
          </div>
          <button
            onClick={() => { setMaintScan(p=>({...p,result:null})); setMaintCam(true); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 font-bold text-sm hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all"
          >
            <Camera size={18}/> Use Camera to Scan
          </button>
        </div>
      ) : (
        <div className="w-full mb-8">
          <QRCameraScanner
            active={maintCam}
            onScan={(text) => {
              setMaintScan(p => ({ ...p, qrCode: text }));
              setMaintCam(false);
              setTimeout(() => handleMaintScan(text), 100);
            }}
            onStop={() => setMaintCam(false)}
          />
        </div>
      )}

      {maintScan.result && (
        <div className={`w-full p-6 rounded-2xl border-2 flex items-start gap-4 ${maintScan.result.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
           {maintScan.result.type === 'success' ? <CheckCircle size={32} className="text-emerald-500 flex-shrink-0"/> : <XCircle size={32} className="text-rose-500 flex-shrink-0"/>}
           <div>
             <h3 className="font-black text-xl mb-1">{maintScan.result.type === 'success' ? 'Maintenance Verified' : 'Verification Failed'}</h3>
             <p className="text-sm font-bold opacity-80 mt-1">{maintScan.result.type === 'success' ? maintScan.result.message : maintScan.result.error}</p>
           </div>
        </div>
      )}
    </div>
  );

  const sections = { overview:renderOverview, members:renderMembers, rooms:renderRooms, allocations:renderAllocations, complaints:renderComplaints, visitors:renderVisitors, fees:renderFees, maintenance:renderMaintenance, furniture:renderFurniture, gatescanner:renderGateScanner, maintscanner:renderMaintScanner, scans:renderScans };
  const curNav = navItems.find(n=>n.id===section);

  return (
    <div className="flex h-screen bg-[#f3f4f6] dark:bg-[#0d1117] font-sans">
      <aside className="w-72 bg-[#0b0f19] flex flex-col flex-shrink-0 relative overflow-hidden text-slate-300">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 opacity-10 rounded-full mix-blend-screen filter blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        <div className="px-6 py-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-3 shadow-lg shadow-blue-500/30 text-white"><Building2 size={24}/></div>
            <div><h1 className="text-white font-black text-2xl tracking-tight">HostelMS</h1><p className="text-blue-400 text-xs font-bold tracking-widest uppercase mt-0.5">Admin Office</p></div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto relative z-10">
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>{setSection(item.id);setSearch('');}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${section===item.id?'bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-x-1':'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon size={20} className={section===item.id?'text-white drop-shadow-sm':'text-slate-500'}/>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 relative z-10 bg-slate-800/50 backdrop-blur-md m-4 rounded-2xl border border-slate-700/50 flex flex-col gap-2">
          <button onClick={()=>setModal('password')} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
            <Lock size={18}/> Change Password
          </button>
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-rose-400 hover:text-white hover:bg-rose-500 transition-colors">
            <LogOut size={18}/> Secure Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700/60 px-8 py-5 flex items-center justify-between z-20 sticky top-0 shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
          <div><h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">{curNav?.label}</h2><p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Live Management Dashboard</p></div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right mr-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logged in as:</p>
              <p className="font-bold text-slate-800 dark:text-white leading-tight">Administrator</p>
            </div>
            <button
              onClick={toggleTheme}
              title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-slate-400 dark:text-slate-500 p-3 rounded-2xl transition-all shadow-sm border border-slate-200 dark:border-slate-700"
            >
              {dark ? <Sun size={20}/> : <Moon size={20}/>}
            </button>
            <button onClick={fetchAll} title="Sync Server" className="bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-slate-400 dark:text-slate-500 p-3 rounded-2xl transition-all shadow-sm border border-slate-200 dark:border-slate-700"><RefreshCw size={20}/></button>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white font-bold shadow-lg border-2 border-white ring-2 ring-slate-100 uppercase">ADM</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 pb-32 bg-[#f3f4f6] dark:bg-[#0d1117]">
          <div className="max-w-[1400px] mx-auto">
             {loading?(<div className="flex items-center justify-center h-[60vh]"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>) : sections[section]?.()}
          </div>
        </main>
      </div>

      {toast&&(
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md text-white font-bold z-[9999] flex items-center gap-3 animate-in slide-in-from-bottom border ${toast.type==='error'?'bg-rose-500/90 border-rose-400':'bg-emerald-500/90 border-emerald-400'}`}>
          {toast.type==='error'?<XCircle size={22}/>:<CheckCircle size={22}/>}{toast.msg}
        </div>
      )}

      {/* Add Member Modal */}
      <Modal show={modal==='addMember'} onClose={closeModal} title="Register New Resident">
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-4">
            <Inp label="Full Name *" value={memberForm.Name} onChange={e=>setMemberForm(p=>({...p,Name:e.target.value}))}/>
            <Inp label="Age *" type="number" value={memberForm.Age} onChange={e=>setMemberForm(p=>({...p,Age:e.target.value}))}/>
          </div>
          <Inp label="Email Address *" type="email" value={memberForm.Email} onChange={e=>setMemberForm(p=>({...p,Email:e.target.value}))}/>
          <div className="grid grid-cols-2 gap-4">
            <Inp label="Contact Number *" value={memberForm.ContactNumber} onChange={e=>setMemberForm(p=>({...p,ContactNumber:e.target.value}))}/>
            <Inp label="Govt. / College ID *" value={memberForm.IdentificationNumber} onChange={e=>setMemberForm(p=>({...p,IdentificationNumber:e.target.value}))}/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Inp label="Date of Birth *" type="date" value={memberForm.DateOfBirth} onChange={e=>setMemberForm(p=>({...p,DateOfBirth:e.target.value}))}/>
            <Inp label="Enrollment Date *" type="date" value={memberForm.AllocatedDate} onChange={e=>setMemberForm(p=>({...p,AllocatedDate:e.target.value}))}/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Sel label="Gender *" value={memberForm.Gender} onChange={e=>setMemberForm(p=>({...p,Gender:e.target.value}))}>{['Male','Female','Other'].map(g=><option key={g}>{g}</option>)}</Sel>
            <Sel label="Type/Purpose *" value={memberForm.PurposeOfStay} onChange={e=>setMemberForm(p=>({...p,PurposeOfStay:e.target.value}))}>{['Resident Student','Staff','Guest','Exchange Student'].map(p=><option key={p}>{p}</option>)}</Sel>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Inp label="Department" value={memberForm.Department} onChange={e=>setMemberForm(p=>({...p,Department:e.target.value}))} placeholder="e.g. CS"/>
            <Inp label="Year (1-10)" type="number" min="1" max="10" value={memberForm.YearOfStudy} onChange={e=>setMemberForm(p=>({...p,YearOfStudy:e.target.value}))}/>
          </div>
          <div className="border border-indigo-100 bg-indigo-50 p-4 rounded-2xl mt-4">
            <label className="flex items-center gap-3 text-sm font-bold text-indigo-900 cursor-pointer">
              <input type="checkbox" checked={memberForm.createLogin} onChange={e=>setMemberForm(p=>({...p,createLogin:e.target.checked}))} className="w-5 h-5 rounded border-indigo-300 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500"/>
              Generate Digital Login Credentials
            </label>
          </div>
          {memberForm.createLogin&&(
            <div className="grid grid-cols-2 gap-4 bg-white border border-indigo-100 p-4 rounded-2xl mt-4">
              <Inp label="Portal Username" value={memberForm.Username} onChange={e=>setMemberForm(p=>({...p,Username:e.target.value}))}/>
              <Inp label="Portal Password" type="password" value={memberForm.Password} onChange={e=>setMemberForm(p=>({...p,Password:e.target.value}))}/>
            </div>
          )}
          <div className="flex gap-4 pt-6">
            <button onClick={closeModal} className="flex-1 border border-slate-200 bg-slate-50 text-slate-700 py-3 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-colors">Cancel</button>
            <button onClick={handleAddMember} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 py-3 rounded-2xl text-sm font-bold transition-all">Submit Registration</button>
          </div>
        </div>
      </Modal>

      {/* Allocate Room Modal */}
      <Modal show={modal==='allocate'} onClose={closeModal} title="Process Space Allocation">
        <div className="space-y-1">
          <Sel label="Select Resident *" value={allocForm.MemberID} onChange={e=>setAllocForm(p=>({...p,MemberID:e.target.value}))}>
            <option value="">Choose resident...</option>
            {members.filter(m=>m.IsActive).map(m=><option key={m.MemberID} value={m.MemberID}>{m.Name}</option>)}
          </Sel>
          <Sel label="Select Available Room *" value={allocForm.RoomID} onChange={e=>setAllocForm(p=>({...p,RoomID:e.target.value}))}>
            <option value="">Choose vacant room...</option>
            {rooms.filter(r=>r.RoomStatus==='Available').map(r=><option key={r.RoomID} value={r.RoomID}>{r.HostelName} — Room {r.RoomNumber} ({r.TypeName})</option>)}
          </Sel>
          <div className="grid grid-cols-2 gap-4">
            <Inp label="Expected Check-In *" type="date" value={allocForm.CheckInDate} onChange={e=>setAllocForm(p=>({...p,CheckInDate:e.target.value}))}/>
            <Inp label="Authorized By" value={allocForm.AllocatedBy} onChange={e=>setAllocForm(p=>({...p,AllocatedBy:e.target.value}))} placeholder="Warden Initials"/>
          </div>
          <div className="flex gap-4 pt-6">
            <button onClick={closeModal} className="flex-1 border border-slate-200 bg-slate-50 text-slate-700 py-3 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-colors">Abort</button>
            <button onClick={handleAllocate} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 py-3 rounded-2xl text-sm font-bold transition-all">Confirm Allocation</button>
          </div>
        </div>
      </Modal>

      {/* Update Complaint Modal */}
      <Modal show={modal==='complaint'} onClose={closeModal} title="Resolve Ticket">
        {selected&&(
          <div className="space-y-1">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl p-5 text-sm mb-6 border border-slate-700 shadow-inner">
              <p className="font-bold text-lg mb-1">{selected.MemberName} <span className="text-blue-400 font-medium">— {selected.CategoryName}</span></p>
              <p className="text-slate-300 italic">"{selected.Description}"</p>
            </div>
            <Sel label="Update Lifecycle Status" value={upForm.Status} onChange={e=>setUpForm(p=>({...p,Status:e.target.value}))}>{['Open','In Progress','Resolved','Rejected','Closed'].map(s=><option key={s}>{s}</option>)}</Sel>
            <Inp label="Assign Technician/Staff" value={upForm.AssignedTo} onChange={e=>setUpForm(p=>({...p,AssignedTo:e.target.value}))} placeholder="e.g. John (Electrician)"/>
            <Txa label="Engineer's Resolution Remarks" value={upForm.ResolutionRemarks} onChange={e=>setUpForm(p=>({...p,ResolutionRemarks:e.target.value}))} placeholder="Describe the fix applied..."/>
            <div className="flex gap-4 pt-6">
              <button onClick={closeModal} className="flex-1 border border-slate-200 bg-slate-50 text-slate-700 py-3 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-colors">Discard</button>
              <button onClick={handleUpdateComplaint} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 py-3 rounded-2xl text-sm font-bold transition-all">Save Changes</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Update Maintenance Modal */}
      <Modal show={modal==='maintenance'} onClose={closeModal} title="Manage Work Order">
        {selected&&(
          <div className="space-y-1">
            <div className="bg-gradient-to-r from-rose-700 to-red-800 text-white rounded-2xl p-5 text-sm mb-6 border border-rose-600 shadow-inner">
              <p className="font-bold text-lg mb-1">Room {selected.RoomNumber} <span className="text-rose-200 font-medium">— {selected.RequestedByName}</span></p>
              <p className="text-white drop-shadow-sm">"{selected.Description}"</p>
            </div>
            <Sel label="Work Status" value={upForm.Status} onChange={e=>setUpForm(p=>({...p,Status:e.target.value}))}>{['Pending','In Progress','Rejected'].map(s=><option key={s}>{s}</option>)}</Sel>
            
            <Inp label="Delegated Contractor/Staff" value={upForm.AssignedTo} onChange={e=>setUpForm(p=>({...p,AssignedTo:e.target.value}))} placeholder="Maintenance team name"/>
            <Txa label="Resolution Remarks" value={upForm.ResolutionRemarks} onChange={e=>setUpForm(p=>({...p,ResolutionRemarks:e.target.value}))}/>

            <div className="flex gap-4 pt-6">
              <button onClick={closeModal} className="flex-1 border border-slate-200 bg-slate-50 text-slate-700 py-3 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-colors">Discard</button>
              <button onClick={handleUpdateMaint} className="flex-1 text-white shadow-lg py-3 rounded-2xl text-sm font-bold transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30">
                Apply Updates
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Fee Modal */}
      <Modal show={modal==='addFee'} onClose={closeModal} title="Issue Invoice / Record Receipt">
        <div className="space-y-1">
          <Sel label="Select Payer/Resident *" value={feeForm.MemberID} onChange={e=>setFeeForm(p=>({...p,MemberID:e.target.value}))}>
            <option value="">Search resident database...</option>
            {members.map(m=><option key={m.MemberID} value={m.MemberID}>{m.Name}</option>)}
          </Sel>
          <Sel label="Billing Category *" value={feeForm.FeeCategoryID} onChange={e=>setFeeForm(p=>({...p,FeeCategoryID:e.target.value}))}>
            <option value="">Select accounting ledger...</option>
            {feeCats.map(fc=><option key={fc.FeeCategoryID} value={fc.FeeCategoryID}>{fc.CategoryName} [Standard: ₹{fc.DefaultAmount}]</option>)}
          </Sel>
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl mb-4 text-emerald-900 font-bold flex items-center gap-4">
             <div className="text-3xl">₹</div>
             <input type="number" placeholder="Amount..." className="w-full bg-transparent text-3xl placeholder-emerald-300 outline-none" value={feeForm.AmountPaid} onChange={e=>setFeeForm(p=>({...p,AmountPaid:e.target.value}))}/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Sel label="Payment Resolution" value={feeForm.Status} onChange={e=>setFeeForm(p=>({...p,Status:e.target.value}))}>{['Paid','Pending','Overdue'].map(s=><option key={s}>{s}</option>)}</Sel>
            <Inp label="Ledger Date" type="date" value={feeForm.PaymentDate} onChange={e=>setFeeForm(p=>({...p,PaymentDate:e.target.value}))}/>
          </div>
          <div className="flex gap-4 pt-6">
            <button onClick={closeModal} className="flex-1 border border-slate-200 bg-slate-50 text-slate-700 py-3 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-colors">Discard Draft</button>
            <button onClick={handleAddFee} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 py-3 rounded-2xl text-sm font-bold transition-all">Submit & Finalize Ledger</button>
          </div>
        </div>
      </Modal>

      {/* Member Details Modal */}
      <Modal show={modal==='memberDetails'} onClose={closeModal} title="Resident Profile Overview">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-6 bg-slate-50 border border-slate-100 dark:border-slate-700p-6 rounded-3xl shadow-inner mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-200 text-blue-700 flex items-center justify-center font-black text-3xl shadow-sm border border-blue-50">
                {selected.Name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800">{selected.Name}</h3>
                <p className="text-sm font-bold text-slate-500 mb-2">{selected.PurposeOfStay} — {selected.Department || 'N/A'}</p>
                {selected.IsActive ? <Badge color="green">Active Record</Badge> : <Badge color="red">Inactive</Badge>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p><p className="font-semibold text-slate-700">{selected.Email}</p></div>
              <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</p><p className="font-semibold text-slate-700">{selected.ContactNumber}</p></div>
              <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Govt. / College ID</p><p className="font-semibold text-slate-700">{selected.IdentificationNumber} <span className="text-slate-400">({selected.IdentificationType || 'N/A'})</span></p></div>
              <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">QR Digital Pass</p><code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-600">{selected.QRCode || selected.IdentificationNumber}</code></div>
              <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Age / DOB</p><p className="font-semibold text-slate-700">{selected.Age} years <span className="text-slate-400">({new Date(selected.DateOfBirth).toLocaleDateString()})</span></p></div>
              <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Enrollment Date</p><p className="font-semibold text-slate-700">{new Date(selected.AllocatedDate).toLocaleDateString()}</p></div>
              <div className="col-span-2"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Permanent Address</p><p className="font-semibold text-slate-700 text-sm bg-slate-50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-300 dark:bg-slate-800">{selected.Address || 'No address provided on file.'}</p></div>
            </div>

            <div className="flex gap-4 pt-6">
              <button onClick={() => handleDeleteMember(selected.MemberID)} className="flex-1 bg-rose-50 text-rose-600 border border-rose-200 py-3 rounded-2xl text-sm font-bold hover:bg-rose-100 transition-colors shadow-sm">Delete Profile Data</button>
              <button onClick={closeModal} className="flex-1 border border-slate-200 bg-white text-slate-800 py-3 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm shadow-slate-200/50">Close Profile View</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal show={modal==='password'} onClose={closeModal} title="Change Admin Password">
        <div className="space-y-1">
          <Inp label="Current Password" type="password" value={cpForm.oldPassword} onChange={e=>setCpForm(p=>({...p,oldPassword:e.target.value}))}/>
          <Inp label="New Password" type="password" value={cpForm.newPassword} onChange={e=>setCpForm(p=>({...p,newPassword:e.target.value}))}/>
          <Inp label="Confirm New Password" type="password" value={cpForm.confirmPassword} onChange={e=>setCpForm(p=>({...p,confirmPassword:e.target.value}))}/>
          <div className="flex gap-4 pt-6">
            <button onClick={closeModal} className="flex-1 border border-slate-200 bg-slate-50 text-slate-700 py-3 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-colors">Discard</button>
            <button onClick={handleChangePassword} disabled={!cpForm.oldPassword||!cpForm.newPassword||!cpForm.confirmPassword} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50">Update Password</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
