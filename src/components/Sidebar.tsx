import React, { useState } from 'react';
import { 
  Users, 
  ShoppingBag, 
  FileText, 
  Boxes, 
  ChevronDown, 
  LayoutDashboard, 
  Cpu, 
  TrendingUp, 
  RefreshCw,
  Eye,
  AlertTriangle,
  History,
  FileSpreadsheet
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string, parentMenuId: string | null) => void;
  lowStockCount: number;
}

export default function Sidebar({ activeTab, onTabChange, lowStockCount }: SidebarProps) {
  // شبیه‌ساز تک‌منوی آکاردئونی: در هر لحظه فقط یک منوی اصلی می‌تواند باز باشد.
  const [expandedMenu, setExpandedMenu] = useState<string | null>('sales'); // پیشفرض بخش فاکتور باز باشد

  const toggleMenu = (menuId: string) => {
    if (expandedMenu === menuId) {
      setExpandedMenu(null); // بستن منوی باز شده فعلی
    } else {
      setExpandedMenu(menuId); // باز کردن منوی جدید و بسته شدن بقیه اتوماتیک
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'داشبورد و گزارشات',
      icon: LayoutDashboard,
      isSingle: true, // منوی تکی بدون زیرمنو
    },
    {
      id: 'persons',
      label: 'اشخاص و مشتریان',
      icon: Users,
      subMenus: [
        { id: 'persons-list', label: 'مدیریت اشخاص و حساب‌ها' },
        { id: 'persons-debtors', label: 'بدهکاران و بستانکاران' },
      ]
    },
    {
      id: 'items',
      label: 'محصولات و خدمات',
      icon: ShoppingBag,
      subMenus: [
        { id: 'items-list', label: 'افزودن محصول و خدمات' },
        { id: 'items-bulk-price', label: 'بروزرسانی لیست قیمت‌ها' },
      ]
    },
    {
      id: 'sales',
      label: 'فاکتور و بهای فروش',
      icon: FileText,
      subMenus: [
        { id: 'quick-pos', label: 'فروش سریع (صندوق POS)', highlight: true },
        { id: 'standard-invoice', label: 'ثبت فاکتور پیشرفته' },
        { id: 'invoice-history', label: 'تاریخچه فاکتورها' },
      ]
    },
    {
      id: 'inventory',
      label: 'لجستیک و انبارداری',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      subMenus: [
        { id: 'inventory-levels', label: 'کنترل موجودی انبار' },
        { id: 'inventory-logs', label: 'تاریخچه عملیات انبار' },
      ]
    },
    {
      id: 'electron',
      label: 'برقراری اتصال Electron',
      icon: Cpu,
      isSingle: true,
    }
  ];

  return (
    <aside className="w-72 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100 flex flex-col border-l border-slate-800 shadow-xl select-none" id="sidebar-container">
      {/* هدر سایدبار */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between" id="sidebar-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20 text-white font-bold text-lg">
            ح
          </div>
          <div>
            <h1 className="font-bold text-sm text-white tracking-wide">حسابداری فروشگاهی آریا</h1>
            <span className="text-[10px] text-slate-400 font-mono">نسخه ۱۰۰٪ آفلاین</span>
          </div>
        </div>
        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">سریع</span>
      </div>

      {/* لیست منوها با انیمیشن و رفتار دقیق آکاردئونی */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5" id="sidebar-menu-list">
        {menuItems.map((menu) => {
          const isSelectedParent = activeTab === menu.id || (menu.subMenus?.some(sub => sub.id === activeTab));

          if (menu.isSingle) {
            return (
              <button
                key={menu.id}
                id={`menu-single-${menu.id}`}
                onClick={() => {
                  onTabChange(menu.id, null);
                  setExpandedMenu(null); // بستن زیرمنوهای آکاردئون
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium text-xs duration-200 ${
                  activeTab === menu.id 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <menu.icon className="w-4.5 h-4.5" />
                  <span>{menu.label}</span>
                </div>
              </button>
            );
          }

          const isExpanded = expandedMenu === menu.id;

          return (
            <div key={menu.id} className="space-y-1" id={`menu-group-${menu.id}`}>
              <button
                id={`menu-header-${menu.id}`}
                onClick={() => toggleMenu(menu.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium text-xs duration-200 ${
                  isSelectedParent 
                    ? 'bg-slate-800 text-white border-r-4 border-emerald-500' 
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <menu.icon className="w-4.5 h-4.5 text-slate-400" />
                  <span>{menu.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {menu.badge && (
                    <span className="bg-red-500 hover:bg-red-600 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-bold font-mono">
                      {menu.badge}
                    </span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-emerald-400' : 'text-slate-500'}`} />
                </div>
              </button>

              {/* باز شدن آکاردئونی با شرط تک‌مفتوحه */}
              {isExpanded && (
                <div className="mr-4 pr-3 border-r border-slate-800 space-y-1 mt-1 transition-all" id={`submenus-for-${menu.id}`}>
                  {menu.subMenus?.map((sub) => {
                    const isSubSelected = activeTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        id={`submenu-item-${sub.id}`}
                        onClick={() => onTabChange(sub.id, menu.id)}
                        className={`w-full text-right block px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
                          isSubSelected
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-medium shadow-md shadow-emerald-500/5'
                            : sub.highlight
                              ? 'text-emerald-400 hover:bg-slate-800 hover:text-emerald-300 font-medium'
                              : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* کارت وضعیت دیتابیس بومی پایین منو */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col gap-2 rounded-b-xl" id="sidebar-footer">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            وضعیت پایگاه داده:
          </span>
          <span className="text-emerald-400 font-medium">آماده‌به‌کار (SQLite)</span>
        </div>
        <div className="text-[10px] text-slate-500 text-center select-text font-mono">
          SQLite engine state: persisted
        </div>
      </div>
    </aside>
  );
}
