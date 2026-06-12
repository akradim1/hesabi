import React, { useState, useEffect } from 'react';
import { OfflineDatabase } from './db/offlineDb';
import { Product, Person, Invoice } from './types';
import Sidebar from './components/Sidebar';
import PersonsTab from './components/PersonsTab';
import DebtorsTab from './components/DebtorsTab';
import ShareholdersTab from './components/ShareholdersTab';
import EmployeesTab from './components/EmployeesTab';
import ProductsTab from './components/ProductsTab';
import CategoriesTab from './components/CategoriesTab';
import PriceUpdateTab from './components/PriceUpdateTab';
import QuickPosTab from './components/QuickPosTab';
import InvoiceTab from './components/InvoiceTab';
import InvoiceHistoryTab from './components/InvoiceHistoryTab';
import InventoryTab from './components/InventoryTab';
import InventoryLogsTab from './components/InventoryLogsTab';
import ElectronIpcTab from './components/ElectronIpcTab';
import UsersTab from './components/UsersTab';
import LicensingPortal from './components/LicensingPortal';
import SettingsTab from './components/SettingsTab';
import { SettingsService, AppSettings } from './utils/settings';

import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Boxes, 
  Clock, 
  Calendar,
  Building,
  UserCheck,
  RefreshCw,
  PlusCircle,
  FilePlus2,
  TrendingDown,
  LayoutDashboard,
  Shield,
  User
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('quick-pos'); // پیش فرض روی صندوق فروش سریع
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLicensed, setIsLicensed] = useState<boolean>(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(SettingsService.get());

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setAppSettings(SettingsService.get());
    };
    window.addEventListener('cofeclick_settings_updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('cofeclick_settings_updated', handleSettingsUpdate);
    };
  }, []);

  const [dbStats, setDbStats] = useState({
    productsCount: 0,
    personsCount: 0,
    invoicesCount: 0,
    totalSales: 0,
    debtorsSum: 0,
    creditorsSum: 0
  });

  // ساعت پویای فارسی بالا سمت چپ
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // ۱. مقداردهی اولیه پایگاه داده آفلاین در صورت نبودن داده
    OfflineDatabase.init();
    recalculateDashboardStats();

    // تنظیم کاربر فعال جاری از دیتابیس
    const systemUsers = OfflineDatabase.getUsers();
    // پیدا کردن آخرین ادمین ثبت‌شده
    const admins = systemUsers.filter(u => u.role === 'Admin');
    const defaultLoggedUser = admins[admins.length - 1] || systemUsers[0];
    if (defaultLoggedUser && !currentUser) {
      setCurrentUser(defaultLoggedUser);
    }

    // ۲. راه اندازی ساعت پویا
    const timer = setInterval(() => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      setCurrentTime(now.toLocaleTimeString('fa-IR', options));
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTab, isLicensed]);

  // ریست خودکار یوزر ارشد در زمان فعالسازی معتبر لایسنس
  useEffect(() => {
    if (isLicensed) {
      const systemUsers = OfflineDatabase.getUsers();
      const admins = systemUsers.filter(u => u.role === 'Admin');
      const latestAdmin = admins[admins.length - 1] || systemUsers[0];
      if (latestAdmin) {
        setCurrentUser(latestAdmin);
      }
      recalculateDashboardStats();
    }
  }, [isLicensed]);

  // Synchronize active user to localStorage for auditing & enforce custom role permissions
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('shop_accounting_active_user', JSON.stringify(currentUser));
      
      // Enforce custom role permissions on activeTab
      const role = currentUser.role || 'Admin';
      if (role !== 'Admin') {
        const getRolePermissions = (roleName: string): string[] => {
          const raw = localStorage.getItem('shop_accounting_role_permissions');
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed[roleName]) return parsed[roleName];
            } catch (e) {}
          }
          if (roleName === 'Salesperson') {
            return ['dashboard', 'quick-pos', 'invoice-history'];
          }
          if (roleName === 'Accountant') {
            return [
              'dashboard', 
              'persons-list', 'persons-debtors', 'persons-shareholders',
              'items-list', 'items-bulk-price',
              'quick-pos', 'standard-invoice', 'invoice-history',
              'inventory-levels', 'inventory-logs'
            ];
          }
          return ['dashboard'];
        };
        
        const permitted = getRolePermissions(role);
        
        const isTabAllowed = (tabId: string) => {
          if (permitted.includes(tabId)) return true;
          if (tabId.startsWith('settings-') && permitted.includes('settings')) return true;
          if (tabId.startsWith('persons-') && permitted.includes(tabId)) return true;
          return false;
        };

        if (!isTabAllowed(activeTab)) {
          const fallback = permitted.find(t => t !== 'settings') || 'dashboard';
          setActiveTab(fallback);
        }
      }
    } else {
      localStorage.removeItem('shop_accounting_active_user');
    }
  }, [currentUser, activeTab]);

  const recalculateDashboardStats = () => {
    const products = OfflineDatabase.getProducts();
    const persons = OfflineDatabase.getPersons();
    const invoices = OfflineDatabase.getInvoices();

    // محاسبه هشدارهای موجودی کم
    const lowCount = products.filter(p => p.stock_quantity <= 10).length;
    setLowStockCount(lowCount);

    // محاسبه مبالغ بدهکاران و بستانکاران
    let dSum = 0;
    let cSum = 0;
    persons.forEach(p => {
      if (p.balance > 0) dSum += p.balance;
      else if (p.balance < 0) cSum += p.balance;
    });

    // جمع کل فروش‌ها
    const saleInvoices = invoices.filter(inv => inv.type === 'Sale' || inv.type === 'Quick Sale');
    const totalSales = saleInvoices.reduce((sum, inv) => sum + inv.final_amount, 0);

    setDbStats({
      productsCount: products.length,
      personsCount: persons.length - 1, // مشتری عمومی را در آمارها حذف می‌کنیم
      invoicesCount: invoices.length,
      totalSales,
      debtorsSum: dSum,
      creditorsSum: Math.abs(cSum)
    });
  };

  const handleTabChange = (tabId: string, parentMenuId: string | null) => {
    setActiveTab(tabId);
  };

  const formatToman = (val: number) => {
    return val.toLocaleString('fa-IR') + ' تومان';
  };

  if (!isLicensed) {
    return <LicensingPortal onValidated={(info) => setIsLicensed(true)} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-right font-sans" id="app-viewport">
      
      {/* کامپوننت منوی آکاردئونی یکتای سایدبار */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        lowStockCount={lowStockCount} 
        currentUserRole={currentUser?.role}
        storeName={appSettings.storeName}
      />

      {/* بخش محتوای صفحات */}
      <div className="flex-1 flex flex-col h-full overflow-hidden" id="page-contents-wrapper">
        
        {/* نوار برتر (Top Navbar & Quick Status indicators) */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shadow-xs select-none" id="primary-app-header">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-800 bg-emerald-500/10 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-500/10">
               دیتابیس در وضعیت آفلاین (Local Engine)
            </span>
            <span className="text-[11px] text-slate-400 font-medium font-sans">سند تراکنش‌ها به صورت آنی در حافظه SQLite پیاده فیزیکی می‌شود.</span>
          </div>

          <div className="flex items-center gap-4" id="header-time-block">
            {/* کلید تغییر سریع نقش‌ها برای ارزیابی */}
            {currentUser && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 rounded-xl px-2.5 py-1.5 text-slate-700 shadow-2xs" id="user-role-selection-pill">
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] text-slate-400 font-medium font-sans">ورود با نقش:</span>
                <select
                  id="user-role-switch"
                  value={currentUser.id}
                  onChange={(e) => {
                    const allUsers = OfflineDatabase.getUsers();
                    const found = allUsers.find(u => u.id === e.target.value);
                    if (found) {
                      setCurrentUser(found);
                      // عقب‌نشینی به تب مجاز در صورت نداشتن دسترسی
                      if (found.role === 'Salesperson') {
                        setActiveTab('quick-pos');
                      } else if (found.role === 'Accountant' && (activeTab === 'quick-pos' || activeTab === 'users-access')) {
                        setActiveTab('dashboard');
                      }
                    }
                  }}
                  className="bg-transparent text-[11px] font-bold text-slate-700 border-none focus:outline-none focus:ring-0 pr-1 cursor-pointer font-sans"
                >
                  {OfflineDatabase.getUsers().map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.role === 'Admin' ? 'مدیر' : u.role === 'Salesperson' ? 'صندوق‌دار' : 'حسابدار'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* تقویم شمسی جلالی فرضی بر مبنای لوکال تایم */}
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-sans">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="font-semibold">امروز: {new Date().toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>

            {/* ساعت ثانیه‌شمار پویا */}
            <div className="flex items-center gap-1.5 text-emerald-600 text-xs bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
              <Clock className="w-4 h-4 text-emerald-500 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="font-mono font-extrabold text-sm tracking-wide">{currentTime || '--:--:--'}</span>
            </div>
          </div>
        </header>

        {/* بدنه تاص تاص محتوای تب فعال */}
        <div className="flex-1 overflow-hidden" id="active-tab-canvas">
          
          {/* تب داشبورد و میز کار مدیریتی فروشگاه */}
          {activeTab === 'dashboard' && (
            <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto space-y-6" id="dashboard-tab-view">
              
              {/* هدر دشت اول */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-600/10 flex justify-between items-center relative overflow-hidden" id="dashboard-hero">
                <div className="absolute left-0 bottom-0 top-0 w-64 bg-white/5 rounded-r-full blur-xl pointer-events-none"></div>
                <div className="space-y-1.5">
                  <h2 className="font-black text-xl">خوش‌آمدید به پنل کنترل حسابداری فروشگاهی آریا</h2>
                  <p className="text-xs text-emerald-100 font-medium">پایش سریع داده‌های مالی، بدهکاری کل، اقلام در جریان و هشدارهای تامین کالا</p>
                </div>
                <LayoutDashboard className="w-12 h-12 text-emerald-200/50 opacity-80" />
              </div>

              {/* ردیف ترازنامه و آمار کلان فروشگاه (Balance Sheets Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid-wrapper">
                
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition hover:shadow-md">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-bold text-slate-400">کل درآمد فروش کالا (سیستمی):</span>
                    <TrendingUp className="w-4.5 h-4.5 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-black text-emerald-600 font-mono leading-none">{formatToman(dbStats.totalSales)}</h3>
                  <span className="text-[10px] text-slate-400 mt-2 block">حاصل فاکتورهای صندوق سریع و فروش نسیه</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition hover:shadow-md">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-bold text-slate-400">تعهدات و بدهکاری کل مشتریان:</span>
                    <TrendingDown className="w-4.5 h-4.5 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-black text-amber-600 font-mono leading-none">{formatToman(dbStats.debtorsSum)}</h3>
                  <span className="text-[10px] text-slate-400 mt-2 block">مبلغی که مشتریان بابت نسیه به فروشگاه بدهکارند</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition hover:shadow-md">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-bold text-slate-400">بستانکاری پخش و همکاران متمم:</span>
                    <UserCheck className="w-4.5 h-4.5 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-black text-rose-600 font-mono leading-none">{formatToman(dbStats.creditorsSum)}</h3>
                  <span className="text-[10px] text-rose-400 mt-2 block">بدهی ما به تامین‌کننده‌های پخش کالا (Supplier)</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition hover:shadow-md">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-bold text-slate-400">کالاهای ثبت‌شده کاتالوگ:</span>
                    <Boxes className="w-4.5 h-4.5 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-black text-blue-600 font-mono leading-none">{dbStats.productsCount} ردیف کالا</h3>
                  <span className="text-[10px] text-slate-400 mt-2 block">موجودی کلی فعال و آماده کسر در پوز صندوق</span>
                </div>

              </div>

              {/* ابزار شتاب سریع به امور فروشگاه (Quick Action Panel) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs" id="quick-actions-launcher">
                <h3 className="font-bold text-xs text-slate-800 mb-4">راه‌انداز سریع وظایف روزانه</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs" id="launcher-buttons-row">
                  <button
                    id="launcher-pos"
                    onClick={() => setActiveTab('quick-pos')}
                    className="p-4 rounded-2xl border border-emerald-100 hover:border-emerald-300 bg-emerald-50/20 hover:bg-emerald-50/60 transition text-right space-y-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-5 h-5 text-emerald-600" />
                    <strong className="font-bold text-slate-800 block text-xs">ثبت فاکتور سریع (صندوق POS)</strong>
                    <span className="text-[10px] text-slate-400 block font-normal text-slate-500">فروش فوق‌سریع کالا با بارکد اسکنر</span>
                  </button>

                  <button
                    id="launcher-invoice"
                    onClick={() => setActiveTab('standard-invoice')}
                    className="p-4 rounded-2xl border border-indigo-100 hover:border-indigo-300 bg-indigo-50/20 hover:bg-indigo-50/40 transition text-right space-y-1.5 cursor-pointer"
                  >
                    <FilePlus2 className="w-5 h-5 text-indigo-600" />
                    <strong className="font-bold text-slate-800 block text-xs">ثبت فاکتور پیشرفته</strong>
                    <span className="text-[10px] text-slate-400 block font-normal text-slate-500">فروش به اشخاص معین و محاسبه مالیات</span>
                  </button>

                  {currentUser?.role !== 'Salesperson' && (
                    <button
                      id="launcher-person"
                      onClick={() => setActiveTab('persons-list')}
                      className="p-4 rounded-2xl border border-blue-100 hover:border-blue-300 bg-blue-50/20 hover:bg-blue-50/40 transition text-right space-y-1.5 cursor-pointer"
                    >
                      <Users className="w-5 h-5 text-blue-600" />
                      <strong className="font-bold text-slate-800 block text-xs">مدیریت اشخاص و ترازها</strong>
                      <span className="text-[10px] text-slate-400 block font-normal text-slate-500">ایجاد طرف‌حساب جدید و کنترل بدهی‌ها</span>
                    </button>
                  )}

                  {currentUser?.role !== 'Salesperson' && (
                    <button
                      id="launcher-b-prices"
                      onClick={() => setActiveTab('items-bulk-price')}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100/80 transition text-right space-y-1.5 cursor-pointer"
                    >
                      <TrendingUp className="w-5 h-5 text-slate-600" />
                      <strong className="font-bold text-slate-800 block text-xs">بروزرسانی قیمتها</strong>
                      <span className="text-[10px] text-slate-400 block font-normal text-slate-500">اصلاح سراسری درصد تراز قیمت فروش کالا</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ردیف سوم: هشدارهای انبارداری بحرانی فیزیکی کالاهای نزدیک به صفر (Low inventory alerts) */}
              {lowStockCount > 0 && currentUser?.role !== 'Salesperson' && (
                <div className="bg-red-50 border border-red-200/40 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse-slow" id="dashboard-low-stock-banners">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-red-100 text-red-600 mt-0.5">
                      <AlertTriangle className="w-5 h-5 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-red-800">هشدار انبار: موجودی فیزیکی برخی کالاها رو به اتمام است!</h4>
                      <p className="text-xs text-red-600/85 mt-0.5">تعداد {lowStockCount} ردیف کالا در بخش لجستیک انبار به سقف بحرانی (کمتر از ۱۰ عدد) تنزل یافته و نیارمند شارژ مجدد فیزیکی می‌باشند.</p>
                    </div>
                  </div>
                  <button
                    id="nav-to-inv"
                    onClick={() => setActiveTab('inventory-levels')}
                    className="py-1.8 px-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs self-start md:self-auto shadow-sm shadow-red-600/10 transition"
                  >
                     ورود کالا به انبار
                  </button>
                </div>
              )}

            </div>
          )}

          {/* هدایت تب‌ها به سمت ماژول‌ها */}
          {activeTab === 'persons-list' && <PersonsTab />}
          {activeTab === 'persons-debtors' && <DebtorsTab />}
          {activeTab === 'persons-shareholders' && <ShareholdersTab />}
          {activeTab === 'persons-employees' && <EmployeesTab />}
          
          {activeTab === 'items-list' && <ProductsTab />}
          {activeTab === 'items-categories' && <CategoriesTab />}
          {activeTab === 'items-bulk-price' && <PriceUpdateTab />} {/* شریک متمم کالا */}

          {activeTab === 'quick-pos' && <QuickPosTab />}
          {activeTab === 'standard-invoice' && <InvoiceTab />}
          {activeTab === 'invoice-history' && <InvoiceHistoryTab />}

          {activeTab === 'inventory-levels' && <InventoryTab />}
          {activeTab === 'inventory-logs' && <InventoryLogsTab />}

          {activeTab === 'users-access' && <UsersTab />}

          {activeTab.startsWith('settings-') && <SettingsTab activeSubTab={activeTab} />}

          {activeTab === 'electron' && <ElectronIpcTab />}

        </div>

      </div>
    </div>
  );
}
