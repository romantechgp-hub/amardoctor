
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, AppConfig, Medicine, Order, OrderItem, Message, Prescription, AppNotification } from '../types';
import { THEMES, DEFAULT_SYMPTOMS, DEFAULT_DISEASES, DEFAULT_TESTS, BLOOD_GROUPS } from '../constants';
import { generatePrescriptionAI, findMedicineInfo, getMedicineDetails } from '../services/geminiService';
import { 
  User as UserIcon, Activity, History, ShoppingBag, Search, 
  MessageCircle, FileText, Camera, Printer, Trash2, 
  LogOut, Clock, XCircle, LayoutDashboard, Plus, ChevronRight, 
  Settings as SettingsIcon, Package, BadgeDollarSign, Heart, ShieldCheck, HelpCircle, Crop, ShoppingCart, Download, QrCode, MapPin, PhoneCall, Bell, Minus, ShoppingBasket,
  RefreshCw, CheckCircle2, Save, X, PlusCircle, Check, ListPlus, UploadCloud, UserPlus, Fingerprint, AlertTriangle, Stethoscope, HandHeart, Sparkles, ClipboardList, Image as ImageIcon, Mail
} from 'lucide-react';
import ImageCropper from './ImageCropper';

// Dynamic imports to prevent build errors and blank screen on Vercel
const loadPDFLib = async () => {
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;
  return { jsPDF, html2canvas };
};

interface UserPanelProps {
  user: User;
  setUser: (user: User) => void;
  config: AppConfig;
  logout: () => void;
  priceList: Medicine[];
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  addNotification: (to: string | 'admin', message: string) => void;
}

