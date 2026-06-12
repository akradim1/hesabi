import React, { useState, useEffect } from 'react';
import { OfflineDatabase } from '../db/offlineDb';
import { Invoice, Person, InvoiceItem } from '../types';
import { FileText, Search, Printer, RotateCcw, AlertTriangle, Filter, Eye, ChevronLeft } from 'lucide-react';

export default function InvoiceHistoryTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Sale' | 'Quick Sale' | 'Purchase'>('All');
  
  // برای مودال پیش‌نمایش مجدد فاکتور قدیمی
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedInvoiceItems, setSelectedInvoiceItems] = useState<InvoiceItem[]>([]);
  const [selectedInvoicePerson, setSelectedInvoicePerson] = useState<Person | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setInvoices(OfflineDatabase.getInvoices());
    const pList = OfflineDatabase.getPersons();
    setPersons(pList);
  };

  const getPersonName = (personId: string) => {
    if (personId === 'general_customer') return 'مشتری عمومی (فروش سریع)';
    const found = persons.find(p => p.id === personId);
    return found ? found.name : 'نامشخص / ویرایش شده';
  };

  // ابطال فاکتور (تعدیل معکوس انبار و برائت مالی شخص)
  const handleRollback = (inv: Invoice) => {
    if (confirm(`هشدار مهم مالی!\nآیا تمایل به ابطال و حذف فاکتور شماره ${inv.invoice_number} دارید؟\nبا تایید این عملیات، تراز بدهکاری خریدار پاک شده و اقلام فروخته شده به موجودی کالاهای فیزیکی انبار عودت داده خواهند شد.`)) {
      // شبیه‌ساز ابطال تراکنش
      const productsList = OfflineDatabase.getProducts();
      const currentItems = OfflineDatabase.getInvoiceItemsByInvoiceId(inv.id);
      const personsList = OfflineDatabase.getPersons();

      // ۱. معکوس کردن انبار
      currentItems.forEach(item => {
        if (item.item_type === 'Product') {
          const prod = productsList.find(p => p.id === item.item_id);
          if (prod) {
            // اگر فروش بوده، ابطال یعنی کالا برمیگرده به مغازه (موجودی زیاد میشه)
            // اگر خرید بوده، ابطال یعنی کالا مرجوعی خارج میشه (موجودی کم میشه)
            if (inv.type === 'Sale' || inv.type === 'Quick Sale') {
              prod.stock_quantity += item.quantity;
            } else if (inv.type === 'Purchase') {
              prod.stock_quantity = Math.max(0, prod.stock_quantity - item.quantity);
            }
            OfflineDatabase.saveProduct(prod);
          }
        }
      });

      // ۲. معکوس کردن معین مالی حساب شخص
      if (inv.person_id !== 'general_customer') {
        const pers = personsList.find(p => p.id === inv.person_id);
        if (pers) {
          let diff = 0;
          if (inv.type === 'Sale') {
            diff = inv.final_amount;
            if (inv.payment_status === 'Paid') diff = 0;
            else if (inv.payment_status === 'Partial') diff = inv.final_amount * 0.4;
          } else if (inv.type === 'Purchase') {
            diff = -inv.final_amount;
            if (inv.payment_status === 'Paid') diff = 0;
          }
          pers.balance -= diff; // کسر بدهکاری ایجاد شده
          OfflineDatabase.savePerson(pers);
        }
      }

      // ۳. کسر فاکتور از لیست محلی
      OfflineDatabase.deleteInvoice(inv.id);

      refreshData();
      alert(`سند فاکتور شماره ${inv.invoice_number} با موفقیت ابطال شد و موجودی انبار اصلاح گردید.`);
    }
  };

  // گشودن فاکتور جهت بازبینی
  const handleViewInvoice = (inv: Invoice) => {
    const items = OfflineDatabase.getInvoiceItemsByInvoiceId(inv.id);
    const pers = persons.find(p => p.id === inv.person_id) || { id: 'general_customer', name: 'مشتری عمومی', phone: '0', type: 'Customer', balance: 0 };
    
    setSelectedInvoice(inv);
    setSelectedInvoiceItems(items);
    setSelectedInvoicePerson(pers as Person);
  };

  const formatToman = (val: number) => {
    return val.toLocaleString('fa-IR') + ' تومان';
  };

  const getPaymentStatusText = (status: string) => {
    if (status === 'Paid') return { text: 'پرداخت نقدی کامل', style: 'bg-emerald-50 text-emerald-600' };
    if (status === 'Unpaid') return { text: 'کاملاً نسیه', style: 'bg-red-50 text-red-600 font-bold' };
    return { text: 'علی‌الحساب (چک/نقدی)', style: 'bg-amber-50 text-amber-600' };
  };

  // فیلتر و سرچ نهایی
  const filteredInvoices = invoices.filter(inv => {
    const customerName = getPersonName(inv.person_id);
    const matchesQuery = inv.invoice_number.includes(searchQuery) || customerName.includes(searchQuery);
    
    if (!matchesQuery) return false;
    if (filterType === 'Sale' && inv.type !== 'Sale') return false;
    if (filterType === 'Quick Sale' && inv.type !== 'Quick Sale') return false;
    if (filterType === 'Purchase' && inv.type !== 'Purchase') return false;

    return true;
  });

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto" id="invoice-history-context">
      
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm max-w-6xl mx-auto" id="history-box">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-3">
          <div>
            <h2 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <FileText className="w-5 h-5 text-emerald-500" />
               آرشیو و کنترل اسناد مالی (دفتر کل فاکتورها)
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">امکان ابطال تراکنش‌های گذشته و بررسی وضعیت تسویه حساب مشتریان</p>
          </div>

          {/* ابزار ردیابی و سرچ */}
          <div className="flex flex-wrap items-center gap-2" id="search-filters-bar">
            <div className="relative w-52 text-xs">
              <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
              <input
                id="search-invoice-history-input"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="جستجوی شماره فاکتور یا نام شخص..."
                className="w-full font-sans pr-8 pl-3.5 py-1.8 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px]" id="invoice-type-filters">
              {(['All', 'Sale', 'Quick Sale', 'Purchase'] as const).map(f => (
                <button
                  key={f}
                  id={`filter-${f}`}
                  onClick={() => setFilterType(f)}
                  className={`py-1 px-2.5 rounded-md font-medium font-sans ${
                    filterType === f 
                      ? 'bg-white text-slate-800 shadow-xs' 
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {f === 'All' && 'همه'}
                  {f === 'Sale' && 'فروش معمولی'}
                  {f === 'Quick Sale' && 'صندوق سریع'}
                  {f === 'Purchase' && 'خرید كالا'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* جدول تاریخچه فاکتورها */}
        <div className="overflow-x-auto text-xs" id="history-table-holder">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-24 text-slate-400 font-medium">
               هیچ فاکتوری در این ردیف آرشیو پیدا نشد.
            </div>
          ) : (
            <table className="w-full border-collapse" id="history-table">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold text-right">
                  <th className="py-3 px-4">شماره سند</th>
                  <th className="py-3 px-4">تاریخ ثبت</th>
                  <th className="py-3 px-4">طرف حساب تجاری</th>
                  <th className="py-3 px-4">نوع معامله</th>
                  <th className="py-3 px-4 text-left">مبلغ کل فاکتور</th>
                  <th className="py-3 px-4 text-left">مبلغ تخفیف</th>
                  <th className="py-3 px-4 text-left">مبلغ نقدی قابل تسویه</th>
                  <th className="py-3 px-4 text-center">وضعیت مالی</th>
                  <th className="py-3 px-4 text-center">خدمات سند</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(inv => {
                  const paymentText = getPaymentStatusText(inv.payment_status);
                  return (
                    <tr key={inv.id} id={`history-row-${inv.id}`} className="border-b border-slate-100 hover:bg-slate-50/40 text-slate-800 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">#{inv.invoice_number}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[10.5px]">
                        {new Date(inv.created_at).toLocaleDateString('fa-IR')} {new Date(inv.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-bold">{getPersonName(inv.person_id)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.type === 'Purchase' 
                            ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {inv.type === 'Sale' ? 'فروش معمولی' : inv.type === 'Quick Sale' ? 'صندوق سریع' : 'خرید کالا'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-left font-mono">{formatToman(inv.total_amount)}</td>
                      <td className="py-3 px-4 text-left text-red-500 font-mono font-bold">-{formatToman(inv.discount)}</td>
                      <td className="py-3 px-4 text-left text-emerald-600 font-extrabold font-mono">{formatToman(inv.final_amount)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${paymentText.style}`}>
                          {paymentText.text}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          id={`view-archive-btn-${inv.id}`}
                          onClick={() => handleViewInvoice(inv)}
                          className="p-1 px-2 border border-slate-100 hover:border-emerald-200 bg-white shadow-xs rounded text-slate-500 hover:text-emerald-600 transition flex items-center gap-0.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          نمایش
                        </button>
                        <button
                          id={`rollback-btn-${inv.id}`}
                          onClick={() => handleRollback(inv)}
                          className="p-1 px-2 border border-slate-100 hover:border-red-200 bg-white shadow-xs rounded text-slate-400 hover:text-red-500 transition flex items-center gap-0.5 cursor-pointer"
                          title="ابطال سند و بازگردانی انبار"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          ابطال فاکتور
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* مودال چاپی فاکتور آرشیو شده قدیمی */}
      {selectedInvoice && selectedInvoicePerson && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 overflow-y-auto p-4 flex justify-center items-start animate-fade-in" id="history-modal-overlay">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-8 border border-slate-200 shadow-2xl space-y-6 mt-10" id="history-modal">
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 text-xs text-slate-500">
              <span className="font-bold flex items-center gap-1 text-slate-700">
                بازبینی مجدد فاکتور شماره {selectedInvoice.invoice_number}
              </span>
              <div className="flex gap-1.5">
                <button
                  id="reprint-a4"
                  onClick={() => { alert('مستند چاپی فاکتور به صف دستگاه پرینتر ویندوز ارسال گردید.'); }}
                  className="py-1.5 px-3.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  چاپ مجدد
                </button>
                <button
                  id="close-reprint"
                  onClick={() => { setSelectedInvoice(null); }}
                  className="py-1.5 px-3.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  بستن پیش‌نمایش
                </button>
              </div>
            </div>

            {/* برگ آ۴ فاکتور */}
            <div className="border-[2px] border-slate-900 p-6 select-text space-y-6 text-slate-950 font-sans" id="reprint-paper">
              <div className="grid grid-cols-3 items-center border-[2px] border-slate-900 -mx-6 -mt-6 p-4 bg-slate-50">
                <div className="text-right">
                  <h1 className="font-extrabold text-sm text-slate-900">فاکتور رسمی حسابداری فروش مستقیم</h1>
                  <span className="text-[9px] text-slate-400">بخش آرشیو و ذخیره‌سازی داده‌های آفلاین</span>
                </div>
                <div className="text-center font-bold text-xs bg-slate-200 py-1 border border-slate-900 rounded">
                  {selectedInvoice.type === 'Purchase' ? 'فاکتور خرید کالا' : 'فاکتور فروش کالا و خدمات'}
                </div>
                <div className="text-left text-[11px] font-mono leading-relaxed space-y-0.5">
                  <div>شماره فاکتور: {selectedInvoice.invoice_number}</div>
                  <div>تاریخ صدور اولیه: {new Date(selectedInvoice.created_at).toLocaleDateString('fa-IR')}</div>
                  <div>وضعیت تسویه: {selectedInvoice.payment_status === 'Paid' ? 'نقدی کامل' : selectedInvoice.payment_status === 'Unpaid' ? 'حساب نسیه' : 'علی‌الحساب'}</div>
                </div>
              </div>

              {/* طرف حساب */}
              <div className="border border-slate-900 p-4 rounded text-xs">
                <h4 className="font-bold border-b border-slate-900 pb-1 -mx-4 -mt-4 bg-slate-100 px-4">مشخصات طرف حساب تجاری (خریدار / دریافت‌کننده کالا)</h4>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div>
                    <span className="text-slate-400">نام خریدار:</span>
                    <span className="font-bold block text-slate-950">{selectedInvoicePerson.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">تلفن همراه:</span>
                    <span className="font-bold block text-slate-950 font-mono">{selectedInvoicePerson.phone !== '0' ? selectedInvoicePerson.phone : 'سیستمی'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">شناسه حسابداری:</span>
                    <span className="font-bold block text-slate-950 font-mono">{selectedInvoicePerson.id}</span>
                  </div>
                </div>
              </div>

              {/* سطرها */}
              <div className="border border-slate-900 rounded overflow-hidden text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-900 text-slate-800 text-right font-bold h-9">
                      <th className="py-2.5 px-3 border-l border-slate-900 w-12 text-center">ردیف</th>
                      <th className="py-2.5 px-3 border-l border-slate-900">شرح عنوان اقلام</th>
                      <th className="py-2.5 px-3 border-l border-slate-900 text-center w-24">نوع سطر</th>
                      <th className="py-2.5 px-3 border-l border-slate-900 text-left w-20">تعداد</th>
                      <th className="py-2.5 px-3 border-l border-slate-900 text-left w-28">قیمت واحد (T)</th>
                      <th className="py-2.5 px-3 text-left w-28">مبلغ نهایی (T)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoiceItems.map((item, index) => (
                      <tr key={item.id} className="border-b border-slate-900 h-9">
                        <td className="py-2 px-3 border-l border-slate-900 text-center font-mono">{index + 1}</td>
                        <td className="py-2 px-3 border-l border-slate-900 font-bold">{item.item_id === 'srv_1' || item.item_id === 'srv_2' || item.item_id === 'srv_3' ? `سرویس: ${item.item_id}` : `کالا و ملزومات فروشگاهی`}</td>
                        <td className="py-2 px-3 border-l border-slate-900 text-center">{item.item_type === 'Product' ? 'کالای انبارداری' : 'هزینه دستمزد'}</td>
                        <td className="py-2 px-3 border-l border-slate-900 text-left font-mono">{item.quantity}</td>
                        <td className="py-2 px-3 border-l border-slate-900 text-left font-mono">{item.price.toLocaleString('fa-IR')}</td>
                        <td className="py-2 px-3 text-left font-bold font-mono">{(item.price * item.quantity).toLocaleString('fa-IR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* محاسبات */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                <div className="border border-slate-900 p-3 rounded leading-relaxed text-slate-500">
                  <span className="font-bold text-slate-900 block mb-1 font-sans">توضیحات ابطال یا بازبینی:</span>
                  <p>این فاکتور از آرشیو دائمی بازخوانی شده است. تراز حسابداری و تغییرات موجودی انبار بابت این سند معین شده و تغییر‌ناپذیرند مگر در صورت فشردن دکمه ابطال دستی فاکتور.</p>
                </div>

                <div className="border border-slate-900 overflow-hidden rounded">
                  <div className="border-b border-slate-900 p-2 flex justify-between bg-slate-50">
                    <span className="text-slate-500">جمع ناخالص:</span>
                    <span className="font-mono font-bold">{formatToman(selectedInvoice.total_amount)}</span>
                  </div>
                  <div className="border-b border-slate-900 p-2 flex justify-between text-red-500">
                    <span>کسر تخفیف فاکتور:</span>
                    <span className="font-mono font-bold">-{formatToman(selectedInvoice.discount)}</span>
                  </div>
                  <div className="p-2 flex justify-between bg-slate-100 text-sm font-extrabold text-slate-950">
                    <span>مبلغ پرداخت شده:</span>
                    <span className="font-mono text-[15px] text-emerald-800">{formatToman(selectedInvoice.final_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
