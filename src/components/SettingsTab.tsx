import React, { useState, useEffect } from 'react';
import { SettingsService, AppSettings, DEFAULT_SETTINGS } from '../utils/settings';
import InvoiceDesignerSubTab from './InvoiceDesignerSubTab';
import { 
  Sliders, 
  Printer, 
  Store, 
  Check, 
  RefreshCw, 
  Palette, 
  FileText, 
  Smartphone,
  Save,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface SettingsTabProps {
  activeSubTab?: string;
}

export default function SettingsTab({ activeSubTab = 'settings-app' }: SettingsTabProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [currentTab, setCurrentTab] = useState<string>(activeSubTab);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Sync tab when prop changes
    if (activeSubTab) {
      setCurrentTab(activeSubTab);
    }
  }, [activeSubTab]);

  useEffect(() => {
    setSettings(SettingsService.get());
  }, []);

  const handleSave = () => {
    SettingsService.save(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید تنظیمات را به حالت پیش‌فرض بازگردانید؟')) {
      setSettings({ ...DEFAULT_SETTINGS });
      SettingsService.save(DEFAULT_SETTINGS);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const preselectedCardBgs = [
    { value: '#edfcf2', label: 'سبز نعنائی بسیار کم‌رنگ', preview: 'bg-[#edfcf2] border-emerald-200' },
    { value: '#f0fdf4', label: 'سبز ملایم بهاری', preview: 'bg-[#f0fdf4] border-green-200' },
    { value: '#f0f9ff', label: 'آبی بسیار کم‌رنگ آسمانی', preview: 'bg-[#f0f9ff] border-sky-200' },
    { value: '#f4f4f5', label: 'خاکستری مدرن', preview: 'bg-[#f4f4f5] border-zinc-200' },
    { value: '#fffbeb', label: 'کهربایی بسیار کم‌رنگ', preview: 'bg-[#fffbeb] border-amber-200' },
  ];

  const preselectedServiceBgs = [
    { value: '#faf5ff', label: 'بنفش سلطنتی ملایم', preview: 'bg-[#faf5ff] border-purple-200' },
    { value: '#fdf4ff', label: 'صورتی ملایم ارکیده', preview: 'bg-[#fdf4ff] border-fuchsia-200' },
    { value: '#f0fdfa', label: 'آبی فیروزه‌ای', preview: 'bg-[#f0fdfa] border-teal-200' },
    { value: '#f8fafc', label: 'اسلیتی بسیار ملایم', preview: 'bg-[#f8fafc] border-slate-200' },
    { value: '#fff7ed', label: 'نارنجی بسیار کم‌رنگ', preview: 'bg-[#fff7ed] border-orange-200' },
  ];

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto space-y-6 text-right" id="settings-tab-view" dir="rtl">
      
      {/* هدر بخش تنظیمات */}
      {currentTab !== 'settings-designer' && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm" id="settings-header">
          <div>
            <h2 className="font-black text-lg text-slate-800 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-600" />
              تنظیمات و پیکربندی سراسری نرم‌افزار
            </h2>
            <p className="text-xs text-slate-500 mt-1">مدیریت ظاهر برنامه، مشخصات چاپ پیش‌فاکتورها و اطلاعات پایه فروشگاه</p>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              id="settings-reset-btn"
              onClick={handleReset}
              className="flex-1 md:flex-none px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              بازنشانی به پیش‌فرض
            </button>
            
            <button
              id="settings-save-btn"
              onClick={handleSave}
              className="flex-1 md:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/10 transition flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              ذخیره تغییرات کنونی
            </button>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-xs font-bold flex items-center gap-2 animate-fade-in" id="save-success-notification">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>تنظیمات و ترجیحات شما با موفقیت در بانک اطلاعاتی محلی ذخیره و بروزرسانی شد.</span>
        </div>
      )}

      {/* ناوبری فرعی تنظیمات */}
      <div className="flex border-b border-slate-200 pb-px gap-2" id="settings-tabs-nav">
        <button
          id="btn-subtab-app"
          onClick={() => setCurrentTab('settings-app')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            currentTab === 'settings-app'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          تنظیمات ظاهر و برنامه
        </button>

        <button
          id="btn-subtab-print"
          onClick={() => setCurrentTab('settings-print')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            currentTab === 'settings-print'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Printer className="w-4 h-4" />
          تنظیمات اسناد و چاپ
        </button>

        <button
          id="btn-subtab-designer"
          onClick={() => setCurrentTab('settings-designer')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            currentTab === 'settings-designer'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
          طراحی فاکتور (المنتور)
        </button>

        <button
          id="btn-subtab-store"
          onClick={() => setCurrentTab('settings-store')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            currentTab === 'settings-store'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          اطلاعات عمومی فروشگاه
        </button>
      </div>

      {/* پنل محتوا */}
      <div className={`p-6 shadow-xs ${currentTab === 'settings-designer' ? 'bg-transparent p-0 border-0 shadow-none' : 'bg-white rounded-2xl border border-slate-200'}`} id="settings-panel-content">
        
        {/* طراحی فاکتور زنده المنتور */}
        {currentTab === 'settings-designer' && <InvoiceDesignerSubTab />}
        
        {/* ۱. تنظیمات برنامه و ظاهر */}
        {currentTab === 'settings-app' && (
          <div className="space-y-6" id="settings-app-section">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Palette className="w-4.5 h-4.5 text-emerald-600" />
              سفارشی‌سازی ظاهر و عملکردهای داخلی
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* انتخاب تم برنامه */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">پوسته رنگی اصلی نرم‌افزار (Theme):</label>
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[
                    { value: 'slate', label: 'خاکستری تیره', color: 'bg-slate-800' },
                    { value: 'light', label: 'سفید خالص', color: 'bg-slate-100 border border-slate-300' },
                    { value: 'emerald', label: 'نعنائی زمرد', color: 'bg-emerald-600' },
                    { value: 'amber', label: 'طلایی کهربا', color: 'bg-amber-500' },
                  ].map(t => (
                    <button
                      key={t.value}
                      id={`theme-${t.value}`}
                      type="button"
                      onClick={() => setSettings({ ...settings, theme: t.value as any })}
                      className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition ${
                        settings.theme === t.value 
                          ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/10' 
                          : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${t.color}`}></div>
                      <span className="text-[10.5px] font-bold text-slate-700">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* روش پرداخت پیش‌فرض */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">روش پرداخت پیش‌فرض صندوق:</label>
                <select
                  id="settings-default-payment"
                  value={settings.defaultPaymentMethod}
                  onChange={e => setSettings({ ...settings, defaultPaymentMethod: e.target.value as any })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-10 focus:outline-none focus:border-emerald-500 font-sans"
                >
                  <option value="POS">کارتخوان سیستمی (POS)</option>
                  <option value="Cash">صندوق نقدی مغازه (Cash)</option>
                  <option value="Mixed">ترکیبی (واریز بانکی / چک)</option>
                </select>
                <span className="text-[10px] text-slate-400 block">مکانیزم پیش‌فرض تسویه در فاکتورهای جدید ثبت شده.</span>
              </div>

              {/* رنگ نازک کارت‌های کالا */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">پس‌زمینه ملایم کارت‌های کالا (تفکیک از خدمات):</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {preselectedCardBgs.map(item => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setSettings({ ...settings, productCardBg: item.value })}
                      className={`p-2.5 rounded-xl border text-right transition flex items-center gap-2 cursor-pointer ${
                        settings.productCardBg === item.value
                          ? 'border-emerald-600 ring-2 ring-emerald-500/15 bg-emerald-50/20'
                          : 'border-slate-100 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-md border ${item.preview}`}></div>
                      <span className="text-[10px] text-slate-600">{item.label}</span>
                    </button>
                  ))}
                </div>
                
                {/* ورودی رنگ کاستوم */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-500">انتخاب کد رنگ دلخواه (Hex):</span>
                  <input
                    type="color"
                    value={settings.productCardBg}
                    onChange={e => setSettings({ ...settings, productCardBg: e.target.value })}
                    className="w-8 h-8 rounded border cursor-pointer p-0"
                  />
                  <input
                    type="text"
                    value={settings.productCardBg}
                    onChange={e => setSettings({ ...settings, productCardBg: e.target.value })}
                    className="w-24 text-[11px] font-mono p-1 border border-slate-200 rounded text-center"
                  />
                </div>
              </div>

              {/* رنگ نازک کارت‌های دستمزد خدمات */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">پس‌زمینه ملایم کارت‌های بخش خدمات (تفکیک از کالا):</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {preselectedServiceBgs.map(item => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setSettings({ ...settings, serviceCardBg: item.value })}
                      className={`p-2.5 rounded-xl border text-right transition flex items-center gap-2 cursor-pointer ${
                        settings.serviceCardBg === item.value
                          ? 'border-purple-600 ring-2 ring-purple-500/15 bg-purple-50/20'
                          : 'border-slate-100 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-md border ${item.preview}`}></div>
                      <span className="text-[10px] text-slate-600">{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* ورودی رنگ کاستومخدمات */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-500">انتخاب کد رنگ دلخواه (Hex):</span>
                  <input
                    type="color"
                    value={settings.serviceCardBg}
                    onChange={e => setSettings({ ...settings, serviceCardBg: e.target.value })}
                    className="w-8 h-8 rounded border cursor-pointer p-0"
                  />
                  <input
                    type="text"
                    value={settings.serviceCardBg}
                    onChange={e => setSettings({ ...settings, serviceCardBg: e.target.value })}
                    className="w-24 text-[11px] font-mono p-1 border border-slate-200 rounded text-center"
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ۲. تنظیمات اسناد و چاپ */}
        {currentTab === 'settings-print' && (
          <div className="space-y-6" id="settings-print-section">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Printer className="w-4.5 h-4.5 text-emerald-600" />
              پیکربندی چاپی فاکتورها، فیش‌ها و صورتحساب‌ها
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* ابعاد استاندارد خروجی فاکتور */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">سایز پیش‌فرض انتشار فاکتور:</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'A4', label: 'برگ رسمی A4', icon: FileText },
                    { value: 'A5', label: 'برگه متوسط A5', icon: FileText },
                    { value: 'thermal', label: 'فیش‌پرینتر حرارتی (80mm)', icon: Smartphone },
                  ].map(p => (
                    <button
                      key={p.value}
                      id={`print-${p.value}`}
                      type="button"
                      onClick={() => setSettings({ ...settings, paperSize: p.value as any })}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition ${
                        settings.paperSize === p.value 
                          ? 'border-emerald-600 bg-emerald-50/10 text-emerald-700 font-bold' 
                          : 'border-slate-100 hover:bg-slate-50 text-slate-500'
                      }`}
                    >
                      <p.icon className="w-5 h-5" />
                      <span className="text-[10.5px]">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* درصد مالیات پیش‌فرض */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">درصد مالیات بر ارزش افزوده موقت (IR-VAT):</label>
                <div className="flex items-center gap-3">
                  <input
                    id="settings-tax-pct-input"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.defaultTaxPct}
                    onChange={e => setSettings({ ...settings, defaultTaxPct: Number(e.target.value) })}
                    className="w-24 text-center text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-10 font-mono focus:outline-none"
                  />
                  <span className="text-xs text-slate-600">درصد ارزش افزوده مصوب سالیانه</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">با زدن تیک دکمه احتساب مالیات، این درصد روی فاکتور اعمال خواهد شد.</span>
              </div>

              {/* تاگل نمایش امضا و قوانین */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-700 block">نمایش ابزار مُهر و امضا کادر پایین فاکتور:</span>
                  <span className="text-[9.5px] text-slate-400">کادرهای امضای خریدار، فروشنده و فاکتور چاپی معتبر دفتری</span>
                </div>
                <input
                  id="settings-show-signature"
                  type="checkbox"
                  checked={settings.showSignature}
                  onChange={e => setSettings({ ...settings, showSignature: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* تاگل نمایش کد اقتصادی */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-700 block">نمایش کدهای ملی ملیتی و اقتصادی طرفین:</span>
                  <span className="text-[9.5px] text-slate-400">نمایش کد ملی و کد اقتصادی خریدار و فروشنده در فاکتورهای رسمی</span>
                </div>
                <input
                  id="settings-show-economic"
                  type="checkbox"
                  checked={settings.showEconomicCode}
                  onChange={e => setSettings({ ...settings, showEconomicCode: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                />
              </div>

            </div>
          </div>
        )}

        {/* ۳. اطلاعات عمومی فروشگاه */}
        {currentTab === 'settings-store' && (
          <div className="space-y-6" id="settings-store-section">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Store className="w-4.5 h-4.5 text-emerald-600" />
              تنظیمات شناسنامه، نام تجاری و مستندات فروشگاه
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">نام تجاری فروشگاه / کسب‌وکار:</label>
                <input
                  id="settings-store-name"
                  type="text"
                  value={settings.storeName}
                  onChange={e => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-10 focus:outline-none"
                  placeholder="مثال: فروشگاه اسباب‌بازی آریا"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">تلفن تماس فروشگاه:</label>
                <input
                  id="settings-store-phone"
                  type="text"
                  value={settings.storePhone}
                  onChange={e => setSettings({ ...settings, storePhone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-10 text-left font-mono focus:outline-none"
                  placeholder="تلفکس رسمی مغازه"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">کد اقتصادی فروشگاه (Economic Code):</label>
                <input
                  id="settings-store-eco-code"
                  type="text"
                  value={settings.storeEconomicCode}
                  onChange={e => setSettings({ ...settings, storeEconomicCode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-10 text-left font-mono focus:outline-none"
                  placeholder="۱۲ رقم کد اقتصادی ثبت شده"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">شناسه ملی / ثبت شرکت:</label>
                <input
                  id="settings-store-national-id"
                  type="text"
                  value={settings.storeNationalId}
                  onChange={e => setSettings({ ...settings, storeNationalId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-10 text-left font-mono focus:outline-none"
                  placeholder="یا ممیز پروانه کسب"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">کد پستی ده رقمی:</label>
                <input
                  id="settings-store-postal"
                  type="text"
                  value={settings.storePostalCode}
                  onChange={e => setSettings({ ...settings, storePostalCode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-10 text-left font-mono focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block font-bold text-slate-700">آدرس فیزیکی فروشگاه (جهت درج در فاکتورها):</label>
                <textarea
                  id="settings-store-address"
                  rows={2}
                  value={settings.storeAddress}
                  onChange={e => setSettings({ ...settings, storeAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-right text-xs"
                  placeholder="نشانی دقیق مغازه یا شعب مرکزی جهت چاپ"
                />
              </div>

            </div>
          </div>
        )}

      </div>

      {/* اعلان‌های ایمنی پایگاه داده */}
      <div className="bg-slate-150 rounded-2xl border border-slate-200 p-4 text-xs text-slate-600 flex items-start gap-3" id="settings-db-status-notice">
        <AlertCircle className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
        <div className="space-y-1 text-[11px]">
          <span className="font-bold text-slate-700 block text-xs">ثبت آنی و ایمن در پایگاه‌داده (Database Center):</span>
          <p className="leading-relaxed">
            تمامی مقادیر وارد شده در فرم‌های فوق به صورت کامل روی **بانک اطلاعاتی محلی بومی برنامه** مستندسازی و با مکانیزم حفاظت تراکنش (Atomicity Isolation) نگهداشته می‌شوند.
            پس از ذخیره تغییرات، پوسته‌ها و تنظیمات چاپی بلافاصله بدون فوت وقت در خطوط سفارش POS و صدور فاکتور شما اعمال خواهد شد.
          </p>
        </div>
      </div>

    </div>
  );
}
