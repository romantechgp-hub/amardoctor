
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import UserPanel from './components/UserPanel';
import AdminPanel from './components/AdminPanel';
import { User, AppConfig, Medicine, Order, Message, AppNotification } from './types';
import { Bell, X, RefreshCw, AlertCircle } from 'lucide-react';

const INITIAL_CONFIG: AppConfig = {
  homeHeader: 'আমার ডাক্তার ডিজিটাল স্বাস্থ্য সেবা',
  homeFooter: 'সুস্থ থাকুন, ভালো থাকুন। আমাদের সাথেই থাকুন।',
  prescriptionHeader: 'Amar Doctor Digital Clinic',
  prescriptionFooter: 'জরুরী প্রয়োজনে নিকটস্থ হাসপাতালে যোগাযোগ করুন।',
  prescriptionTheme: 'blue',
  bannerImage: 'https://picsum.photos/1200/400?medical=1',
  welcomeBanner: {
    title: 'স্বাগতম আমাদের স্বাস্থ্য সেবায়!',
    image: 'https://picsum.photos/400/200?admin=1'
  },
  digitalSignature: '',
  doctorDetails: {
    name: 'ডাঃ মোঃ আব্দুর রহমান',
    degree: 'MBBS, BCS (Health)',
    specialty: 'মেডিসিন বিশেষজ্ঞ',
    regNo: 'BMDC-12345'
  }
};

const ErrorFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
    <div className="max-w-md w-full bg-white p-8 rounded-[40px] shadow-2xl text-center">
      <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertCircle size={40} />
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-2">অ্যাপটি লোড হতে সমস্যা হচ্ছে</h2>
      <p className="text-slate-500 font-bold mb-6">আপনার ব্রাউজারের ক্যাশ (Cache) ক্লিয়ার করে আবার চেষ্টা করুন।</p>
      <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl">আবার লোড দিন</button>
    </div>
  </div>
);

const App: React.FC = () => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load state from localStorage with safe parsing
  const getSafeData = useCallback((key: string, defaultValue: any) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      console.error(`Error loading ${key}`, e);
      return defaultValue;
    }
  }, []);

  const [users, setUsers] = useState<User[]>(() => getSafeData('ad_users', []));
  const [currentUser, setCurrentUser] = useState<User | null>(() => getSafeData('ad_current_user', null));
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem('ad_is_admin') === 'true');
  const [config, setConfig] = useState<AppConfig>(() => getSafeData('ad_config', INITIAL_CONFIG));
  const [priceList, setPriceList] = useState<Medicine[]>(() => getSafeData('ad_price_list', []));
  const [orders, setOrders] = useState<Order[]>(() => getSafeData('ad_orders', []));
  const [messages, setMessages] = useState<Message[]>(() => getSafeData('ad_messages', []));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getSafeData('ad_notifications', []));
  const [toast, setToast] = useState<string | null>(null);

  // Effect to save data and handle loading state
  useEffect(() => {
    try {
      localStorage.setItem('ad_users', JSON.stringify(users));
      localStorage.setItem('ad_current_user', JSON.stringify(currentUser));
      localStorage.setItem('ad_is_admin', isAdmin.toString());
      localStorage.setItem('ad_config', JSON.stringify(config));
      localStorage.setItem('ad_price_list', JSON.stringify(priceList));
      localStorage.setItem('ad_orders', JSON.stringify(orders));
      localStorage.setItem('ad_messages', JSON.stringify(messages));
      localStorage.setItem('ad_notifications', JSON.stringify(notifications));
      setIsLoading(false);
    } catch (e) {
      console.error("Critical: Failed to sync to storage", e);
      setHasError(true);
    }
  }, [users, currentUser, isAdmin, config, priceList, orders, messages, notifications]);

  const addNotification = (to: string | 'admin', message: string) => {
    const newNotif: AppNotification = {
      id: Date.now().toString(),
      to,
      message,
      timestamp: Date.now(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    setToast(message);
    setTimeout(() => setToast(null), 5000);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    localStorage.removeItem('ad_current_user');
    localStorage.removeItem('ad_is_admin');
  };

  if (hasError) return <ErrorFallback />;
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><RefreshCw className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <HashRouter>
      {toast && (
        <div className="fixed top-6 right-6 left-6 md:left-auto md:w-96 z-[200] animate-in slide-in-from-right-10 fade-in duration-500">
          <div className="bg-slate-900 text-white p-6 rounded-[30px] shadow-2xl flex items-center justify-between border border-white/10 backdrop-blur-xl bg-opacity-95">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center animate-pulse">
                <Bell size={20} className="text-white" />
              </div>
              <p className="font-black text-sm">{toast}</p>
            </div>
            <button onClick={() => setToast(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/login" element={
          (currentUser || isAdmin) ? <Navigate to="/" /> : 
          <Login onLogin={(user, admin) => {
            if(admin) setIsAdmin(true);
            else setCurrentUser(user);
          }} users={users} setUsers={setUsers} />
        } />
        
        <Route path="/" element={
          isAdmin ? (
            <AdminPanel 
              config={config} 
              setConfig={setConfig} 
              users={users} 
              setUsers={setUsers} 
              logout={handleLogout} 
              priceList={priceList} 
              setPriceList={setPriceList} 
              orders={orders} 
              setOrders={setOrders} 
              messages={messages} 
              setMessages={setMessages}
              notifications={notifications}
              setNotifications={setNotifications}
              addNotification={addNotification}
            />
          ) : currentUser ? (
            <UserPanel 
              user={currentUser} 
              setUser={setCurrentUser} 
              config={config} 
              logout={handleLogout} 
              priceList={priceList} 
              orders={orders} 
              setOrders={setOrders} 
              messages={messages} 
              setMessages={setMessages}
              notifications={notifications}
              setNotifications={setNotifications}
              addNotification={addNotification}
            />
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