const UserPanel: React.FC<UserPanelProps> = ({ user, setUser, config, logout, priceList, orders, setOrders, messages, setMessages, notifications, setNotifications, addNotification }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'intake' | 'history' | 'store' | 'priceList' | 'messages' | 'search' | 'medicineGuide'>('home');
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const memoRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const prescriptionRef = useRef<HTMLDivElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  
  const [profileData, setProfileData] = useState<User>(user);

  const [intake, setIntake] = useState({
    name: user.name || '',
    age: user.age || '',
    gender: user.gender || '',
    symptoms: [] as string[],
    customSymptoms: '',
    diseases: [] as string[],
    customDiseases: '',
    pastMedicines: '',
    bp: '',
    diabetes: '',
    selectedTests: [] as string[],
    testResult: '',
    testImage: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'brand' | 'generic'>('brand');
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [manualEntry, setManualEntry] = useState({ name: '', quantity: '1' });

  const [priceSearch, setPriceSearch] = useState('');
  const [medicineGuideQuery, setMedicineGuideQuery] = useState('');
  const [medicineGuideResult, setMedicineGuideResult] = useState<string | null>(null);
  const [chatText, setChatText] = useState('');

  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => {
    try {
      const saved = localStorage.getItem(`pres_${user.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [currentPrescription, setCurrentPrescription] = useState<Prescription | null>(null);

  const [draftOrderItems, setDraftOrderItems] = useState<OrderItem[]>([]);
  const [orderFormMeta, setOrderFormMeta] = useState({ address: user.address || '', phone: user.mobile || '', note: '' });
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const [cropModal, setCropModal] = useState<{ show: boolean, image: string, aspect: number }>({
    show: false, image: '', aspect: 1
  });

  const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23cbd5e1' viewBox='0 0 24 24'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

  const unreadRepliesCount = useMemo(() => {
    return notifications.filter(n => n.to === user.id && !n.read).length;
  }, [notifications, user.id]);

  useEffect(() => {
    setProfileData(user);
    if (!intake.name) {
      setIntake(prev => ({
        ...prev,
        name: user.name || '',
        age: user.age || '',
        gender: user.gender || ''
      }));
    }
    setOrderFormMeta(prev => ({ ...prev, address: user.address || '', phone: user.mobile || '' }));
  }, [user]);

  useEffect(() => {
    if (activeTab === 'messages') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    if (tab === 'store' || tab === 'messages') {
      setNotifications(prev => prev.map(n => n.to === user.id ? { ...n, read: true } : n));
    }
    if (tab === 'history' && prescriptions.length > 0 && !currentPrescription) {
      setCurrentPrescription(prescriptions[0]);
    }
  };

  const handleProfileSave = () => {
    setUser(profileData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const addToDraftOrder = (med: Partial<Medicine>) => {
    const medicineName = med.brandName || '';
    const existing = draftOrderItems.find(item => item.medicineName === medicineName);
    if (existing) {
      setDraftOrderItems(draftOrderItems.map(item => 
        item.medicineName === medicineName 
        ? { ...item, quantity: (parseInt(item.quantity) + 1).toString() } 
        : item
      ));
    } else {
      setDraftOrderItems([...draftOrderItems, { medicineName, quantity: '1', pricePerUnit: med.price || '0' }]);
    }
    setAddedItems(prev => new Set(prev).add(medicineName));
    setTimeout(() => {
      setAddedItems(prev => {
        const next = new Set(prev);
        next.delete(medicineName);
        return next;
      });
    }, 1500);
  };

  const handleManualAdd = () => {
    if (!manualEntry.name.trim()) return;
    const medInList = priceList.find(p => p.brandName.toLowerCase() === manualEntry.name.toLowerCase());
    setDraftOrderItems([...draftOrderItems, { medicineName: manualEntry.name, quantity: manualEntry.quantity, pricePerUnit: medInList ? medInList.price : '0' }]);
    setManualEntry({ name: '', quantity: '1' });
  };

  const updateQuantity = (index: number, delta: number) => {
    setDraftOrderItems(draftOrderItems.map((item, i) => i === index ? { ...item, quantity: Math.max(1, parseInt(item.quantity) + delta).toString() } : item));
  };

  const removeDraftItem = (index: number) => setDraftOrderItems(draftOrderItems.filter((_, i) => i !== index));

  const handleFinalOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftOrderItems.length === 0) return;
    const newOrder: Order = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      items: draftOrderItems,
      totalPrice: draftOrderItems.reduce((acc, it) => acc + (parseFloat(it.pricePerUnit) * parseFloat(it.quantity)), 0),
      address: orderFormMeta.address,
      phone: orderFormMeta.phone,
      note: orderFormMeta.note,
      status: 'pending',
      timestamp: Date.now()
    };
    setOrders(prev => [newOrder, ...prev].slice(0, 5));
    addNotification('admin', `নতুন ঔষধের অর্ডার: ${user.name}`);
    setDraftOrderItems([]);
    alert('অর্ডার সফল হয়েছে। এডমিন চেক করে রিপ্লাই দেবেন।');
  };

  const downloadPDF = async (orderId: string) => {
    const element = memoRefs.current[orderId];
    if (!element) return;
    setIsProcessing(true);
    try {
      const { jsPDF, html2canvas } = await loadPDFLib();
      const canvas = await html2canvas(element, { scale: 3 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 10, 10, 140, (canvas.height * 140) / canvas.width);
      pdf.save(`Memo_${orderId.slice(-6)}.pdf`);
    } catch (err) {
      console.error(err);
      alert('PDF ডাউনলোড করতে সমস্যা হয়েছে।');
    }
    setIsProcessing(false);
  };

  const downloadPrescriptionPDF = async () => {
    if (!prescriptionRef.current) return;
    setIsProcessing(true);
    try {
      const { jsPDF, html2canvas } = await loadPDFLib();
      const element = prescriptionRef.current;
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const actions = clonedDoc.getElementById('pres-actions');
          if (actions) actions.style.display = 'none';
        }
      });
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Prescription_${currentPrescription?.id.slice(-6)}.pdf`);
    } catch (error) {
      console.error(error);
      alert('Error downloading PDF');
    }
    setIsProcessing(false);
  };

  const handleGeneratePrescription = async () => {
    if (!intake.symptoms.length && !intake.customSymptoms) return alert('লক্ষণ লিখুন');
    setIsProcessing(true);
    const patientInfo = { name: intake.name, age: intake.age, gender: intake.gender };
    
    // Construct a comprehensive history string for the AI
    const historyString = [
      intake.diseases.length > 0 ? `আগের রোগ: ${intake.diseases.join(', ')}` : '',
      intake.customDiseases ? `অন্যান্য রোগ: ${intake.customDiseases}` : '',
      intake.pastMedicines ? `আগের ঔষধ: ${intake.pastMedicines}` : '',
      intake.selectedTests.length > 0 ? `করা টেস্ট: ${intake.selectedTests.join(', ')}` : '',
      intake.testResult ? `টেস্ট রেজাল্ট: ${intake.testResult}` : ''
    ].filter(Boolean).join('; ');

    const result = await generatePrescriptionAI(patientInfo, intake.symptoms, intake.customSymptoms, historyString, intake.bp, intake.diabetes);
    setIsProcessing(false);
    if (result) {
      const newP: Prescription = { 
        id: Date.now().toString(), 
        userId: user.id, 
        date: new Date().toLocaleDateString('bn-BD'), 
        patientName: intake.name || user.name,
        age: intake.age || user.age || '',
        gender: intake.gender || user.gender || '',
        bp: intake.bp,
        diabetes: intake.diabetes,
        symptoms: [...intake.symptoms, intake.customSymptoms].filter(Boolean), 
        ...result 
      };
      const newHistory = [newP, ...prescriptions].slice(0, 5);
      setPrescriptions(newHistory);
      localStorage.setItem(`pres_${user.id}`, JSON.stringify(newHistory));
      setCurrentPrescription(newP);
      setActiveTab('history');
    }
  };

  const handleSearchMedicine = async () => {
    if (!searchQuery.trim()) return;
    setIsProcessing(true);
    setSearchResults(await findMedicineInfo(searchQuery, searchType));
    setIsProcessing(false);
  };

  const handleMedicineGuideSearch = async () => {
    if (!medicineGuideQuery.trim()) return;
    setIsProcessing(true);
    setMedicineGuideResult(await getMedicineDetails(medicineGuideQuery));
    setIsProcessing(false);
  };

  const handleSendMessage = () => {
    if (!chatText.trim()) return;
    const newMessage: Message = { id: Date.now().toString(), senderId: user.id, receiverId: 'admin', text: chatText, timestamp: Date.now() };
    setMessages([...messages, newMessage]);
    setChatText('');
    addNotification('admin', `ইউজার ${user.name} একটি নতুন মেসেজ পাঠিয়েছেন।`);
  };

  const handleTestImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setIntake({ ...intake, testImage: ev.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setCropModal({ show: true, image: ev.target?.result as string, aspect: 1 });
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCropComplete = (croppedImage: string) => {
    setProfileData({ ...profileData, photo: croppedImage });
    setCropModal({ ...cropModal, show: false });
  };

  const activeThemeColor = THEMES.find(t => t.id === user.theme)?.color || '#3b82f6';
  const prescriptionThemeColor = THEMES.find(t => t.id === config.prescriptionTheme)?.color || '#3b82f6';

  const dashboardOptions = [
    { id: 'intake', icon: Plus, label: 'নতুন প্রেসক্রিপশন', desc: 'AI প্রেসক্রিপশন লিখুন', color: 'bg-blue-600' },
    { id: 'profile', icon: UserIcon, label: 'আমার প্রোফাইল', desc: 'ব্যক্তিগত তথ্য ও থিম', color: 'bg-indigo-500' },
    { id: 'history', icon: History, label: 'পূর্বের ইতিহাস', desc: 'রেকর্ড ও রিপোর্ট দেখুন', color: 'bg-rose-500' },
    { id: 'medicineGuide', icon: HelpCircle, label: 'ঔষধের কাজ', desc: 'বিস্তারিত তথ্য জানুন', color: 'bg-cyan-600' },
    { id: 'search', icon: Search, label: 'ঔষধ সন্ধান', desc: 'ব্র্যান্ড বা জেনেরিক ঔষধ', color: 'bg-orange-500' },
    { id: 'priceList', icon: BadgeDollarSign, label: 'ঔষধের মূল্য', desc: 'বাজার মূল্য দেখে নিন', color: 'bg-emerald-500' },
    { id: 'store', icon: Package, label: 'ঔষধ অর্ডার', desc: 'অনলাইনে ঔষধ কিনুন', color: 'bg-blue-500', hasBadge: unreadRepliesCount > 0 },
    { id: 'messages', icon: MessageCircle, label: 'সরাসরি চ্যাট', desc: 'যোগাযোগ করুন', color: 'bg-purple-500' },
  ];

  return (
    <div className={`min-h-screen bg-[#fcfdfe] flex flex-col md:flex-row theme-${user.theme} custom-scrollbar overflow-hidden`} style={{ '--primary': activeThemeColor } as any}>
      {cropModal.show && <ImageCropper image={cropModal.image} aspect={cropModal.aspect} onCropComplete={handleCropComplete} onCancel={() => setCropModal({ ...cropModal, show: false })} />}

      <aside className="hidden md:flex w-72 glass border-r flex-col p-8 z-50 no-print">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg" style={{backgroundColor: 'var(--primary)'}}><Heart size={22} fill="currentColor" /></div>
          <h1 className="text-xl font-black text-slate-800 leading-tight">আমার ডাক্তার</h1>
        </div>
        <nav className="flex-1 space-y-3">
          {dashboardOptions.map(item => (
            <button key={item.id} onClick={() => handleTabChange(item.id as any)} className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-primary-light hover:text-primary'}`} style={activeTab === item.id ? { backgroundColor: 'var(--primary)' } : {}}>
              <div className="flex items-center gap-4"><item.icon size={20} /><span>{item.label}</span></div>
              {item.hasBadge && <div className="w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">{unreadRepliesCount}</div>}
            </button>
          ))}
        </nav>
        <button onClick={logout} className="mt-8 flex items-center gap-4 px-5 py-4 text-rose-500 font-bold hover:bg-rose-50 rounded-2xl transition-all"><LogOut size={20} /> লগআউট</button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white/50 backdrop-blur-md border-b flex items-center justify-between px-6 md:px-12 no-print z-40">
          <div className="md:hidden flex items-center gap-2"><Heart className="text-primary" size={24} style={{color: 'var(--primary)'}} /><span className="font-black text-lg">আমার ডাক্তার</span></div>
          <h2 className="hidden md:block text-lg font-black text-slate-700">{config.homeHeader}</h2>
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab('store')} className="relative p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:scale-105 active:scale-95 transition-all"><ShoppingCart className="text-slate-400" size={22} />{draftOrderItems.length > 0 && <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center">{draftOrderItems.length}</span>}</button>
            <button onClick={() => setActiveTab('profile')} className="w-12 h-12 bg-white rounded-2xl shadow-sm border p-0.5 overflow-hidden active:scale-95 transition-transform"><img src={user.photo || defaultAvatar} className="w-full h-full object-cover rounded-[14px]" /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-12 pb-12 bg-[#fcfdfe]">
          {activeTab === 'home' && (
            <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
              {config.bannerImage && (
                <div className="w-full rounded-[40px] overflow-hidden shadow-2xl relative group border-4 border-white transition-all bg-slate-100">
                  <img src={config.bannerImage} className="w-full h-auto block transition-transform duration-1000 group-hover:scale-105" alt="Banner" />
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 relative group overflow-hidden rounded-[50px] shadow-2xl bg-gradient-to-br from-primary to-indigo-600 p-12 text-white" style={{background: `linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)`}}>
                  <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700"><Heart size={250} fill="currentColor" /></div>
                  <h1 className="text-5xl font-black mb-6">সুপ্রভাত, {user.name}!</h1>
                  <p className="text-white/80 text-xl max-w-lg font-medium leading-relaxed">{config.welcomeBanner.title}</p>
                  <div className="mt-10 flex flex-wrap gap-4">
                    <button onClick={() => setActiveTab('intake')} className="bg-white text-primary px-8 py-4 rounded-3xl font-black shadow-2xl hover:scale-105 transition-transform flex items-center gap-3" style={{color: 'var(--primary)'}}><Plus size={22} strokeWidth={4} /> নতুন প্রেসক্রিপশন</button>
                    <button onClick={() => setActiveTab('store')} className="bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-3xl font-black border border-white/30 hover:bg-white/30 transition-all flex items-center gap-3"><ShoppingBag size={22} /> ঔষধ অর্ডার</button>
                  </div>
                </div>
                <div className="bg-white p-10 rounded-[50px] shadow-2xl border border-slate-50 flex flex-col justify-between relative overflow-hidden group">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><History className="text-primary" style={{color: 'var(--primary)'}} /> শেষ রেকর্ড</h3>
                  <div className="mt-8 space-y-4">
                    {prescriptions.length > 0 ? (
                      <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 cursor-pointer hover:bg-white transition-colors" onClick={() => setActiveTab('history')}>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{prescriptions[0].date}</p>
                        <p className="text-xl font-black text-slate-800">{prescriptions[0].diagnosis}</p>
                      </div>
                    ) : <p className="text-slate-300 font-bold italic py-10 text-center">কোনো রেকর্ড নেই</p>}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {dashboardOptions.map(item => (
                  <button key={item.id} onClick={() => handleTabChange(item.id as any)} className="group card-hover glass p-8 rounded-[40px] flex flex-col items-start gap-6 text-left relative overflow-hidden border border-white/50">
                    <div className={`w-16 h-16 ${item.color} rounded-[24px] flex items-center justify-center text-white shadow-xl`}><item.icon size={30} strokeWidth={2.5} /></div>
                    <div><h4 className="font-black text-2xl text-slate-800 mb-2 leading-none">{item.label}</h4><p className="text-slate-400 font-bold text-sm leading-tight">{item.desc}</p></div>
                  </button>
                ))}
              </div>

              {/* Welcome Banner */}
              <div className="p-12 bg-white rounded-[50px] shadow-2xl border border-slate-100 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 group-hover:scale-110 transition-transform"><HandHeart size={200} /></div>
                <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                  <div className="w-full md:w-1/3 aspect-[4/3] rounded-[40px] overflow-hidden border-8 border-slate-50 shadow-xl">
                    <img src={config.welcomeBanner.image || 'https://picsum.photos/400/300?doctor=1'} className="w-full h-full object-cover" alt="Welcome" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-6"><Sparkles className="text-amber-500" size={28} /><span className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">অ্যাডমিন বার্তা</span></div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 leading-tight mb-6">{config.welcomeBanner.title}</h2>
                    <button onClick={() => setActiveTab('messages')} className="bg-primary text-white px-10 py-5 rounded-3xl font-black shadow-xl hover:scale-105 transition-all flex items-center justify-center md:justify-start gap-3 mx-auto md:mx-0" style={{backgroundColor: 'var(--primary)'}}><MessageCircle size={22} /> সরাসরি চ্যাট শুরু করুন</button>
                  </div>
                </div>
              </div>

              {/* Professional Footer */}
              <footer className="mt-12 pt-12 border-t border-slate-100 pb-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                  <div className="text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                      <Heart className="text-primary" size={32} style={{color: 'var(--primary)'}} />
                      <span className="text-2xl font-black text-slate-800">আমার ডাক্তার</span>
                    </div>
                    <p className="text-slate-400 font-bold max-w-sm">{config.homeFooter}</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-8 rounded-[40px] flex flex-col md:flex-row justify-between items-center gap-6 border border-slate-100">
                  <div className="flex flex-col items-center md:items-start gap-1">
                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Made by Rimon Mahmud Roman</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                      <span className="flex items-center gap-1.5"><PhoneCall size={12} className="text-blue-500" /> 01617365471</span>
                      <span className="flex items-center gap-1.5"><Mail size={12} className="text-blue-500" /> romantechgp@gmail.com</span>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <button className="text-[10px] font-black text-slate-400 uppercase hover:text-slate-600 transition-colors">প্রাইভেসি পলিসি</button>
                    <button className="text-[10px] font-black text-slate-400 uppercase hover:text-slate-600 transition-colors">টার্মস অফ ইউজ</button>
                  </div>
                </div>
              </footer>
            </div>
          )}
          {activeTab === 'profile' && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
              <div className="bg-white p-12 rounded-[50px] shadow-2xl border border-slate-100 relative">
                <div className="absolute top-10 right-10 flex gap-3 flex-wrap justify-end max-w-xs">
                  {THEMES.map(t => (
                    <button key={t.id} onClick={() => setProfileData({ ...profileData, theme: t.id })} className={`w-6 h-6 rounded-full border-4 transition-all ${profileData.theme === t.id ? 'border-slate-800 scale-125' : 'border-white shadow-md'}`} style={{ backgroundColor: t.color }} title={t.name} />
                  ))}
                </div>
                <div className="flex flex-col md:flex-row gap-12 items-center">
                  <div className="relative group">
                    <div className="w-48 h-48 bg-slate-50 rounded-[60px] flex items-center justify-center overflow-hidden border-8 border-white shadow-2xl relative transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                      <img src={profileData.photo || defaultAvatar} className="w-full h-full object-cover group-hover:opacity-50" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600/20"><Crop className="text-white" size={40} /></div>
                    </div>
                    <label className="absolute -bottom-4 -right-4 bg-primary text-white p-4 rounded-3xl cursor-pointer shadow-2xl hover:scale-110 transition-transform active:scale-90" style={{backgroundColor: 'var(--primary)'}}>
                      <Camera size={24} strokeWidth={3} />
                      <input type="file" className="hidden" onChange={handleProfilePhotoUpload} />
                    </label>
                  </div>
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">নাম</label><input className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold" value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} /></div>
                    <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">বয়স</label><input className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold" value={profileData.age} onChange={e => setProfileData({ ...profileData, age: e.target.value })} /></div>
                    <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">রক্তের গ্রুপ</label><select className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold" value={profileData.bloodGroup} onChange={e => setProfileData({ ...profileData, bloodGroup: e.target.value })}><option value="">সিলেক্ট করুন</option>{BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                    <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">মোবাইল</label><input className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold" value={profileData.mobile} onChange={e => setProfileData({ ...profileData, mobile: e.target.value })} /></div>
                    <div className="sm:col-span-2 space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">ঠিকানা</label><textarea rows={3} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold" value={profileData.address} onChange={e => setProfileData({ ...profileData, address: e.target.value })} /></div>
                  </div>
                </div>
                <div className="mt-12 flex items-center justify-between">
                  {saveSuccess && <div className="flex items-center gap-2 text-emerald-600 font-black animate-in fade-in slide-in-from-left-4"><CheckCircle2 size={24} /> তথ্য সফলভাবে সেভ হয়েছে</div>}
                  <button onClick={handleProfileSave} className="ml-auto bg-slate-900 text-white px-10 py-5 rounded-3xl font-black text-lg flex items-center gap-3 shadow-2xl hover:bg-slate-800 transition-all active:scale-95"><Save size={24} /> সেভ করুন</button>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'intake' && (
            <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-10 duration-500 pb-20">
              <div className="bg-white p-10 md:p-14 rounded-[50px] shadow-2xl border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary" style={{backgroundColor: 'var(--primary)'}}></div>
                <h3 className="text-3xl font-black mb-12 flex items-center gap-4 text-slate-800"><Activity className="text-primary" size={32} style={{color: 'var(--primary)'}} /> নতুন প্রেসক্রিপশন ইনপুট</h3>
                
                <div className="space-y-12">
                  <div className="space-y-6 p-8 bg-slate-50 rounded-[40px] border border-slate-100">
                    <h4 className="text-sm font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest"><UserPlus size={18} /> সাধারণ তথ্য</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2"><label className="text-xs font-bold text-slate-500">রোগীর নাম</label><input className="w-full p-5 bg-white rounded-2xl border border-slate-100 font-bold" value={intake.name} onChange={e => setIntake({ ...intake, name: e.target.value })} /></div>
                      <div className="space-y-2"><label className="text-xs font-bold text-slate-500">বয়স</label><input className="w-full p-5 bg-white rounded-2xl border border-slate-100 font-bold" value={intake.age} onChange={e => setIntake({ ...intake, age: e.target.value })} /></div>
                      <div className="space-y-2"><label className="text-xs font-bold text-slate-500">লিঙ্গ</label><select className="w-full p-5 bg-white rounded-2xl border border-slate-100 font-bold" value={intake.gender} onChange={e => setIntake({ ...intake, gender: e.target.value })}><option value="পুরুষ">পুরুষ</option><option value="মহিলা">মহিলা</option><option value="অন্যান্য">অন্যান্য</option></select></div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-sm font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest"><Fingerprint size={18} /> লক্ষণসমূহ (সিলেক্ট করুন)</h4>
                    <div className="flex flex-wrap gap-2">{DEFAULT_SYMPTOMS.map(s => <button key={s} onClick={() => setIntake({ ...intake, symptoms: intake.symptoms.includes(s) ? intake.symptoms.filter(x => x !== s) : [...intake.symptoms, s] })} className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all ${intake.symptoms.includes(s) ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-primary/30'}`} style={intake.symptoms.includes(s) ? { backgroundColor: 'var(--primary)' } : {}}>{s}</button>)}</div>
                    <textarea rows={2} className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-100 font-bold" placeholder="বিস্তারিত লক্ষণ বা অন্য কোনো সমস্যা থাকলে লিখুন..." value={intake.customSymptoms} onChange={e => setIntake({ ...intake, customSymptoms: e.target.value })} />
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-sm font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest"><AlertTriangle size={18} /> পূর্বের কোনো রোগ থাকলে সিলেক্ট করুন</h4>
                    <div className="flex flex-wrap gap-2">{DEFAULT_DISEASES.map(d => <button key={d} onClick={() => setIntake({ ...intake, diseases: intake.diseases.includes(d) ? intake.diseases.filter(x => x !== d) : [...intake.diseases, d] })} className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all ${intake.diseases.includes(d) ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-rose-300'}`}>{d}</button>)}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div className="space-y-2"><label className="text-xs font-bold text-slate-500">অন্যান্য কোনো রোগ থাকলে লিখুন</label><input className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-100 font-bold" placeholder="উদা: গ্যাস্ট্রিক, হার্টের সমস্যা" value={intake.customDiseases} onChange={e => setIntake({ ...intake, customDiseases: e.target.value })} /></div>
                      <div className="space-y-2"><label className="text-xs font-bold text-slate-500">আগে ব্যবহার করা ঔষধের নাম</label><input className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-100 font-bold" placeholder="উদা: Napa, Sergel" value={intake.pastMedicines} onChange={e => setIntake({ ...intake, pastMedicines: e.target.value })} /></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-slate-50 rounded-[40px] border border-slate-100">
                    <div className="space-y-2"><label className="text-xs font-black text-slate-500 uppercase tracking-widest">রক্তচাপ (BP)</label><input className="w-full p-5 bg-white rounded-2xl border border-slate-100 font-bold" placeholder="উদা: 120/80" value={intake.bp} onChange={e => setIntake({ ...intake, bp: e.target.value })} /></div>
                    <div className="space-y-2"><label className="text-xs font-black text-slate-500 uppercase tracking-widest">ডায়াবেটিস (Blood Sugar)</label><input className="w-full p-5 bg-white rounded-2xl border border-slate-100 font-bold" placeholder="উদা: 6.5 mmol/L" value={intake.diabetes} onChange={e => setIntake({ ...intake, diabetes: e.target.value })} /></div>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-sm font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest"><ClipboardList size={18} /> করা কোনো টেস্ট থাকলে সিলেক্ট করুন</h4>
                    <div className="flex flex-wrap gap-2">{DEFAULT_TESTS.map(t => <button key={t} onClick={() => setIntake({ ...intake, selectedTests: intake.selectedTests.includes(t) ? intake.selectedTests.filter(x => x !== t) : [...intake.selectedTests, t] })} className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all ${intake.selectedTests.includes(t) ? 'bg-indigo-500 text-white border-indigo-500 shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-300'}`}>{t}</button>)}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                      <div className="space-y-2"><label className="text-xs font-bold text-slate-500">টেস্ট রেজাল্ট বা ফলাফল লিখুন</label><textarea rows={3} className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-100 font-bold" placeholder="টেস্টের ফলাফল সম্পর্কে সংক্ষেপে লিখুন..." value={intake.testResult} onChange={e => setIntake({ ...intake, testResult: e.target.value })} /></div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500">রিপোর্ট এর ছবি আপলোড করুন</label>
                        <div className="relative h-[120px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden group">
                          {intake.testImage ? (
                            <div className="relative h-full w-full">
                              <img src={intake.testImage} className="w-full h-full object-cover" alt="Report" />
                              <button onClick={() => setIntake({ ...intake, testImage: '' })} className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform"><X size={14} /></button>
                            </div>
                          ) : (
                            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100/50 transition-colors">
                              <Camera className="text-slate-300 group-hover:text-primary transition-colors" size={32} />
                              <span className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">ছবি তুলুন বা ফাইল সিলেক্ট করুন</span>
                              <input type="file" className="hidden" accept="image/*" onChange={handleTestImageUpload} />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-20">
                  <button disabled={isProcessing} onClick={handleGeneratePrescription} className="w-full bg-primary text-white py-8 rounded-[35px] font-black text-2xl shadow-2xl flex items-center justify-center gap-6 hover:scale-[1.02] transition-all" style={{backgroundColor: 'var(--primary)'}}>
                    {isProcessing ? <><RefreshCw className="animate-spin" /> AI প্রেসক্রিপশন লিখছে...</> : <><CheckCircle2 /> প্রেসক্রিপশন তৈরি করুন</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserPanel;
