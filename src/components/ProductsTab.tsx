import React, { useState, useEffect } from 'react';
import { OfflineDatabase } from '../db/offlineDb';
import { Product, Service } from '../types';
import { ShoppingBag, Search, PlusCircle, Trash2, Edit2, Barcode, TrendingUp, DollarSign, Layers } from 'lucide-react';

export default function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [activeFormTab, setActiveFormTab] = useState<'product' | 'service'>('product');

  // فرم محصول
  const [prodId, setProdId] = useState('');
  const [barcode, setBarcode] = useState('');
  const [title, setTitle] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [unit, setUnit] = useState('عدد');

  // فرم خدمات
  const [srvId, setSrvId] = useState('');
  const [srvTitle, setSrvTitle] = useState('');
  const [srvPrice, setSrvPrice] = useState<number>(0);

  // فرم بروزرسانی دسته جمعی
  const [bulkPercent, setBulkPercent] = useState<number>(10);
  const [roundNearest, setRoundNearest] = useState<number>(1000);
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setProducts(OfflineDatabase.getProducts());
    setServices(OfflineDatabase.getServices());
  };

  // ثبت یا ویرایش محصول
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    OfflineDatabase.saveProduct({
      id: prodId ? prodId : undefined,
      barcode: barcode.trim(),
      title,
      purchase_price: Number(purchasePrice),
      sale_price: Number(salePrice),
      stock_quantity: Number(stockQuantity),
      unit
    });

    // بازنشانی فرم
    resetProductForm();
    refreshData();
  };

  const resetProductForm = () => {
    setProdId('');
    setBarcode('');
    setTitle('');
    setPurchasePrice(0);
    setSalePrice(0);
    setStockQuantity(0);
    setUnit('عدد');
  };

  // ثبت یا ویرایش خدمات
  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!srvTitle.trim()) return;

    OfflineDatabase.saveService({
      id: srvId ? srvId : undefined,
      title: srvTitle,
      price: Number(srvPrice)
    });

    resetServiceForm();
    refreshData();
  };

  const resetServiceForm = () => {
    setSrvId('');
    setSrvTitle('');
    setSrvPrice(0);
  };

  // انتقال کالا به فرم ویرایش
  const handleEditProduct = (p: Product) => {
    setActiveFormTab('product');
    setProdId(p.id);
    setBarcode(p.barcode);
    setTitle(p.title);
    setPurchasePrice(p.purchase_price);
    setSalePrice(p.sale_price);
    setStockQuantity(p.stock_quantity);
    setUnit(p.unit);
  };

  // انتقال خدمت به فرم ویرایش
  const handleEditService = (s: Service) => {
    setActiveFormTab('service');
    setSrvId(s.id);
    setSrvTitle(s.title);
    setSrvPrice(s.price);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('آیا از حذف این کالا اطمینان دارید؟ با حذف کالا، رکورد انبارداری آن نیز برداشته خواهد شد.')) {
      OfflineDatabase.deleteProduct(id);
      refreshData();
    }
  };

  const handleDeleteService = (id: string) => {
    if (confirm('آیا از حذف این خدمت اطمینان دارید؟')) {
      OfflineDatabase.deleteService(id);
      refreshData();
    }
  };

  // اجرای بروز رسانی قیمتی سراسری کالاها
  const handleBulkUpdate = () => {
    if (confirm(`آیا مطمئن هستید که می‌خواهید قیمت فروش تمامی کالاهای فروشگاه را به میزان ${bulkPercent > 0 ? '+' : ''}${bulkPercent}٪ تغییر داده و به نزدیکترین ${roundNearest} تومانی گرد کنید؟`)) {
      OfflineDatabase.bulkUpdatePrices(bulkPercent, roundNearest);
      setBulkSuccess(true);
      refreshData();
      setTimeout(() => setBulkSuccess(false), 5000);
    }
  };

  const formatToman = (val: number) => {
    return val.toLocaleString('fa-IR') + ' تومان';
  };

  // فیلتر و جستجوی اقلام
  const filteredProducts = products.filter(p => p.title.includes(searchQuery) || p.barcode.includes(searchQuery));
  const filteredServices = services.filter(s => s.title.includes(searchQuery));

  return (
    <div className="p-6 flex flex-col xl:flex-row gap-6 h-[calc(100vh-64px)] overflow-hidden" id="products-tab-container">
      {/* ستون راست: فرم‌های ثبت و ویرایش + جادوی بروزرسانی فیزیکی کالا */}
      <div className="w-full xl:w-[40%] flex flex-col gap-6 h-full overflow-y-auto" id="forms-sidebar-column">
        
        {/* پنل ثبت کالا / خدمات */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5" id="catalog-maker-form">
          {/* تب فرم‌ها */}
          <div className="flex border-b border-slate-100 pb-3 mb-4 gap-2" id="catalog-form-tabs">
            <button
              id="form-tab-product"
              onClick={() => { setActiveFormTab('product'); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                activeFormTab === 'product'
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                  : 'text-slate-500 hover:text-slate-700 bg-slate-50'
              }`}
            >
              کالا (کنترل انبار)
            </button>
            <button
              id="form-tab-service"
              onClick={() => { setActiveFormTab('service'); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                activeFormTab === 'service'
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                  : 'text-slate-500 hover:text-slate-700 bg-slate-50'
              }`}
            >
              خدمات (سرویس دستمزد)
            </button>
          </div>

          {/* فرم کالا */}
          {activeFormTab === 'product' && (
            <form onSubmit={handleProductSubmit} className="space-y-3" id="product-maker-tag">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-emerald-500" />
                  {prodId ? 'ویرایش کالا' : 'تعریف کالا با انبارداری هوشمند'}
                </span>
                {prodId && (
                  <button type="button" onClick={resetProductForm} className="text-xs text-red-500 hover:underline">
                    انصراف
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] mb-1 font-medium text-slate-500">بارکد کالا (اسکنر):</label>
                  <div className="relative">
                    <Barcode className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                    <input
                      id="product-barcode"
                      type="text"
                      value={barcode}
                      onChange={e => setBarcode(e.target.value)}
                      className="w-full text-xs pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-left font-mono"
                      placeholder="اسکن بارکد"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10.5px] mb-1 font-medium text-slate-500">عنوان کالا:</label>
                  <input
                    id="product-title"
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="روغن مایع لادن"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] mb-1 font-medium text-slate-500">قیمت خرید (تومان):</label>
                  <input
                    id="product-purchase-price"
                    type="number"
                    required
                    value={purchasePrice || ''}
                    onChange={e => setPurchasePrice(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-left font-mono"
                    placeholder="قیمت اولیه خرید"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] mb-1 font-medium text-slate-500">قیمت فروش مصرف‌کننده (تومان):</label>
                  <input
                    id="product-sale-price"
                    type="number"
                    required
                    value={salePrice || ''}
                    onChange={e => setSalePrice(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-left font-mono"
                    placeholder="قیمت فروش کالا"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] mb-1 font-medium text-slate-500">سقف قلم موجودی انبار:</label>
                  <input
                    id="product-stock-qty"
                    type="number"
                    required
                    value={stockQuantity || ''}
                    onChange={e => setStockQuantity(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-left font-mono"
                    placeholder="تعداد انبار"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] mb-1 font-medium text-slate-500">واحد شمارش:</label>
                  <select
                    id="product-unit"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg h-9 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="عدد">عدد</option>
                    <option value="بسته">بسته</option>
                    <option value="کیلوگرم">کیلوگرم</option>
                    <option value="متر">متر</option>
                    <option value="کیسه">کیسه</option>
                    <option value="شل">شل / شل کالا</option>
                  </select>
                </div>
              </div>

              <button
                id="save-product-btn"
                type="submit"
                className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm shadow-emerald-500/10 transition"
              >
                {prodId ? 'بروزرسانی کالا' : 'افزودن به کاتالوگ فروشگاه'}
              </button>
            </form>
          )}

          {/* فرم خدمات */}
          {activeFormTab === 'service' && (
            <form onSubmit={handleServiceSubmit} className="space-y-4" id="service-maker-tag">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-purple-500" />
                  {srvId ? 'ویرایش خدمات' : 'تعریف کارهای خدماتی و پیک فروش دائم'}
                </span>
                {srvId && (
                  <button type="button" onClick={resetServiceForm} className="text-xs text-red-500 hover:underline">
                    انصراف
                  </button>
                )}
              </div>
              
              <div>
                <label className="block text-[11px] mb-1 font-medium text-slate-500">عنوان کامل خدمت:</label>
                <input
                  id="service-title"
                  type="text"
                  required
                  value={srvTitle}
                  onChange={e => setSrvTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="بسته‌بندی ویژه کارتن مرسولات"
                />
              </div>

              <div>
                <label className="block text-[11px] mb-1 font-medium text-slate-500">هزینه دریافتی دستمزد (تومان):</label>
                <input
                  id="service-price"
                  type="number"
                  required
                  value={srvPrice || ''}
                  onChange={e => setSrvPrice(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-left font-mono"
                  placeholder="قیمت دریافتی"
                />
              </div>

              <button
                id="save-service-btn"
                type="submit"
                className="w-full text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm shadow-purple-500/10 transition animate-fade-in"
              >
                {srvId ? 'بروزرسانی خدمات' : 'ذخیره نوع خدمت'}
              </button>
            </form>
          )}
        </div>

        {/* پنل تغییر قیمت‌های فیزیکی دسته‌جمعی (Bulk Price Update) */}
        <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-5 shadow-lg relative overflow-hidden" id="bulk-price-updater-panel">
          {/* افکت پس‌زمینه */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <h3 className="font-bold text-xs text-white flex items-center gap-2 mb-3">
            <TrendingUp className="w-4.5 h-4.5 text-emerald-400" />
            جادوگر بروزرسانی لیست قیمت‌ها
          </h3>
          
          <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
            با توجه به تلاطم ریالی، می‌توانید قیمت نهایی تمام کالاهای دارای انبار را در کمتر از ۱ ثانیه به صورت خودکار تغییر دهید (با ویرایش ایمن پایگاه‌داده).
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">درصد تغییر قیمت (منفی برای تخفیف سراسری):</label>
              <div className="flex gap-2">
                <input
                  id="bulk-percent-input"
                  type="number"
                  value={bulkPercent}
                  onChange={e => setBulkPercent(Number(e.target.value))}
                  className="w-20 text-xs px-2 py-1.5 bg-slate-800 border border-slate-700 text-emerald-400 rounded-lg text-center font-bold"
                />
                <input
                  type="range"
                  min="-30"
                  max="50"
                  value={bulkPercent}
                  onChange={e => setBulkPercent(Number(e.target.value))}
                  className="flex-1 accent-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">مکانیزم گرد کردن مبالغ نهایی به نزدیکترین:</label>
              <select
                id="bulk-round-nearest"
                value={roundNearest}
                onChange={e => setRoundNearest(Number(e.target.value))}
                className="w-full text-[11px] px-2.5 py-1.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:outline-none"
              >
                <option value="1000">۱,۰۰۰ تومان (طبیعی ترین حالت)</option>
                <option value="5000">۵,۰۰۰ تومان</option>
                <option value="10000">۱۰,۰۰۰ تومان</option>
                <option value="1">بدون رند کردن</option>
              </select>
            </div>

            <button
              id="execute-bulk-btn"
              type="button"
              onClick={handleBulkUpdate}
              className="w-full text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 py-2.5 px-4 rounded-xl shadow-md transition-all mt-3 duration-300 transform active:scale-98"
            >
              به‌روزرسانی همگانی {products.length} کالا!
            </button>

            {bulkSuccess && (
              <p className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2 rounded-lg text-center animate-pulse" id="bulk-price-success-alert">
                 قیمت‌ها ویرایش شد! در دیتابیس SQLite لاگ آن ثبت گردید.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* ستون چپ: لیست محصولات و خدمات */}
      <div className="w-full xl:w-[60%] bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col h-full overflow-hidden" id="catalog-explorer-panel">
        <div className="flex border-b border-slate-100 pb-3 mb-4 justify-between items-center" id="catalog-list-header">
          <div>
            <h3 className="font-bold text-sm text-slate-800">کاتالوگ فروشگاه</h3>
            <p className="text-[10px] text-slate-400">جستجو، ویرایش موجودی و حذف آیتم‌ها</p>
          </div>
          
          {/* باکس جستجو و ردیابی */}
          <div className="relative w-64" id="catalog-search-holder">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            <input
              id="catalog-search-query"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="جستجو با عنوان یا اسکن بارکد..."
              className="w-full text-xs pr-7 pl-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>
        </div>

        {/* لیست‌ها با امکان تمایز کالا و خدمات */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1" id="catalog-items-scroll-area">
          {/* بخش کالاها */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 mb-2.5 flex items-center gap-1">
              <span>کالاهای انباردار ({filteredProducts.length})</span>
            </h4>
            
            {filteredProducts.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400 italic">کالایی یافت نشد.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="products-list-grid">
                {filteredProducts.map(p => {
                  const isLowStock = p.stock_quantity <= 10;
                  return (
                    <div
                      key={p.id}
                      id={`p-card-${p.id}`}
                      className="p-3 border border-slate-100 bg-slate-50/40 rounded-xl hover:border-slate-200 hover:bg-slate-50/80 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h5 className="font-bold text-xs text-slate-800 leading-tight">{p.title}</h5>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            isLowStock 
                              ? 'bg-red-50 text-red-500 border border-red-100 animate-pulse' 
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            {p.stock_quantity === 0 
                              ? 'ناموجود' 
                              : `موجودی: ${p.stock_quantity} ${p.unit}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9.5px] text-slate-400 mt-1 font-mono">
                          <Barcode className="w-3 h-3 text-slate-300" />
                          <span>{p.barcode || 'فاقد بارکد'}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-2 border-t border-slate-100/60 flex items-end justify-between">
                        <div className="text-[10px] space-y-0.5">
                          <div className="text-slate-400 flex items-center gap-1">
                            <span>خرید:</span>
                            <span className="font-mono text-slate-600">{formatToman(p.purchase_price)}</span>
                          </div>
                          <div className="text-slate-500 flex items-center gap-1">
                            <span className="font-bold text-slate-700">فروش:</span>
                            <span className="font-mono text-emerald-600 font-bold text-xs">{formatToman(p.sale_price)}</span>
                          </div>
                        </div>

                        <div className="flex gap-1.5">
                          <button
                            id={`p-edit-btn-${p.id}`}
                            onClick={() => handleEditProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-emerald-500 bg-white shadow-xs rounded-lg border border-slate-100 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`p-delete-btn-${p.id}`}
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 bg-white shadow-xs rounded-lg border border-slate-100 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* بخش خدمات */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-400 mb-2.5">
              خدمات ارائه‌شده بدون انبارداری ({filteredServices.length})
            </h4>

            {filteredServices.length === 0 ? (
              <p className="text-center py-4 text-xs text-slate-400 italic">خدماتی ثبت نشده است.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="services-list-grid">
                {filteredServices.map(s => {
                  return (
                    <div
                      key={s.id}
                      id={`s-card-${s.id}`}
                      className="p-3 border border-indigo-100/50 bg-indigo-50/5 rounded-xl hover:border-indigo-200 transition flex justify-between items-center"
                    >
                      <div>
                        <h5 className="font-bold text-xs text-indigo-900">{s.title}</h5>
                        <span className="text-[9px] text-indigo-400 mt-1 block">فاقد کسر کالا فیزیکی</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold font-mono text-indigo-600">{formatToman(s.price)}</span>
                        <div className="flex gap-1">
                          <button
                            id={`s-edit-btn-${s.id}`}
                            onClick={() => handleEditService(s)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 bg-white shadow-xs rounded-lg border border-slate-100 transition"
                          >
                            <Edit2 className="w-3.2 h-3.2" />
                          </button>
                          <button
                            id={`s-delete-btn-${s.id}`}
                            onClick={() => handleDeleteService(s.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 bg-white shadow-xs rounded-lg border border-slate-100 transition"
                          >
                            <Trash2 className="w-3.2 h-3.2" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
