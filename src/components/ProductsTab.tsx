import React, { useState, useEffect, useRef } from 'react';
import { OfflineDatabase } from '../db/offlineDb';
import { Product, Service, Category } from '../types';
import { 
  ShoppingBag, Search, PlusCircle, Trash2, Edit2, Barcode, TrendingUp, 
  DollarSign, Layers, Folder, FolderOpen, ChevronRight, ChevronDown, 
  Upload, Image as ImageIcon, Tag, RefreshCw, Layers as LayersIcon, 
  Clock, Package, AlertTriangle, BadgePercent, ArrowLeftRight, HelpCircle, 
  X, Check, Plus, Minimize2, Eye, Sparkles
} from 'lucide-react';

// تمساح رنگی یا تصاویر پیش‌فرض برای کالای بدون عکس
const PRODUCT_IMAGE_PRESETS = [
  { name: 'خواروبار و عمومی', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80' },
  { name: 'برنج و کیسه‌جات', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80' },
  { name: 'روغن و مایعات', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80' },
  { name: 'لبنیات و نوشیدنی', url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&q=80' },
  { name: 'چای و تنقلات', url: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=400&q=80' },
  { name: 'سخت‌افزار و فیزیکی', url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=400&q=80' },
];

const SERVICE_IMAGE_PRESETS = [
  { name: 'پیک و ارسال سریع', url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=400&q=80' },
  { name: 'بسته‌بندی و سلفون', url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80' },
  { name: 'مونتاژ و تست فنی', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80' },
  { name: 'کارگری و حمل کالا', url: 'https://images.unsplash.com/photo-1524143986875-3b098d78b363?auto=format&fit=crop&w=400&q=80' },
];

export default function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [activeFormTab, setActiveFormTab] = useState<'product' | 'service'>('product');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // فرم پیشرفته محصول
  const [prodId, setProdId] = useState('');
  const [barcode, setBarcode] = useState(''); // بارکد کارخانه
  const [barcodeStore, setBarcodeStore] = useState(''); // بارکد مغازه
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [unit, setUnit] = useState('عدد');
  const [minStock, setMinStock] = useState<number>(5); // نقطه سفارش پیش‌فرض
  const [maxStock, setMaxStock] = useState<number>(100);
  const [dimensions, setDimensions] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [image, setImage] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [tempGalleryUrl, setTempGalleryUrl] = useState('');

  // فرم پیشرفته خدمات
  const [srvId, setSrvId] = useState('');
  const [srvTitle, setSrvTitle] = useState('');
  const [srvPrice, setSrvPrice] = useState<number>(0);
  const [srvDurationMins, setSrvDurationMins] = useState<number>(30);
  const [srvDescription, setSrvDescription] = useState('');
  const [srvCategoryId, setSrvCategoryId] = useState('');
  const [srvImage, setSrvImage] = useState('');
  const [srvGallery, setSrvGallery] = useState<string[]>([]);
  const [tempSrvGalleryUrl, setTempSrvGalleryUrl] = useState('');

  // جادوی بروزرسانی دسته‌جمعی
  const [bulkPercent, setBulkPercent] = useState<number>(15);
  const [roundNearest, setRoundNearest] = useState<number>(1000);
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState(false);

  // پاپ‌آپ دسته‌بندی
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [activeGalleryPreviewProduct, setActiveGalleryPreviewProduct] = useState<Product | null>(null);

  // مدیریت آپلود تصویر
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const srvFileInputRef = useRef<HTMLInputElement>(null);
  const srvGalleryInputRef = useRef<HTMLInputElement>(null);

  const carouselRef = useRef<HTMLDivElement>(null);
  const [isCarouselDragging, setIsCarouselDragging] = useState(false);
  const [carouselStartX, setCarouselStartX] = useState(0);
  const [carouselScrollLeft, setCarouselScrollLeft] = useState(0);

  const handleCarouselMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsCarouselDragging(true);
    setCarouselStartX(e.pageX - carouselRef.current.offsetLeft);
    setCarouselScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleCarouselMouseLeave = () => {
    setIsCarouselDragging(false);
  };

  const handleCarouselMouseUp = () => {
    setIsCarouselDragging(false);
  };

  const handleCarouselMouseMove = (e: React.MouseEvent) => {
    if (!isCarouselDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - carouselStartX) * 1.5; // Scroll speed factor
    carouselRef.current.scrollLeft = carouselScrollLeft - walk;
  };

  const sortedCategoriesForFilter = React.useMemo(() => {
    return [...categories].sort((a, b) => {
      // 1. Prioritize categories marked as important manually
      const aImp = a.isImportant ? 1 : 0;
      const bImp = b.isImportant ? 1 : 0;
      if (bImp !== aImp) return bImp - aImp;

      // 2. Count of products mapped to this category (bestseller heuristic)
      const aCount = products.filter(p => p.category_id === a.id).length + services.filter(s => s.category_id === a.id).length;
      const bCount = products.filter(p => p.category_id === b.id).length + services.filter(s => s.category_id === b.id).length;
      if (bCount !== aCount) return bCount - aCount;

      // 3. Fallback alphabetical
      return a.name.localeCompare(b.name, 'fa');
    });
  }, [categories, products, services]);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setProducts(OfflineDatabase.getProducts());
    setServices(OfflineDatabase.getServices());
    setCategories(OfflineDatabase.getCategories());
  };

  // تولید بارکد رندوم (کارخانه‌ای EAN-13 یا مغازه‌ای MST)
  const generateRandomBarcode = (type: 'factory' | 'store') => {
    if (type === 'factory') {
      const code = '626' + Array.from({length: 10}, () => Math.floor(Math.random() * 10)).join('');
      setBarcode(code);
    } else {
      const code = 'MST-' + Array.from({length: 6}, () => Math.floor(Math.random() * 10)).join('');
      setBarcodeStore(code);
    }
  };

  // خواندن تصویر بومی و تبدیل به Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'product-cover' | 'product-gallery' | 'service-cover' | 'service-gallery') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('کاربر گرامی، جهت حفظ کارایی بهینه مرورگر، لطفاً تصویر کمتر از ۲ مگابایت انتخاب نمایید.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (target === 'product-cover') {
        setImage(base64String);
      } else if (target === 'product-gallery') {
        setGallery(prev => [...prev, base64String]);
      } else if (target === 'service-cover') {
        setSrvImage(base64String);
      } else if (target === 'service-gallery') {
        setSrvGallery(prev => [...prev, base64String]);
      }
    };
    reader.readAsDataURL(file);
  };

  // ثبت یا ویرایش محصول
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('عنوان محصول الزامی است');
      return;
    }

    OfflineDatabase.saveProduct({
      id: prodId ? prodId : undefined,
      barcode: barcode.trim(),
      barcode_store: barcodeStore.trim(),
      title: title.trim(),
      brand: brand.trim(),
      sku: sku.trim(),
      purchase_price: Number(purchasePrice) || 0,
      sale_price: Number(salePrice) || 0,
      stock_quantity: Number(stockQuantity) || 0,
      unit,
      min_stock: Number(minStock) || 0,
      max_stock: Number(maxStock) || 0,
      dimensions: dimensions.trim(),
      description: description.trim(),
      category_id: categoryId || undefined,
      image,
      gallery
    });

    resetProductForm();
    refreshData();
    alert('اطلاعات محصول با موفقیت ثبت و فایروال انبارداری بروزرسانی شد.');
  };

  const resetProductForm = () => {
    setProdId('');
    setBarcode('');
    setBarcodeStore('');
    setTitle('');
    setBrand('');
    setSku('');
    setPurchasePrice(0);
    setSalePrice(0);
    setStockQuantity(0);
    setUnit('عدد');
    setMinStock(5);
    setMaxStock(100);
    setDimensions('');
    setDescription('');
    setCategoryId('');
    setImage('');
    setGallery([]);
    setTempGalleryUrl('');
  };

  // ثبت یا ویرایش خدمات
  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!srvTitle.trim()) {
      alert('عنوان کامل خدمت الزامی است');
      return;
    }

    OfflineDatabase.saveService({
      id: srvId ? srvId : undefined,
      title: srvTitle.trim(),
      price: Number(srvPrice) || 0,
      description: srvDescription.trim(),
      duration_mins: Number(srvDurationMins) || 30,
      category_id: srvCategoryId || undefined,
      image: srvImage,
      gallery: srvGallery
    });

    resetServiceForm();
    refreshData();
    alert('شناسنامه خدمت با گالری پیوست‌ها در سیستم قرار گرفت.');
  };

  const resetServiceForm = () => {
    setSrvId('');
    setSrvTitle('');
    setSrvPrice(0);
    setSrvDurationMins(30);
    setSrvDescription('');
    setSrvCategoryId('');
    setSrvImage('');
    setSrvGallery([]);
    setTempSrvGalleryUrl('');
  };

  // بارگذاری داده‌ها برای ویرایش محصول
  const handleEditProduct = (p: Product) => {
    setActiveFormTab('product');
    setProdId(p.id);
    setBarcode(p.barcode || '');
    setBarcodeStore(p.barcode_store || '');
    setTitle(p.title);
    setBrand(p.brand || '');
    setSku(p.sku || '');
    setPurchasePrice(p.purchase_price || 0);
    setSalePrice(p.sale_price || 0);
    setStockQuantity(p.stock_quantity || 0);
    setUnit(p.unit || 'عدد');
    setMinStock(p.min_stock !== undefined ? p.min_stock : 5);
    setMaxStock(p.max_stock !== undefined ? p.max_stock : 100);
    setDimensions(p.dimensions || '');
    setDescription(p.description || '');
    setCategoryId(p.category_id || '');
    setImage(p.image || '');
    setGallery(p.gallery || []);
  };

  // بارگذاری داده‌ها برای ویرایش خدمت
  const handleEditService = (s: Service) => {
    setActiveFormTab('service');
    setSrvId(s.id);
    setSrvTitle(s.title);
    setSrvPrice(s.price || 0);
    setSrvDurationMins(s.duration_mins !== undefined ? s.duration_mins : 30);
    setSrvDescription(s.description || '');
    setSrvCategoryId(s.category_id || '');
    setSrvImage(s.image || '');
    setSrvGallery(s.gallery || []);
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

  // بروز رسانی قیمتی سراسری
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

  // محاسبه حاشیه سود لحظه‌ای محصول در فرم تعریف کالا
  const calculateMargin = () => {
    if (!salePrice || salePrice === 0) return 0;
    const profit = salePrice - purchasePrice;
    return Math.round((profit / salePrice) * 100);
  };

  // گرفتن لیست درختی دسته‌بندی‌ها به صورت خطی با افکت تورفتگی جهت نمایش در Dropdown
  const getFormattedCategoriesList = (
    allCategories: Category[],
    parentId: string | undefined = undefined,
    prefix = ''
  ): { id: string; label: string }[] => {
    const levelCats = allCategories.filter(c => c.parentId === parentId || (!parentId && !c.parentId));
    let result: { id: string; label: string }[] = [];
    
    levelCats.forEach(cat => {
      result.push({
        id: cat.id,
        label: `${prefix}${prefix ? '└── ' : ''}${cat.name} (${cat.type === 'product' ? 'کالا' : cat.type === 'service' ? 'خدمت' : 'عمومی'})`
      });
      const children = getFormattedCategoriesList(allCategories, cat.id, prefix ? `${prefix}  ` : '  ');
      result = [...result, ...children];
    });
    
    return result;
  };

  const categoriesDropdownOptions = getFormattedCategoriesList(categories);

  // اِعمال فیلترینگ بر اساس سرچ بارکد کالا، برند و دسته‌بندی درختی
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.barcode || '').includes(searchQuery) ||
      (p.barcode_store || '').includes(searchQuery) ||
      (p.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategoryFilter === 'all' || p.category_id === selectedCategoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const filteredServices = services.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'all' || s.category_id === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 flex flex-col xl:flex-row gap-6 h-[calc(100vh-64px)] overflow-hidden bg-slate-50/50" id="products-tab-container">
      
      {/* ستون راست: فرم‌های ثبت و ویرایش پیشرفته */}
      <div className="w-full xl:w-[45%] flex flex-col gap-5 h-full overflow-y-auto pr-1" id="forms-sidebar-column">
        
        {/* پنل سوئیچ کاتالوگ و مدیریت دسته‌بندی‌ها */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between gap-2">
          <div className="flex gap-1.5" id="catalog-form-tabs">
            <button
              id="form-tab-product"
              type="button"
              onClick={() => { setActiveFormTab('product'); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFormTab === 'product'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 bg-slate-50'
              }`}
            >
              <Package className="w-4 h-4" />
              کالا (انبارداری هوشمند)
            </button>
            <button
              id="form-tab-service"
              type="button"
              onClick={() => { setActiveFormTab('service'); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFormTab === 'service'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/10'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4" />
              خدمات (سرویس سفارشی)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-sky-700 hover:text-white bg-sky-50 hover:bg-sky-600 border border-sky-150 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <LayersIcon className="w-4 h-4" />
            مدیریت دسته‌بندی درختی 🌳
          </button>
        </div>

        {/* فرم کالا */}
        {activeFormTab === 'product' && (
          <form onSubmit={handleProductSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4" id="product-maker-tag">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-black text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-emerald-500" />
                {prodId ? 'ویرایش کالا' : 'تعریف کالا با انبارداری هوشمند خیلی خیلی پیشرفته'}
              </span>
              {prodId && (
                <button type="button" onClick={resetProductForm} className="text-xs text-red-500 hover:underline hover:font-bold">
                  انصراف از ویرایش
                </button>
              )}
            </div>

            {/* بخش ۱: اطلاعات پایه */}
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">۱. شناسنامه و هویت کالا</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10.5px] mb-1 font-bold text-slate-600">عنوان کامل محصول کالا:</label>
                  <input
                    id="product-title"
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50/60 focus:bg-white border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    placeholder="نمونه: برنج دودی صدر هاشمی گیلان"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] mb-1 font-bold text-slate-500">برند یا کارخانه سازنده:</label>
                  <input
                    id="product-brand"
                    type="text"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50/60 focus:bg-white border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="نمونه: کاله، لادن، گلستان"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] mb-1 font-bold text-slate-500">شناسه فنی انبارداری (SKU):</label>
                  <input
                    id="product-sku"
                    type="text"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50/60 focus:bg-white border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-left font-mono"
                    placeholder="PRD-1025-X"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] mb-1 font-bold text-slate-650">انتساب دسته‌بندی درختی:</label>
                  <select
                    id="product-category"
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 h-[38px] cursor-pointer"
                  >
                    <option value="">بدون دسته‌بندی (متفرقه)</option>
                    {categories.filter(c => c.type === 'product' || c.type === 'both').length === 0 ? (
                      <option disabled>دسته کالایی یافت نشد. لطفا بسازید.</option>
                    ) : (
                      categoriesDropdownOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[10.5px] mb-1 font-bold text-slate-500">واحد شمارش فروش:</label>
                  <select
                    id="product-unit"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 h-[38px] cursor-pointer"
                  >
                    <option value="عدد">عدد (ساده)</option>
                    <option value="بسته">بسته بندی</option>
                    <option value="کیلوگرم">کیلوگرم (وزنی)</option>
                    <option value="لیتر">لیتر (مایعات)</option>
                    <option value="متر">متر (طولی)</option>
                    <option value="کیسه">کیسه</option>
                    <option value="شل / جین">شل / جین</option>
                    <option value="کارتن">کارتن بزرگ</option>
                    <option value="باکس">باکس متراکم</option>
                  </select>
                </div>
              </div>
            </div>

            {/* بخش ۲: سیستم بارکد دوگانه */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
                <span>۲. سیستم بارکد دوگانه (کارخانه و مغازه)</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-300" title="می توانید هر دو یا یکی را پر نمایید. جهت کاربری اسکن پیوسته به کار می آید" />
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] mb-1 font-bold text-slate-500 flex justify-between">
                    <span>بارکد محصول (کارخانه):</span>
                    <button
                      type="button"
                      onClick={() => generateRandomBarcode('factory')}
                      className="text-[9px] text-emerald-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> تولید بارکد متمم
                    </button>
                  </label>
                  <div className="relative">
                    <Barcode className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                    <input
                      id="product-barcode"
                      type="text"
                      value={barcode}
                      onChange={e => setBarcode(e.target.value)}
                      className="w-full text-xs pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-left font-mono"
                      placeholder="اسکن یا درج بارکد کالا کالا"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] mb-1 font-bold text-slate-500 flex justify-between">
                    <span>بارکد اختصاصی مغازه:</span>
                    <button
                      type="button"
                      onClick={() => generateRandomBarcode('store')}
                      className="text-[9px] text-sky-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> تولید بارکد سریع
                    </button>
                  </label>
                  <div className="relative">
                    <Barcode className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                    <input
                      id="product-barcode-store"
                      type="text"
                      value={barcodeStore}
                      onChange={e => setBarcodeStore(e.target.value)}
                      className="w-full text-xs pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-left font-mono"
                      placeholder="نمونه: MST-00125"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* بخش ۳: انبارداری، حاشیه سود و مبالغ */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex justify-between">
                <span>۳. حسابداری مالی و کالیبره انبارداری هوشمند</span>
                {salePrice > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 font-black rounded-lg ${
                    calculateMargin() >= 20 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    سود ناخالص: {calculateMargin()}% 📈
                  </span>
                )}
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] mb-1 font-bold text-slate-550">قیمت خرید (تومان):</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                    <input
                      id="product-purchase-price"
                      type="number"
                      required
                      value={purchasePrice || ''}
                      onChange={e => setPurchasePrice(Number(e.target.value))}
                      className="w-full text-xs pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-left font-mono"
                      placeholder="قیمت پایه خرید تک"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] mb-1 font-bold text-slate-550">قیمت مصرف‌کننده فروش (تومان):</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                    <input
                      id="product-sale-price"
                      type="number"
                      required
                      value={salePrice || ''}
                      onChange={e => setSalePrice(Number(e.target.value))}
                      className="w-full text-xs pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-left font-mono font-bold text-emerald-700"
                      placeholder="قیمت فروش نهایی"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[9.5px] mb-1 font-bold text-slate-500">کل موجودی انبارها:</label>
                  <input
                    id="product-stock-qty"
                    type="number"
                    required
                    value={stockQuantity || ''}
                    onChange={e => setStockQuantity(Number(e.target.value))}
                    className="w-full text-xs px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] mb-1 font-bold text-slate-500">نقطه سفارش (حداقل هشدار):</label>
                  <input
                    id="product-min-stock"
                    type="number"
                    value={minStock || ''}
                    onChange={e => setMinStock(Number(e.target.value))}
                    className="w-full text-xs px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono text-center text-red-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] mb-1 font-bold text-slate-500">سقف دپو (حداکثر قفسه):</label>
                  <input
                    id="product-max-stock"
                    type="number"
                    value={maxStock || ''}
                    onChange={e => setMaxStock(Number(e.target.value))}
                    className="w-full text-xs px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono text-center text-sky-600 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] mb-1 font-bold text-slate-500">ابعاد و وزن فیزیکی کالا (در ابعاد کارتن یا کیلوگرم):</label>
                  <input
                    id="product-dimensions"
                    type="text"
                    value={dimensions}
                    onChange={e => setDimensions(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none"
                    placeholder="مثال: کارتن ۲۴ عددی، ابعاد ۴۰*۳۰*۲۰ سانتی‌متر"
                  />
                </div>
              </div>
            </div>

            {/* بخش ۴: تصویر و آلبوم گالری تصاویر */}
            <div className="space-y-3 pt-3 border-t border-slate-100 animate-fade-in">
              <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">۴. بارگذاری تصویر اصلی و گالری پیوست‌ها</h4>
              
              {/* آپلود تصویر اصلی */}
              <div>
                <label className="block text-[10.5px] mb-1 font-bold text-slate-500">تصویر اصلی محصول کالا:</label>
                <div className="flex gap-3 items-center">
                  <div className="relative w-16 h-16 border border-slate-250 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                    {image ? (
                      <img
                        src={image}
                        alt="Product visual"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                    {image && (
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="absolute top-0 right-0 p-0.5 bg-red-600 text-white rounded-bl-lg hover:bg-red-700 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5 text-xs text-slate-650">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/70 text-[10.5px] font-bold rounded-lg cursor-pointer flex items-center gap-1 transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        انتخاب فایل از هارد مغازه
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={e => handleImageUpload(e, 'product-cover')}
                        className="hidden"
                      />
                    </div>
                    {/* پیش‌فرض‌های سریع کالا */}
                    <div className="flex flex-wrap gap-1">
                      {PRODUCT_IMAGE_PRESETS.map((pst, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setImage(pst.url)}
                          className="bg-emerald-50 text-[9px] hover:bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-150 transition cursor-pointer"
                        >
                          {pst.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* آلبوم تصویر گالری با چند فایل */}
              <div>
                <label className="block text-[10.5px] mb-1 font-bold text-slate-500">گالری تصاویر متمم و تصاویر فرعی کالای مغازه:</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tempGalleryUrl}
                      onChange={e => setTempGalleryUrl(e.target.value)}
                      placeholder="یا پیوند URL تصویر را اینجا بنویسید..."
                      className="flex-1 text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-left font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (tempGalleryUrl.trim()) {
                          setGallery(prev => [...prev, tempGalleryUrl.trim()]);
                          setTempGalleryUrl('');
                        }
                      }}
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-3 py-1.5 text-xs font-bold border border-emerald-150 rounded-lg transition shrink-0 cursor-pointer"
                    >
                      ثبت تفضیلی لینک
                    </button>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      آپلود فایل فرعی
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      ref={galleryInputRef}
                      onChange={e => handleImageUpload(e, 'product-gallery')}
                      className="hidden"
                    />
                  </div>

                  {gallery.length > 0 ? (
                    <div className="grid grid-cols-5 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-150 border-dashed max-h-32 overflow-y-auto">
                      {gallery.map((imgUrl, index) => (
                        <div key={index} className="relative w-full aspect-square border border-slate-200 bg-white rounded-lg overflow-hidden flex items-center justify-center">
                          <img
                            src={imgUrl}
                            alt="Gallery item"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setGallery(prev => prev.filter((_, i) => i !== index))}
                            className="absolute -top-0.5 -right-0.5 p-0.5 bg-red-600 text-white rounded-full hover:bg-red-700 cursor-pointer shadow-xs"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">آلبومی تنظیم نشده است. تا ۳ تصویر مکمل می‌توانید الصاق کنید.</p>
                  )}
                </div>
              </div>

              {/* فیلد توضیحات */}
              <div>
                <label className="block text-[10.5px] mb-1 font-bold text-slate-650">توضیحات تکمیلی کالا (شامل مشخصات فنی و فرمول‌ها):</label>
                <textarea
                  id="product-description"
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200/80 rounded-xl focus:outline-none"
                  placeholder="مشخصات انبارداری عمیق یا یادداشت‌های فاکتور..."
                />
              </div>
            </div>

            <button
              id="save-product-btn"
              type="submit"
              className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl shadow-md shadow-emerald-500/10 transition duration-300 transform active:scale-98 cursor-pointer flex justify-center items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {prodId ? 'بروزرسانی نهایی کالا' : 'افزودن به انبار و کاتالوگ فروشگاه مغازه'}
            </button>
          </form>
        )}

        {/* فرم خدمات */}
        {activeFormTab === 'service' && (
          <form onSubmit={handleServiceSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4 animate-fade-in" id="service-maker-tag">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-black text-slate-800 flex items-center gap-2">
                <PlusCircle className="w-4.5 h-4.5 text-purple-500" />
                {srvId ? 'ویرایش خدمات دفتری' : 'تعریف کارهای خدماتی با پیوست گالری و زمان‌بند'}
              </span>
              {srvId && (
                <button type="button" onClick={resetServiceForm} className="text-xs text-red-500 hover:underline hover:font-bold">
                  انصراف از ویرایش
                </button>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">شناسنامه خدمت دستمزد</h4>
              
              <div>
                <label className="block text-[10.5px] mb-1 font-bold text-slate-500">عنوان کامل خدمت ارائه‌شده:</label>
                <input
                  id="service-title"
                  type="text"
                  required
                  value={srvTitle}
                  onChange={e => setSrvTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  placeholder="بسته‌بندی کارتنی با سورت لادن متمم"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] mb-1 font-bold text-slate-550">مبلغ دریافتی دستمزد (تومان):</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                    <input
                      id="service-price"
                      type="number"
                      required
                      value={srvPrice || ''}
                      onChange={e => setSrvPrice(Number(e.target.value))}
                      className="w-full text-xs pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-left font-mono font-bold text-purple-700"
                      placeholder="مبلغ پایه خدمت"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] mb-1 font-bold text-slate-500">تخمین مدت کاربری (به دقیقه):</label>
                  <input
                    id="service-duration"
                    type="number"
                    value={srvDurationMins || ''}
                    onChange={e => setSrvDurationMins(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-center font-mono font-bold"
                    placeholder="۳۰ دقیقه"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] mb-1 font-bold text-slate-650">دسته‌بندی درختی خدمات:</label>
                <select
                  id="service-category"
                  value={srvCategoryId}
                  onChange={e => setSrvCategoryId(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none h-[38px] cursor-pointer"
                >
                  <option value="">بدون گروه خدمات (سایر)</option>
                  {categories.filter(c => c.type === 'service' || c.type === 'both').length === 0 ? (
                    <option disabled>دسته‌بندی خدماتی یافت نشد. بسازید.</option>
                  ) : (
                    categoriesDropdownOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))
                  )}
                </select>
              </div>

              {/* تصویر و گالری شاخص خدمات */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <h5 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">آلبوم نگاره و تصاویر فرعی خدمت</h5>
                
                <div>
                  <label className="block text-[10.5px] mb-1 font-bold text-slate-500">تصویر شاخص خدمت:</label>
                  <div className="flex gap-3 items-center">
                    <div className="relative w-16 h-16 border border-slate-250 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                      {srvImage ? (
                        <img
                          src={srvImage}
                          alt="Service visual logo"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                      )}
                      {srvImage && (
                        <button
                          type="button"
                          onClick={() => setSrvImage('')}
                          className="absolute top-0 right-0 p-0.5 bg-red-600 text-white rounded-bl-lg hover:bg-red-700 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5 text-xs text-slate-600">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => srvFileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-[10.5px] font-bold rounded-lg cursor-pointer flex items-center gap-1 transition"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          آپلود نگاره
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          ref={srvFileInputRef}
                          onChange={e => handleImageUpload(e, 'service-cover')}
                          className="hidden"
                        />
                      </div>
                      {/* تصویر پیش‌فرض */}
                      <div className="flex flex-wrap gap-1">
                        {SERVICE_IMAGE_PRESETS.map((pst, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSrvImage(pst.url)}
                            className="bg-purple-50 text-[9px] hover:bg-purple-100 text-purple-850 px-1.5 py-0.5 rounded border border-purple-150 transition cursor-pointer"
                          >
                            {pst.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* آلبوم مکمل خدمات */}
                <div>
                  <label className="block text-[10.5px] mb-1 font-bold text-slate-505">ضمایم گالری و اسناد مصور خدمات:</label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tempSrvGalleryUrl}
                        onChange={e => setTempSrvGalleryUrl(e.target.value)}
                        placeholder="درج لینک تصویر یا داکیومنت..."
                        className="flex-1 text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-left font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (tempSrvGalleryUrl.trim()) {
                            setSrvGallery(prev => [...prev, tempSrvGalleryUrl.trim()]);
                            setTempSrvGalleryUrl('');
                          }
                        }}
                        className="bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white px-3 py-1.5 text-xs font-bold border border-purple-150 rounded-lg transition shrink-0 cursor-pointer"
                      >
                        ثبت دائم لینک
                      </button>
                      <button
                        type="button"
                        onClick={() => srvGalleryInputRef.current?.click()}
                        className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        آپلود نگاره کمکی
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        ref={srvGalleryInputRef}
                        onChange={e => handleImageUpload(e, 'service-gallery')}
                        className="hidden"
                      />
                    </div>

                    {srvGallery.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2 rounded-xl border border-dashed border-slate-200">
                        {srvGallery.map((imgUrl, idx) => (
                          <div key={idx} className="relative w-full aspect-square border border-slate-200 bg-white rounded-lg overflow-hidden flex items-center justify-center">
                            <img
                              src={imgUrl}
                              alt="Service gallery item"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() => setSrvGallery(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute -top-0.5 -right-0.5 p-0.5 bg-red-600 text-white rounded-full hover:bg-red-700 cursor-pointer"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">سندی برای این خدمت پیوست نشده است.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-[10.5px] mb-1 font-bold text-slate-600 font-bold">توضیحات و شرایط ارائه خدمت:</label>
                <textarea
                  id="service-desc"
                  rows={2}
                  value={srvDescription}
                  onChange={e => setSrvDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  placeholder="نویسه شرایط، زمان لازم جهت سفارش گیری در سیستم پوز..."
                />
              </div>

            </div>

            <button
              id="save-service-btn"
              type="submit"
              className="w-full text-xs bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3 px-4 rounded-xl shadow-md shadow-purple-500/10 transition transform active:scale-98 cursor-pointer flex justify-center items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {srvId ? 'بروزرسانی خدمت' : 'ذخیره فوری خدمت دستمزد'}
            </button>
          </form>
        )}

        {/* پنل جادویی قیمت‌ها */}
        <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-5 shadow-lg relative overflow-hidden" id="bulk-price-updater-panel">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none"></div>
          
          <h3 className="font-bold text-xs text-white flex items-center gap-2 mb-2.5">
            <TrendingUp className="w-4.5 h-4.5 text-emerald-450" />
            بروزرسانی لحظه‌ای و دسته‌جمعی مبالغ
          </h3>
          <p className="text-[10px] text-slate-400 mb-3 ml-1">
            با توجه به تلاطم ریالی، می‌توانید قیمت نهایی تمام کارهای دارای انبار را در کمتر از ۱ ثانیه تغییر دهید.
          </p>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[9.5px] text-slate-400 mb-1 font-bold">میزان درصد تغییر قیمت:</label>
                <div className="flex gap-2">
                  <input
                    id="bulk-percent-input"
                    type="number"
                    value={bulkPercent}
                    onChange={e => setBulkPercent(Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-800 border border-slate-700 text-emerald-400 rounded-lg text-center font-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9.5px] text-slate-400 mb-1 font-bold">رند کردن مبالغ نهایی به:</label>
                <select
                  id="bulk-round-nearest"
                  value={roundNearest}
                  onChange={e => setRoundNearest(Number(e.target.value))}
                  className="w-full text-[10.5px] px-2 py-1.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg h-[34px] focus:outline-none"
                >
                  <option value="1000">۱,۰۰۰ تومانی (طبیعی ترین حالت)</option>
                  <option value="5000">۵,۰۰۰ تومانی</option>
                  <option value="10000">۱۰,۰۰۰ تومانی</option>
                  <option value="1">دقیقاً بدون رند کردن</option>
                </select>
              </div>
            </div>

            <button
              id="execute-bulk-btn"
              type="button"
              onClick={handleBulkUpdate}
              className="w-full text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-450 hover:to-teal-450 text-slate-950 py-2.5 px-4 rounded-xl shadow-md transition-all duration-200 cursor-pointer"
            >
              اعمال افزایش فوق به کل {products.length} کالای فروشگاهی
            </button>

            {bulkSuccess && (
              <p className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2 rounded-lg text-center animate-pulse" id="bulk-price-success-alert">
                 کل فیلدهای فروشگاه کالیبره و در دیتابیس لاگ گردید.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* ستون چپ: لیست کاتالوگ با فیلتر دسته‌بندی و آلبوم */}
      <div className="w-full xl:w-[55%] bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col h-full overflow-hidden" id="catalog-explorer-panel">
        
        {/* هدر بخش کاوشگر */}
        <div className="flex flex-col md:flex-row border-b border-slate-100 pb-3 mb-4 gap-3 justify-between items-stretch md:items-center" id="catalog-list-header">
          <div>
            <h3 className="font-extrabold text-[13px] text-slate-800 flex items-center gap-1.5">
              <ShoppingBag className="w-4.5 h-4.5 text-sky-600" />
              کاتالوگ کالاهای انباردار و سیستم خدمات
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">جستجوی دقیق بر اساس بارکد، برند و فیلتر سلسله‌مراتب درختی</p>
          </div>
          
          <div className="relative w-full md:w-64" id="catalog-search-holder">
            <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
            <input
              id="catalog-search-query"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="جستجو با عنوان، برند، بارکد، SKU..."
              className="w-full text-xs pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none"
            />
          </div>
        </div>

        {/* فیلتر دسته‌بندی بالای کاتالوگ بصورت کاروسل کششی ماوس */}
        <div className="text-[9px] text-slate-400 mb-1 flex justify-between items-center px-1">
          <span>👈 با چپ و راست کشیدن ماوس، بین دسته‌ها جابه‌جا شوید.</span>
          <span className="font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">دسته‌های مهم و پرفروش اول قرار دارند ⭐</span>
        </div>
        <div 
          ref={carouselRef}
          onMouseDown={handleCarouselMouseDown}
          onMouseLeave={handleCarouselMouseLeave}
          onMouseUp={handleCarouselMouseUp}
          onMouseMove={handleCarouselMouseMove}
          className={`flex gap-1.5 mb-3.5 overflow-x-auto pb-2 scrollbar-thin select-none ${
            isCarouselDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ scrollBehavior: isCarouselDragging ? 'auto' : 'smooth' }}
          id="category-horizontal-carousel"
        >
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-[10.5px] font-black shrink-0 transition-all cursor-pointer ${
              selectedCategoryFilter === 'all'
                ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/10'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-650'
            }`}
          >
            📂 همه دسته‌بندی‌ها
          </button>
          {sortedCategoriesForFilter.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-[10.5px] font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategoryFilter === cat.id
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/10'
                  : cat.isImportant
                    ? 'bg-amber-100/75 border border-amber-200 hover:bg-amber-100 text-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-650'
              }`}
            >
              <span>{cat.type === 'service' ? '🔧' : '📦'}</span>
              <span>{cat.name}</span>
              {cat.isImportant && (
                <span className="text-[7.5px] text-amber-700 bg-white/70 px-1 rounded-full font-sans">★</span>
              )}
            </button>
          ))}
        </div>

        {/* اسکرول بار اصلی */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1" id="catalog-items-scroll-area">
          
          {/* کالاها */}
          <div>
            <h4 className="text-[11px] font-black text-slate-450 mb-3 flex items-center gap-1.5 sticky top-0 bg-white py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>کالاهای انباردار فروشگاه ({filteredProducts.length})</span>
            </h4>
            
            {filteredProducts.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400 italic bg-slate-50/50 rounded-2xl border border-slate-100">کالایی در این دسته‌بندی و با فیلتر شما ثبت نشده است.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5" id="products-list-grid">
                {filteredProducts.map(p => {
                  const isLowStock = p.stock_quantity <= (p.min_stock !== undefined ? p.min_stock : 5);
                  const belongsCategory = categories.find(c => c.id === p.category_id);
                  const isExceeded = p.max_stock !== undefined && p.stock_quantity > p.max_stock;

                  return (
                    <div
                      key={p.id}
                      id={`p-card-${p.id}`}
                      className={`p-3.5 border rounded-2xl hover:bg-white hover:shadow-md transition-all flex flex-col justify-between ${
                        isLowStock 
                          ? 'bg-rose-50/25 border-rose-200 hover:border-rose-300' 
                          : 'border-slate-200/80 bg-slate-50/30'
                      }`}
                    >
                      <div>
                        {/* عنوان، برند و دکمه بررسی گالری */}
                        <div className="flex gap-2.5 items-start">
                          {/* عکس بندانگشتی کالا */}
                          {p.image ? (
                            <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden shadow-2xs shrink-0 relative group">
                              <img
                                src={p.image}
                                alt="Thumnbail product"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              {p.gallery && p.gallery.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setActiveGalleryPreviewProduct(p)}
                                  className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-slate-100 text-slate-405 border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
                              <ShoppingBag className="w-5 h-5" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-1">
                              <h5 className="font-extrabold text-xs text-slate-800 truncate leading-tight">{p.title}</h5>
                              
                              <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-full border ${
                                isLowStock 
                                  ? 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse' 
                                  : isExceeded
                                    ? 'bg-sky-50 text-sky-700 border-sky-100'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              }`}>
                                {p.stock_quantity === 0 
                                  ? '⚠️ ناموجود' 
                                  : isLowStock
                                    ? `⚠️ نقطه سفارش: ${p.stock_quantity} ${p.unit}`
                                    : `موجودی: ${p.stock_quantity} ${p.unit}`}
                              </span>
                            </div>

                            {/* برند و دسته‌بندی متمم */}
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              {p.brand && (
                                <span className="bg-slate-100 text-slate-550 border border-slate-200/50 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                  برند: {p.brand}
                                </span>
                              )}
                              {belongsCategory && (
                                <span className="bg-sky-50 text-sky-700 border border-sky-100 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5">
                                  <Tag className="w-2.5 h-2.5" />
                                  {belongsCategory.name}
                                </span>
                              )}
                              {p.sku && (
                                <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-1 py-0.5 border rounded">
                                  SKU: {p.sku}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* سیستم بارکد دوگانه */}
                        <div className="mt-2 text-[9.5px] space-y-0.5 border-t border-slate-100/60 pt-2 font-mono">
                          {p.barcode && (
                            <div className="flex items-center gap-1 text-slate-450">
                              <Barcode className="w-3.5 h-3.5 text-slate-350" />
                              <span>کارخانه: {p.barcode}</span>
                            </div>
                          )}
                          {p.barcode_store && (
                            <div className="flex items-center gap-1 text-slate-450">
                              <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
                              <span className="text-sky-600">بارکد مغازه: {p.barcode_store}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* قسمت گالری پیوستی کوچک */}
                      {p.gallery && p.gallery.length > 0 && (
                        <div className="mt-2.5 flex items-center gap-1">
                          <span className="text-[8.5px] font-bold text-slate-400 shrink-0">آلبوم کالا ({p.gallery.length}):</span>
                          <div className="flex gap-1 overflow-x-auto py-0.5">
                            {p.gallery.slice(0, 3).map((gimg, gidx) => (
                              <div
                                key={gidx}
                                onClick={() => setActiveGalleryPreviewProduct(p)}
                                className="w-6 h-6 border border-slate-200 rounded overflow-hidden cursor-pointer hover:border-emerald-500 shrink-0"
                              >
                                <img
                                  src={gimg}
                                  alt="Preview miniature"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            ))}
                            {p.gallery.length > 3 && (
                              <button
                                type="button"
                                onClick={() => setActiveGalleryPreviewProduct(p)}
                                className="w-6 h-6 bg-slate-100 rounded text-[9px] border font-bold flex items-center justify-center text-slate-550 cursor-pointer"
                              >
                                +{p.gallery.length - 3}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-3.5 pt-2 border-t border-slate-100/60 flex items-end justify-between">
                        <div className="text-[10px] space-y-0.5">
                          <div className="text-slate-400 flex items-center gap-1">
                            <span>قیمت خرید کالا:</span>
                            <span className="font-mono text-slate-600">{formatToman(p.purchase_price)}</span>
                          </div>
                          <div className="text-slate-500 flex items-center gap-1">
                            <span className="font-black text-slate-705">قیمت فروش مصرف‌کننده:</span>
                            <span className="font-mono text-emerald-600 font-extrabold text-xs">{formatToman(p.sale_price)}</span>
                          </div>
                        </div>

                        <div className="flex gap-1.5 shrink-0">
                          <button
                            id={`p-edit-btn-${p.id}`}
                            type="button"
                            onClick={() => handleEditProduct(p)}
                            className="p-2 text-slate-450 hover:text-emerald-600 bg-white shadow-3xs rounded-xl border border-slate-150 hover:border-emerald-300 transition"
                            title="ویرایش کامل شناسنامه کالا"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`p-delete-btn-${p.id}`}
                            type="button"
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 text-slate-450 hover:text-red-500 bg-white shadow-3xs rounded-xl border border-slate-150 hover:border-red-300 transition"
                            title="حذف از انبار"
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

          {/* خدمات */}
          <div className="pt-4 border-t border-slate-150">
            <h4 className="text-[11px] font-black text-slate-450 mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
              <span>خدمات شناسنامه‌دار بدون نیاز به انبارداری فیزیکی ({filteredServices.length})</span>
            </h4>

            {filteredServices.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400 italic bg-purple-50/15 rounded-xl border border-purple-100">خدماتی با فیلتر شما ثبت نشده است.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5" id="services-list-grid">
                {filteredServices.map(s => {
                  const belongsCategory = categories.find(c => c.id === s.category_id);
                  return (
                    <div
                      key={s.id}
                      id={`s-card-${s.id}`}
                      className="p-3.5 border border-purple-100/70 bg-purple-50/5/10 rounded-2xl hover:border-purple-300 hover:bg-white hover:shadow-md transition duration-200 flex flex-col justify-between"
                    >
                      <div className="flex gap-2 items-start">
                        {s.image ? (
                          <div className="w-10 h-10 border border-purple-100 rounded-xl overflow-hidden shrink-0">
                            <img
                              src={s.image}
                              alt="Service icon thumbnail"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-purple-50 text-purple-400 border border-purple-100 rounded-xl flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <h5 className="font-extrabold text-xs text-purple-950">{s.title}</h5>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            <span className="text-[8.5px] bg-purple-50 text-purple-600 px-1 py-0.5 rounded border border-purple-100 leading-tight">
                              سرویس دستمزد
                            </span>
                            {s.duration_mins && (
                              <span className="text-[8.5px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded border leading-tight">
                                ⌛ {s.duration_mins} دقیقه
                              </span>
                            )}
                            {belongsCategory && (
                              <span className="bg-sky-50 text-sky-700 border border-sky-100 px-1.5 py-0.5 rounded text-[8.5px] font-bold">
                                {belongsCategory.name}
                              </span>
                            )}
                          </div>
                          {s.description && (
                            <p className="text-[9.5px] text-slate-400 mt-1.5 leading-relaxed truncate max-w-sm" title={s.description}>
                              {s.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* گالری اسناد خدمات */}
                      {s.gallery && s.gallery.length > 0 && (
                        <div className="mt-2 mx-1 flex gap-1 items-center">
                          <span className="text-[8.5px] font-bold text-slate-400">اسناد ({s.gallery.length}):</span>
                          <div className="flex gap-1">
                            {s.gallery.map((gimg, idx) => (
                              <div key={idx} className="w-5 h-5 rounded border border-purple-100 overflow-hidden relative">
                                <img
                                  src={gimg}
                                  alt="service doc"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-purple-50/50">
                        <span className="text-xs font-black font-mono text-purple-700">{formatToman(s.price)}</span>
                        <div className="flex gap-1">
                          <button
                            id={`s-edit-btn-${s.id}`}
                            type="button"
                            onClick={() => handleEditService(s)}
                            className="p-1.5 text-slate-400 hover:text-purple-600 bg-white shadow-3xs rounded-lg border border-slate-150 transition"
                          >
                            <Edit2 className="w-3.2 h-3.2" />
                          </button>
                          <button
                            id={`s-delete-btn-${s.id}`}
                            type="button"
                            onClick={() => handleDeleteService(s.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 bg-white shadow-3xs rounded-lg border border-slate-155 transition"
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

      {/* ۱. پاپ‌آپ درخت دسته‌بندی پیشرفته (Hierarchical Tree Category Editor) */}
      <CategoryTreeModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          refreshData(); // خواندن مقادیر ویرایش شده
        }}
        categories={categories}
      />

      {/* ۲. پاپ‌آپ نمایش گالری تصاویر به همراه جزئیات برای کالا */}
      {activeGalleryPreviewProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-scale-up">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-xs">{activeGalleryPreviewProduct.title}</h4>
                <p className="text-[9.5px] text-slate-400 mt-0.5">آلبوم گالری پیوست‌ها و عکاسی محصول</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveGalleryPreviewProduct(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">تصویر اصلی محصول:</span>
                <div className="aspect-video w-full rounded-2xl border bg-slate-50 overflow-hidden flex items-center justify-center">
                  <img
                    src={activeGalleryPreviewProduct.image || 'https://picsum.photos/seed/placeholder/400/300'}
                    alt="Main visual representation"
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {activeGalleryPreviewProduct.gallery && activeGalleryPreviewProduct.gallery.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 block">تصاویر فرعی و متمم آلبوم ({activeGalleryPreviewProduct.gallery.length}):</span>
                  <div className="grid grid-cols-2 gap-3">
                    {activeGalleryPreviewProduct.gallery.map((galleryImg, index) => (
                      <div key={index} className="aspect-square border bg-slate-50/50 rounded-xl overflow-hidden flex items-center justify-center relative">
                        <img
                          src={galleryImg}
                          alt={`Gallery photo ${index}`}
                          className="max-h-full max-w-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 border-t flex justify-end">
              <button
                type="button"
                onClick={() => setActiveGalleryPreviewProduct(null)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition cursor-pointer"
              >
                بستن آلبوم بازرسی
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// کامپوننت پاپ‌آپ مدیریت درخت دسته‌بندی خیلی خیلی پیشرفته
// ==========================================
interface CategoryTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

function CategoryTreeModal({ isOpen, onClose, categories }: CategoryTreeModalProps) {
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // فرم دسته بندی
  const [catId, setCatId] = useState('');
  const [catName, setCatName] = useState('');
  const [parentId, setParentId] = useState('');
  const [catType, setCatType] = useState<'product' | 'service' | 'both'>('product');
  const [catDescription, setCatDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = () => {
    const list = OfflineDatabase.getCategories();
    setLocalCategories(list);
    
    // باز کردن نودهای ریشه به طور پیش‌فرض
    const roots = list.filter(c => !c.parentId);
    const newExpanded = new Set<string>();
    roots.forEach(r => newExpanded.add(r.id));
    setExpandedNodes(newExpanded);
  };

  if (!isOpen) return null;

  const toggleNode = (id: string) => {
    const next = new Set(expandedNodes);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedNodes(next);
  };

  const handleEditCategory = (cat: Category) => {
    setCatId(cat.id);
    setCatName(cat.name);
    setParentId(cat.parentId || '');
    setCatType(cat.type);
    setCatDescription(cat.description || '');
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      alert('لطفاً عنوان دسته‌بندی را بنویسید.');
      return;
    }

    // بررسی لوپ تو در تو (جلوگیری از اینکه والد، خودش یا زیرمجموعه خودش باشد)
    if (catId && parentId === catId) {
      alert('خطای منطقی: دسته‌بندی نمی‌تواند والد خودش باشد.');
      return;
    }

    OfflineDatabase.saveCategory({
      id: catId ? catId : undefined,
      name: catName.trim(),
      parentId: parentId || undefined,
      type: catType,
      description: catDescription.trim()
    });

    resetCategoryForm();
    loadCategories();
    alert('دسته‌بندی درختی در SQLite ذخیره و درخت متمم آپدیت شد.');
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('آیا از حذف این شاخه دسته‌بندی اطمینان دارید؟ با حذف، زیردسته‌ها به ریشه انتقال یافته و کالاها فاقد دسته خواهند شد.')) {
      OfflineDatabase.deleteCategory(id);
      resetCategoryForm();
      loadCategories();
    }
  };

  const resetCategoryForm = () => {
    setCatId('');
    setCatName('');
    setParentId('');
    setCatType('product');
    setCatDescription('');
  };

  // تهیه آپشن‌های والد با حذف خود شاخه جاری (جلوگیری از لوپ)
  const availableParents = localCategories.filter(c => !catId || c.id !== catId);

  // تابع بازگشتی رندر درخت با خط چین‌های تودرتوی زیبا
  const renderTreeNodes = (parentIdVal: string | undefined, depth: number) => {
    const nodes = localCategories.filter(c => c.parentId === parentIdVal || (!parentIdVal && !c.parentId));
    
    if (nodes.length === 0) return null;

    return (
      <div className={`space-y-1.5 ${depth > 0 ? 'mr-5 border-r border-dashed border-slate-200 pr-3.5 mt-1' : ''}`}>
        {nodes.map(node => {
          const hasChildren = localCategories.some(child => child.parentId === node.id);
          const isExpanded = expandedNodes.has(node.id);
          const isSelected = catId === node.id;
          
          return (
            <div key={node.id} className="relative">
              {/* خط تودرتو عمودی به صورت بومی با کلاس‌های طراحی */}
              <div className="flex items-center justify-between group py-1 px-3 rounded-xl hover:bg-slate-100/70 border border-transparent transition-all">
                <div className="flex items-center gap-2 min-w-0">
                  {/* دکمه آکاردئونی شاخه‌ها */}
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => toggleNode(node.id)}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                    >
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  ) : (
                    <span className="w-5.5 flex justify-center text-slate-350 select-none text-[8px]">●</span>
                  )}

                  {/* آیکون دسته */}
                  <span className="shrink-0">
                    {node.type === 'service' ? (
                      <Clock className="w-4 h-4 text-purple-500" />
                    ) : hasChildren ? (
                      isExpanded ? <FolderOpen className="w-4 h-4 text-amber-500" /> : <Folder className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Tag className="w-4 h-4 text-sky-500" />
                    )}
                  </span>

                  {/* نام دسته */}
                  <span
                    onClick={() => handleEditCategory(node)}
                    className={`text-xs truncate cursor-pointer hover:underline ${
                      isSelected ? 'text-sky-700 font-extrabold' : 'text-slate-700 font-semibold'
                    }`}
                  >
                    {node.name}
                  </span>

                  {/* نشانگر نوع تعلق */}
                  <span className="text-[8px] bg-slate-100 text-slate-450 px-1 py-0.2 rounded shrink-0">
                    {node.type === 'product' ? 'فقط کالا' : node.type === 'service' ? 'فقط خدمت' : 'عمومی'}
                  </span>
                </div>

                {/* دکمه‌های شناور عملیات سریع */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      resetCategoryForm();
                      setParentId(node.id);
                      setCatType(node.type);
                    }}
                    className="p-1 text-slate-450 hover:text-emerald-600 hover:bg-white rounded border border-transparent hover:border-slate-150 transition cursor-pointer"
                    title="افزودن زیردسته مستقیم"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditCategory(node)}
                    className="p-1 text-slate-450 hover:text-sky-655 hover:bg-white rounded border border-transparent hover:border-slate-150 transition cursor-pointer"
                    title="ویرایش کل فیلدها"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(node.id)}
                    className="p-1 text-slate-450 hover:text-red-500 hover:bg-white rounded border border-transparent hover:border-slate-150 transition cursor-pointer"
                    title="حذف فوری"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* رندر زیر نودهای بازگشتی */}
              {hasChildren && isExpanded && renderTreeNodes(node.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-up" id="category-firewall-modal">
        {/* هدر */}
        <div className="bg-slate-900 text-slate-100 p-5 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <LayersIcon className="w-5.5 h-5.5 text-sky-400" />
            <div>
              <h3 className="font-extrabold text-sm">سیستم طبقه‌بندی هوشمند و درختی</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">مدیریت غرفه‌ها، خانواده کالایی و دسته خدمات بدون محدودیت سلسله‌مراتبی</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* بدنه دو ستونه */}
        <div className="p-6 flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* ستون راست: درخت سلسله‌مراتب دسته‌بندی */}
          <div className="md:col-span-7 bg-slate-50 border rounded-2xl p-4 flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-black text-slate-500">سلسله مراتب دسته‌ها ({localCategories.length}):</span>
              <button
                type="button"
                onClick={() => {
                  const allIds = localCategories.map(c => c.id);
                  setExpandedNodes(expandedNodes.size === allIds.length ? new Set() : new Set(allIds));
                }}
                className="text-[9.5px] text-sky-600 hover:semibold cursor-pointer"
              >
                {expandedNodes.size === localCategories.length ? '◀ بستن همگی شاخه‌ها' : '▼ باز کردن کل شاخه‌ها'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {localCategories.length === 0 ? (
                <div className="text-center py-16 text-xs text-slate-400 italic">هیچ دسته‌بندی یافت نشد. لطفا بسازید.</div>
              ) : (
                renderTreeNodes(undefined, 0)
              )}
            </div>
          </div>

          {/* ستون چپ: فرم تولید یا ویرایش دسته */}
          <form onSubmit={handleSaveCategory} className="md:col-span-5 flex flex-col justify-between h-full bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2.5">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-sky-505" />
                  {catId ? 'به‌روزرسانی جزئیات شاخه' : 'افزودن دسته‌بندی جدید به ساختار درختی'}
                </span>
                {catId && (
                  <button type="button" onClick={resetCategoryForm} className="text-[10px] text-red-500 hover:underline">
                    انصراف
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[10.5px] mb-1 font-bold text-slate-600">عنوان دسته بندی:</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  placeholder="مثال: روغن لادن، شوینده بهداشتی"
                />
              </div>

              <div>
                <label className="block text-[10.5px] mb-1 font-bold text-slate-650">انتخاب شاخه والد (سلسله مراتب):</label>
                <select
                  value={parentId}
                  onChange={e => setParentId(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.8 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer h-9"
                >
                  <option value="">دسته اصلی (ریشه - Root Node)</option>
                  {availableParents.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type === 'product' ? 'کالا' : c.type === 'service' ? 'خدمت' : 'هر دو'})
                    </option>
                  ))}
                </select>
                <span className="text-[8.5px] text-slate-400 mt-1 block">می‌توانید محصول را فرزند شاخه بزرگتر قرار دهید.</span>
              </div>

              <div>
                <label className="block text-[10.5px] mb-1 font-bold text-slate-600">نوع وابستگی اقلام:</label>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {(['product', 'service', 'both'] as const).map(typeKey => (
                    <button
                      key={typeKey}
                      type="button"
                      onClick={() => setCatType(typeKey)}
                      className={`py-1.5 text-[10px] font-bold border rounded-lg transition-all cursor-pointer ${
                        catType === typeKey
                          ? 'bg-sky-50 text-sky-700 border-sky-400 font-extrabold shadow-3xs'
                          : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      {typeKey === 'product' ? '🛍️ کالاها' : typeKey === 'service' ? '🔧 خدمات' : '🌐 عمومی'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] mb-1 font-bold text-slate-600">توضیح دسته:</label>
                <textarea
                  rows={2}
                  value={catDescription}
                  onChange={e => setCatDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  placeholder="این خانواده برای نگهداری دپوی..."
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t mt-4">
              {catId && (
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(catId)}
                  className="flex-1 bg-red-50 text-red-655 hover:bg-red-600 hover:text-white border border-red-200/60 py-2.5 px-4 rounded-xl text-xs font-black transition cursor-pointer"
                >
                  حذف شاخه
                </button>
              )}
              <button
                type="submit"
                className="flex-1 text-white bg-sky-600 hover:bg-sky-700 py-2.5 px-4 rounded-xl text-xs font-black shadow-md shadow-sky-600/10 transition cursor-pointer flex justify-center items-center gap-1"
              >
                <Check className="w-4 h-4" />
                {catId ? 'ذخیره شاخه' : 'تایید و ثبت جدید'}
              </button>
            </div>
          </form>

        </div>

        {/* فوتر */}
        <div className="bg-slate-50 px-6 py-4 border-t flex justify-between items-center text-[10px] text-slate-400">
          <span>شما می‌توانید نام خانواده را کلیک کنید تا وارد ویرایشگر شود.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer"
          >
            تکمیل عملیات و بازگشت
          </button>
        </div>
      </div>
    </div>
  );
}
