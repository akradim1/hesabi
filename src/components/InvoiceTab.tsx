import React, { useState, useEffect } from 'react';
import { OfflineDatabase } from '../db/offlineDb';
import { Person, Product, Service, Invoice, InvoiceItem } from '../types';
import { SettingsService, AppSettings } from '../utils/settings';
import { InvoiceDesignerService, InvoiceTemplateDesign } from '../utils/invoiceDesignerSettings';
import InvoiceShapes from './InvoiceShapes';
import { 
  Plus, 
  Trash2, 
  CheckCircle, 
  Printer, 
  Users, 
  ShoppingBag, 
  Receipt, 
  AlertCircle, 
  FileText, 
  Search, 
  MapPin, 
  Phone, 
  CreditCard, 
  Tag, 
  Mail, 
  AlignRight, 
  Info, 
  Briefcase 
} from 'lucide-react';

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

  // جستجو و تاگل مشتریان
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  // جستجو و فیلتر کاتالوگ کالاوخدمات
  const [itemSearch, setItemSearch] = useState('');
  const [catalogFilter, setCatalogFilter] = useState<'All' | 'Products' | 'Services'>('All');

  // تنظیمات پوسته و ظاهر برنامه
  const [appSettings, setAppSettings] = useState<AppSettings>(SettingsService.get());
  const [templateDesign, setTemplateDesign] = useState<InvoiceTemplateDesign>(InvoiceDesignerService.get());

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
    
    // اشتراک در رویداد تغییر تنظیمات سراسری
    const handleSettingsUpdate = () => {
      setAppSettings(SettingsService.get());
    };
    const handleDesignerUpdate = () => {
      setTemplateDesign(InvoiceDesignerService.get());
    };
    window.addEventListener('cofeclick_settings_updated', handleSettingsUpdate);
    window.addEventListener('cofeclick_designer_updated', handleDesignerUpdate);
    return () => {
      window.removeEventListener('cofeclick_settings_updated', handleSettingsUpdate);
      window.removeEventListener('cofeclick_designer_updated', handleDesignerUpdate);
    };
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

  // اضافه کردن مستقیم کالا یا خدمات کلیک شده از روی کاتالوگ کارت‌ها
  const handleAddCardItem = (item: any, type: 'Product' | 'Service') => {
    const dbId = item.id;
    const itemTitle = item.title;
    const itemUnit = type === 'Product' ? item.unit : 'سرویس';
    const itemPrice = type === 'Product' ? (invoiceType === 'Sale' ? item.sale_price : item.purchase_price) : item.price;

    // بررسی انبار در حالت پیش‌فروش کالا
    if (type === 'Product' && invoiceType === 'Sale' && item.stock_quantity <= 0) {
      alert(`هشدار: موجودی انبار کالا کافی نیست (موجودی فعلی: ۰ عدد)`);
    }

    const existingRowIdx = selectedItems.findIndex(row => row.item_id === dbId && row.type === type);
    if (existingRowIdx >= 0) {
      // بررسی انبار قبل افزایش تعداد
      if (type === 'Product' && invoiceType === 'Sale' && item.stock_quantity < selectedItems[existingRowIdx].quantity + 1) {
        alert(`هشدار: کالا در انبار به اتمام رسیده است.`);
      }
      const updated = [...selectedItems];
      updated[existingRowIdx] = {
        ...updated[existingRowIdx],
        quantity: updated[existingRowIdx].quantity + 1
      };
      setSelectedItems(updated);
    } else {
      const newRow: SelectedItem = {
        id: `row_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type,
        item_id: dbId,
        title: itemTitle,
        quantity: 1,
        price: itemPrice,
        unit: itemUnit
      };
      setSelectedItems([...selectedItems, newRow]);
    }
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
                <label className="block text-[10.5px] text-slate-500 mb-1">جستجو و انتخاب طرف حساب تجاری:</label>
                <div className="relative">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      className="w-full text-xs pr-8 pl-10 py-2 bg-slate-50 border border-slate-200 rounded-lg h-9 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      placeholder="جستجو با نام، شماره همراه، کدملی، آدرس..."
                      value={customerSearch}
                      onChange={e => {
                        setCustomerSearch(e.target.value);
                        setIsCustomerDropdownOpen(true);
                      }}
                      onFocus={() => setIsCustomerDropdownOpen(true)}
                    />
                    <Search className="absolute right-2.5 w-4 h-4 text-slate-400" />
                    {customerSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerSearch('');
                          setSelectedPersonId('general_customer');
                        }}
                        className="absolute left-2.5 text-slate-400 hover:text-slate-600 text-[10px]"
                      >
                        پاک کردن
                      </button>
                    )}
                  </div>

                  {/* منوی لیست نتایج فیلتر شده */}
                  {isCustomerDropdownOpen && (
                    <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto text-xs divide-y divide-slate-100">
                      {persons
                        .filter(p => invoiceType === 'Purchase' ? p.type === 'Supplier' : p.type === 'Customer' || p.id === 'general_customer')
                        .filter(p => {
                          const q = customerSearch.toLowerCase();
                          if (!q) return true;
                          return (
                            p.name.toLowerCase().includes(q) ||
                            p.phone.includes(q) ||
                            (p.national_code && p.national_code.includes(q)) ||
                            (p.economic_code && p.economic_code.includes(q)) ||
                            (p.address && p.address.toLowerCase().includes(q)) ||
                            (p.notes && p.notes.toLowerCase().includes(q))
                          );
                        })
                        .map(p => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedPersonId(p.id);
                              setCustomerSearch(p.id === 'general_customer' ? '' : p.name);
                              setIsCustomerDropdownOpen(false);
                            }}
                            className={`p-2.5 hover:bg-slate-50 cursor-pointer transition flex justify-between items-center ${
                              selectedPersonId === p.id ? 'bg-emerald-50/50 font-bold text-emerald-700' : ''
                            }`}
                          >
                            <div>
                              <span className="block font-medium">{p.name || 'مشتری عمومی بدون حساب'}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{p.phone !== '0' ? p.phone : 'بدون تلفن'}</span>
                            </div>
                            <span className="text-[10px] font-mono whitespace-nowrap">
                              تراز: {p.balance === 0 ? '۰' : p.balance > 0 ? `${p.balance.toLocaleString('fa-IR')} بدهکار` : `${Math.abs(p.balance).toLocaleString('fa-IR')} بستانکار`}
                            </span>
                          </div>
                        ))}
                      {persons.filter(p => invoiceType === 'Purchase' ? p.type === 'Supplier' : p.type === 'Customer' || p.id === 'general_customer').length === 0 && (
                        <div className="p-3 text-center text-slate-400 text-[11px]">هیچ فرد یا طرف حسابی در دیتابیس یافت نشد</div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* دکمه بستن در صورتی که دراپ داون باز باشد */}
                {isCustomerDropdownOpen && (
                  <div 
                    className="fixed inset-x-0 bottom-0 top-[20%] z-20" 
                    onClick={() => setIsCustomerDropdownOpen(false)}
                  ></div>
                )}

                <span className="text-[10px] text-slate-400 mt-1 block leading-relaxed">
                  فاکتور نوع خرید فقط مالکین تامین‌کننده (Supplier) و فروش شامل مشتریان را پوشش می‌دهد.
                </span>
                
                {/* نمایش تمام اطلاعات ثبت شده طرف حساب بصورت زنده */}
                {(() => {
                  const selectedPerson = persons.find(p => p.id === selectedPersonId);
                  if (!selectedPerson || selectedPerson.id === 'general_customer') return null;
                  return (
                    <div className="bg-slate-50/80 border border-slate-200/50 p-3.5 rounded-xl text-[10.5px] space-y-2.5 mt-3 text-slate-700 animate-fade-in" id="customer-profile-preview-card">
                      <div className="font-bold text-slate-800 text-xs border-b border-dashed border-slate-200 pb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          مشخصات ثبتی طرف حساب تجاری
                        </div>
                        <span className="text-[9px] bg-slate-200/60 text-slate-600 px-1.8 py-0.5 rounded-md font-mono">{selectedPerson.id}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                        <div>
                          <strong className="text-slate-400">طرف حساب: </strong>
                          <span className="font-bold text-slate-900">{selectedPerson.name}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400">کد ملی/شناسه: </strong>
                          <span className="font-mono text-slate-800">{selectedPerson.national_code || 'ثبت نشده'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400">کد اقتصادی: </strong>
                          <span className="font-mono text-slate-800">{selectedPerson.economic_code || 'ثبت نشده'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400">تلفن همراه: </strong>
                          <span className="font-mono text-slate-800">{selectedPerson.phone !== '0' ? selectedPerson.phone : 'ثبت نشده'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400">تلفن ثابت: </strong>
                          <span className="font-mono text-slate-800">{selectedPerson.landline || 'ثبت نشده'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400">کد پستی: </strong>
                          <span className="font-mono text-slate-800">{selectedPerson.postal_code || 'ثبت نشده'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400">سهم مالکین: </strong>
                          <span className="font-mono text-emerald-600 font-bold">{selectedPerson.share_percentage !== undefined ? `${selectedPerson.share_percentage}٪` : 'ثبت نشده'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400">نوع همکاری: </strong>
                          <span className="text-slate-800">
                            {selectedPerson.type === 'Customer' ? 'مشتری صنف' : selectedPerson.type === 'Supplier' ? 'تامین کننده' : 'همکار'}
                          </span>
                        </div>
                      </div>
                      {selectedPerson.email && (
                        <div className="border-t border-slate-200/30 pt-1.5 flex items-center gap-1">
                          <strong className="text-slate-400">پست الکترونیک: </strong>
                          <span className="font-mono text-slate-600">{selectedPerson.email}</span>
                        </div>
                      )}
                      {selectedPerson.address && (
                        <div className="border-t border-slate-200/30 pt-1.5 flex items-center gap-1">
                          <strong className="text-slate-400">نشانی پستی: </strong>
                          <span className="text-slate-800">{selectedPerson.address}</span>
                        </div>
                      )}
                      {selectedPerson.notes && (
                        <div className="border-t border-slate-200/30 pt-1.5 flex items-start gap-1">
                          <strong className="text-slate-400">یادداشت اداری: </strong>
                          <span className="text-slate-500 italic">{selectedPerson.notes}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
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
          
          {/* بخش کاتالوگ کارت‌محور کالا و خدمات با جستجوی سریع */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4" id="line-items-catalog">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-xs text-slate-800">کاتالوگ هوشمند کالا و خدمات</h4>
                <p className="text-[10px] text-slate-400 mt-1">جهت درج کالا یا خدمات در پیش‌فاکتور، روی کارت مربوطه زیر کلیک نمایید.</p>
              </div>
              
              {/* فیلترهای بالا */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-[10px] font-bold self-stretch sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCatalogFilter('All')}
                  className={`px-3 py-1.5 rounded-lg transition ${catalogFilter === 'All' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  همه اقلام ({products.length + services.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogFilter('Products')}
                  className={`px-3 py-1.5 rounded-lg transition ${catalogFilter === 'Products' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  کالاها ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogFilter('Services')}
                  className={`px-3 py-1.5 rounded-lg transition ${catalogFilter === 'Services' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  خدمات ({services.length})
                </button>
              </div>
            </div>

            {/* کادر جستجوی کالا و خدمات */}
            <div className="relative">
              <input
                type="text"
                placeholder="جستجو کالا و خدمات بر اساس نام، بارکد، شرح یا قیمت..."
                value={itemSearch}
                onChange={e => setItemSearch(e.target.value)}
                className="w-full text-xs pr-8.5 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-9.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
            </div>

            {/* گرید کارت‌های محصولات و خدمات */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-0.5" id="catalog-cards-grid">
              {/* بخش کالاها */}
              {(catalogFilter === 'All' || catalogFilter === 'Products') &&
                products
                  .filter(p => !itemSearch || p.title.toLowerCase().includes(itemSearch.toLowerCase()) || p.barcode.includes(itemSearch))
                  .map(p => {
                    const rowQty = selectedItems.find(item => item.item_id === p.id && item.type === 'Product')?.quantity || 0;
                    // انتخاب رنگ پس‌زمینه نازک کالا از تنظیمات پوسته یا پیش‌فرض
                    const cardColor = appSettings.productCardBg || '#f4fbf7';
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleAddCardItem(p, 'Product')}
                        className="relative p-3.5 rounded-xl border border-dashed border-slate-200/60 hover:border-emerald-500/50 hover:shadow-sm cursor-pointer transition select-none flex flex-col justify-between group"
                        style={{ backgroundColor: cardColor }}
                      >
                        {rowQty > 0 && (
                          <span className="absolute top-2 left-2 bg-emerald-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                            {rowQty} {p.unit || 'عدد'}
                          </span>
                        )}
                        <div className="space-y-1.5">
                          <span className="text-[9px] bg-emerald-600/10 text-emerald-700 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3" />
                            کالا ({p.unit || 'عدد'})
                          </span>
                          <h5 className="font-bold text-slate-800 text-[11px] group-hover:text-emerald-700 transition leading-tight line-clamp-2">
                            {p.title}
                          </h5>
                        </div>
                        <div className="mt-4 pt-2 border-t border-slate-200/40 flex justify-between items-center text-[10px]">
                          <span className="text-slate-400">
                            موجودی: <strong className={`font-mono ${p.stock_quantity <= 0 ? 'text-red-500 font-bold' : 'text-slate-600'}`}>{p.stock_quantity}</strong>
                          </span>
                          <span className="font-mono text-emerald-700 font-bold">
                            {formatToman(invoiceType === 'Sale' ? p.sale_price : p.purchase_price)}
                          </span>
                        </div>
                      </div>
                    );
                  })}

              {/* بخش خدمات */}
              {(catalogFilter === 'All' || catalogFilter === 'Services') &&
                services
                  .filter(s => !itemSearch || s.title.toLowerCase().includes(itemSearch.toLowerCase()))
                  .map(s => {
                    const rowQty = selectedItems.find(item => item.item_id === s.id && item.type === 'Service')?.quantity || 0;
                    // انتخاب رنگ پس‌زمینه نازک خدمت از تنظیمات پوسته یا پیش‌فرض
                    const cardColor = appSettings.serviceCardBg || '#fcf5ff';
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleAddCardItem(s, 'Service')}
                        className="relative p-3.5 rounded-xl border border-dashed border-slate-200/60 hover:border-purple-500/50 hover:shadow-sm cursor-pointer transition select-none flex flex-col justify-between group"
                        style={{ backgroundColor: cardColor }}
                      >
                        {rowQty > 0 && (
                          <span className="absolute top-2 left-2 bg-purple-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                            {rowQty} ردیف
                          </span>
                        )}
                        <div className="space-y-1.5">
                          <span className="text-[9px] bg-purple-600/10 text-purple-700 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            بخش خدمات (دستمزد)
                          </span>
                          <h5 className="font-bold text-slate-800 text-[11px] group-hover:text-purple-700 transition leading-tight line-clamp-2">
                            {s.title}
                          </h5>
                        </div>
                        <div className="mt-4 pt-2 border-t border-slate-200/40 flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-bold">دستمزد خدمت</span>
                          <span className="font-mono text-purple-700 font-bold">{formatToman(s.price)}</span>
                        </div>
                      </div>
                    );
                  })}
            </div>

            {/* دراپ‌داون فرم تفضیلی ثبت دستی اقلام متفرقه */}
            <details className="group border border-slate-100 rounded-xl bg-slate-50 overflow-hidden" id="manual-line-adder">
              <summary className="flex justify-between items-center p-3.5 cursor-pointer font-bold text-[11px] text-slate-600 bg-slate-100/60 hover:bg-slate-100 transition list-none select-none">
                <span className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-slate-500" />
                  در لست فوق کالا/خدمت نیست؟ باز کردن فرم تفضیلی ثبت موقت دستی با قیمت و مشخصات سفارشی
                </span>
                <span className="transition duration-300 group-open:-rotate-180">▼</span>
              </summary>
              <div className="p-4 border-t border-slate-200/50 space-y-4 text-xs bg-white">
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
                      <label className="block text-[10px] text-slate-400 mb-1">انتخاب کالا عمومی:</label>
                      <select
                        id="invoice-product-picker"
                        value={currentProductId}
                        onChange={e => setCurrentProductId(e.target.value)}
                        className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg h-9"
                      >
                        <option value="">-- کالا را گزینش کنید --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.title} (موجودی: {p.stock_quantity})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-[150px] text-xs">
                      <label className="block text-[10px] text-slate-400 mb-1">انتخاب سرویس:</label>
                      <select
                        id="invoice-service-picker"
                        value={currentServiceId}
                        onChange={e => setCurrentServiceId(e.target.value)}
                        className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg h-9"
                      >
                        <option value="">-- سرویس را گزینش کنید --</option>
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
                      className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-left"
                      placeholder="قیمت توافقی واحد"
                    />
                  </div>

                  <button
                    id="add-item-row-btn"
                    type="button"
                    onClick={handleAddItemRow}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3.5 h-9 rounded-lg text-xs flex items-center gap-1 shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    درج در جدول
                  </button>
                </div>
              </div>
            </details>
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
            <div 
              className="bg-white text-slate-950 shadow-2xl transition-all duration-300 relative select-text w-full group A4-paper"
              style={{ 
                fontFamily: templateDesign.fontFamily === 'Vazirmatn' ? 'Vazirmatn, sans-serif' : 'sans-serif',
                fontSize: templateDesign.fontSizeScale === 'sm' ? '11px' : templateDesign.fontSizeScale === 'lg' ? '14px' : templateDesign.fontSizeScale === 'xl' ? '16px' : '12px',
                borderWidth: `${templateDesign.lineWidth}px`,
                borderColor: templateDesign.borderColor,
                borderStyle: templateDesign.borderStyle,
                padding: `${templateDesign.layoutPadding}px`,
                lineHeight: '1.7'
              }}
              id="a4-printable-paper"
            >
              {/* طرح فانتزی و اشکال برگردان اریب بردی پس‌زمینه فاکتور */}
              <InvoiceShapes primaryColor={templateDesign.primaryColor} styleName={templateDesign.shapeStyle} />

              <div className="relative z-10 space-y-4">
                {/* کمپایلر تر ترتیبی سکشن‌های فاکتور با طرح‌بندی دقیق المنتور */}
                {templateDesign.sectionsOrder.map((secId) => {
                
                // هدر
                if (secId === 'header') {
                  return (
                    <div key="header" className="border-b border-slate-300 pb-3 h-auto mb-4" id="print-sec-header">
                      <div className="flex justify-between items-start md:items-center">
                        {templateDesign.widgets.showLogo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-extrabold text-sm shadow">
                              آریا
                            </div>
                            <div>
                              <h4 className="font-black text-xs text-slate-800">حسابداری آریا</h4>
                              <span className="text-[9px] text-slate-400 font-mono block leading-none">Aria Store ERP v1</span>
                            </div>
                          </div>
                        ) : (
                          <h4 className="font-extrabold text-xs text-slate-800">سامانه حسابداری بومی</h4>
                        )}

                        <div className="text-center">
                          <h1 className="font-extrabold text-xs md:text-sm tracking-tight px-3 py-1 rounded" style={{ color: templateDesign.primaryColor }}>
                            {templateDesign.customInvoiceTitle || 'صورتحساب خرید/فروش اقلام'}
                          </h1>
                          {templateDesign.widgets.showPaymentStatusBadge && (
                            <span className="inline-block mt-1 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm border border-emerald-200">
                              {activeInvoiceForPrint.invoice.payment_status === 'Paid' ? 'تسویه شده نقدی' : activeInvoiceForPrint.invoice.payment_status === 'Unpaid' ? 'حساب نسیه' : 'علی‌الحساب'}
                            </span>
                          )}
                        </div>

                        <div className="text-left text-[9.5px] text-slate-500 font-mono space-y-0.5 leading-tight">
                          <div>شماره فاکتور: <strong className="text-slate-900 font-bold font-sans">{activeInvoiceForPrint.invoice.invoice_number}</strong></div>
                          <div>تاریخ صدور: <span className="font-medium">{new Date(activeInvoiceForPrint.invoice.created_at).toLocaleDateString('fa-IR')}</span></div>
                          
                          {templateDesign.widgets.showInvoiceBarcode && (
                            <div className="pt-2 flex flex-col items-end">
                              <div className="w-20 h-4 bg-slate-950 flex items-center justify-between px-1 rounded-sm gap-0.5">
                                {[1,3,2,1,4,2,3,1,2,3,4,1,2,3,4,2,3,1].map((w, i) => (
                                  <div key={i} className="bg-white h-3.5" style={{ width: `${w * 0.9}px` }} />
                                ))}
                              </div>
                              <span className="text-[7.5px] text-slate-400 select-none block text-center w-20">{activeInvoiceForPrint.invoice.invoice_number}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                // متعاملین
                if (secId === 'entities_info') {
                  return (
                    <div key="entities_info" className="space-y-3 mb-4 text-[11px]" id="print-sec-entities">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {templateDesign.widgets.showSellerDetails && (
                          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1.5 text-right">
                            <h4 className="font-black text-[11px] border-b border-slate-200 pb-1 flex items-center gap-1 text-slate-800">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: templateDesign.primaryColor }}></span>
                              مشخصات صادرکننده سند چاپی (فروشگاه)
                            </h4>
                            <div className="space-y-0.8 leading-relaxed">
                              <div><strong>نام فروشگاه:</strong> {appSettings.storeName || 'کسب و کار آریا'}</div>
                              {appSettings.storeEconomicCode && <div><strong>کد اقتصادی:</strong> <span className="font-mono">{appSettings.storeEconomicCode}</span></div>}
                              {appSettings.storePhone && <div><strong>تلفن رسمی تماس:</strong> <span className="font-mono">{appSettings.storePhone}</span></div>}
                              {appSettings.storeAddress && <div><strong>نشانی مرکز:</strong> {appSettings.storeAddress}</div>}
                            </div>
                          </div>
                        )}

                        {templateDesign.widgets.showBuyerDetails && (
                          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1.5 text-right">
                            <h4 className="font-black text-[11px] border-b border-slate-200 pb-1 flex items-center gap-1 text-slate-800">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: templateDesign.primaryColor }}></span>
                              مشخصات طرف حساب تجاری (خریدار)
                            </h4>
                            <div className="space-y-0.8 leading-relaxed">
                              <div><strong>نام شخص:</strong> {activeInvoiceForPrint.person.name}</div>
                              {activeInvoiceForPrint.person.phone !== '0' && <div><strong>تلفن همراه:</strong> <span className="font-mono">{activeInvoiceForPrint.person.phone}</span></div>}
                              {activeInvoiceForPrint.person.national_code && <div><strong>کد ملی حقیقی:</strong> <span className="font-mono">{activeInvoiceForPrint.person.national_code}</span></div>}
                              {activeInvoiceForPrint.person.address && <div><strong>نشانی خریدار:</strong> {activeInvoiceForPrint.person.address}</div>}
                              <div><strong>کد عضویت معین:</strong> <span className="font-mono">{activeInvoiceForPrint.person.id}</span></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // جدول اقلام
                if (secId === 'items_table') {
                  return (
                    <div key="items_table" className="border border-slate-350 rounded-xl overflow-hidden mb-4" id="print-sec-table">
                      <table className="w-full text-right border-collapse text-[10.5px]">
                        <thead>
                          <tr className="border-b border-slate-350" style={{ backgroundColor: templateDesign.secondaryColor }}>
                            {templateDesign.widgets.showItemIndexNumber && (
                              <th className="p-2 border-l border-slate-200 text-center w-8">ردیف</th>
                            )}
                            {templateDesign.widgets.showBarcodeColumn && (
                              <th className="p-2 border-l border-slate-200 text-center w-16">بارکد</th>
                            )}
                            <th className="p-2 border-l border-slate-200">شرح کالا یا خدمات پیوستی</th>
                            {templateDesign.widgets.showUnitColumn && (
                              <th className="p-2 border-l border-slate-200 text-center w-12">واحد</th>
                            )}
                            <th className="p-2 border-l border-slate-200 text-left w-12">تعداد</th>
                            <th className="p-2 border-l border-slate-200 text-left w-20">واحد (ت)</th>
                            {templateDesign.widgets.showItemDiscountField && (
                              <th className="p-2 border-l border-slate-200 text-left w-16">تخفیف (ت)</th>
                            )}
                            <th className="p-2 text-left w-24">مبلغ نهایی (تومان)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {activeInvoiceForPrint.items.map((item, index) => (
                            <tr key={item.id || index} className="h-8">
                              {templateDesign.widgets.showItemIndexNumber && <td className="p-2 border-l border-slate-200 text-center font-mono">{index + 1}</td>}
                              {templateDesign.widgets.showBarcodeColumn && <td className="p-2 border-l border-slate-200 text-center font-mono text-[9px] text-slate-400">{item.barcode || '---'}</td>}
                              <td className="p-2 border-l border-slate-200 font-bold text-slate-800">{item.title}</td>
                              {templateDesign.widgets.showUnitColumn && <td className="p-2 border-l border-slate-200 text-center">{item.unit || 'عدد'}</td>}
                              <td className="p-2 border-l border-slate-200 text-left font-mono">{item.quantity}</td>
                              <td className="p-2 border-l border-slate-200 text-left font-mono">{item.price.toLocaleString('fa-IR')}</td>
                              {templateDesign.widgets.showItemDiscountField && <td className="p-2 border-l border-slate-200 text-left font-mono">0</td>}
                              <td className="p-2 text-left font-bold font-mono">{(item.price * item.quantity).toLocaleString('fa-IR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                // حسابداری مالی
                if (secId === 'financial_receipt') {
                  const taxAmount = activeInvoiceForPrint.invoice.final_amount - activeInvoiceForPrint.invoice.total_amount + activeInvoiceForPrint.invoice.discount;
                  return (
                    <div key="financial_receipt" className="space-y-3 mb-4 text-[10.5px]" id="print-sec-financial">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-7 border border-slate-200 p-3 rounded-xl bg-slate-50/50 space-y-1 text-right">
                          <span className="font-bold text-slate-700 block text-[11px]">شرایط عمومی معامله و پی‌نویس حقوقی:</span>
                          {templateDesign.widgets.showTermsAndFooterText ? (
                            <p className="text-slate-500 text-[10px] leading-relaxed text-justify italic">
                              {templateDesign.customTermsNote}
                            </p>
                          ) : (
                            <p className="text-slate-400 text-[9.5px] italic">توضیحات و شرایط فروش چاپ نشده است.</p>
                          )}
                        </div>

                        <div className="md:col-span-5 border border-slate-205 py-2 px-3.5 rounded-xl bg-slate-100/50 space-y-1.5 divide-y divide-slate-250">
                          <div className="flex justify-between items-center pb-1 text-slate-600 text-right">
                            <span>جمع ناخالص فاکتور رسمی:</span>
                            <span className="font-mono font-bold">{(activeInvoiceForPrint.invoice.total_amount).toLocaleString('fa-IR')} تومان</span>
                          </div>
                          {templateDesign.widgets.showItemDiscountField && (
                            <div className="flex justify-between items-center py-1 text-red-650 h-6 leading-none">
                              <span>کاهش تخفیفات معامله:</span>
                              <span className="font-mono font-bold">-{activeInvoiceForPrint.invoice.discount.toLocaleString('fa-IR')} تومان</span>
                            </div>
                          )}
                          {templateDesign.widgets.showTaxAndAdditions && taxAmount > 0 && (
                            <div className="flex justify-between items-center py-1 text-slate-605 h-6 leading-none">
                              <span>مالیات ارزش افزوده (۱۰٪):</span>
                              <span className="font-mono font-bold">+{taxAmount.toLocaleString('fa-IR')} تومان</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-1.5 font-black text-xs h-8 leading-none" style={{ color: templateDesign.primaryColor }}>
                            <span>مبلغ نهایی قابل تسویه:</span>
                            <span className="font-mono text-xs font-black">{activeInvoiceForPrint.invoice.final_amount.toLocaleString('fa-IR')} تومان</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // امضاها
                if (secId === 'signatures') {
                  return (
                    <div key="signatures" className="h-auto pb-4 pt-1" id="print-sec-signatures">
                      {templateDesign.widgets.showSignatureBoxes ? (
                        <div className="grid grid-cols-2 gap-4 text-center text-[10.5px]">
                          <div className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/20 shadow-xs h-24 flex flex-col justify-between">
                            <strong className="text-slate-500 font-bold">{templateDesign.customSellerStampLabel}</strong>
                            <span className="text-[9px] text-slate-400 font-mono italic">مهر و امضای شرکت</span>
                          </div>
                          <div className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/20 shadow-xs h-24 flex flex-col justify-between">
                            <strong className="text-slate-500 font-bold">{templateDesign.customBuyerSignatureLabel}</strong>
                            <span className="text-[9px] text-slate-400 italic">گواهی صحت و دریافت کالا</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 border border-dashed border-slate-200 text-slate-400 rounded-xl text-center text-[10px]">
                          کادر امضا غیرفعال است.
                        </div>
                      )}
                    </div>
                  );
                }

                return null;
              })}
            </div>

          </div>

          </div>
        </div>
      )}

    </div>
  );
}
