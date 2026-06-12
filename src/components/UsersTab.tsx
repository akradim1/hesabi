import React, { useState, useEffect } from 'react';
import { OfflineDatabase } from '../db/offlineDb';
import { KeyRound, ShieldAlert, UserPlus, Edit2, Trash2, CheckCircle2, XCircle, Shield, FileText, ShoppingCart, Key } from 'lucide-react';

interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'Admin' | 'Salesperson' | 'Accountant';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'Admin' | 'Salesperson' | 'Accountant'>('Salesperson');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    refreshUsers();
  }, []);

  const refreshUsers = () => {
    const list = OfflineDatabase.getUsers();
    setUsers(list);
  };

  const resetForm = () => {
    setUserId('');
    setUsername('');
    setFullName('');
    setRole('Salesperson');
    setIsActive(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim()) return;

    // Check if username is already taken by another user
    const taken = users.some(u => u.username.toLowerCase() === username.toLowerCase() && u.id !== userId);
    if (taken) {
      alert('این نام کاربری قبلاً در سیستم ثبت شده است.');
      return;
    }

    const payload = {
      id: userId || 'user_' + Date.now(),
      username: username.toLowerCase().trim(),
      fullName: fullName.trim(),
      role,
      isActive,
      createdAt: userId ? (users.find(u => u.id === userId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    OfflineDatabase.saveUser(payload);
    resetForm();
    refreshUsers();
  };

  const handleEdit = (u: User) => {
    setUserId(u.id);
    setUsername(u.username);
    setFullName(u.fullName);
    setRole(u.role);
    setIsActive(u.isActive);
  };

  const handleDelete = (id: string) => {
    if (id === 'user_admin') {
      alert('کاربر ادمین کلیدی سیستم غیر قابل حذف است.');
      return;
    }
    if (confirm('آیا از حذف این کاربر مطمئن هستید؟')) {
      const ok = OfflineDatabase.deleteUser(id);
      if (ok) {
        refreshUsers();
      }
    }
  };

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'Admin':
        return { text: 'مدیر کل سیستم', color: 'bg-red-50 text-red-700 border-red-200' };
      case 'Salesperson':
        return { text: 'صندوق‌دار فروشگاه', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'Accountant':
        return { text: 'حسابدار ارشد', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      default:
        return { text: 'کاربر معمولی', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto space-y-6" id="users-tab-container">
      {/* هدر دسترسی‌ها */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md flex justify-between items-center relative overflow-hidden" id="users-header">
        <div className="space-y-1">
          <h2 className="font-black text-lg flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-500" />
            تعریف کاربران و سطوح دسترسی فروشگاه
          </h2>
          <p className="text-xs text-slate-300">مدیر اصلی می‌تواند نقش‌های صندوق‌دار و حسابدار را مدیریت، فعال‌سازی یا محدود کند.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ستون راست: فرم ثبت کابر جدید */}
        <form onSubmit={handleSubmit} className="lg:col-span-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4" id="user-form">
          <h3 className="font-bold text-xs text-slate-800 border-b border-slate-100 pb-2">
            {userId ? 'ویرایش مشخصات کاربر' : 'تعریف کاربر / پرسنل جدید'}
          </h3>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">نام کامل پرسنل:</label>
            <input
              id="user-fullname-input"
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-sans"
              placeholder="مثال: رضا کریمی"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">شناسه کاربری (جهت ورود به سیستم):</label>
            <input
              id="user-username-input"
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-left font-mono"
              placeholder="مثال: r_karimi"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">نقش و سطح دسترسی:</label>
            <select
              id="user-role-select"
              value={role}
              onChange={e => setRole(e.target.value as any)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg h-9 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-sans font-medium"
            >
              <option value="Salesperson">صندوق‌دار (فقط ثبت فاکتورها و تسویه‌ها)</option>
              <option value="Accountant">حسابدار (گزارشات کامل، معین اشخاص، فاکتورها)</option>
              <option value="Admin">مدیر ارشد (دسترسی نامحدود به همه‌جای سیستم)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 py-1">
            <input
              id="user-status-checkbox"
              type="checkbox"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
            />
            <label htmlFor="user-status-checkbox" className="text-[11px] text-slate-600 font-semibold cursor-pointer">
              حساب کاربری فعال و مجاز به استفاده باشد
            </label>
          </div>

          <div className="flex gap-2 border-t border-slate-100 pt-3">
            <button
              id="user-submit-btn"
              type="submit"
              className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg transition"
            >
              {userId ? 'اصلاح کاربر' : 'افزودن کاربر'}
            </button>
            {userId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 px-3 rounded-lg transition"
              >
                انصراف
              </button>
            )}
          </div>
        </form>

        {/* ستون چپ: لیست کاربران فعال سیستم */}
        <div className="lg:col-span-8 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs" id="users-list-wrapper">
          <h3 className="font-bold text-xs text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>لیست اکانت‌های مجاز سیستم حسابداری</span>
            <span className="text-[10px] text-slate-400 font-mono">جمعا {users.length} کاربر تعریف شده</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="users-grid">
            {users.map(u => {
              const bg = getRoleBadge(u.role);
              return (
                <div key={u.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/40 relative flex flex-col justify-between" id={`user-card-${u.id}`}>
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-xs font-bold text-slate-800 block">{u.fullName}</strong>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">@{u.username}</span>
                      </div>
                      <span className={`text-[9.5px] px-2 py-0.5 rounded border ${bg.color} font-bold`}>
                        {bg.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-slate-400">وضعیت ورود:</span>
                      {u.isActive ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 w-3" /> فعال
                        </span>
                      ) : (
                        <span className="text-red-500 font-bold flex items-center gap-0.5">
                          <XCircle className="w-3 w-3" /> غیرفعال
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-100/85 pt-2 mt-3 flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-mono">عضویت: {new Date(u.createdAt).toLocaleDateString('fa-IR')}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(u)}
                        className="text-blue-500 hover:underline p-1 border border-slate-100 rounded bg-white"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {u.id !== 'user_admin' && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="text-red-500 hover:underline p-1 border border-slate-100 rounded bg-white"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* کارتابل مدیریت دسترسی اختصاصی سناریوها */}
          <RolePermissionsConfigurator />

          <div className="mt-6 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2.5 text-[11px] text-slate-300 leading-relaxed shadow-lg">
            <strong className="font-bold block text-xs text-amber-400">نفوذپذیری نقش‌های ارشد سیستم:</strong>
            <ul className="list-disc pr-4 space-y-1">
              <li><strong>صندوق‌دار:</strong> برای بهینه‌سازی فروش، دسترسی‌های پيش‌فرض او صرفاً به صندوق POS و تاريخچه فاکتورها محدود شده است. مدیر می‌تواند دسترسی مازاد برای او بازنماید.</li>
              <li><strong>حسابدار:</strong> به صورت کلیدی مجاز به ردیف معین حساب‌ها، انباشت بدهکاران و ثبت فاکتورهای پیشرفته است اما دسترسی به کارگزینی کاربران برای او قطع است.</li>
              <li><strong>مدیر کُل (ادمین):</strong> با تکیه بر بالاترین سطح رمزنگاری، قفل دسترسی‌ها برای کل صفحات باز است به صورت فرادستانه.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// کامپوننت داخلی تنظیم دسترسی نقش ها
function RolePermissionsConfigurator() {
  const [selectedRole, setSelectedRole] = useState<'Salesperson' | 'Accountant'>('Salesperson');
  const [permissions, setPermissions] = useState<string[]>([]);

  const ALL_PAGES = [
    { id: 'dashboard', label: 'داشبورد و گزارشات عملکرد' },
    { id: 'persons-list', label: 'مدیریت اشخاص و حساب‌های طرفین' },
    { id: 'persons-debtors', label: 'بدهکاران و بستانکاران متمم' },
    { id: 'persons-shareholders', label: 'صفحه سهامداران شرکت' },
    { id: 'persons-employees', label: 'صفحه مدیریت پرسنل و کارمندان' },
    { id: 'items-list', label: 'افزودن محصول و خدمات تازه' },
    { id: 'items-bulk-price', label: 'بروزرسانی تکی و گروهی تراز قیمت ها' },
    { id: 'quick-pos', label: 'فروش سریع (صندوق POS)' },
    { id: 'standard-invoice', label: 'ثبت فاکتور پیشرفته' },
    { id: 'invoice-history', label: 'تاریخچه فاکتورها' },
    { id: 'inventory-levels', label: 'کنترل موجودی انبار و دپوها' },
    { id: 'inventory-logs', label: 'تاریخچه عملیات انبارداری عمیق' },
    { id: 'settings', label: 'تنظیمات سراسری برنامه مغازه' },
    { id: 'electron', label: 'برقراری اتصال Electron و سخت‌افزارها' },
  ];

  useEffect(() => {
    const raw = localStorage.getItem('shop_accounting_role_permissions');
    let loaded: string[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed[selectedRole]) {
          loaded = parsed[selectedRole];
        }
      } catch (e) {}
    }

    if (loaded.length === 0) {
      if (selectedRole === 'Salesperson') {
        loaded = ['dashboard', 'quick-pos', 'invoice-history', 'electron'];
      } else if (selectedRole === 'Accountant') {
        loaded = [
          'dashboard', 
          'persons-list', 'persons-debtors', 'persons-shareholders',
          'items-list', 'items-bulk-price',
          'quick-pos', 'standard-invoice', 'invoice-history',
          'inventory-levels', 'inventory-logs'
        ];
      }
    }
    setPermissions(loaded);
  }, [selectedRole]);

  const togglePermission = (id: string) => {
    if (permissions.includes(id)) {
      setPermissions(permissions.filter(p => p !== id));
    } else {
      setPermissions([...permissions, id]);
    }
  };

  const handleSave = () => {
    const raw = localStorage.getItem('shop_accounting_role_permissions');
    let existing: any = {};
    if (raw) {
      try {
        existing = JSON.parse(raw);
      } catch (e) {}
    }
    existing[selectedRole] = permissions;
    localStorage.setItem('shop_accounting_role_permissions', JSON.stringify(existing));
    
    // رفلکس همزمان سایدبار
    window.dispatchEvent(new Event('cofeclick_settings_updated'));
    alert(`دسترسی‌های اختصاصی نقش کاربری «${selectedRole === 'Salesperson' ? 'صندوق‌دار' : 'حسابدار'}» با موفقیت اصلاح و ثبت شد.`);
  };

  return (
    <div className="mt-8 bg-white border border-indigo-150 rounded-2xl p-5 shadow-sm space-y-4" id="role-firewall-panel">
      <div className="flex justify-between items-center border-b border-indigo-50 pb-2.5">
        <div>
          <h4 className="font-extrabold text-xs text-indigo-900 flex items-center gap-1.5">
            <Shield className="w-4.5 h-4.5 text-indigo-600" />
            سیستم فایروال و سفارشی‌سازی سطوح دسترسی نقش‌ها
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">مدیر می‌تواند دسترسی دسته‌جمعی پرسنل به تک تک اِلمان‌ها را در عرض ثانیه کنترل کند</p>
        </div>
      </div>

      <div className="flex gap-2 items-center text-xs">
        <span className="font-bold text-slate-500">انتخاب نقش جهت ویرایش:</span>
        <button
          type="button"
          onClick={() => setSelectedRole('Salesperson')}
          className={`px-3 py-1.5 rounded-lg border font-black transition cursor-pointer ${
            selectedRole === 'Salesperson' 
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          صندوق‌دار فروشگاه (Salesperson)
        </button>
        <button
          type="button"
          onClick={() => setSelectedRole('Accountant')}
          className={`px-3 py-1.5 rounded-lg border font-black transition cursor-pointer ${
            selectedRole === 'Accountant' 
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          حسابدار ارشد (Accountant)
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[11px] pt-2" id="firewall-permissions-grid">
        {ALL_PAGES.map(page => {
          const isAllowed = permissions.includes(page.id);
          return (
            <div
              key={page.id}
              onClick={() => togglePermission(page.id)}
              className={`p-3 rounded-xl border transition cursor-pointer flex items-center gap-2.5 hover:shadow-2xs select-none ${
                isAllowed 
                  ? 'border-indigo-400 bg-indigo-50/15 text-indigo-950 font-extrabold shadow-sm' 
                  : 'border-slate-100 bg-slate-50/50 text-slate-500'
              }`}
            >
              <input
                type="checkbox"
                checked={isAllowed}
                readOnly
                className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded cursor-pointer"
              />
              <span>{page.label}</span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <button
          onClick={handleSave}
          className="text-white bg-indigo-600 hover:bg-indigo-700 font-extrabold text-xs px-5 py-2.5 rounded-xl transition shadow-md shadow-indigo-600/10 cursor-pointer"
        >
          ذخیره سازی و اعمال دسترسی‌های نقش {selectedRole === 'Salesperson' ? 'صندوق‌دار' : 'حسابدار'} 🛡️
        </button>
      </div>
    </div>
  );
}

