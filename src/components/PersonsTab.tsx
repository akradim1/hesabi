import React, { useState, useEffect } from 'react';
import { OfflineDatabase } from '../db/offlineDb';
import { Person, Invoice } from '../types';
import { UserPlus, Search, Edit2, Trash2, Phone, Briefcase, FileText, ArrowUpRight, ArrowDownLeft, Receipt, Users } from 'lucide-react';

export default function PersonsTab() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // وضعیت فرم اشخاص
  const [personId, setPersonId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [type, setType] = useState<'Customer' | 'Supplier' | 'Shareholder' | 'Employee' | 'Other'>('Customer');
  const [balance, setBalance] = useState<number>(0);
  const [sharePercentage, setSharePercentage] = useState<number>(0);
  const [nationalCode, setNationalCode] = useState<string>('');
  const [economicCode, setEconomicCode] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [landline, setLandline] = useState<string>('');
  
  // وضعیت جستجو و فیلترها
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Customer' | 'Supplier' | 'Shareholder' | 'Employee' | 'Other' | 'Debtors' | 'Creditors'>('All');
  
  // بارگذاری داده‌ها پس از بارگذاری کامپوننت
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const pList = OfflineDatabase.getPersons();
    const invList = OfflineDatabase.getInvoices();
    setPersons(pList);
    setInvoices(invList);
    
    // اگر شخصی انتخاب شده بود، اطلاعات جدید آن را به‌روزرسانی می‌کنیم
    if (selectedPerson) {
      const updated = pList.find(p => p.id === selectedPerson.id);
      setSelectedPerson(updated || null);
    } else if (pList.length > 0) {
      setSelectedPerson(pList[0]);
    }
  };

  // ذخیره اطلاعات شخص
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (type === 'Shareholder') {
      const shareVal = Number(sharePercentage);
      if (shareVal < 0 || shareVal > 100) {
        alert('درصد سهم وارد شده باید بین ۰ تا ۱۰۰ باشد.');
        return;
      }

      // بررسی سهم سایر سهام‌داران تا مطمئن شویم از ۱۰۰ درصد عبور نمی‌کند
      const totalOtherShare = persons
        .filter(p => p.type === 'Shareholder' && p.id !== personId)
        .reduce((sum, p) => sum + (p.share_percentage || 0), 0);

      if (totalOtherShare + shareVal > 100) {
        alert(`خطا: مجموع درصد سهام از ۱۰۰٪ بیشتر می‌شود. مجموع سهم سایر سهام‌داران: ${totalOtherShare}٪ است. حداکثر سهم مجاز جدید: ${100 - totalOtherShare}٪ است.`);
        return;
      }
    }

    OfflineDatabase.savePerson({
      id: personId ? personId : undefined,
      name,
      phone,
      type,
      balance: Number(balance),
      national_code: nationalCode,
      economic_code: economicCode,
      address,
      email,
      notes,
      postal_code: postalCode,
      landline,
      share_percentage: type === 'Shareholder' ? Number(sharePercentage) : undefined,
    });

    // بازنشانی فرم
    resetForm();
    refreshData();
  };

  const resetForm = () => {
    setPersonId('');
    setName('');
    setPhone('');
    setType('Customer');
    setBalance(0);
    setSharePercentage(0);
    setNationalCode('');
    setEconomicCode('');
    setAddress('');
    setEmail('');
    setNotes('');
    setPostalCode('');
    setLandline('');
  };

  // ویرایش شخص
  const handleEdit = (p: Person) => {
    setPersonId(p.id);
    setName(p.name);
    setPhone(p.phone);
    setType(p.type);
    setBalance(p.balance);
    setSharePercentage(p.share_percentage || 0);
    setNationalCode(p.national_code || '');
    setEconomicCode(p.economic_code || '');
    setAddress(p.address || '');
    setEmail(p.email || '');
    setNotes(p.notes || '');
    setPostalCode(p.postal_code || '');
    setLandline(p.landline || '');
  };

  // حذف شخص
  const handleDelete = (id: string) => {
    if (id === 'general_customer') {
      alert('مشتری عمومی سیستم قابل حذف نمی‌باشد.');
      return;
    }
    if (confirm('آیا از حذف این شخص مطمئن هستید؟ با حذف وی، مانده حساب او از سیستم حذف می‌شود.')) {
      OfflineDatabase.deletePerson(id);
      if (selectedPerson?.id === id) {
        setSelectedPerson(null);
      }
      refreshData();
    }
  };

  // تصفیه و جستجوی اشخاص
  const filteredPersons = persons.filter(p => {
    const matchesSearch = p.name.includes(searchQuery) || p.phone.includes(searchQuery);
    
    if (!matchesSearch) return false;
    
    if (filterType === 'Customer') return p.type === 'Customer';
    if (filterType === 'Supplier') return p.type === 'Supplier';
    if (filterType === 'Shareholder') return p.type === 'Shareholder';
    if (filterType === 'Employee') return p.type === 'Employee';
    if (filterType === 'Other') return p.type === 'Other';
    if (filterType === 'Debtors') return p.balance > 0;
    if (filterType === 'Creditors') return p.balance < 0;
    
    return true;
  });

  // گزارش صورتحساب شخص انتخابی
  const personInvoices = invoices.filter(inv => inv.person_id === selectedPerson?.id);

  // تبدیل تومن به فرمت خوانا ریال
  const formatToman = (amount: number) => {
    return Math.abs(amount).toLocaleString('fa-IR') + ' تومان';
  };

  // مشخص کردن تراز کل حساب
  const getBalanceStatus = (amount: number) => {
    if (amount > 0) return { text: 'بدهکار (به ما بدهکار است)', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (amount < 0) return { text: 'بستانکار (طلبکار از ما)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    return { text: 'تسویه کامل (بی‌حساب)', color: 'text-slate-500 bg-slate-50 border-slate-200' };
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 h-[calc(100vh-64px)] overflow-hidden" id="persons-tab-container">
      {/* ستون راست: فرم و لیست اشخاص */}
      <div className="w-full lg:w-[45%] flex flex-col gap-6 h-full overflow-y-auto" id="persons-sidebar-and-form">
        
        {/* بخش فرم اشخاص */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm" id="person-form-panel">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-500" />
              {personId ? 'ویرایش حساب شخص' : 'ایجاد شخص / مشتری / تامین‌کننده جدید'}
            </h2>
            {personId && (
              <button onClick={resetForm} className="text-xs text-red-500 hover:underline">
                انصراف از ویرایش
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] mb-1 font-medium text-slate-500">نام و نام خانوادگی:</label>
                <input
                  id="person-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="علیرضا حسینی"
                />
              </div>
              <div>
                <label className="block text-[11px] mb-1 font-medium text-slate-500">شماره همراه تماس:</label>
                <input
                  id="person-phone-input"
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-left"
                  placeholder="0912..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[11px] mb-1 font-medium text-slate-500">نوع حساب:</label>
                <select
                  id="person-type-select"
                  value={type}
                  onChange={e => setType(e.target.value as 'Customer' | 'Supplier' | 'Shareholder' | 'Employee' | 'Other')}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg h-9 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                >
                  <option value="Customer">مشتری (خریدار)</option>
                  <option value="Supplier">تامین‌کننده (پخش کالا)</option>
                  <option value="Shareholder">سهام‌دار (سرمایه‌گذار)</option>
                  <option value="Employee">کارمند / پرسنل</option>
                  <option value="Other">سایر حساب‌ها</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] mb-1 font-medium text-slate-500">مانده حساب اولیه (تومان):</label>
                <input
                  id="person-balance-input"
                  type="number"
                  value={balance}
                  onChange={e => setBalance(Number(e.target.value))}
                  disabled={!!personId} // مانده حساب اولیه بعد از ساخت غیرقابل ویرایش مستقیم است و تراکنشی تغییر می‌کند
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-left disabled:opacity-60"
                  placeholder="مثبت بدهکار، منفی بستانکار"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">بدهکاری شخص مثبت و بستانکاری ما منفی است</span>
              </div>
            </div>

            {type === 'Shareholder' && (
              <div className="bg-emerald-50/50 border border-emerald-200/50 p-3 rounded-xl mb-3 flex gap-4 items-center">
                <div className="w-[120px]">
                  <label className="block text-[11px] mb-1 font-bold text-emerald-800">درصد سهم (۰-۱۰۰):</label>
                  <input
                    id="person-share-percentage-input"
                    type="number"
                    min="0"
                    max="100"
                    value={sharePercentage || ''}
                    onChange={e => setSharePercentage(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-left font-mono font-bold text-emerald-700"
                    placeholder="درصد سهم"
                  />
                </div>
                <div className="text-[10px] text-emerald-600 flex-1 leading-relaxed">
                  مجموع سهام تعریف‌شده در سیستم نباید از ۱۰۰٪ بیشتر شود. این درصد جهت تسهیم دارایی و سود کاربرد دارد.
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 pt-3 mt-3">
              <span className="block text-[11px] font-bold text-slate-700 mb-2">اطلاعات تکمیلی و حقوقی</span>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[11px] mb-1 font-medium text-slate-500">کد ملی / شناسه ملی:</label>
                  <input
                    id="person-national-code"
                    type="text"
                    value={nationalCode}
                    onChange={e => setNationalCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-left font-mono"
                    placeholder="کد ملی ۱۰ رقمی"
                  />
                </div>
                <div>
                  <label className="block text-[11px] mb-1 font-medium text-slate-500">کد اقتصادی:</label>
                  <input
                    id="person-economic-code"
                    type="text"
                    value={economicCode}
                    onChange={e => setEconomicCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-left font-mono"
                    placeholder="کد اقتصادی شرکت"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[11px] mb-1 font-medium text-slate-500">تلفن ثابت:</label>
                  <input
                    id="person-landline"
                    type="text"
                    value={landline}
                    onChange={e => setLandline(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-left font-mono"
                    placeholder="۰۲۱..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] mb-1 font-medium text-slate-500">کد پستی:</label>
                  <input
                    id="person-postal-code"
                    type="text"
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-left font-mono"
                    placeholder="کد پستی ۱۰ رقمی"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-[11px] mb-1 font-medium text-slate-500">آدرس پست الکترونیکی (ایمیل):</label>
                <input
                  id="person-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-left font-mono"
                  placeholder="info@example.com"
                />
              </div>

              <div className="mb-3">
                <label className="block text-[11px] mb-1 font-medium text-slate-500">آدرس کامل سکونت / شرکت:</label>
                <textarea
                  id="person-address"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={2}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none font-sans"
                  placeholder="استان، شهر، خیابان، پلاک، واحد..."
                />
              </div>

              <div className="mb-3">
                <label className="block text-[11px] mb-1 font-medium text-slate-500">یادداشت‌ها و توضیحات:</label>
                <textarea
                  id="person-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none font-sans"
                  placeholder="تضمین‌های مالی، حساب‌های جانبی یا نکات دیگر..."
                />
              </div>
            </div>

            <button
              id="submit-person-btn"
              type="submit"
              className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm shadow-emerald-600/10 transition"
            >
              {personId ? 'ذخیره تغییرات حساب' : 'ثبت شخص جدید'}
            </button>
          </form>
        </div>

        {/* لیست اشخاص */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex-1 flex flex-col overflow-hidden" id="person-list-panel">
          
          <div className="flex items-center gap-3 mb-3" id="person-search-box">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                id="search-persons-query"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام یا تلفن همراه..."
                className="w-full text-xs pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* فیلتر تب‌ها */}
          <div className="flex flex-wrap gap-1 mb-3 bg-slate-100 p-1 rounded-xl" id="person-filter-tabs">
            {([
              'All',
              'Customer',
              'Supplier',
              'Shareholder',
              'Employee',
              'Other',
              'Debtors',
              'Creditors'
            ] as const).map(tab => (
              <button
                key={tab}
                id={`filter-btn-${tab}`}
                onClick={() => setFilterType(tab)}
                className={`text-[9px] sm:text-[10px] py-1 px-2 rounded-lg font-medium transition ${
                  filterType === tab 
                    ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab === 'All' && 'همه'}
                {tab === 'Customer' && 'مشتریان'}
                {tab === 'Supplier' && 'تامین‌کنندگان'}
                {tab === 'Shareholder' && 'سهام‌داران'}
                {tab === 'Employee' && 'کارمندان'}
                {tab === 'Other' && 'سایرین'}
                {tab === 'Debtors' && 'بدهکاران'}
                {tab === 'Creditors' && 'بستانکاران'}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto space-y-1.5 flex-1 pr-1" id="persons-items-list">
            {filteredPersons.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 font-medium">
                شخصی با این مشخصات یافت نشد
              </div>
            ) : (
              filteredPersons.map(p => {
                const isSelected = selectedPerson?.id === p.id;
                return (
                  <div
                    key={p.id}
                    id={`person-card-${p.id}`}
                    onClick={() => setSelectedPerson(p)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex justify-between items-center ${
                      isSelected 
                        ? 'border-emerald-500 bg-emerald-50/20' 
                        : 'border-slate-100 hover:border-slate-200 bg-slate-50/40'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded-lg text-[9px] font-bold leading-none ${
                        p.type === 'Customer' 
                          ? 'bg-blue-50 text-blue-600' 
                          : p.type === 'Supplier' 
                            ? 'bg-purple-50 text-purple-600' 
                            : p.type === 'Shareholder' 
                              ? 'bg-emerald-50 text-emerald-600' 
                              : p.type === 'Employee' 
                                ? 'bg-amber-50 text-amber-600' 
                                : 'bg-slate-100 text-slate-500'
                      }`}>
                        {p.type === 'Customer' && 'مشتری'}
                        {p.type === 'Supplier' && 'پخش‌کننده'}
                        {p.type === 'Shareholder' && `سهام‌دار (${p.share_percentage || 0}٪)`}
                        {p.type === 'Employee' && 'پرسنل'}
                        {p.type === 'Other' && 'متفرقه'}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                          {p.name}
                          {p.id === 'general_customer' && (
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded">سیستمی</span>
                          )}
                        </h4>
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{p.phone !== '0' ? p.phone : 'بدون شماره'}</span>
                      </div>
                    </div>
                    <div className="text-left flex flex-col items-end gap-1.5">
                      <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full ${
                        p.balance > 0 
                          ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                          : p.balance < 0 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-slate-100 text-slate-500'
                      }`}>
                        {p.balance === 0 ? 'تسویه' : formatToman(p.balance)}
                      </span>
                      <div className="flex gap-2 opacity-80 hover:opacity-100" onClick={e => e.stopPropagation()}>
                        <button
                          id={`person-edit-btn-${p.id}`}
                          onClick={() => handleEdit(p)}
                          className="p-1 text-slate-400 hover:text-emerald-600 rounded bg-white border border-slate-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {p.id !== 'general_customer' && (
                          <button
                            id={`person-delete-btn-${p.id}`}
                            onClick={() => handleDelete(p.id)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded bg-white border border-slate-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ستون چپ: نمایش معین و تراکنش‌های شخص انتخابی */}
      <div className="w-full lg:w-[55%] bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col h-full overflow-hidden shadow-sm" id="person-ledger-details">
        {selectedPerson ? (
          <>
            <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-center" id="ledger-header">
              <div>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-medium">
                  {selectedPerson.type === 'Customer' && 'کارت حساب مشتری'}
                  {selectedPerson.type === 'Supplier' && 'حساب بستانکاری تامین‌کننده'}
                  {selectedPerson.type === 'Shareholder' && `کارت حساب سهام‌دار (${selectedPerson.share_percentage || 0}٪ سهم)`}
                  {selectedPerson.type === 'Employee' && 'حساب پرسنلی کارمند / همکار'}
                  {selectedPerson.type === 'Other' && 'حساب متفرقه'}
                </span>
                <h3 className="font-bold text-base text-slate-800 mt-1">{selectedPerson.name}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                  <Phone className="w-3 h-3 text-slate-300" />
                  {selectedPerson.phone !== '0' ? selectedPerson.phone : 'تلفن ثبت نشده'}
                </p>
              </div>

              {/* کارت وضعیت تراز به ریال */}
              <div className={`p-3 rounded-xl border flex flex-col items-end gap-0.5 ${getBalanceStatus(selectedPerson.balance).color}`}>
                <span className="text-[10px] font-medium opacity-85">مانده حساب نهایی:</span>
                <span className="text-sm font-bold font-mono">
                  {selectedPerson.balance === 0 ? '۰ تومان' : formatToman(selectedPerson.balance)}
                </span>
                <span className="text-[9px] font-medium opacity-75 mt-0.5">
                  {getBalanceStatus(selectedPerson.balance).text}
                </span>
              </div>
            </div>

            {/* مشخصات تکمیلی شخص در معین */}
            {(selectedPerson.national_code || selectedPerson.economic_code || selectedPerson.landline || selectedPerson.postal_code || selectedPerson.email || selectedPerson.address || selectedPerson.notes) && (
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 mb-4 grid grid-cols-2 gap-3 text-xs" id="ledger-advanced-details">
                {selectedPerson.national_code && (
                  <div>
                    <span className="text-slate-400 block mb-0.5">کد ملی / شناسه ملی:</span>
                    <span className="font-bold text-slate-700 font-mono">{selectedPerson.national_code}</span>
                  </div>
                )}
                {selectedPerson.economic_code && (
                  <div>
                    <span className="text-slate-400 block mb-0.5">کد اقتصادی:</span>
                    <span className="font-bold text-slate-700 font-mono">{selectedPerson.economic_code}</span>
                  </div>
                )}
                {selectedPerson.landline && (
                  <div>
                    <span className="text-slate-400 block mb-0.5">تلفن ثابت:</span>
                    <span className="font-bold text-slate-700 font-mono">{selectedPerson.landline}</span>
                  </div>
                )}
                {selectedPerson.postal_code && (
                  <div>
                    <span className="text-slate-400 block mb-0.5">کد پستی:</span>
                    <span className="font-bold text-slate-700 font-mono">{selectedPerson.postal_code}</span>
                  </div>
                )}
                {selectedPerson.email && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block mb-0.5">پست الکترونیکی:</span>
                    <span className="font-bold text-slate-700 font-mono">{selectedPerson.email}</span>
                  </div>
                )}
                {selectedPerson.address && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block mb-0.5">آدرس کامل:</span>
                    <span className="font-semibold text-slate-700">{selectedPerson.address}</span>
                  </div>
                )}
                {selectedPerson.notes && (
                  <div className="col-span-2 border-t border-slate-200/60 pt-2 mt-1">
                    <span className="text-slate-400 block mb-0.5">توضیحات / یادداشت‌ها:</span>
                    <p className="text-slate-600 bg-white p-2 rounded border border-slate-100 text-[11px] whitespace-pre-wrap">{selectedPerson.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* تاریخچه تراکنش‌ها */}
            <div className="flex-1 overflow-y-auto" id="ledger-transactions">
              <h4 className="font-bold text-xs text-slate-700 mb-3 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-500" />
                لیست اقلام و فاکتورهای صادره
              </h4>
              {personInvoices.length === 0 ? (
                <div className="text-center py-20 bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <span className="text-xs text-slate-400">هیچ فاکتوری برای این شخص ثبت نشده است.</span>
                </div>
              ) : (
                <div className="space-y-2.5" id="ledger-invoice-cards-list">
                  {personInvoices.map(inv => {
                    return (
                      <div key={inv.id} className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              inv.type === 'Purchase' ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}></span>
                            <span className="text-xs font-bold text-slate-800">
                              فاکتور شماره {inv.invoice_number}
                            </span>
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-mono">
                              {inv.type === 'Sale' ? 'فروش معمولی' : inv.type === 'Quick Sale' ? 'فروش سریع' : 'فاکتور خرید'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(inv.created_at).toLocaleDateString('fa-IR')}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-50 text-[10.5px]">
                          <div>
                            <span className="text-slate-400 block">جمع کل قبل تخفیف:</span>
                            <span className="font-bold text-slate-700">{formatToman(inv.total_amount)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">مبلغ تخفیف فاکتور:</span>
                            <span className="font-bold text-red-500">{formatToman(inv.discount)}</span>
                          </div>
                          <div className="text-left">
                            <span className="text-slate-400 block mb-0.5">وضعیت پرداخت:</span>
                            <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                              inv.payment_status === 'Paid' 
                                ? 'bg-emerald-50 text-emerald-600' 
                                : inv.payment_status === 'Unpaid' 
                                  ? 'bg-red-50 text-red-600' 
                                  : 'bg-amber-50 text-amber-600'
                            }`}>
                              {inv.payment_status === 'Paid' ? 'پرداخت کامل' : inv.payment_status === 'Unpaid' ? 'پرداخت نشده (نسیه)' : 'علی‌الحساب'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-between items-center text-xs pt-1.5 border-t border-slate-100 bg-slate-50 -mx-4 -mb-4 px-4 py-2 rounded-b-xl">
                          <span className="text-slate-500 font-medium text-[11px]">مبلغ نهایی قابل پرداخت:</span>
                          <span className="font-bold text-emerald-600 text-sm font-mono">{formatToman(inv.final_amount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-slate-400">
            <Users className="w-12 h-12 text-slate-300 mb-2 mt-4" />
            <p className="text-xs font-medium">مشتری یا حسابی را جهت مشاهده ریز تراکنش‌ها انتخاب نمایید</p>
          </div>
        )}
      </div>
    </div>
  );
}
