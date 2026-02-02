
import React, { useState, useRef, useMemo } from 'react';
import { AppConfig, User, Medicine, Order, Message, AppNotification } from '../types';
import { THEMES } from '../constants';
import { 
  Settings, Users, ShoppingCart, MessageSquare, Trash2, Edit, Save, 
  LogOut, Check, X, Shield, Image as ImageIcon, Signature, Crop, 
  XCircle, Plus, Package, Stethoscope, Camera, RefreshCw, 
  BadgeDollarSign, UserCheck, Search, User as UserIcon, Clock, 
  Bell, Phone, Mail, FileText, Palette, Layout, Type, UserRoundPen
} from 'lucide-react';
import ImageCropper from './ImageCropper';

interface AdminPanelProps {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  users: User[];
  setUsers: (users: User[]) => void;
  logout: () => void;
  priceList: Medicine[];
  setPriceList: React.Dispatch<React.SetStateAction<Medicine[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  addNotification: (to: string | 'admin', message: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ config, setConfig, users, setUsers, logout, priceList, setPriceList, orders, setOrders, messages, setMessages, notifications, setNotifications, addNotification }) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'prescription' | 'users' | 'orders' | 'messages' | 'prices'>('settings');
  const [newPrice, setNewPrice] = useState({ brandName: '', genericName: '', company: '', price: '' });
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [itemPrices, setItemPrices] = useState<{ [orderId: string]: string[] }>({});
  const [userSearch, setUserSearch] = useState('');
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  const [adminChatMessage, setAdminChatMessage] = useState('');
  
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const welcomeInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);

  const [cropModal, setCropModal] = useState<{ show: boolean, image: string, field: string, aspect: number }>({
    show: false, image: '', field: '', aspect: 1
  });

  const unreadOrdersCount = useMemo(() => {
    return notifications.filter(n => n.to === 'admin' && !n.read).length;
  }, [notifications]);

  const chatUsers = useMemo(() => {
    const userIds = new Set(messages.map(m => m.senderId === 'admin' ? m.receiverId : m.senderId));
    return users.filter(u => userIds.has(u.id));
  }, [messages, users]);

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    if (tab === 'orders') {
      setNotifications(prev => prev.map(n => n.to === 'admin' ? { ...n, read: true } : n));
    }
  };

  const toggleBlock = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, isBlocked: !u.isBlocked } : u));
  };

  const handleAddPrice = () => {
    if (!newPrice.brandName || !newPrice.price) return;
    if (editingPrice) {
      setPriceList(priceList.map(p => p.id === editingPrice ? { ...newPrice, id: editingPrice } : p));
      setEditingPrice(null);
    } else {
      setPriceList([...priceList, { ...newPrice, id: Date.now().toString() }]);
    }
    setNewPrice({ brandName: '', genericName: '', company: '', price: '' });
  };

  const editPrice = (p: Medicine) => {
    setNewPrice({ brandName: p.brandName, genericName: p.genericName, company: p.company, price: p.price });
    setEditingPrice(p.id);
  };

  const removePrice = (id: string) => {
    setPriceList(priceList.filter(p => p.id !== id));
  };

  const removeOrder = (orderId: string) => {
    if (window.confirm('অর্ডারটি ডিলিট করতে চান?')) {
      setOrders(orders.filter(o => o.id !== orderId));
    }
  };

  const updateItemPrice = (orderId: string, itemIdx: number, val: string) => {
    const currentPrices = itemPrices[orderId] || orders.find(o => o.id === orderId)?.items.map(it => it.pricePerUnit) || [];
    const newPrices = [...currentPrices];
    newPrices[itemIdx] = val;
    setItemPrices({ ...itemPrices, [orderId]: newPrices });
  };

  const handleOrderReply = (orderId: string) => {
    const reply = replyText[orderId] || 'অর্ডার প্রসেস করা হয়েছে। ইনভয়েস চেক করুন।';
    const prices = itemPrices[orderId];
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    setOrders(prev => {
      return prev.map(o => {
        if (o.id === orderId) {
          const updatedItems = o.items.map((it, idx) => ({ ...it, pricePerUnit: prices?.[idx] || it.pricePerUnit }));
          const total = updatedItems.reduce((acc, it) => acc + (parseFloat(it.pricePerUnit) * parseFloat(it.quantity || '0')), 0);
          return { ...o, status: 'replied', items: updatedItems, totalPrice: total, adminReply: reply };
        }
        return o;
      });
    });

    addNotification(order.userId, `আপনার অর্ডারে এডমিন রিপ্লাই দিয়েছেন। আইডি: #${order.id.slice(-6)}`);
    setReplyText({ ...replyText, [orderId]: '' });
  };

  const handleAdminChatMessage = () => {
    if (!selectedChatUser || !adminChatMessage.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'admin',
      receiverId: selectedChatUser,
      text: adminChatMessage,
      timestamp: Date.now()
    };
    setMessages([...messages, newMessage]);
    setAdminChatMessage('');
    addNotification(selectedChatUser, "এডমিন আপনাকে একটি মেসেজ পাঠিয়েছেন।");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string, aspect: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropModal({ show: true, image: ev.target?.result as string, field, aspect });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = (croppedImage: string) => {
    if (cropModal.field === 'bannerImage') {
      setConfig({ ...config, bannerImage: croppedImage });
    } else if (cropModal.field === 'welcomeImage') {
      setConfig({ ...config, welcomeBanner: { ...config.welcomeBanner, image: croppedImage } });
    } else if (cropModal.field === 'digitalSignature') {
      setConfig({ ...config, digitalSignature: croppedImage });
    }
    setCropModal({ ...cropModal, show: false });
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.id.includes(userSearch)
  );

  const blankAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23cbd5e1' viewBox='0 0 24 24'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 overflow-hidden">
      <div className="w-full md:w-80 bg-slate-900 text-white p-8 flex flex-col shadow-2xl z-20 h-screen overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg"><Shield className="text-white" size={28} /></div>
          <h2 className="text-2xl font-black">এডমিন প্যানেল</h2>
        </div>
        <nav className="flex-1 space-y-3">
          {[
            { id: 'settings', label: 'অ্যাপ সেটিংস', icon: Settings },
            { id: 'prescription', label: 'প্রেসক্রিপশন ডিজাইন', icon: FileText },
            { id: 'users', label: 'ইউজার লিস্ট', icon: Users },
            { id: 'prices', label: 'মূল্য তালিকা', icon: BadgeDollarSign },
            { id: 'orders', label: 'অর্ডার লিস্ট', icon: ShoppingCart, hasBadge: unreadOrdersCount > 0 },
            { id: 'messages', label: 'সাপোর্ট চ্যাট', icon: MessageSquare },
          ].map(item => (
            <button key={item.id} onClick={() => handleTabChange(item.id as any)} className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all font-bold ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}>
              <div className="flex items-center gap-4"><item.icon size={22} /><span className="text-lg">{item.label}</span></div>
              {item.hasBadge && <div className="w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce">{unreadOrdersCount}</div>}
            </button>
          ))}
        </nav>
        <button onClick={logout} className="mt-8 flex items-center gap-4 px-6 py-4 text-rose-400 hover:bg-rose-900/20 rounded-2xl transition-all font-black text-lg"><LogOut size={22} /> লগআউট</button>
      </div>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar h-screen bg-[#f8fafc]">
        {cropModal.show && <ImageCropper image={cropModal.image} initialAspect={cropModal.aspect} onCropComplete={handleCropComplete} onCancel={() => setCropModal({ ...cropModal, show: false })} />}

        {activeTab === 'settings' && (
          <div className="space-y-10 max-w-6xl animate-in fade-in duration-500">
            <h3 className="text-3xl font-black text-slate-800">হোম পেজ কাস্টমাইজেশন</h3>
            
            <div className="bg-white p-10 rounded-[50px] shadow-xl border border-slate-100 space-y-8">
              <h4 className="text-xl font-black flex items-center gap-3"><Layout className="text-blue-600" /> হোম পেজ হেডার ও ফুটার</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">হোম পেজ হেডার টেক্সট</label>
                  <input className="w-full p-4 mt-1 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:border-blue-500 outline-none" value={config.homeHeader} onChange={e => setConfig({...config, homeHeader: e.target.value})} placeholder="হেডার টেক্সট লিখুন" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">হোম পেজ ফুটার বার্তা</label>
                  <input className="w-full p-4 mt-1 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:border-blue-500 outline-none" value={config.homeFooter} onChange={e => setConfig({...config, homeFooter: e.target.value})} placeholder="ফুটার টেক্সট লিখুন" />
                </div>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[50px] shadow-xl border border-slate-100 space-y-10">
              <h4 className="text-xl font-black flex items-center gap-3"><ImageIcon className="text-blue-600" /> ব্যানার ও ওয়েলকাম ইমেজ</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">হোম পেজ মেইন ব্যানার</p>
                    {config.bannerImage && (
                      <button onClick={() => setConfig({...config, bannerImage: ''})} className="text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1 text-[10px] font-black uppercase">
                        <Trash2 size={12} /> ডিলিট করুন
                      </button>
                    )}
                  </div>
                  <div className="relative min-h-[100px] bg-slate-100 rounded-[35px] overflow-hidden group border-4 border-white shadow-lg flex items-center justify-center">
                    {config.bannerImage ? (
                      <img src={config.bannerImage} className="w-full h-auto block" />
                    ) : (
                      <div className="p-12 flex flex-col items-center gap-2 text-slate-300">
                        <ImageIcon size={48} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">কোনো ব্যানার নেই</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                      <button onClick={() => bannerInputRef.current?.click()} className="bg-white p-4 rounded-3xl text-blue-600 shadow-xl scale-90 group-hover:scale-100 transition-transform flex items-center gap-2 font-black">
                        <Camera size={24} /> {config.bannerImage ? 'পরিবর্তন করুন' : 'আপলোড করুন'}
                      </button>
                    </div>
                  </div>
                  <input type="file" ref={bannerInputRef} className="hidden" onChange={e => handleFileUpload(e, 'bannerImage', 1200/400)} />
                </div>

                <div className="space-y-6">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">ওয়েলকাম ব্যানার (ফুটার)</p>
                  <div className="flex gap-6 items-center">
                    <div className="relative w-32 h-32 bg-slate-100 rounded-3xl overflow-hidden group border-4 border-white shadow-md flex-shrink-0">
                      {config.welcomeBanner.image ? <img src={config.welcomeBanner.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={24} /></div>}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <button onClick={() => welcomeInputRef.current?.click()} className="bg-white p-2 rounded-xl text-blue-600"><Camera size={18} /></button>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase">ব্যানার টাইটেল</label>
                       <textarea rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:border-blue-500 outline-none text-sm" value={config.welcomeBanner.title} onChange={e => setConfig({...config, welcomeBanner: {...config.welcomeBanner, title: e.target.value}})} placeholder="ওয়েলকাম মেসেজ লিখুন..." />
                    </div>
                  </div>
                  <input type="file" ref={welcomeInputRef} className="hidden" onChange={e => handleFileUpload(e, 'welcomeImage', 400/200)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prescription' && (
          <div className="space-y-10 max-w-6xl animate-in slide-in-from-right-10 duration-500">
            <h3 className="text-3xl font-black text-slate-800">প্রেসক্রিপশন কাস্টমাইজেশন</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-10 rounded-[50px] shadow-xl border border-slate-100 space-y-8">
                <h4 className="text-xl font-black flex items-center gap-3"><Palette className="text-blue-600" /> ডিজাইন ও কন্টেন্ট</h4>
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">প্রেসক্রিপশন হেডার</label>
                    <input className="w-full p-4 mt-1 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:border-blue-500 outline-none" value={config.prescriptionHeader} onChange={e => setConfig({...config, prescriptionHeader: e.target.value})} placeholder="ক্লিনিক বা হসপিটাল নাম" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">প্রেসক্রিপশন ফুটার (নোটিশ)</label>
                    <input className="w-full p-4 mt-1 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:border-blue-500 outline-none" value={config.prescriptionFooter} onChange={e => setConfig({...config, prescriptionFooter: e.target.value})} placeholder="জরুরী উপদেশ" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ডিফল্ট থিম কালার</label>
                    <div className="grid grid-cols-5 gap-4 mt-3">
                      {THEMES.map(t => (
                        <button 
                          key={t.id} 
                          onClick={() => setConfig({...config, prescriptionTheme: t.id})} 
                          className={`h-12 rounded-2xl transition-all border-4 flex items-center justify-center ${config.prescriptionTheme === t.id ? 'border-slate-800 scale-110 shadow-lg' : 'border-white shadow-sm hover:scale-105'}`} 
                          style={{ backgroundColor: t.color }}
                        >
                          {config.prescriptionTheme === t.id && <Check className="text-white" size={20} strokeWidth={4} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[50px] shadow-xl border border-slate-100 space-y-8">
                <h4 className="text-xl font-black flex items-center gap-3"><Stethoscope className="text-blue-600" /> ডাক্তার এর তথ্য</h4>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400">ডাক্তার এর নাম</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={config.doctorDetails.name} onChange={e => setConfig({...config, doctorDetails: {...config.doctorDetails, name: e.target.value}})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400">BMDC রেজি: নং</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={config.doctorDetails.regNo} onChange={e => setConfig({...config, doctorDetails: {...config.doctorDetails, regNo: e.target.value}})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400">ডিগ্রি</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={config.doctorDetails.degree} onChange={e => setConfig({...config, doctorDetails: {...config.doctorDetails, degree: e.target.value}})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400">বিশেষজ্ঞ</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={config.doctorDetails.specialty} onChange={e => setConfig({...config, doctorDetails: {...config.doctorDetails, specialty: e.target.value}})} />
                    </div>
                  </div>
                  
                  <div className="pt-4 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ডিজিটাল সাক্ষর (Digital Signature)</label>
                    <div className="flex items-center gap-6">
                      <div className="w-48 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center relative group">
                        {config.digitalSignature ? (
                          <>
                            <img src={config.digitalSignature} className="max-h-full max-w-full mix-blend-multiply" />
                            <button onClick={() => setConfig({...config, digitalSignature: ''})} className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                          </>
                        ) : <Signature className="text-slate-200" size={32} />}
                      </div>
                      <button onClick={() => sigInputRef.current?.click()} className="flex items-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-slate-800 transition-all">
                        <Camera size={20} /> আপলোড করুন
                      </button>
                      <input type="file" ref={sigInputRef} className="hidden" onChange={e => handleFileUpload(e, 'digitalSignature', 2/1)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-600 p-12 rounded-[50px] shadow-2xl text-white relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-700"><FileText size={300} fill="currentColor" /></div>
               <h4 className="text-3xl font-black mb-4">সবকিছু ঠিক আছে?</h4>
               <p className="text-blue-100 text-lg font-bold max-w-xl">আপনার করা পরিবর্তনগুলো সাথে সাথে সকল ইউজারের কাছে আপডেট হয়ে যাবে। প্রেসক্রিপশন প্রিন্ট করে একবার পরীক্ষা করে দেখুন।</p>
               <div className="mt-8 flex gap-4">
                  <button onClick={() => setActiveTab('settings')} className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:scale-105 transition-all"><Save size={20} /> সেভ ও শেষ করুন</button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-center"><h3 className="text-3xl font-black text-slate-800">ইউজার লিস্ট</h3><div className="relative w-96"><input className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-3xl font-bold" placeholder="নাম বা আইডি দিয়ে খুঁজুন..." value={userSearch} onChange={e => setUserSearch(e.target.value)} /><Search className="absolute left-4 top-4 text-slate-300" size={20} /></div></div>
            <div className="bg-white rounded-[50px] shadow-2xl overflow-hidden border border-slate-100">
              <table className="w-full text-left"><thead className="bg-slate-50 text-slate-400 text-xs font-black uppercase"><tr><th className="px-10 py-8">ইউজার</th><th className="px-10 py-8">ক্রেডেনশিয়াল</th><th className="px-10 py-8">অবস্থা</th><th className="px-10 py-8 text-right">অ্যাকশন</th></tr></thead>
                <tbody className="divide-y divide-slate-50">{filteredUsers.map(u => (<tr key={u.id} className="hover:bg-slate-50/30 transition-colors"><td className="px-10 py-8"><div className="flex items-center gap-4"><img src={u.photo || blankAvatar} className="w-12 h-12 rounded-2xl object-cover" /><div><div className="font-black text-slate-800 text-xl">{u.name}</div><div className="text-xs text-slate-400 font-bold">{u.mobile}</div></div></div></td><td className="px-10 py-8"><div className="flex flex-col gap-1"><span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-black">ID: {u.id}</span><span className="px-3 py-1 bg-blue-50 rounded-lg text-xs font-black">PW: {u.password}</span></div></td><td className="px-10 py-8">{u.isBlocked ? <span className="text-rose-600 bg-rose-50 px-4 py-1.5 rounded-full text-xs font-black">ব্লকড</span> : <span className="text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full text-xs font-black">সক্রিয়</span>}</td><td className="px-10 py-8 text-right"><button onClick={() => toggleBlock(u.id)} className={`px-6 py-3 rounded-2xl text-sm font-black transition-all ${u.isBlocked ? 'bg-emerald-600 text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'}`}>{u.isBlocked ? 'আনব্লক' : 'ব্লক করুন'}</button></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'prices' && (
          <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500">
            <h3 className="text-3xl font-black text-slate-800">মূল্য তালিকা আপডেট</h3>
            <div className="bg-white p-10 rounded-[50px] shadow-xl border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
              <input className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="ব্র্যান্ড" value={newPrice.brandName} onChange={e => setNewPrice({...newPrice, brandName: e.target.value})} />
              <input className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="জেনেরিক" value={newPrice.genericName} onChange={e => setNewPrice({...newPrice, genericName: e.target.value})} />
              <input className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="কোম্পানি" value={newPrice.company} onChange={e => setNewPrice({...newPrice, company: e.target.value})} />
              <div className="flex gap-2"><input className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="৳" value={newPrice.price} onChange={e => setNewPrice({...newPrice, price: e.target.value})} /><button onClick={handleAddPrice} className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl"><Plus /></button></div>
            </div>
            <div className="bg-white rounded-[50px] shadow-2xl overflow-hidden border border-slate-100">
               <table className="w-full text-left"><thead className="bg-slate-50 text-slate-400 text-xs font-black uppercase"><tr><th className="px-10 py-6">ঔষধ</th><th className="px-10 py-6">মূল্য</th><th className="px-10 py-6 text-right">অ্যাকশন</th></tr></thead>
                 <tbody className="divide-y divide-slate-50">{priceList.map(p => (<tr key={p.id} className="hover:bg-slate-50/50 transition-colors"><td className="px-10 py-6 font-black text-slate-800 text-lg">{p.brandName}<div className="text-xs text-slate-400">{p.genericName}</div></td><td className="px-10 py-6 font-black text-blue-600 text-xl">৳{p.price}</td><td className="px-10 py-6 text-right space-x-2"><button onClick={() => editPrice(p)} className="p-3 bg-slate-50 rounded-xl"><Edit size={18} /></button><button onClick={() => removePrice(p.id)} className="p-3 bg-rose-50 text-rose-500 rounded-xl"><Trash2 size={18} /></button></td></tr>))}</tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-12 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <h3 className="text-3xl font-black text-slate-800">অর্ডার লিস্ট</h3>
            {orders.length === 0 && <div className="p-20 bg-white rounded-[50px] border-2 border-dashed flex flex-col items-center opacity-30 italic font-bold">কোনো নতুন অর্ডার নেই</div>}
            {orders.map(order => (
              <div key={order.id} className="bg-white p-10 rounded-[50px] shadow-2xl border border-slate-100">
                <div className="flex justify-between items-start mb-8">
                   <div className="flex items-center gap-6"><div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Package size={28} /></div><div><h4 className="font-black text-xl">#{order.id.slice(-6)} - {order.userName}</h4><p className="text-xs font-bold text-slate-400">{new Date(order.timestamp).toLocaleString('bn-BD')}</p></div></div>
                   <div className="flex items-center gap-3"><button onClick={() => removeOrder(order.id)} className="p-3 bg-rose-50 text-rose-500 rounded-xl"><Trash2 size={20} /></button><span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${order.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{order.status === 'pending' ? 'পেন্ডিং' : 'প্রসেসড'}</span></div>
                </div>
                <div className="bg-slate-50 p-6 rounded-[30px] border border-slate-100 mb-8"><p className="text-[10px] font-black text-slate-400 uppercase mb-2">ঠিকানা: {order.address}</p>
                   <table className="w-full mt-4 text-sm"><thead className="border-b"><tr className="text-left font-black text-[10px] text-slate-400 uppercase tracking-widest"><th className="pb-4">ঔষধ</th><th className="pb-4 text-center">পরিমান</th><th className="pb-4 text-right">মূল্য সেট করুন (৳)</th></tr></thead>
                      <tbody className="divide-y divide-slate-50">{order.items.map((it, idx) => (<tr key={idx}><td className="py-4 font-bold">{it.medicineName}</td><td className="py-4 text-center font-bold">{it.quantity}</td><td className="py-4 text-right">{order.status === 'pending' ? (<input type="number" className="w-24 p-2 bg-white border border-slate-200 rounded-xl text-right font-black" placeholder="৳" value={itemPrices[order.id]?.[idx] || ''} onChange={e => updateItemPrice(order.id, idx, e.target.value)} />) : (<span className="font-black text-blue-600">৳{it.pricePerUnit}</span>)}</td></tr>))}</tbody>
                   </table>
                </div>
                {order.status === 'pending' && (<div className="flex flex-col gap-4 pt-4 border-t"><textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-[25px] font-bold" placeholder="গ্রাহকের জন্য মেসেজ..." value={replyText[order.id] || ''} onChange={e => setReplyText({...replyText, [order.id]: e.target.value})} /><button onClick={() => handleOrderReply(order.id)} className="w-full bg-blue-600 text-white py-5 rounded-[30px] font-black text-lg shadow-xl hover:scale-[1.02] transition-all">রিপ্লাই পাঠান</button></div>)}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="max-w-6xl mx-auto h-[80vh] flex bg-white rounded-[50px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in duration-500">
            <div className="w-80 border-r border-slate-100 flex flex-col"><div className="p-8 border-b bg-slate-50"><h4 className="font-black text-xl">মেসেজ লিস্ট</h4></div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">{chatUsers.map(u => (<button key={u.id} onClick={() => setSelectedChatUser(u.id)} className={`w-full p-6 flex items-center gap-4 hover:bg-slate-50 transition-all border-b ${selectedChatUser === u.id ? 'bg-blue-50 border-r-4 border-r-blue-600' : ''}`}><img src={u.photo || blankAvatar} className="w-12 h-12 rounded-2xl object-cover" /><div><p className="font-black">{u.name}</p><p className="text-[10px] font-bold text-slate-400">ID: {u.id}</p></div></button>))}</div>
            </div>
            <div className="flex-1 flex flex-col bg-slate-50/50">
              {selectedChatUser ? (
                <>
                  <div className="p-8 bg-white border-b flex items-center gap-4"><h4 className="font-black">{users.find(u => u.id === selectedChatUser)?.name}</h4></div>
                  <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">{messages.filter(m => m.senderId === selectedChatUser || m.receiverId === selectedChatUser).map(m => (<div key={m.id} className={`flex ${m.senderId === 'admin' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[75%] p-5 rounded-[25px] shadow-sm font-bold text-sm ${m.senderId === 'admin' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>{m.text}<div className="text-[9px] mt-2 opacity-50 text-right">{new Date(m.timestamp).toLocaleTimeString('bn-BD')}</div></div></div>))}</div>
                  <div className="p-8 bg-white border-t flex gap-4">
                    <input className="flex-1 p-5 bg-slate-50 rounded-[25px] outline-none font-bold border border-slate-100" placeholder="উত্তর লিখুন..." value={adminChatMessage} onChange={e => setAdminChatMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAdminChatMessage()} />
                    <button onClick={handleAdminChatMessage} className="bg-blue-600 text-white px-10 rounded-[25px] font-black shadow-xl">পাঠান</button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-20"><MessageSquare size={100} /><p className="text-2xl font-black mt-6">একটি চ্যাট সিলেক্ট করুন</p></div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
