import React, { useState, useEffect } from 'react';
import { OfflineDatabase } from '../db/offlineDb';
import { Person, Product, Service, Invoice, InvoiceItem } from '../types';
import { Plus, Trash2, CheckCircle, Printer, Users, ShoppingBag, Receipt, AlertCircle, FileText } from 'lucide-react';

interface SelectedItem {
  id: string; // client temporary inline id
  type: 'Product' | 'Service';
  item_id: string; // References database Product or Service ID
  title: string;
  quantity: number;
  price: number;
  unit: string;
}

export default function InvoiceTab() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // انتخاب حساب مشتری
  const [selectedPersonId, setSelectedPersonId] = useState('general_customer');
  const [invoiceType, setInvoiceType] = useState<'Sale' | 'Purchase'>('Sale');

  // ردیف‌های فعال فاکتور جاری
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // مقادیر ورودی جدید برای سطر فاکتور
  const [currentItemType, setCurrentItemType] = useState<'Product' | 'Service'>('Product');
  const [currentProductId, setCurrentProductId] = useState('');
  const [currentServiceId, setCurrentServiceId] = useState('');
  const [currentQty, setCurrentQty] = useState<number>(1);
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  // تخفیف و مالیات
  const [discount, setDiscount] = useState<number>(0);
  const [applyTax, setApplyTax] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid' | 'Partial'>('Paid');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'POS' | 'Mixed'>('POS');

  // پیش‌نمایش چاپی فاکتور آ۴ رسمی
  const [activeInvoiceForPrint, setActiveInvoiceForPrint] = useState<{ invoice: Invoice; items: SelectedItem[]; person: Person } | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setPersons(OfflineDatabase.getPersons());
    setProducts(OfflineDatabase.getProducts());
    setServices(OfflineDatabase.getServices());
    setInvoices(OfflineDatabase.getInvoices());
  };

  // هرگاه کالا یا خدمت جدید انتخاب می‌شود، قیمت آن را اتوماتیک پر کنیم
  useEffect(() => {
    if (currentItemType === 'Product') {
      const p = products.find(prod => prod.id === currentProductId);
      if (p) {
        setCurrentPrice(invoiceType === 'Sale' ? p.sale_price : p.purchase_price);
      } else {
        setCurrentPrice(0);
      }
    } else {
      const s = services.find(srv => srv.id === currentServiceId);
      if (s) {
        setCurrentPrice(s.price);
      } else {
        setCurrentPrice(0);
      }
    }
  }, [currentProductId, currentServiceId, currentItemType, invoiceType, products, services]);

  // اضافه کردن یک ردیف جدید به فاکتور
  const handleAddItemRow = (e: React.FormEvent) => {
    e.preventDefault();
    
    let dbId = '';
    let itemTitle = '';
    let itemUnit = 'عدد';

    if (currentItemType === 'Product') {
      if (!currentProductId) return;
      const originalProduct = products.find(p => p.id === currentProductId);
      if (!originalProduct) return;
      
      // چک کردن تکراری بودن آیتم در جدول بالایی
      if (selectedItems.some(row => row.item_id === currentProductId && row.type === 'Product')) {
        alert('این کالا قبلا به فاکتور اضافه شده است. لطفا تعداد آن را در جدول ویرایش کنید.');
        return;
      }

      // چک کردن موجودی فقط در حالت پیش‌فروش کالا
      if (invoiceType === 'Sale' && originalProduct.stock_quantity < currentQty) {
        alert(`هشدار: موجودی انبار کالا کافی نیست (${originalProduct.stock_quantity} ${originalProduct.unit} مانده است)`);
      }

      dbId = originalProduct.id;
      itemTitle = originalProduct.title;
      itemUnit = originalProduct.unit;
    } else {
      if (!currentServiceId) return;
      const originalService = services.find(s => s.id === currentServiceId);
      if (!originalService) return;

      if (selectedItems.some(row => row.item_id === currentServiceId && row.type === 'Service')) {
        alert('این خدمت قبلا اضافه شده است.');
        return;
      }

      dbId = originalService.id;
      itemTitle = originalService.title;
      itemUnit = 'سرویس';
    }

    const newRow: SelectedItem = {
      id: `row_${Date.now()}`,
      type: currentItemType,
      item_id: dbId,
      title: itemTitle,
      quantity: currentQty,
      price: currentPrice,
      unit: itemUnit
    };

    setSelectedItems([...selectedItems, newRow]);
    
    // ریست فیلدهای پایین ردیف
    setCurrentProductId('');
    setCurrentServiceId('');
    setCurrentQty(1);
    setCurrentPrice(0);
  };

  // حذف ردیف از چیدمان فاکتور
  const handleRemoveRow = (rowId: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== rowId));
  };

  // ویرایش سریع تعداد سطر
  const handleQtyChangeInTable = (rowId: string, value: number) => {
    setSelectedItems(selectedItems.map(row => {
      if (row.id === rowId) {
        return { ...row, quantity: value };
      }
      return row;
    }));
  };

  // محاسبات نهایی مالیات و تخفیف
  const subtotal = selectedItems.reduce((sum, row) => sum + (row.price * row.quantity), 0);
  const discountAmount = Number(discount);
  const taxAmount = applyTax ? Math.round((subtotal - discountAmount) * 0.1) : 0; // ۱۰ درصد ارزش افزوده رسمی دفتری ایران
  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);

  // ثبت فاکتور نهایی
  const handleRegisterInvoice = () => {
    if (selectedItems.length === 0) {
      alert('لطفا حداقل یک ردیف کالا یا خدمت به جدول فاکتور اضافه کنید.');
      return;
    }

    const itemsPayload = selectedItems.map(row => ({
      item_id: row.item_id,
      item_type: row.type,
      quantity: row.quantity,
      price: row.price
    }));

    const person = persons.find(p => p.id === selectedPersonId) || persons[0];

    // ثبت فاکتور
    const savedInv = OfflineDatabase.createInvoice({
      person_id: selectedPersonId,
      type: invoiceType,
      total_amount: subtotal,
      discount: discountAmount,
      final_amount: grandTotal,
      payment_status: paymentStatus,
      payment_method: paymentMethod
    }, itemsPayload);

    // ارسال به صورت چاپی رسمی آ۴ مجاز
    setActiveInvoiceForPrint({
      invoice: savedInv,
      items: selectedItems,
      person
    });

    // پاکسازی کامل فرم پس از ثبت سند انبار و حسابداری برای فاکتور بعدی
    setSelectedItems([]);
    setDiscount(0);
    setApplyTax(false);
    setSelectedPersonId('general_customer');
    setPaymentStatus('Paid');
    refreshData();
  };

  const formatToman = (val: number) => {
    return val.toLocaleString('fa-IR') + ' تومان';
  };

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto" id="standard-invoice-wrapper">
      
      {/* فاکتور ساز پیشرفته */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="invoice-builder-layout">
        
        {/* ستون راست: تنظیمات پیش‌نیاز فاکتور فروشگاه */}
        <div className="space-y-6 xl:col-span-1" id="invoice-control-columns">
          
          {/* هدر اطلاعات مشتری و هویت سند */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5" id="customer-identity-card">
            <h3 className="font-bold text-xs text-slate-800 flex items-center gap-2 mb-4">
              <Users className="w-4.5 h-4.5 text-emerald-500" />
              هویت معین فاکتور (شخص و نوع سند)
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10.5px] text-slate-500 mb-1">نوع سند حسابداری:</label>
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                  <button
                    id="doc-sale-type"
                    type="button"
                    onClick={() => { setInvoiceType('Sale'); }}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition ${
                      invoiceType === 'Sale'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    فروش (خروج انبار کالا)
                  </button>
                  <button
                    id="doc-purchase-type"
                    type="button"
                    onClick={() => { setInvoiceType('Purchase'); }}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition ${
                      invoiceType === 'Purchase'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    خرید از تامین‌کننده (ورود انبار)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] text-slate-500 mb-1">انتخاب شخص / طرف حساب تجاری:</label>
                <select
                  id="invoice-select-person"
                  value={selectedPersonId}
                  onChange={e => setSelectedPersonId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg h-9 focus:outline-none"
                >
                  {persons
                    .filter(p => invoiceType === 'Purchase' ? p.type === 'Supplier' : p.type === 'Customer' || p.id === 'general_customer')
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.phone !== '0' ? `(${p.phone})` : ''} — تراز: {p.balance === 0 ? '۰۰' : p.balance > 0 ? `بدهکار (${p.balance.toLocaleString('fa-IR')} ت)` : `بستانکار (${Math.abs(p.balance).toLocaleString('fa-IR')} ت)`}
                      </option>
                    ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block leading-relaxed">
                  فاکتور نوع خرید فقط مالکین تامین‌کننده (Supplier) و فروش شامل مشتریان را پوشش می‌دهد.
                </span>
              </div>
            </div>
          </div>

          {/* پنل شرایط تسویه و وضعیت دریافتی نهایی */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5" id="billing-settlements-card">
            <h3 className="font-bold text-xs text-slate-800 flex items-center gap-2 mb-4">
              <Receipt className="w-4.5 h-4.5 text-emerald-500" />
              شرایط پرداخت و وضعیت تخصیص معین
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10.5px] text-slate-500 mb-1">وضعیت پرداخت فاکتور:</label>
                <select
                  id="invoice-payment-status"
                  value={paymentStatus}
                  onChange={e => setPaymentStatus(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg h-9 focus:outline-none"
                >
                  <option value="Paid">پرداخت کامل فاکتور (نقدی/کارتخوان فوری)</option>
                  <option value="Unpaid">پرداخت انجام نشده (نسیه طویل‌المدت)</option>
                  <option value="Partial">علی‌الحساب (در صدی نسیه و نقد)</option>
                </select>
                <span className="text-[9.5px] text-amber-500 mt-1 block">
                  * با انتخاب گزینه نسیه یا علی‌الحساب مانده کل فاکتور بلافاصله به معین بدهکاری شخص پیوست خواهد شد.
                </span>
              </div>

              <div>
                <label className="block text-[10.5px] text-slate-500 mb-1">مکانیزم دریافت سرمایه:</label>
                <select
                  id="invoice-payment-method"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg h-9 focus:outline-none focus:border-emerald-500"
                >
                  <option value="POS">کارتخوان سیستمی فروشگاه (POS)</option>
                  <option value="Cash">صندوق نقدی مغازه (Cash)</option>
                  <option value="Mixed">ترکیبی (واریز بانکی / چک تضمین)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[11px] text-slate-700 block">احتساب مالیات بر ارزش افزوده (۱۰٪):</span>
                  <span className="text-[9.5px] text-slate-400">اعمال بر کالاها به نرخ مصوب ارزش افزوده</span>
                </div>
                <input
                  id="invoice-apply-tax"
                  type="checkbox"
                  checked={applyTax}
                  onChange={e => setApplyTax(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

        </div>

        {/* ستون چپ: ردیف کالا و خدمات و جدول اصلی سند فاکتور صادر شده */}
        <div className="xl:col-span-2 space-y-6" id="invoice-details-billing-table">
          
          {/* ادیتور ثبت موقت خط فاکتور (Line Items Input Wizard) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5" id="line-items-inputs">
            <h4 className="font-bold text-xs text-slate-800 mb-3.5">افزودن اقلام به تفکیک ردیف‌های پیش فاکتور</h4>
            
            {/* انتخاب نوع آیتم ورودی */}
            <div className="flex flex-wrap items-end gap-3" id="fast-inputs-wrapper">
              <div className="w-28 text-xs">
                <label className="block text-[10px] text-slate-400 mb-1">نوع سطر فاکتور:</label>
                <select
                  id="item-type-toggle"
                  value={currentItemType}
                  onChange={e => {
                    setCurrentItemType(e.target.value as any);
                    setCurrentProductId('');
                    setCurrentServiceId('');
                  }}
                  className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg h-9"
                >
                  <option value="Product">کالا (انبار)</option>
                  <option value="Service">خدمات (دستمزد)</option>
                </select>
              </div>

              {currentItemType === 'Product' ? (
                <div className="flex-1 min-w-[150px] text-xs">
                  <label className="block text-[10px] text-slate-400 mb-1">انتخاب کالا کاتالوگ:</label>
                  <select
                    id="invoice-product-picker"
                    value={currentProductId}
                    onChange={e => setCurrentProductId(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg h-9"
                  >
                    <option value="">-- کالا را برگزینید --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title} (موجودی: {p.stock_quantity})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex-1 min-w-[150px] text-xs">
                  <label className="block text-[10px] text-slate-400 mb-1">انتخاب خدمت:</label>
                  <select
                    id="invoice-service-picker"
                    value={currentServiceId}
                    onChange={e => setCurrentServiceId(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg h-9"
                  >
                    <option value="">-- بخش خدماتی --</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({formatToman(s.price)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="w-20 text-xs text-left">
                <label className="block text-[10px] text-slate-400 mb-1 text-right">مقدار / تعداد:</label>
                <input
                  id="invoice-item-qty"
                  type="number"
                  min="1"
                  value={currentQty}
                  onChange={e => setCurrentQty(Number(e.target.value))}
                  className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-left"
                />
              </div>

              <div className="w-28 text-xs text-left">
                <label className="block text-[10px] text-slate-400 mb-1 text-right">قیمت واحد (تومان):</label>
                <input
                  id="invoice-item-custom-price"
                  type="number"
                  value={currentPrice || ''}
                  onChange={e => setCurrentPrice(Number(e.target.value))}
                  className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-left font-mono"
                  placeholder="قیمت توافقی واحد"
                />
              </div>

              <button
                id="add-item-row-btn"
                type="button"
                onClick={handleAddItemRow}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-3.5 h-9 rounded-lg text-xs flex items-center gap-1 shadow-sm transition"
              >
                <Plus className="w-3.8 h-3.8" />
                درج در فاکتور
              </button>
            </div>
          </div>

          {/* جدول اقلام درج شده بدنه فاکتور فیزیکی */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5" id="billing-items-table-card">
            <h4 className="font-bold text-xs text-slate-800 mb-3.5">پیش فاکتور آماده تایید نهایی</h4>
            
            {selectedItems.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-100 flex flex-col justify-center items-center text-slate-400">
                <AlertCircle className="w-8 h-8 text-slate-300 mb-1.5" />
                <span className="text-[11px] font-medium">سطری جهت ایجاد فاکتور وجود ندارد. از کنترلر بالایی کالا یا خدمات درج کنید.</span>
              </div>
            ) : (
              <div className="overflow-x-auto text-xs" id="items-table-wrapper">
                <table className="w-full border-collapse" id="invoice-items-table-details">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-right bg-slate-50/50">
                      <th className="py-2.5 px-3">سطر</th>
                      <th className="py-2.5 px-3">عنوان کالا یا خدمات</th>
                      <th className="py-2.5 px-3">نوع</th>
                      <th className="py-2.5 px-3 text-left">تعداد / مقدار</th>
                      <th className="py-2.5 px-3 text-left">قیمت واحد (T)</th>
                      <th className="py-2.5 px-3 text-left">مبلغ نهایی (T)</th>
                      <th className="py-2.5 px-3 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item, index) => (
                      <tr key={item.id} id={`row-item-${item.id}`} className="border-b border-slate-50 text-slate-800">
                        <td className="py-3 px-3 font-mono">{index + 1}</td>
                        <td className="py-3 px-3 font-bold">{item.title}</td>
                        <td className="py-3 px-3 text-slate-400 text-[10px]">
                          {item.type === 'Product' ? `کالا (${item.unit})` : 'خدماتی'}
                        </td>
                        <td className="py-3 px-3 text-left font-mono">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => handleQtyChangeInTable(item.id, Number(e.target.value))}
                            className="w-12 text-center bg-slate-100/60 rounded px-1 text-xs py-0.5"
                          />
                        </td>
                        <td className="py-3 px-3 text-left font-mono text-slate-600">{item.price.toLocaleString('fa-IR')}</td>
                        <td className="py-3 px-3 text-left font-bold font-mono text-slate-800">{(item.price * item.quantity).toLocaleString('fa-IR')}</td>
                        <td className="py-3 px-3 text-center">
                          <button
                            id={`del-row-${item.id}`}
                            onClick={() => handleRemoveRow(item.id)}
                            className="text-slate-300 hover:text-red-500 rounded p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* بخش تسویه حساب فاکتور نهایی */}
            {selectedItems.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-100 text-xs flex flex-col md:flex-row justify-between items-start gap-4">
                
                {/* بخش تخفیفات */}
                <div className="w-full md:w-56 space-y-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">کسر تخفیف فاکتور (تومان):</label>
                    <input
                      id="invoice-manual-discount"
                      type="number"
                      value={discount || ''}
                      onChange={e => setDiscount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-left"
                      placeholder="تخفیف کلی"
                    />
                  </div>
                </div>

                {/* محاسبات حسابداری */}
                <div className="w-full md:w-80 space-y-2 border-r border-slate-100 pr-5" id="total-sums">
                  <div className="flex justify-between text-slate-500">
                    <span>جمع اقلام پیش فاکتور:</span>
                    <span className="font-mono">{formatToman(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-red-500">
                    <span>تخفیف دستی کسر شده:</span>
                    <span className="font-mono font-bold">-{formatToman(discountAmount)}</span>
                  </div>
                  {applyTax && (
                    <div className="flex justify-between text-indigo-600">
                      <span>مالیات ارزش افزوده (۱۰٪):</span>
                      <span className="font-mono">+{formatToman(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-100 font-extrabold text-slate-900 text-sm">
                    <span>مبلغ کل قابل تسویه:</span>
                    <span className="text-emerald-600 text-base font-mono">{formatToman(grandTotal)}</span>
                  </div>

                  <button
                    id="submit-advanced-invoice-btn"
                    onClick={handleRegisterInvoice}
                    className="w-full mt-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center justify-center gap-1.5 transition active:scale-97 cursor-pointer text-xs"
                  >
                    <CheckCircle className="w-4 h-4" />
                     ثبت نهایی و صدور سند چاپی رسمی
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>

      {/* بخش پیش‌نمایش چاپی فاکتور آ۴ رسمی (A4 Official Print Layout Simulation) */}
      {activeInvoiceForPrint && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 overflow-y-auto p-4 flex justify-center items-start animate-fade-in" id="print-overlay">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-8 border border-slate-200 shadow-2xl space-y-6 mt-10 md:mb-10" id="print-container">
            
            {/* دکمه‌های کنترلی بالای فاکتور آ۴ */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 text-xs no-print">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <FileText className="w-4.5 h-4.5 text-blue-500" />
                 سند فاکتور رسمی صادر شده (شبیه‌ساز استاندارد چاپ جمهوری اسلامی ایران)
              </span>
              <div className="flex gap-2">
                <button
                  id="print-a4-btn"
                  onClick={() => { alert('سرویس چاپ آفلاین بومی سیستم آماده شد. برای چاپ واقعی، دکمه Ctrl+P را بعد از انتقال به بستر Electron اجرا نمایید.'); }}
                  className="py-1.5 px-3.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-4.5 h-4.5" />
                  چاپ مستقیم / ذخیره PDF
                </button>
                <button
                  id="close-a4-btn"
                  onClick={() => setActiveInvoiceForPrint(null)}
                  className="py-1.5 px-3.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition"
                >
                  بازگشت به برنامه
                </button>
              </div>
            </div>

            {/* برگ آ۴ فاکتور */}
            <div className="border-[2px] border-slate-900 p-6 select-text space-y-6 text-slate-950 A4-paper" id="a4-printable-paper">
              
              {/* هدر فاکتور رسمی */}
              <div className="grid grid-cols-3 items-center border-[2px] border-slate-900 -mx-6 -mt-6 p-4 bg-slate-50">
                <div className="text-right">
                  <h1 className="font-extrabold text-base text-slate-900">فاکتور رسمی فروش مستقیم کالا و خدمات</h1>
                  <span className="text-[10px] text-slate-500">نرم‌افزار یکپارچه حسابداری فروشگاهی آریا</span>
                </div>
                <div className="text-center font-bold text-xs bg-slate-200 py-1 px-3 border border-slate-900 rounded">
                  فاکتور نوع: (فروش کالای تجاری)
                </div>
                <div className="text-left text-[11px] font-mono leading-relaxed space-y-0.5">
                  <div>شماره فاکتور: {activeInvoiceForPrint.invoice.invoice_number}</div>
                  <div>تاریخ صدور: {new Date(activeInvoiceForPrint.invoice.created_at).toLocaleDateString('fa-IR')}</div>
                  <div>وضعیت تسویه: {activeInvoiceForPrint.invoice.payment_status === 'Paid' ? 'نقدی کامل' : activeInvoiceForPrint.invoice.payment_status === 'Unpaid' ? 'حساب نسیه' : 'علی‌الحساب'}</div>
                </div>
              </div>

              {/* مشخصات خریدار / فروشنده */}
              <div className="border border-slate-900 p-4 rounded text-xs space-y-2">
                <h4 className="font-bold border-b border-slate-900 pb-1 -mx-4 -mt-4 bg-slate-100 px-4">مشخصات طرف حساب تجاری (خریدار / دریافت‌کننده کالا)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1.5">
                  <div>
                    <span className="text-slate-500">نام شخص حقیقی/حقوقی:</span>
                    <span className="font-bold block text-slate-950">{activeInvoiceForPrint.person.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">تلفن همراه:</span>
                    <span className="font-bold block text-slate-950 font-mono">{activeInvoiceForPrint.person.phone !== '0' ? activeInvoiceForPrint.person.phone : 'ثبت نشده'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">نوع همکاری:</span>
                    <span className="font-bold block text-slate-950">{activeInvoiceForPrint.person.type === 'Customer' ? 'مشتری مستقیم' : 'تامین کننده کالا'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">کد عضویت معین:</span>
                    <span className="font-bold block text-slate-950 font-mono">{activeInvoiceForPrint.person.id}</span>
                  </div>
                </div>
              </div>

              {/* جدول اقلام رسمی فاکتور فروش کالا */}
              <div className="border border-slate-900 rounded overflow-hidden text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-900 text-slate-800 text-right font-bold h-9">
                      <th className="py-2.5 px-3 border-l border-slate-900 w-12 text-center">ردیف</th>
                      <th className="py-2.5 px-3 border-l border-slate-900">شرح کالا یا خدمات</th>
                      <th className="py-2.5 px-3 border-l border-slate-900 text-center w-20">واحد</th>
                      <th className="py-2.5 px-3 border-l border-slate-900 text-left w-24">تعداد/مقدار</th>
                      <th className="py-2.5 px-3 border-l border-slate-900 text-left w-28">قیمت واحد (تومان)</th>
                      <th className="py-2.5 px-3 text-left w-32">مبلغ کل (تومان)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeInvoiceForPrint.items.map((item, index) => (
                      <tr key={item.id} className="border-b border-slate-900 h-9">
                        <td className="py-2 px-3 border-l border-slate-900 text-center font-mono">{index + 1}</td>
                        <td className="py-2 px-3 border-l border-slate-900 font-bold">{item.title}</td>
                        <td className="py-2 px-3 border-l border-slate-900 text-center">{item.unit}</td>
                        <td className="py-2 px-3 border-l border-slate-900 text-left font-mono">{item.quantity}</td>
                        <td className="py-2 px-3 border-l border-slate-900 text-left font-mono">{item.price.toLocaleString('fa-IR')}</td>
                        <td className="py-2 px-3 text-left font-bold font-mono">{(item.price * item.quantity).toLocaleString('fa-IR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* محاسبات رسمی پایین فاکتور فروش آ۴ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                <div className="border border-slate-900 p-3 rounded leading-relaxed text-slate-500">
                  <span className="font-bold text-slate-900 block mb-1">توضیحات و شرایط فروش:</span>
                  <p>کالاها بر اساس قوانین تجارت الکترونیک کاتالوگ فروش صادر گردیده و به رویت کامل مشتری رسیده است. تراز بدهکاری و بستانکاری طبق تاییدیه فوق در معین سیستم ثبت و محفوظ می‌باشد.</p>
                </div>

                <div className="border border-slate-900 overflow-hidden rounded">
                  <div className="border-b border-slate-900 p-2.5 flex justify-between bg-slate-50">
                    <span className="text-slate-500">جمع ناخالص فاکتور:</span>
                    <span className="font-mono font-bold">{formatToman(activeInvoiceForPrint.invoice.total_amount)}</span>
                  </div>
                  <div className="border-b border-slate-900 p-2.5 flex justify-between text-red-500">
                    <span>مانده کسر تخفیف:</span>
                    <span className="font-mono font-bold">-{formatToman(activeInvoiceForPrint.invoice.discount)}</span>
                  </div>
                  {activeInvoiceForPrint.invoice.final_amount - activeInvoiceForPrint.invoice.total_amount + activeInvoiceForPrint.invoice.discount > 0 && (
                    <div className="border-b border-slate-900 p-2.5 flex justify-between text-indigo-700">
                      <span>مالیات رسمی افزوده (۱۰٪):</span>
                      <span className="font-mono font-bold">+{formatToman((activeInvoiceForPrint.invoice.final_amount - activeInvoiceForPrint.invoice.total_amount + activeInvoiceForPrint.invoice.discount))}</span>
                    </div>
                  )}
                  <div className="p-2.5 flex justify-between bg-slate-100 text-sm font-extrabold text-slate-950">
                    <span>مبلغ قابل تسویه نهایی:</span>
                    <span className="font-mono text-[16px] text-emerald-800">{formatToman(activeInvoiceForPrint.invoice.final_amount)}</span>
                  </div>
                </div>
              </div>

              {/* امضاها */}
              <div className="grid grid-cols-2 h-20 text-xs text-center border-t border-slate-900 pt-3">
                <div className="text-slate-500">
                  <span>مهر و امضای فروشنده فروشگاه آریا</span>
                </div>
                <div className="text-slate-500 col-span-1">
                  <span>مهر و امضای خریدار / متمم فاکتور</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
