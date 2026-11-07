import { useState, useEffect, useRef } from 'react';
import { 
  Plus, ArrowRight, Star, Calendar, Image as ImageIcon, 
  Trash2, Edit2, Network, Check, X, Share2, Link2, 
  Download, Move, Eye, LogOut, Lock, Mail, Key
} from 'lucide-react';

import { supabase } from './supabase';

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // استیت‌های خالی (دیتا از سرور پر می‌شود)
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [news, setNews] = useState([]);

  const [activeNodeId, setActiveNodeId] = useState(null);
  const [newNodeName, setNewNodeName] = useState('');
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [connectMode, setConnectMode] = useState(false);
  const [connectSourceId, setConnectSourceId] = useState(null);
  const canvasRef = useRef(null);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [editNodeName, setEditNodeName] = useState('');
  const [shareModalData, setShareModalData] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importTokenInput, setImportTokenInput] = useState('');
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [newsForm, setNewsForm] = useState({ title: '', text: '', image: '', importance: '1', date: new Date().toISOString().split('T')[0] });
  const [editingNewsId, setEditingNewsId] = useState(null);
  const [editNewsForm, setEditNewsForm] = useState(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser) return;

    // تابع دریافت تمام اطلاعات
    const fetchGraphData = async () => {
      const [{ data: nodesData }, { data: edgesData }, { data: newsData }] = await Promise.all([
        supabase.from('nodes').select('*'),
        supabase.from('edges').select('*'),
        supabase.from('news').select('*')
      ]);
      if (nodesData) setNodes(nodesData);
      if (edgesData) setEdges(edgesData);
      if (newsData) setNews(newsData);
    };

    // اجرای اولیه
    fetchGraphData();

    // گوش دادن به تغییرات زنده (Real-time) دیتابیس
    const channel = supabase.channel('graph_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nodes' }, fetchGraphData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'edges' }, fetchGraphData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, fetchGraphData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUser]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (isLoginMode) {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if (error) throw error;
      }
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleResetPassword = async () => {
    if (!authEmail) {
      setAuthError('برای بازیابی رمز، ابتدا ایمیل خود را در کادر بالا وارد کنید.');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail);
      if (error) throw error;
      setAuthError('لینک تغییر رمز به ایمیل شما ارسال شد.');
    } catch (error) {
      setAuthError(error.message);
    }
  };

  if (isAuthLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-400">در حال اتصال...</div>;
  if (!authUser) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans selection:bg-indigo-500/30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-600/30"><Lock size={32} className="text-white" /></div>
            <h1 className="text-2xl font-black text-white">ورود به شبکه گراف</h1>
          </div>
          {authError && <div className="bg-red-950/50 border border-red-900 text-red-400 p-3 rounded-xl text-sm mb-6 text-center">{authError}</div>}
          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <Mail className="absolute right-4 top-3.5 text-slate-500" size={20} />
              <input required type="email" placeholder="ایمیل شما" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white pr-12 pl-4 py-3 rounded-xl outline-none dir-ltr text-left focus:border-indigo-500" />
            </div>
            <div className="relative">
              <Key className="absolute right-4 top-3.5 text-slate-500" size={20} />
              <input required type="password" placeholder="رمز عبور" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white pr-12 pl-4 py-3 rounded-xl outline-none dir-ltr text-left focus:border-indigo-500" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg mt-2">{isLoginMode ? 'ورود' : 'ثبت‌نام'}</button>
            
            {isLoginMode && (
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-slate-400 hover:text-indigo-400 text-xs text-right mt-2 transition-colors w-full"
              >
                رمز عبور را فراموش کرده‌اید؟
              </button>
            )}
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-slate-400 hover:text-indigo-400 text-sm">{isLoginMode ? 'حساب ندارید؟ ثبت‌نام کنید' : 'وارد شوید'}</button>
          </div>
        </div>
      </div>
    );
  }

  const currentUserId = authUser.id;
  const currentUserName = authUser.email.split('@')[0];

  const visibleNodes = nodes.filter(n => n.ownerId === currentUserId || n.subscribers?.includes(currentUserId));
  const visibleNodeIds = visibleNodes.map(n => n.id);
  const visibleEdges = edges.filter(e => visibleNodeIds.includes(e.source) && visibleNodeIds.includes(e.target));

  const handleMouseDownOnNode = (e, node) => {
    if (editingNodeId === node.id || connectMode) return;
    e.stopPropagation();
    setDraggingNodeId(node.id);
    setHasDragged(false);
    setDragOffset({ x: e.clientX - node.x, y: e.clientY - node.y });
  };

  const handleCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current || e.target.closest('svg') === e.target) {
      setIsPanning(true);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (draggingNodeId) {
      setHasDragged(true);
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      setNodes(nodes.map(n => n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n));
    } else if (isPanning) {
      setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
    }
  };

  const handleCanvasMouseUp = async () => {
    if (draggingNodeId && hasDragged) {
      const nodeToUpdate = nodes.find(n => n.id === draggingNodeId);
      if (nodeToUpdate) {
        await supabase.from('nodes').update({ x: nodeToUpdate.x, y: nodeToUpdate.y }).eq('id', draggingNodeId);
      }
    }
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  const handleNodeClick = async (node) => {
    if (hasDragged) return;
    if (connectMode) {
      if (!connectSourceId) setConnectSourceId(node.id);
      else if (connectSourceId !== node.id) {
        const exists = edges.some(e => (e.source === connectSourceId && e.target === node.id) || (e.source === node.id && e.target === connectSourceId));
        if (!exists) {
          const newEdge = { id: 'e_' + Date.now(), source: connectSourceId, target: node.id, ownerId: currentUserId };
          // آپدیت آنی (خوش‌بینانه)
          setEdges(prev => [...prev, newEdge]);
          const { error } = await supabase.from('edges').insert([newEdge]); // <--- تغییر سوپابیس
          if (error) {
             setEdges(prev => prev.filter(e => e.id !== newEdge.id));
             console.error(error);
          }
        }
        setConnectSourceId(null);
        setConnectMode(false);
      } else setConnectSourceId(null);
      return;
    }
    if (editingNodeId !== node.id) setActiveNodeId(node.id);
  };

  const handleAddNode = async (e) => {
    e.preventDefault();
    if (!newNodeName.trim()) return;
    const randomX = Math.floor(Math.random() * 400) + 250 - pan.x;
    const randomY = Math.floor(Math.random() * 250) + 150 - pan.y;
    const newNode = { 
      id: 'n_' + Date.now(), name: newNodeName.trim(), 
      x: randomX, y: randomY, 
      ownerId: currentUserId, ownerName: currentUserName, 
      shareToken: 'SHARE-' + Math.random().toString(36).substring(2, 7).toUpperCase(), 
      subscribers: [] 
    };
    
    // آپدیت آنی در استیت (Optimistic UI Update)
    setNodes(prevNodes => [...prevNodes, newNode]);
    setNewNodeName('');
    
    const { error } = await supabase.from('nodes').insert([newNode]); // <--- تغییر سوپابیس
    
    // اگر در ذخیره در سرور خطایی رخ داد، نود را از صفحه حذف کن
    if (error) {
      console.error(error);
      alert('خطا در ذخیره نود');
      setNodes(prevNodes => prevNodes.filter(n => n.id !== newNode.id));
    }
  };

  const handleAddNews = async (e) => {
    e.preventDefault();
    const newItem = { ...newsForm, id: Date.now().toString(), nodeId: activeNodeId, authorName: currentUserName };
    
    // آپدیت آنی
    setNews(prev => [...prev, newItem]);
    setShowNewsForm(false);
    setNewsForm({ title: '', text: '', image: '', importance: '1', date: new Date().toISOString().split('T')[0] });
    
    const { error } = await supabase.from('news').insert([newItem]); // <--- تغییر سوپابیس
    if(error) {
       setNews(prev => prev.filter(n => n.id !== newItem.id));
       console.error(error);
    }
  };

  const handleDeleteNode = async (node, e) => {
    e.stopPropagation();
    if (node.ownerId !== currentUserId) {
      if (window.confirm(`آیا می‌خواهید این نود را از بوم خود حذف کنید؟`)) {
        const newSubscribers = node.subscribers.filter(id => id !== currentUserId);
        setNodes(prev => prev.map(n => n.id === node.id ? {...n, subscribers: newSubscribers} : n));
        await supabase.from('nodes').update({ subscribers: newSubscribers }).eq('id', node.id); // <--- تغییر سوپابیس
      }
      return;
    }
    if (window.confirm(`آیا از حذف کامل نود مطمئن هستید؟`)) {
      setNodes(prev => prev.filter(n => n.id !== node.id));
      await supabase.from('nodes').delete().eq('id', node.id); // <--- تغییر سوپابیس
      
      // پاکسازی یال‌ها و اخبار متصل
      const edgesToDelete = edges.filter(edge => edge.source === node.id || edge.target === node.id);
      if (edgesToDelete.length > 0) {
         setEdges(prev => prev.filter(edge => edge.source !== node.id && edge.target !== node.id));
         for (const edge of edgesToDelete) {
           await supabase.from('edges').delete().eq('id', edge.id);
         }
      }
      
      const newsToDelete = news.filter(item => item.nodeId === node.id);
      if(newsToDelete.length > 0) {
         setNews(prev => prev.filter(item => item.nodeId !== node.id));
         for (const item of newsToDelete) {
           await supabase.from('news').delete().eq('id', item.id.toString());
         }
      }
    }
  };

  const handleDeleteEdge = async (edgeId) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId));
    await supabase.from('edges').delete().eq('id', edgeId); // <--- تغییر سوپابیس
  };

  const handleDeleteNews = async (id) => {
    setNews(prev => prev.filter(n => n.id !== id.toString()));
    await supabase.from('news').delete().eq('id', id.toString()); // <--- تغییر سوپابیس
  };

  const handleStartEditNews = (item) => {
    setEditingNewsId(item.id);
    setEditNewsForm({ ...item });
  };

  const handleSaveEditNews = async (e) => {
    e.preventDefault();
    setNews(prev => prev.map(n => n.id === editingNewsId ? editNewsForm : n));
    setEditingNewsId(null);
    const { error } = await supabase.from('news').update({
      title: editNewsForm.title,
      text: editNewsForm.text,
      importance: editNewsForm.importance,
      date: editNewsForm.date
    }).eq('id', editNewsForm.id);
    
    if (error) {
      console.error(error);
      alert('خطا در ویرایش خبر');
    }
  };

  const handleSaveEditNode = async (id, e) => {
    e.stopPropagation();
    const newName = editNodeName.trim();
    if (newName) {
      setNodes(prev => prev.map(n => n.id === id ? {...n, name: newName} : n));
      await supabase.from('nodes').update({ name: newName }).eq('id', id);
    }
    setEditingNodeId(null);
  };

  const handleShareSingleNode = (node, e) => {
    e.stopPropagation();
    setShareModalData({ title: `اشتراک‌گذاری نود «${node.name}»`, desc: 'کد زیر را به دوستان خود بدهید.', token: node.shareToken });
  };

  const handleImportShared = async (e) => {
    e.preventDefault();
    const code = importTokenInput.trim();
    if (!code) return;
    const targetNode = nodes.find(n => n.shareToken === code);
    if (!targetNode) return alert('کد اشتراک در دیتابیس یافت نشد!');
    if (targetNode.ownerId === currentUserId) return alert('این نود متعلق به خودتان است!');
    if (!targetNode.subscribers.includes(currentUserId)) {
      const newSubscribers = [...targetNode.subscribers, currentUserId];
      setNodes(prev => prev.map(n => n.id === targetNode.id ? {...n, subscribers: newSubscribers} : n));
      await supabase.from('nodes').update({ subscribers: newSubscribers }).eq('id', targetNode.id);
    }
    setImportModalOpen(false);
    setImportTokenInput('');
  };

  const activeNode = nodes.find(n => n.id === activeNodeId);
  const canEditActiveNode = activeNode && activeNode.ownerId === currentUserId;

  const currentCategoryNews = news.filter(item => item.nodeId === activeNodeId).sort((a, b) => {
    if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
    return parseInt(b.importance) - parseInt(a.importance);
  });

  const getPathToRoot = (nodeId, currentPath = []) => {
    if (currentPath.length > 10) return currentPath;
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return currentPath;
    const newPath = [node, ...currentPath];
    const parentEdge = edges.find(e => e.target === nodeId);
    if (!parentEdge) return newPath;
    if (currentPath.some(n => n.id === parentEdge.source)) return newPath;
    return getPathToRoot(parentEdge.source, newPath);
  };

  const hierarchyPath = activeNodeId ? getPathToRoot(activeNodeId) : [];
  const childEdges = activeNodeId ? edges.filter(e => e.source === activeNodeId) : [];
  const childNodes = childEdges.map(e => nodes.find(n => n.id === e.target)).filter(Boolean);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-indigo-500/30 flex flex-col">
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg"><Network size={20} className="text-white" /></div>
              گراف اخبار
            </h1>
            <div className="hidden sm:flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-indigo-300">خوش آمدید، {currentUserName}</div>
          </div>
          <div className="flex items-center gap-2.5">
            {!activeNodeId ? (
              <>
                <button onClick={() => setImportModalOpen(true)} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-medium"><Download size={15} className="text-emerald-400" /> افزودن کد اشتراکی</button>
                <button onClick={handleLogout} className="flex items-center gap-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/30 px-3.5 py-2 rounded-xl text-xs font-medium"><LogOut size={15} /> خروج</button>
              </>
            ) : (
              <button onClick={() => setActiveNodeId(null)} className="flex items-center gap-2 text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm"><ArrowRight size={18} /> بازگشت</button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col">
        {!activeNodeId ? (
          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <form onSubmit={handleAddNode} className="flex gap-2 flex-1 max-w-md">
                <input type="text" placeholder="نام نود جدید..." value={newNodeName} onChange={(e) => setNewNodeName(e.target.value)} className="flex-1 px-4 py-2 bg-slate-950 text-white border border-slate-800 focus:border-indigo-500 rounded-xl outline-none text-sm" />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5"><Plus size={18} /> ساخت نود</button>
              </form>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 hidden md:inline-flex items-center gap-1"><Move size={14} /> جابجایی با ماوس</span>
                <button onClick={() => { setConnectMode(!connectMode); setConnectSourceId(null); }} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border ${connectMode ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse' : 'bg-slate-800 text-slate-300'}`}><Link2 size={16} /> {connectMode ? 'کلیک روی نود...' : 'اتصال نودها'}</button>
              </div>
            </div>

            <div ref={canvasRef} onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp} className={`relative flex-1 min-h-[560px] w-full bg-slate-950 rounded-3xl border border-slate-800/80 overflow-hidden select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`} style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '28px 28px', backgroundPosition: `${pan.x}px ${pan.y}px` }}>
              <div style={{ transform: `translate(${pan.x}px, ${pan.y}px)`, position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-0">
                <defs>
                <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
                </linearGradient>
                <marker id="arrow" viewBox="0 0 10 10" refX="78" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" opacity="0.9" />
                </marker>
              </defs>
                {visibleEdges.map(edge => {
                  const sourceNode = visibleNodes.find(n => n.id === edge.source);
                  const targetNode = visibleNodes.find(n => n.id === edge.target);
                  if (!sourceNode || !targetNode) return null;
                  const midX = (sourceNode.x + targetNode.x) / 2;
                  const midY = (sourceNode.y + targetNode.y) / 2;
                  return (
                    <g key={edge.id} className="group pointer-events-auto">
                      <line x1={sourceNode.x} y1={sourceNode.y} x2={targetNode.x} y2={targetNode.y} stroke="url(#edgeGradient)" strokeWidth="3" strokeDasharray="6 4" markerEnd="url(#arrow)" className="transition-all group-hover:stroke-red-400 group-hover:stroke-[4px]" />
                      {edge.ownerId === currentUserId && (
                        <g onClick={() => handleDeleteEdge(edge.id)} className="cursor-pointer opacity-0 group-hover:opacity-100" transform={`translate(${midX}, ${midY})`}><circle r="12" fill="#0f172a" stroke="#ef4444" strokeWidth="2" /><line x1="-4" y1="-4" x2="4" y2="4" stroke="#ef4444" strokeWidth="2" /><line x1="4" y1="-4" x2="-4" y2="4" stroke="#ef4444" strokeWidth="2" /></g>
                      )}
                    </g>
                  );
                })}
              </svg>

              {visibleNodes.map(node => {
                const isOwner = node.ownerId === currentUserId;
                const isSelectedSource = connectSourceId === node.id;
                const nodeNewsCount = news.filter(n => n.nodeId === node.id).length;
                return (
                  <div key={node.id} onMouseDown={(e) => handleMouseDownOnNode(e, node)} onClick={() => handleNodeClick(node)} style={{ left: `${node.x}px`, top: `${node.y}px`, transform: 'translate(-50%, -50%)' }} className={`absolute z-10 w-36 h-36 rounded-full flex flex-col items-center justify-center transition-shadow duration-200 group pointer-events-auto ${draggingNodeId === node.id ? 'cursor-grabbing scale-105' : 'cursor-grab'} ${isSelectedSource ? 'bg-amber-950/90 border-4 border-amber-400' : isOwner ? 'bg-slate-900/95 border-2 border-indigo-500/60 hover:border-indigo-400 shadow-[0_0_30px_rgba(79,70,229,0.2)]' : 'bg-slate-900/95 border-2 border-emerald-500/60 hover:border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]'}`}>
                    {!isOwner && <span className="absolute -top-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">اشتراکی از {node.ownerName}</span>}
                    {editingNodeId !== node.id && !connectMode && (
                      <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 z-20 bg-slate-950/90 p-1 rounded-full border border-slate-700">
                        {isOwner && (
                          <><button onClick={(e) => handleShareSingleNode(node, e)} className="bg-slate-800 text-indigo-400 p-1.5 rounded-full hover:bg-indigo-600 hover:text-white"><Share2 size={13}/></button>
                          <button onClick={(e) => { e.stopPropagation(); setEditingNodeId(node.id); setEditNodeName(node.name); }} className="bg-slate-800 text-blue-400 p-1.5 rounded-full hover:bg-blue-600 hover:text-white"><Edit2 size={13}/></button></>
                        )}
                        <button onClick={(e) => handleDeleteNode(node, e)} className="bg-slate-800 text-red-400 p-1.5 rounded-full hover:bg-red-600 hover:text-white"><Trash2 size={13}/></button>
                      </div>
                    )}
                    {editingNodeId === node.id ? (
                      <div className="px-3 flex flex-col items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <input autoFocus value={editNodeName} onChange={e => setEditNodeName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveEditNode(node.id, e)} className="w-24 text-center bg-slate-950 border border-indigo-500 text-white rounded-lg px-1 py-1 text-xs outline-none" />
                        <div className="flex gap-2"><button onClick={(e) => handleSaveEditNode(node.id, e)} className="text-emerald-400"><Check size={16}/></button><button onClick={(e) => { e.stopPropagation(); setEditingNodeId(null); }} className="text-red-400"><X size={16}/></button></div>
                      </div>
                    ) : (
                      <><span className="font-bold text-slate-100 text-sm text-center px-3 leading-snug">{node.name}</span>
                      <span className="mt-2 bg-slate-950 px-2.5 py-0.5 rounded-full text-[11px] text-slate-400 border border-slate-800">{nodeNewsCount} خبر</span></>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3"><h2 className="text-2xl font-black text-white">{activeNode?.name}</h2>
                {!canEditActiveNode && <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1"><Eye size={13} /> متعلق به {activeNode?.ownerName}</span>}</div>
                {hierarchyPath.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                    <span className="text-slate-400 flex items-center gap-1"><Network size={13} className="text-indigo-400"/> مسیر:</span>
                    {hierarchyPath.map((n, i) => (
                      <span key={n.id} className="flex items-center gap-1.5">
                        <button onClick={() => setActiveNodeId(n.id)} className={`px-2.5 py-1 rounded-lg border transition-colors ${n.id === activeNodeId ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-300 font-bold' : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-500'}`}>
                          {n.name}
                        </button>
                        {i < hierarchyPath.length - 1 && <ArrowRight size={12} className="text-slate-600" />}
                      </span>
                    ))}
                  </div>
                )}
                {childNodes.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                    <span className="text-slate-400 flex items-center gap-1"><Link2 size={13} className="text-emerald-400"/> فرزندان (زیرشاخه‌ها):</span>
                    {childNodes.map(cn => (
                      <button key={cn.id} onClick={() => setActiveNodeId(cn.id)} className="bg-slate-950 text-emerald-400 border border-emerald-900/50 hover:border-emerald-500/50 px-2.5 py-1 rounded-lg transition-colors">
                        {cn.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2 outline-none text-sm"><option value="date">تاریخ</option><option value="importance">اهمیت</option></select>
                {canEditActiveNode && <button onClick={() => setShowNewsForm(!showNewsForm)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Plus size={18} /> ثبت خبر</button>}
              </div>
            </div>
            {showNewsForm && canEditActiveNode && (
              <form onSubmit={handleAddNews} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="text" placeholder="تیتر خبر..." value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})} className="col-span-1 md:col-span-2 p-3 bg-slate-950 text-white border border-slate-800 rounded-xl outline-none" />
                <textarea required placeholder="متن کامل..." value={newsForm.text} onChange={e => setNewsForm({...newsForm, text: e.target.value})} rows="4" className="col-span-1 md:col-span-2 p-3 bg-slate-950 text-white border border-slate-800 rounded-xl outline-none resize-none"></textarea>
                <div className="flex gap-4 col-span-1 md:col-span-2">
                  <input required type="date" value={newsForm.date} onChange={e => setNewsForm({...newsForm, date: e.target.value})} className="p-3 bg-slate-950 text-white border border-slate-800 rounded-xl outline-none w-full text-sm" />
                  <select value={newsForm.importance} onChange={e => setNewsForm({...newsForm, importance: e.target.value})} className="p-3 bg-slate-950 text-white border border-slate-800 rounded-xl outline-none w-full text-sm"><option value="1">عادی</option><option value="2">مهم</option><option value="3">فوری</option></select>
                </div>
                <button type="submit" className="col-span-1 md:col-span-2 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-500 font-bold">انتشار خبر</button>
              </form>
            )}
            <div className="grid grid-cols-1 gap-5">
              {currentCategoryNews.map((item) => (
                <article key={item.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between">
                  {editingNewsId === item.id ? (
                    <form onSubmit={handleSaveEditNews} className="flex flex-col gap-3">
                      <input required type="text" value={editNewsForm.title} onChange={e => setEditNewsForm({...editNewsForm, title: e.target.value})} className="p-3 bg-slate-950 text-white border border-slate-800 rounded-xl outline-none" />
                      <textarea required value={editNewsForm.text} onChange={e => setEditNewsForm({...editNewsForm, text: e.target.value})} rows="4" className="p-3 bg-slate-950 text-white border border-slate-800 rounded-xl outline-none resize-none"></textarea>
                      <div className="flex gap-3">
                        <input required type="date" value={editNewsForm.date} onChange={e => setEditNewsForm({...editNewsForm, date: e.target.value})} className="p-3 bg-slate-950 text-white border border-slate-800 rounded-xl outline-none text-sm flex-1" />
                        <select value={editNewsForm.importance} onChange={e => setEditNewsForm({...editNewsForm, importance: e.target.value})} className="p-3 bg-slate-950 text-white border border-slate-800 rounded-xl outline-none text-sm flex-1"><option value="1">عادی</option><option value="2">مهم</option><option value="3">فوری</option></select>
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <button type="button" onClick={() => setEditingNewsId(null)} className="px-5 py-2 rounded-xl text-sm bg-slate-800 hover:bg-slate-700 text-slate-300">لغو</button>
                        <button type="submit" className="px-5 py-2 rounded-xl text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-bold"><Check size={16} className="inline mr-1"/> ذخیره</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <div className="flex gap-3 mb-3 text-xs font-bold text-slate-400">
                          <span className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800"><Calendar size={13} /> {item.date}</span>
                          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border ${item.importance === '3' ? 'text-red-400 border-red-900/60' : item.importance === '2' ? 'text-amber-400 border-amber-900/60' : 'text-blue-400 border-blue-900/60'}`}><Star size={13} fill="currentColor" /> {item.importance === '3' ? 'فوری' : item.importance === '2' ? 'مهم' : 'عادی'}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{item.text}</p>
                      </div>
                      {canEditActiveNode && (
                        <div className="mt-5 pt-3 border-t border-slate-800/80 flex justify-end gap-2">
                          <button onClick={() => handleStartEditNews(item)} className="text-blue-400 hover:text-blue-300 bg-slate-950 hover:bg-slate-800 p-2 rounded-lg border border-slate-800"><Edit2 size={16} /></button>
                          <button onClick={() => handleDeleteNews(item.id)} className="text-red-400 hover:text-red-300 bg-slate-950 hover:bg-slate-800 p-2 rounded-lg border border-slate-800"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}
      </main>

      {shareModalData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between mb-3"><h3 className="font-bold text-lg text-white">{shareModalData.title}</h3><button onClick={() => setShareModalData(null)} className="text-slate-400"><X size={20}/></button></div>
            <p className="text-xs text-slate-400 mb-4">{shareModalData.desc}</p>
            <div className="bg-slate-950 border border-indigo-500/40 rounded-xl p-3 flex justify-between"><code className="text-indigo-400 font-mono text-sm select-all">{shareModalData.token}</code><button onClick={() => { navigator.clipboard.writeText(shareModalData.token); alert('کپی شد!'); }} className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg">کپی</button></div>
          </div>
        </div>
      )}

      {importModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleImportShared} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between mb-3"><h3 className="font-bold text-lg text-white">افزودن نود مشترک</h3><button type="button" onClick={() => setImportModalOpen(false)} className="text-slate-400"><X size={20}/></button></div>
            <input required type="text" placeholder="کد اشتراک را اینجا وارد کنید..." value={importTokenInput} onChange={e => setImportTokenInput(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm outline-none mb-4" />
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-sm">اتصال به نود</button>
          </form>
        </div>
      )}

      <footer className="py-4 text-center text-xs text-slate-500 mt-auto border-t border-slate-800/50">
        Created by Parsa Momtaz
      </footer>
    </div>
  );
}
