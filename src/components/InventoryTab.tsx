import React, { useState, useEffect } from 'react';
import { OfflineDatabase } from '../db/offlineDb';
import { Product, StockLog } from '../types';
import { 
  Boxes, 
  Search, 
  AlertTriangle, 
  History, 
  Plus, 
  Minus, 
  CheckCircle, 
  ArrowRightLeft, 
  TrendingUp, 
  DollarSign, 
  BarChart4 
} from 'lucide-react';

export default function InventoryTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // تفکیک برای فرم ویرایش دستی موجودی (Stock correction)
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<'increase' | 'decrease'>('increase');
  const [adjustReason, setAdjustReason] = useState('انبارگردانی سالانه و بازشماری');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setProducts(OfflineDatabase.getProducts());
    setStockLogs(OfflineDatabase.getStockLogs());
  };

  // ارسال فرم تعدیل دستی انبار
  const handleStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    const originalProduct = products.find(p => p.id === selectedProductId);
    if (!originalProduct) return;

    const delta = adjustType === 'increase' ? adjustQty : -adjustQty;
    const previous_qty = originalProduct.stock_quantity;
    const new_qty = Math.max(0, previous_qty + delta);

    // ذخیره کالا با تعداد جدید کالا
    OfflineDatabase.saveProduct({
      ...originalProduct,
      stock_quantity: new_qty
    });

    // احیای مقادیر فرم
    setSelectedProductId('');
    setAdjustQty(1);
    setAdjustReason('انبارگردانی سالانه و بازشماری');
    refreshData();
  };

  const formatToman = (val: number) => {
    return val.toLocaleString('fa-IR') + ' تومان';
  };

  // آمار کل انبار
  const totalItemsCount = products.reduce((sum, p) => sum + p.stock_quantity, 0);
  const lowStockProducts = products.filter(p => p.stock_quantity <= 10);
  const totalAssetsValuePurchase = products.reduce((sum, p) => sum + (p.purchase_price * p.stock_quantity), 0);
  const totalAssetsValueSale = products.reduce((sum, p) => sum + (p.sale_price * p.stock_quantity), 0);
  const expectedProfitMargin = totalAssetsValueSale - totalAssetsValuePurchase;

  const filteredProducts = products.filter(p => p.title.includes(searchQuery) || p.barcode.includes(searchQuery));

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto" id="inventory-tab-container">
      
      {/* هدر: ویجت‌ها و آمار ارزش‌گذاری انبار مغازه (Warehouse Assets Analytics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" id="warehouse-analytics-cards">
        
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-4.5">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10.5px] text-slate-400 block font-medium">کل اقلام موجود در انبار:</span>
            <span className="text-base font-extrabold text-slate-800 font-mono">{totalItemsCount.toLocaleString('fa-IR')} قلم کالا</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-4.5">
          <div className="p-3 rounded-2xl bg-red-50 text-red-500 animate-pulse">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10.5px] text-slate-400 block font-medium">کالاهای رو به اتمام (زیر ۱۰ عدد):</span>
            <span className="text-base font-extrabold text-red-500 font-mono">{lowStockProducts.length} کالا بحرانی</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-4.5">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <BarChart4 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10.5px] text-slate-400 block font-medium">ارزش سرمایه انبار (قیمت خرید):</span>
            <span className="text-xs font-bold text-slate-700 font-mono block mt-0.5">{formatToman(totalAssetsValuePurchase)}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-4.5">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10.5px] text-slate-400 block font-medium">سود ناخالص نهایی متصور مغازه:</span>
            <span className="text-xs font-bold text-indigo-600 font-mono block mt-0.5">+{formatToman(expectedProfitMargin)}</span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="inventory-grid-splits">
        
        {/* ستون راست و وسط: پایش موجودی و فرم تعدیل دستی */}
        <div className="lg:col-span-2 space-y-6" id="inventory-main-flows">
          
          {/* لیست موجودی انبار */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm" id="stock-levels-box">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-xs text-slate-800">بررسی سطح کیفی موجودی کالاها</h3>
                <p className="text-[10px] text-slate-400">امکان فیلتر و ردگیری سریع کسری کالاها</p>
              </div>

              {/* جستجو کاتالوگ انبار */}
              <div className="relative w-full sm:w-52">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                <input
                  id="inventory-search-box"
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="جستجو کالا در انبار..."
                  className="w-full text-xs pr-7 pl-3 py-1.8 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto text-xs" id="levels-table-holder">
              <table className="w-full border-collapse" id="levels-table">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-bold text-right leading-loose">
                    <th className="py-2.5 px-3">بارکد</th>
                    <th className="py-2.5 px-3">عنوان کالا کاتالوگ</th>
                    <th className="py-2.5 px-3 text-left">قیمت خرید (T)</th>
                    <th className="py-2.5 px-3 text-left">قیمت فروش (T)</th>
                    <th className="py-2.5 px-3 text-left">موجودی انبار</th>
                    <th className="py-2.5 px-3 text-center">وضعیت سطح</th>
                    <th className="py-2.5 px-3 text-center">تعدیل دستی</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => {
                    const isOutOfStock = p.stock_quantity <= 0;
                    const isCritical = p.stock_quantity <= 10;
                    
                    return (
                      <tr key={p.id} id={`stock-row-${p.id}`} className="border-b border-slate-50 hover:bg-slate-50/50 text-slate-800">
                        <td className="py-3 px-3 font-mono text-slate-400 text-[10.5px]">{p.barcode || 'فاقد بارکد'}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{p.title}</td>
                        <td className="py-3 px-3 text-left font-mono text-slate-500">{p.purchase_price.toLocaleString('fa-IR')}</td>
                        <td className="py-3 px-3 text-left font-mono font-semibold text-slate-700">{p.sale_price.toLocaleString('fa-IR')}</td>
                        <td className="py-3 px-3 text-left font-mono font-bold text-slate-900">
                          {p.stock_quantity} {p.unit}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                            isOutOfStock 
                              ? 'bg-red-50 text-red-500 animated-pulse' 
                              : isCritical 
                                ? 'bg-amber-50 text-amber-600' 
                                : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {isOutOfStock ? 'عدم موجودی' : isCritical ? 'بحرانی (کاهش یافته)' : 'کافی و پایدار'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            id={`correction-trigger-${p.id}`}
                            onClick={() => {
                              setSelectedProductId(p.id);
                              setAdjustQty(1);
                            }}
                            className="text-[10px] text-indigo-600 hover:underline hover:text-indigo-800 font-bold"
                          >
                            تعدیل تعداد
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ستون چپ: پنل ویرایش دستی انبار و تاریخچه لاگ موجودی */}
        <div className="space-y-6 xl:col-span-1" id="inventory-sideline-panels">
          
          {/* پنل فرم تعدیل دستی کالا */}
          {selectedProductId && (
            <div className="bg-white rounded-2xl border border-indigo-200 bg-indigo-50/5 p-5 shadow-sm animate-fade-in" id="corrector-panel-p">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4" />
                   فرآیند اصلاح دستی تعداد کالا
                </h4>
                <button 
                  onClick={() => setSelectedProductId('')}
                  className="text-slate-400 hover:text-red-500 font-bold text-xs"
                >
                  انصراف
                </button>
              </div>

              <div className="text-[11px] bg-indigo-50 border border-indigo-100 p-2.5 rounded-lg text-indigo-800 leading-snug mb-3">
                 کالای انتخابی: <strong className="font-bold text-indigo-900">{products.find(p => p.id === selectedProductId)?.title}</strong>
              </div>

              <form onSubmit={handleStockAdjustment} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">نوع عملیات انبارداری:</label>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg" id="adjust-type-toggles">
                    <button
                      id="adjust-inc-btn"
                      type="button"
                      onClick={() => setAdjustType('increase')}
                      className={`flex-1 py-1 rounded text-[10px] font-bold ${
                        adjustType === 'increase' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      افزایش موجودی (ورود)
                    </button>
                    <button
                      id="adjust-dec-btn"
                      type="button"
                      onClick={() => setAdjustType('decrease')}
                      className={`flex-1 py-1 rounded text-[10px] font-bold ${
                        adjustType === 'decrease' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      کاهش موجودی (سرقت/فساد)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">میزان اصلاح تعداد:</label>
                    <input
                      id="adjust-qty-field"
                      type="number"
                      min="1"
                      required
                      value={adjustQty}
                      onChange={e => setAdjustQty(Number(e.target.value))}
                      className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-left"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">کد دلیل رسمی اصلاح انبار:</label>
                    <select
                      id="adjust-reason-field"
                      value={adjustReason}
                      onChange={e => setAdjustReason(e.target.value)}
                      className="w-full text-[11px] px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="انبارگردانی سالانه و بازشماری">انبارگردانی سالانه و بازشماری</option>
                      <option value="کالای منقضی، خراب و یا آسیب‌دیده">کالای آسیب‌دیده، منقضی یا فاسد</option>
                      <option value="عودت موقت کالا از سوی همکار">کسری تراز تایید شده مشتری</option>
                      <option value="مغایرت سیستمی اسکنر بارکد">سرقت کالا یا گم شدن فیزیکی</option>
                    </select>
                  </div>
                </div>

                <button
                  id="confirm-correction-btn"
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm transition"
                >
                  ثبت تعدیل نهایی انبار و ثبت سند
                </button>
              </form>
            </div>
          )}

          {/* تاریخچه بافت تراکنش‌های انبار بر اساس لاگ انبارداری (StockLogs Trail) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm" id="stock-logs-box">
            <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 mb-3">
              <History className="w-4.5 h-4.5 text-emerald-500" />
               پرونده رویدادهای فیزیکی انبار
            </h3>

            <div className="overflow-y-auto max-h-96 space-y-2 pr-1" id="stock-logs-scroller">
              {stockLogs.length === 0 ? (
                <p className="text-center py-10 text-slate-400 text-[11px] italic">هیچ سند انبارداری ثبت نشده است.</p>
              ) : (
                stockLogs.map(log => {
                  const isPositive = log.change_qty > 0;
                  return (
                    <div key={log.id} id={`log-card-${log.id}`} className="p-3 border border-slate-50 rounded-xl bg-slate-50/50 text-[10.5px]">
                      <div className="flex justify-between items-start mb-1 text-slate-400">
                        <span className="font-mono text-[9px]">{new Date(log.created_at).toLocaleDateString('fa-IR')}</span>
                        <span className={`font-bold font-mono px-1.5 rounded text-[8.5px] ${
                          isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {isPositive ? `+${log.change_qty}` : `${log.change_qty}`}
                        </span>
                      </div>
                      
                      <div className="text-slate-800">
                        تغییر در موجودی <strong className="font-bold text-slate-900">«{log.product_title}»</strong>
                        <div className="text-slate-400 text-[10px] mt-1 space-y-0.5">
                          <div>تراز: {log.previous_qty} ← {log.new_qty} عدد</div>
                          <div className="text-[9.5px] font-medium text-slate-500 bg-white border border-slate-100 p-1 rounded mt-1">{log.reason}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
