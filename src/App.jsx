import { useState, useEffect, useRef } from 'react';
import { 
  Plus, ArrowRight, Star, Calendar, Image as ImageIcon, 
  Trash2, Edit2, Network, Check, X, Share2, Link2, 
  Download, Move, Eye, LogOut, Lock, Mail, Key, Bookmark, CheckCircle
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

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [news, setNews] = useState([]);

  // Views: 'canvas', 'node', 'calendar', 'saved'
  const [activeView, setActiveView] = useState('canvas');
  const [activeNodeId, setActiveNodeId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [newNodeName, setNewNodeName] = useState('');
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [connectMode, setConnectMode] = useState(false);
  const [connectSourceId, setConnectSourceId] = useState(null);
  const canvasRef = useRef(null);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [editNodeName, setEditNodeName] = useState('');
  const [shareSelection, setShareSelection] = useState(null);
  const [selectedToShare, setSelectedToShare] = useState([]);
  const [generatedShareToken, setGeneratedShareToken] = useState('');
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

    fetchGraphData();

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
      setAuthError('亘乇丕蹖 亘丕夭蹖丕亘蹖 乇賲夭貙 丕亘鬲丿丕 丕蹖賲蹖賱 禺賵丿 乇丕 丿乇 讴丕丿乇 亘丕賱丕 賵丕乇丿 讴賳蹖丿.');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail);
      if (error) throw error;
      setAuthError('賱蹖賳讴 鬲睾蹖蹖乇 乇賲夭 亘賴 丕蹖賲蹖賱 卮賲丕 丕乇爻丕賱 卮丿.');
    } catch (error) {
      setAuthError(error.message);
    }
  };

  if (isAuthLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-400">丿乇 丨丕賱 丕鬲氐丕賱...</div>;
  if (!authUser) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans selection:bg-indigo-500/30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-600/30"><Lock size={32} className="text-white" /></div>
            <h1 className="text-2xl font-black text-white">賵乇賵丿 亘賴 卮亘讴賴 诏乇丕賮</h1>
          </div>
          {authError && <div className="bg-red-950/50 border border-red-900 text-red-400 p-3 rounded-xl text-sm mb-6 text-center">{authError}</div>}
          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <Mail className="absolute right-4 top-3.5 text-slate-500" size={20} />
              <input required type="email" placeholder="丕蹖賲蹖賱 卮賲丕" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white pr-12 pl-4 py-3 rounded-xl outline-none dir-ltr text-left focus:border-indigo-500" />
            </div>
            <div className="relative">
              <Key className="absolute right-4 top-3.5 text-slate-500" size={20} />
              <input required type="password" placeholder="乇賲夭 毓亘賵乇" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white pr-12 pl-4 py-3 rounded-xl outline-none dir-ltr text-left focus:border-indigo-500" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg mt-2">{isLoginMode ? '賵乇賵丿' : '孬亘鬲鈥屬嗀з�'}</button>
            
            {isLoginMode && (
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-slate-400 hover:text-indigo-400 text-xs text-right mt-2 transition-colors w-full"
              >
                乇賲夭 毓亘賵乇 乇丕 賮乇丕賲賵卮 讴乇丿賴鈥屫й屫�
              </button>
            )}
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-slate-400 hover:text-indigo-400 text-sm">{isLoginMode ? '丨爻丕亘 賳丿丕乇蹖丿責 孬亘鬲鈥屬嗀з� 讴賳蹖丿' : '賵丕乇丿 卮賵蹖丿'}</button>
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
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      const node = nodes.find(n => n.id === draggingNodeId);
      if (node && (Math.abs(newX - node.x) > 3 || Math.abs(newY - node.y) > 3)) {
         setHasDragged(true);
      }
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
          setEdges(prev => [...prev, newEdge]);
          const { error } = await supabase.from('edges').insert([newEdge]);
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
    if (editingNodeId !== node.id) {
      setActiveNodeId(node.id);
      setActiveView('node');
    }
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
    
    setNodes(prevNodes => [...prevNodes, newNode]);
    setNewNodeName('');
    
    const { error } = await supabase.from('nodes').insert([newNode]);
    if (error) {
      console.error(error);
      alert('禺胤丕 丿乇 匕禺蹖乇賴 诏乇賴');
      setNodes(prevNodes => prevNodes.filter(n => n.id !== newNode.id));
    }
  };

  const handleAddNews = async (e) => {
    e.preventDefault();
    const newItem = { ...newsForm, id: Date.now().toString(), nodeId: activeNodeId, authorName: currentUserName };
    
    setNews(prev => [...prev, newItem]);
    setShowNewsForm(false);
    setNewsForm({ title: '', text: '', image: '', importance: '1', date: new Date().toISOString().split('T')[0] });
    
    const { error } = await supabase.from('news').insert([newItem]);
    if(error) {
       setNews(prev => prev.filter(n => n.id !== newItem.id));
       console.error(error);
    }
  };

  const handleDeleteNode = async (node, e) => {
    e.stopPropagation();
    if (node.ownerId !== currentUserId) {
      if (window.confirm(`丌蹖丕 賲蹖鈥屫堌з囒屫� 丕蹖賳 诏乇賴 乇丕 丕夭 亘賵賲 禺賵丿 丨匕賮 讴賳蹖丿責`)) {
        const newSubscribers = node.subscribers.filter(id => id !== currentUserId);
        setNodes(prev => prev.map(n => n.id === node.id ? {...n, subscribers: newSubscribers} : n));
        await supabase.from('nodes').update({ subscribers: newSubscribers }).eq('id', node.id);
      }
      return;
    }
    if (window.confirm(`丌蹖丕 丕夭 丨匕賮 讴丕賲賱 诏乇賴 賲胤賲卅賳 賴爻鬲蹖丿責`)) {
      setNodes(prev => prev.filter(n => n.id !== node.id));
      await supabase.from('nodes').delete().eq('id', node.id);
      
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
    await supabase.from('edges').delete().eq('id', edgeId);
  };

  const handleDeleteNews = async (id) => {
    setNews(prev => prev.filter(n => n.id !== id.toString()));
    await supabase.from('news').delete().eq('id', id.toString());
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
      alert('禺胤丕 丿乇 賵蹖乇丕蹖卮 禺亘乇');
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
    const getDescendants = (nodeId, acc = []) => {
      const children = edges.filter(e => e.source === nodeId).map(e => e.target);
      for (const childId of children) {
        if (!acc.includes(childId)) {
          acc.push(childId);
          getDescendants(childId, acc);
        }
      }
      return acc;
    };
    const descendantsIds = getDescendants(node.id);
    const descendantsNodes = nodes.filter(n => descendantsIds.includes(n.id));
    
    setShareSelection({ rootNode: node, descendants: descendantsNodes });
    setSelectedToShare([node.id, ...descendantsIds]);
    setGeneratedShareToken('');
  };

  const handleImportShared = async (e) => {
    e.preventDefault();
    const code = importTokenInput.trim();
    if (!code) return;
    
    let tokens = [];
    if (code.startsWith('BNDL-')) {
        try { tokens = atob(code.replace('BNDL-', '')).split(','); } catch(e) { return alert('讴丿 賳丕賲毓鬲亘乇 丕爻鬲'); }
    } else {
        tokens = [code];
    }
    
    const targetNodes = nodes.filter(n => tokens.includes(n.shareToken));
    if (targetNodes.length === 0) return alert('诏乇賴鈥屫й� 亘丕 丕蹖賳 讴丿 蹖丕賮鬲 賳卮丿!');
    
    const nodesToSubscribe = targetNodes.filter(n => n.ownerId !== currentUserId && !n.subscribers.includes(currentUserId));
    if (nodesToSubscribe.length === 0) return alert('卮賲丕 丕夭 賯亘賱 亘賴 鬲賲丕賲 丕蹖賳 诏乇賴鈥屬囏� 丿爻鬲乇爻蹖 丿丕乇蹖丿 蹖丕 賲丕賱讴 丌賳鈥屬囏� 賴爻鬲蹖丿.');
    
    let newNodes = [...nodes];
    for (const targetNode of nodesToSubscribe) {
        const newSubscribers = [...targetNode.subscribers, currentUserId];
        newNodes = newNodes.map(n => n.id === targetNode.id ? { ...n, subscribers: newSubscribers } : n);
        await supabase.from('nodes').update({ subscribers: newSubscribers }).eq('id', targetNode.id);
    }
    
    setNodes(newNodes);
    setImportModalOpen(false);
    setImportTokenInput('');
    alert('诏乇賴(賴丕蹖) 丕賳鬲禺丕亘蹖 亘丕 賲賵賮賯蹖鬲 丕囟丕賮賴 卮丿賳丿!');
  };

  const handleToggleSaveNews = async (item) => {
    const savedBy = item.savedBy || [];
    const isSaved = savedBy.includes(currentUserId);
    const newSavedBy = isSaved ? savedBy.filter(id => id !== currentUserId) : [...savedBy, currentUserId];
    setNews(prev => prev.map(n => n.id === item.id ? { ...n, savedBy: newSavedBy } : n));
    await supabase.from('news').update({ savedBy: newSavedBy }).eq('id', item.id);
  };

  const handleToggleReadNews = async (item) => {
    const readBy = item.readBy || [];
    const isRead = readBy.includes(currentUserId);
    const newReadBy = isRead ? readBy.filter(id => id !== currentUserId) : [...readBy, currentUserId];
    setNews(prev => prev.map(n => n.id === item.id ? { ...n, readBy: newReadBy } : n));
    await supabase.from('news').update({ readBy: newReadBy }).eq('id', item.id);
  };

  const handleShareNews = (item) => {
    const shareData = {
      title: item.title,
      text: `馃摪 ${item.title}\n\n${item.text}\n\n馃敆 诏乇丕賮 丕禺亘丕乇`,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(err => console.log('禺胤丕 丿乇 丕卮鬲乇丕讴鈥屭柏ж臂�', err));
    } else {
      navigator.clipboard.writeText(shareData.text);
      alert('賲鬲賳 禺亘乇 讴倬蹖 卮丿!');
    }
  };

  const activeNode = nodes.find(n => n.id === activeNodeId);
  const canEditActiveNode = activeNode && activeNode.ownerId === currentUserId;

  const getSortedNews = (newsArray) => {
    return [...newsArray].sort((a, b) => {
      const aRead = (a.readBy || []).includes(currentUserId);
      const bRead = (b.readBy || []).includes(currentUserId);
      if (aRead !== bRead) return aRead ? 1 : -1;
      
      if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
      return parseInt(b.importance) - parseInt(a.importance);
    });
  };

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

  const renderNewsItem = (item, context = 'node') => {
    const isSaved = (item.savedBy || []).includes(currentUserId);
    const isRead = (item.readBy || []).includes(currentUserId);
    const parentNode = nodes.find(n => n.id === item.nodeId);
    const canEdit = context === 'node' && canEditActiveNode;

    if (editingNewsId === item.id) {
       return (
          <form key={item.id} onSubmit={handleSaveEditNews} className="bg-slate-900 rounded-2xl border border-slate-700 p-6 flex flex-col gap-3">
             <input required type="text" value={editNewsForm.title} onChange={e => setEditNewsForm({...editNewsForm, title: e.target.value})} className="p-3 bg-slate-950 text-white border border-slate-800 rounded-xl outline-none" />
             <textarea required value={editNewsForm.text} onChange={e => setEditNewsForm({...editNewsForm, text: e.target.value})} rows="4" className="p-3 bg-slate-950 text-white border border-slate-800 rounded-xl outline-none resize-none"></textarea>
             <div className="flex gap-3">
               <input required type="date" value={editNewsForm.date} onChange={e => setEditNewsForm({...editNewsForm, date: e.target.value})} className="p-3 bg-slate-950 text-white border border-slate-800 rounded-xl outline-none text-sm flex-1" />
               <select value={editNewsForm.importance} onChange={e => setEditNewsForm({...editNewsForm, importance: e.target.value})} className="p-3 bg-slate-950 text-white border border-slate-800 rounded-xl outline-none text-sm flex-1"><option value="1">毓丕丿蹖</option><option value="2">賲賴賲</option><option value="3">賮賵乇蹖</option></select>
             </div>
             <div className="flex justify-end gap-2 mt-2">
               <button type="button" onClick={() => setEditingNewsId(null)} className="px-5 py-2 rounded-xl text-sm bg-slate-800 hover:bg-slate-700 text-slate-300">賱睾賵</button>
               <button type="submit" className="px-5 py-2 rounded-xl text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-bold"><Check size={16} className="inline mr-1"/> 匕禺蹖乇賴</button>
             </div>
          </form>
       );
    }

    return (
      <article key={item.id} className={`bg-slate-900 rounded-2xl border ${isRead ? 'border-slate-800/50 opacity-60' : 'border-slate-700 shadow-md hover:border-slate-600'} p-6 flex flex-col justify-between transition-all`}>
         <div>
           <div className="flex justify-between items-start mb-4">
             <div className="flex gap-2.5 text-xs font-bold text-slate-400 flex-wrap">
                <span className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800"><Calendar size={13} /> {item.date}</span>
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${item.importance === '3' ? 'text-red-400 border-red-900/60' : item.importance === '2' ? 'text-amber-400 border-amber-900/60' : 'text-blue-400 border-blue-900/60'}`}><Star size={13} fill="currentColor" /> {item.importance === '3' ? '賮賵乇蹖' : item.importance === '2' ? '賲賴賲' : '毓丕丿蹖'}</span>
                {context !== 'node' && parentNode && (
                  <button onClick={() => {setActiveNodeId(parentNode.id); setActiveView('node');}} className="flex items-center gap-1.5 bg-indigo-950/30 text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-900/30 hover:bg-indigo-900/50 transition-colors"><Network size={13} /> {parentNode.name}</button>
                )}
             </div>
             <div className="flex gap-2 mr-4 shrink-0">
                <button onClick={() => handleShareNews(item)} className="p-2 rounded-lg border transition-colors bg-slate-950 text-indigo-400 border-indigo-900/40 hover:bg-indigo-900/30" title="丕乇爻丕賱 禺亘乇">
                   <Share2 size={16} />
                </button>
                <button onClick={() => handleToggleSaveNews(item)} className={`p-2 rounded-lg border transition-colors ${isSaved ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-white hover:border-slate-600'}`} title="賳卮丕賳鈥屭柏ж臂� 禺亘乇">
                   <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
                </button>
                <button onClick={() => handleToggleReadNews(item)} className={`p-2 rounded-lg border transition-colors ${isRead ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-white hover:border-slate-600'}`} title={isRead ? '禺賵丕賳丿賴 卮丿賴' : '毓賱丕賲鬲 亘賴 毓賳賵丕賳 禺賵丕賳丿賴 卮丿賴'}>
                   <CheckCircle size={16} />
                </button>
             </div>
           </div>
           <h3 className={`text-xl font-bold mb-3 leading-snug ${isRead ? 'text-slate-400' : 'text-white'}`}>{item.title}</h3>
           <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isRead ? 'text-slate-500' : 'text-slate-300'}`}>{item.text}</p>
         </div>
         {canEdit && (
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex justify-end gap-2">
               <button onClick={() => handleStartEditNews(item)} className="text-blue-400 hover:text-blue-300 bg-slate-950 hover:bg-slate-800 p-2 rounded-lg border border-slate-800 transition-colors"><Edit2 size={16} /></button>
               <button onClick={() => handleDeleteNews(item.id)} className="text-red-400 hover:text-red-300 bg-slate-950 hover:bg-slate-800 p-2 rounded-lg border border-slate-800 transition-colors"><Trash2 size={16} /></button>
            </div>
         )}
      </article>
    );
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-indigo-500/30 flex flex-col">
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center justify-between gap-4 w-full md:w-auto">
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shrink-0"><Network size={20} className="text-white" /></div>
              <span className="shrink-0">诏乇丕賮 丕禺亘丕乇</span>
            </h1>
            <div className="hidden sm:flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-indigo-300 truncate">禺賵卮 丌賲丿蹖丿貙 {currentUserName}</div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar w-full md:w-auto">
            {activeView !== 'canvas' ? (
              <button onClick={() => { setActiveView('canvas'); setActiveNodeId(null); }} className="shrink-0 flex items-center gap-2 text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm transition-colors"><ArrowRight size={18} /> 亘丕夭诏卮鬲 亘賴 亘賵賲</button>
            ) : (
              <>
                <button onClick={() => setActiveView('calendar')} className="shrink-0 flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors"><Calendar size={15} className="text-blue-400" /> 鬲賯賵蹖賲</button>
                <button onClick={() => setActiveView('saved')} className="shrink-0 flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors"><Bookmark size={15} className="text-amber-400" /> 匕禺蹖乇賴鈥屬囏�</button>
                <button onClick={() => setImportModalOpen(true)} className="shrink-0 flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors"><Download size={15} className="text-emerald-400" /> 丕賮夭賵丿賳 讴丿</button>
                <button onClick={handleLogout} className="shrink-0 flex items-center gap-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/30 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors"><LogOut size={15} /> 禺乇賵噩</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col">
        {activeView === 'canvas' && (
          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <form onSubmit={handleAddNode} className="flex gap-2 flex-1 max-w-md">
                <input type="text" placeholder="賳丕賲 诏乇賴 噩丿蹖丿..." value={newNodeName} onChange={(e) => setNewNodeName(e.target.value)} className="flex-1 px-4 py-2 bg-slate-950 text-white border border-slate-800 focus:border-indigo-500 rounded-xl outline-none text-sm" />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5"><Plus size={18} /> 爻丕禺鬲 诏乇賴</button>
              </form>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 hidden md:inline-flex items-center gap-1"><Move size={14} /> 噩丕亘噩丕蹖蹖 亘丕 賲丕賵爻</span>
                {connectMode && <span className="text-xs text-amber-400 animate-pulse hidden md:inline-block">丿乇 丨丕賱 丕鬲氐丕賱... (诏乇賴 賲亘丿兀 乇丕 丕賳鬲禺丕亘 讴賳蹖丿)</span>}
                <button type="button" onClick={() => { setConnectMode(!connectMode); setConnectSourceId(null); }} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-colors shrink-0 ${connectMode ? 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                  {connectMode ? <X size={16} /> : <Link2 size={16} />}
                  {connectMode ? '賱睾賵 丕鬲氐丕賱' : '丕鬲氐丕賱 诏乇賴鈥屬囏�'}
                </button>
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
                    {!isOwner && <span className="absolute -top-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">丕卮鬲乇丕讴蹖 丕夭 {node.ownerName}</span>}
                    {editingNodeId !== node.id && !connectMode && (
                      <div className="absolute -top-4 md:-top-3 -right-4 md:-right-3 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 z-30 bg-slate-950/90 p-1.5 md:p-1 rounded-full border border-slate-700 shadow-xl">
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
                      <span className="mt-2 bg-slate-950 px-2.5 py-0.5 rounded-full text-[11px] text-slate-400 border border-slate-800">{nodeNewsCount} 禺亘乇</span></>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        )}

        {activeView === 'node' && activeNodeId && (
          <div className="animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3"><h2 className="text-2xl font-black text-white">{activeNode?.name}</h2>
                {!canEditActiveNode && <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1"><Eye size={13} /> 賲鬲毓賱賯 亘賴 {activeNode?.ownerName}</span>}</div>
                {hierarchyPath.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                    <span className="text-slate-400 flex items-center gap-1"><Network size={13} className="text-indigo-400"/> 賲爻蹖乇:</span>
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
                    <span className="text-slate-400 flex items-center gap-1"><Link2 size={13} className="text-emerald-400"/> 賮乇夭賳丿丕賳 (夭蹖乇卮丕禺賴鈥屬囏�):</span>
                    {childNodes.map(cn => (
                      <button key={cn.id} onClick={() => setActiveNodeId(cn.id)} className="bg-slate-950 text-emerald-400 border border-emerald-900/50 hover:border-emerald-500/50 px-2.5 py-1 rounded-lg transition-colors">
                        {cn.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2 outline-none text-sm"><option value="date">鬲丕乇蹖禺</option><option value="importance">丕賴賲蹖鬲</option></select>
                {canEditActiveNode && <button onClick={() => setShowNewsForm(!showNewsForm)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"><Plus size={18} /> 孬亘鬲 禺亘乇</button>}
              </div>
            </div>
            {showNewsForm && canEditActiveNode && (
              <form onSubmit={handleAddNews} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="text" placeholder="鬲蹖鬲乇 禺亘乇..." value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})} className="col-span-1 md:col-span-2 p-3 bg-slate-950 text-white border border-slate-800 rounded-xl outline-none" />
                <textarea required placeholder="賲鬲賳 讴丕賲賱..." value={newsForm.text} onChange={e => setNewsForm({...newsForm, text: e.target.value})} rows="4" className="col-span-1 md:col-span-2 p-3 bg-slate-950 text-white border border-slate-800 rounded-xl outline-none resize-none"></textarea>
                <div className="flex gap-4 col-span-1 md:col-span-2">
                  <input required type="date" value={newsForm.date} onChange={e => setNewsForm({...newsForm, date: e.target.value})} className="p-3 bg-slate-950 text-white border border-slate-800 rounded-xl outline-none w-full text-sm" />
                  <select value={newsForm.importance} onChange={e => setNewsForm({...newsForm, importance: e.target.value})} className="p-3 bg-slate-950 text-white border border-slate-800 rounded-xl outline-none w-full text-sm"><option value="1">毓丕丿蹖</option><option value="2">賲賴賲</option><option value="3">賮賵乇蹖</option></select>
                </div>
                <button type="submit" className="col-span-1 md:col-span-2 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-500 font-bold transition-colors">丕賳鬲卮丕乇 禺亘乇</button>
              </form>
            )}
            <div className="grid grid-cols-1 gap-5">
              {getSortedNews(news.filter(item => item.nodeId === activeNodeId)).map(item => renderNewsItem(item, 'node'))}
            </div>
          </div>
        )}

        {activeView === 'calendar' && (
          <div className="animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-6 flex flex-wrap items-center justify-between gap-4">
               <h2 className="text-2xl font-black text-white flex items-center gap-2"><Calendar size={24} className="text-blue-400"/> 鬲賯賵蹖賲 诏乇丕賮</h2>
               <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none" />
            </div>
            <div className="grid grid-cols-1 gap-5">
               {news.filter(n => n.date === selectedDate && visibleNodeIds.includes(n.nodeId)).length === 0 ? (
                 <div className="text-center text-slate-500 py-10 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">禺亘乇蹖 丿乇 丕蹖賳 鬲丕乇蹖禺 孬亘鬲 賳卮丿賴 丕爻鬲.</div>
               ) : (
                 getSortedNews(news.filter(n => n.date === selectedDate && visibleNodeIds.includes(n.nodeId)))
                     .map(item => renderNewsItem(item, 'calendar'))
               )}
            </div>
          </div>
        )}

        {activeView === 'saved' && (
          <div className="animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-6 flex flex-wrap items-center justify-between gap-4">
               <h2 className="text-2xl font-black text-white flex items-center gap-2"><Bookmark size={24} className="text-amber-400"/> 丕禺亘丕乇 匕禺蹖乇賴鈥屫簇� 賲賳</h2>
            </div>
            <div className="grid grid-cols-1 gap-5">
               {news.filter(n => (n.savedBy || []).includes(currentUserId) && visibleNodeIds.includes(n.nodeId)).length === 0 ? (
                 <div className="text-center text-slate-500 py-10 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">賴蹖趩 禺亘乇蹖 乇丕 賳卮丕賳鈥屭柏ж臂� 賳讴乇丿賴鈥屫й屫�.</div>
               ) : (
                 getSortedNews(news.filter(n => (n.savedBy || []).includes(currentUserId) && visibleNodeIds.includes(n.nodeId)))
                     .map(item => renderNewsItem(item, 'saved'))
               )}
            </div>
          </div>
        )}
      </main>

      {shareSelection && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between mb-4">
               <h3 className="font-bold text-lg text-white">丕卮鬲乇丕讴鈥屭柏ж臂� 诏乇賴 芦{shareSelection.rootNode.name}禄</h3>
               <button onClick={() => setShareSelection(null)} className="text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
            </div>
            
            {!generatedShareToken ? (
              <div className="flex flex-col overflow-hidden">
                <p className="text-sm text-slate-400 mb-4">丕賳鬲禺丕亘 讴賳蹖丿 讴丿丕賲 诏乇賴鈥屬囏� 丿乇 丕蹖賳 讴丿 丕卮鬲乇丕讴 賯乇丕乇 亘诏蹖乇賳丿:</p>
                <div className="flex flex-col gap-2 mb-6 overflow-y-auto pr-2 custom-scrollbar">
                   <label className="flex items-center gap-3 p-2 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                      <input type="checkbox" checked={selectedToShare.includes(shareSelection.rootNode.id)} onChange={(e) => {
                         if(e.target.checked) setSelectedToShare([...selectedToShare, shareSelection.rootNode.id]);
                         else setSelectedToShare(selectedToShare.filter(id => id !== shareSelection.rootNode.id));
                      }} className="w-4 h-4 accent-indigo-600" />
                      <span className="text-white text-sm font-bold">{shareSelection.rootNode.name} (诏乇賴 丕氐賱蹖)</span>
                   </label>
                   {shareSelection.descendants.map(desc => (
                     <label key={desc.id} className="flex items-center gap-3 p-2 hover:bg-slate-950/50 rounded-xl border border-transparent hover:border-slate-800 transition-colors mr-4 cursor-pointer">
                        <input type="checkbox" checked={selectedToShare.includes(desc.id)} onChange={(e) => {
                           if(e.target.checked) setSelectedToShare([...selectedToShare, desc.id]);
                           else setSelectedToShare(selectedToShare.filter(id => id !== desc.id));
                        }} className="w-4 h-4 accent-indigo-600" />
                        <span className="text-slate-300 text-sm">{desc.name}</span>
                     </label>
                   ))}
                   {shareSelection.descendants.length === 0 && (
                     <div className="text-xs text-slate-500 text-center py-2">丕蹖賳 诏乇賴 賴蹖趩 夭蹖乇卮丕禺賴鈥屫й� 賳丿丕乇丿.</div>
                   )}
                </div>
                <button onClick={() => {
                   const tokens = nodes.filter(n => selectedToShare.includes(n.id)).map(n => n.shareToken);
                   const b64 = btoa(tokens.join(','));
                   setGeneratedShareToken(`BNDL-${b64}`);
                }} disabled={selectedToShare.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold transition-colors shrink-0">
                   鬲賵賱蹖丿 讴丿 丕卮鬲乇丕讴
                </button>
              </div>
            ) : (
              <div className="flex flex-col">
                <p className="text-sm text-slate-400 mb-4">讴丿 夭蹖乇 乇丕 讴倬蹖 讴乇丿賴 賵 亘賴 丿賵爻鬲丕賳 禺賵丿 亘丿賴蹖丿:</p>
                <div className="bg-slate-950 border border-indigo-500/40 rounded-xl p-3 flex justify-between gap-3 mb-4">
                   <code className="text-indigo-400 font-mono text-xs break-all select-all flex-1">{generatedShareToken}</code>
                </div>
                <div className="flex gap-2 shrink-0">
                   <button onClick={() => { navigator.clipboard.writeText(generatedShareToken); alert('讴倬蹖 卮丿!'); }} className="flex-1 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white py-2.5 rounded-xl font-bold text-sm">讴倬蹖 讴丿</button>
                   <button onClick={() => setShareSelection(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 transition-colors text-white py-2.5 rounded-xl text-sm">亘爻鬲賳</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {importModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleImportShared} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between mb-3"><h3 className="font-bold text-lg text-white">丕賮夭賵丿賳 诏乇賴 賲卮鬲乇讴</h3><button type="button" onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={20}/></button></div>
            <input required type="text" placeholder="讴丿 丕卮鬲乇丕讴 乇丕 丕蹖賳噩丕 賵丕乇丿 讴賳蹖丿..." value={importTokenInput} onChange={e => setImportTokenInput(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm outline-none mb-4" />
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 transition-colors text-white py-2.5 rounded-xl text-sm">丕鬲氐丕賱 亘賴 诏乇賴(賴丕)</button>
          </form>
        </div>
      )}

      <footer className="py-4 text-center text-xs text-slate-500 mt-auto border-t border-slate-800/50">
        Created by Parsa Momtaz
      </footer>
    </div>
  );
}
