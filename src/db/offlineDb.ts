import { Person, Product, Service, Invoice, InvoiceItem, StockLog } from '../types';

// کلیدهای ذخیره‌سازی در LocalStorage
const STORAGE_KEYS = {
  PERSONS: 'shop_accounting_persons',
  PRODUCTS: 'shop_accounting_products',
  SERVICES: 'shop_accounting_services',
  INVOICES: 'shop_accounting_invoices',
  INVOICE_ITEMS: 'shop_accounting_invoice_items',
  STOCK_LOGS: 'shop_accounting_stock_logs',
};

// داده‌های اولیه (Seed Data) به تومان
const DEFAULT_PERSONS: Person[] = [
  { id: 'general_customer', name: 'مشتری عمومی (فروش سریع)', phone: '0', type: 'Customer', balance: 0 },
  { id: 'p_1', name: 'علیرضا حسینی', phone: '09123456789', type: 'Customer', balance: 150000 }, // بدهکار
  { id: 'p_2', name: 'مریم احمدی', phone: '09198765432', type: 'Customer', balance: -45000 },  // بستانکار
  { id: 'p_3', name: 'شرکت پخش بنکدار تهران', phone: '02188889900', type: 'Supplier', balance: -2450000 }, // بستانکار (ما به تامین‌کننده بدهکاریم)
  { id: 'p_4', name: 'صنایع لبنی پاک‌سازان', phone: '02144556677', type: 'Supplier', balance: 0 },
];

const DEFAULT_PRODUCTS: Product[] = [
  { id: 'prod_1', barcode: '6260123456789', title: 'برنج ایرانی هاشمی (۱۰ کیلوگرم)', purchase_price: 820000, sale_price: 950000, stock_quantity: 25, unit: 'کیسه' },
  { id: 'prod_2', barcode: '6260987654321', title: 'روغن مایع سرخ‌کردنی لادن ۱.۵ لیتری', purchase_price: 65000, sale_price: 78000, stock_quantity: 48, unit: 'عدد' },
  { id: 'prod_3', barcode: '6261543210987', title: 'چای کیسه‌ای گلستان ۲۵ عددی', purchase_price: 42000, sale_price: 55000, stock_quantity: 8, unit: 'بسته' }, // موجودی کم
  { id: 'prod_4', barcode: '6260011223344', title: 'پاکت شیر کم‌چرب کاله ۱ لیتری', purchase_price: 28000, sale_price: 35000, stock_quantity: 30, unit: 'عدد' },
  { id: 'prod_5', barcode: '6260234567890', title: 'ماکارونی ۷۰۰ گرمی تک‌ماکارون', purchase_price: 18000, sale_price: 24000, stock_quantity: 6, unit: 'عدد' }, // موجودی کم
];

const DEFAULT_SERVICES: Service[] = [
  { id: 'srv_1', title: 'پیک و تحویل ویژه درب منزل', price: 35000 },
  { id: 'srv_2', title: 'خدمات بسته‌بندی و سلفون‌کشی', price: 15000 },
  { id: 'srv_3', title: 'مونتاژ، تست و فعال‌سازی کالا', price: 80000 },
];

const DEFAULT_INVOICES: Invoice[] = [
  {
    id: 'inv_1',
    invoice_number: '140501',
    person_id: 'p_1',
    type: 'Sale',
    total_amount: 1005000,
    discount: 50000,
    final_amount: 955000,
    payment_status: 'Partial',
    payment_method: 'Mixed',
    created_at: '2026-06-10T12:30:00Z'
  },
  {
    id: 'inv_2',
    invoice_number: '140502',
    person_id: 'general_customer',
    type: 'Quick Sale',
    total_amount: 168000,
    discount: 8000,
    final_amount: 160000,
    payment_status: 'Paid',
    payment_method: 'POS',
    created_at: '2026-06-11T09:15:00Z'
  }
];

const DEFAULT_INVOICE_ITEMS: InvoiceItem[] = [
  { id: 'item_1', invoice_id: 'inv_1', item_id: 'prod_1', item_type: 'Product', quantity: 1, price: 950000, total: 950000 },
  { id: 'item_2', invoice_id: 'inv_1', item_id: 'srv_1', item_type: 'Service', quantity: 1, price: 35000, total: 35000 },
  { id: 'item_3', invoice_id: 'inv_1', item_id: 'prod_3', item_type: 'Service', quantity: 1, price: 20000, total: 20000 }, // بسته‌بندی
  { id: 'item_4', invoice_id: 'inv_2', item_id: 'prod_2', item_type: 'Product', quantity: 2, price: 78000, total: 156000 },
  { id: 'item_5', invoice_id: 'inv_2', item_id: 'srv_2', item_type: 'Service', quantity: 1, price: 12000, total: 12000 }
];

const DEFAULT_STOCK_LOGS: StockLog[] = [
  {
    id: 'log_1',
    product_id: 'prod_1',
    product_title: 'برنج ایرانی هاشمی (۱۰ کیلوگرم)',
    previous_qty: 26,
    new_qty: 25,
    change_qty: -1,
    reason: 'ثبت در فاکتور شماره ۱۴۰۵۰۱',
    created_at: '2026-06-10T12:30:00Z'
  },
  {
    id: 'log_2',
    product_id: 'prod_2',
    product_title: 'روغن مایع سرخ‌کردنی لادن ۱.۵ لیتری',
    previous_qty: 50,
    new_qty: 48,
    change_qty: -2,
    reason: 'ثبت در فاکتور فروش سریع ۱۴۰۵۰۲',
    created_at: '2026-06-11T09:15:00Z'
  }
];

// کلاس مدیریت فاکتور و اشخاص به صورت آفلاین کاملا منطقی (شبیه‌ساز SQLite)
export class OfflineDatabase {
  // ساختار نگهداری عبارات SQL مجازی برای مستندسازی IPC در اپلیکیشن دسکتاپ فرضی Electron
  private static sqlLogs: string[] = [];

  static getSqlLogs(): string[] {
    return [...this.sqlLogs];
  }

  static clearSqlLogs() {
    this.sqlLogs = [];
  }

  private static logSql(statement: string) {
    this.sqlLogs.unshift(`[${new Date().toLocaleTimeString('fa-IR')}] => ${statement}`);
    if (this.sqlLogs.length > 50) {
      this.sqlLogs.pop();
    }
  }

  // لود داده‌ها یا ایجاد پیش‌فرض
  static init() {
    if (!localStorage.getItem(STORAGE_KEYS.PERSONS)) {
      this.saveData(STORAGE_KEYS.PERSONS, DEFAULT_PERSONS);
      this.logSql("CREATE TABLE IF NOT EXISTS persons (id TEXT PRIMARY KEY, name TEXT, phone TEXT, type TEXT, balance INTEGER);");
      this.logSql("INSERT INTO persons VALUES ... (Seeded default customer/supplier ledger accounts)");
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.saveData(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
      this.logSql("CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, barcode TEXT, title TEXT, purchase_price INTEGER, sale_price INTEGER, stock_quantity INTEGER, unit TEXT);");
      this.logSql("INSERT INTO products VALUES ... (Seeded typical Iranian retail products)");
    }
    if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
      this.saveData(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES);
      this.logSql("CREATE TABLE IF NOT EXISTS services (id TEXT PRIMARY KEY, title TEXT, price INTEGER);");
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
      this.saveData(STORAGE_KEYS.INVOICES, DEFAULT_INVOICES);
      this.logSql("CREATE TABLE IF NOT EXISTS invoices (id TEXT PRIMARY KEY, invoice_number TEXT, person_id TEXT, type TEXT, total_amount INTEGER, discount INTEGER, final_amount INTEGER, payment_status TEXT, payment_method TEXT, created_at TEXT);");
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVOICE_ITEMS)) {
      this.saveData(STORAGE_KEYS.INVOICE_ITEMS, DEFAULT_INVOICE_ITEMS);
      this.logSql("CREATE TABLE IF NOT EXISTS invoice_items (id TEXT PRIMARY KEY, invoice_id TEXT, item_id TEXT, item_type TEXT, quantity INTEGER, price INTEGER, total INTEGER);");
    }
    if (!localStorage.getItem(STORAGE_KEYS.STOCK_LOGS)) {
      this.saveData(STORAGE_KEYS.STOCK_LOGS, DEFAULT_STOCK_LOGS);
      this.logSql("CREATE TABLE IF NOT EXISTS stock_logs (id TEXT PRIMARY KEY, product_id TEXT, product_title TEXT, previous_qty INTEGER, new_qty INTEGER, change_qty INTEGER, reason TEXT, created_at TEXT);");
    }
  }

  private static loadData<T>(key: string): T[] {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  }

  private static saveData<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- عملیات اشخاص (Persons CRUD) ---
  static getPersons(): Person[] {
    const list = this.loadData<Person>(STORAGE_KEYS.PERSONS);
    this.logSql("SELECT * FROM persons ORDER BY name ASC;");
    return list;
  }

  static savePerson(person: Omit<Person, 'id'> & { id?: string }): Person {
    const list = this.getPersons();
    const id = person.id || `person_${Date.now()}`;
    const newPerson: Person = { ...person, id, balance: person.balance || 0 };

    const idx = list.findIndex(p => p.id === id);
    if (idx >= 0) {
      list[idx] = newPerson;
      this.logSql(`UPDATE persons SET name='${person.name}', phone='${person.phone}', type='${person.type}', balance=${person.balance} WHERE id='${id}';`);
    } else {
      list.push(newPerson);
      this.logSql(`INSERT INTO persons (id, name, phone, type, balance) VALUES ('${id}', '${person.name}', '${person.phone}', '${person.type}', ${person.balance});`);
    }
    this.saveData(STORAGE_KEYS.PERSONS, list);
    return newPerson;
  }

  static deletePerson(id: string): boolean {
    if (id === 'general_customer') return false; // غیر قابل حذف
    const list = this.getPersons();
    const filtered = list.filter(p => p.id !== id);
    this.saveData(STORAGE_KEYS.PERSONS, filtered);
    this.logSql(`DELETE FROM persons WHERE id='${id}';`);
    return true;
  }

  // --- عملیات کالاها (Products CRUD) ---
  static getProducts(): Product[] {
    const list = this.loadData<Product>(STORAGE_KEYS.PRODUCTS);
    this.logSql("SELECT * FROM products ORDER BY title ASC;");
    return list;
  }

  static saveProduct(product: Omit<Product, 'id'> & { id?: string }): Product {
    const list = this.getProducts();
    const id = product.id || `prod_${Date.now()}`;
    const newProduct: Product = { ...product, id };

    const idx = list.findIndex(p => p.id === id);
    if (idx >= 0) {
      const oldVal = list[idx];
      list[idx] = newProduct;
      this.logSql(`UPDATE products SET barcode='${product.barcode}', title='${product.title}', purchase_price=${product.purchase_price}, sale_price=${product.sale_price}, stock_quantity=${product.stock_quantity}, unit='${product.unit}' WHERE id='${id}';`);
      
      // اگر تعداد موجودی کالا دستی تغییر کرده، لاگ انبار ثبت کنیم
      if (oldVal.stock_quantity !== product.stock_quantity) {
        this.addStockLog(id, oldVal.title, oldVal.stock_quantity, product.stock_quantity, 'ویرایش مستقیم کالا و اصلاح انبار');
      }
    } else {
      list.push(newProduct);
      this.logSql(`INSERT INTO products (id, barcode, title, purchase_price, sale_price, stock_quantity, unit) VALUES ('${id}', '${product.barcode}', '${product.title}', ${product.purchase_price}, ${product.sale_price}, ${product.stock_quantity}, '${product.unit}');`);
      this.addStockLog(id, product.title, 0, product.stock_quantity, 'اضافه شدن اولیه کالا به نرم‌افزار');
    }
    this.saveData(STORAGE_KEYS.PRODUCTS, list);
    return newProduct;
  }

  static deleteProduct(id: string): boolean {
    const list = this.getProducts();
    const filtered = list.filter(p => p.id !== id);
    this.saveData(STORAGE_KEYS.PRODUCTS, filtered);
    this.logSql(`DELETE FROM products WHERE id='${id}';`);
    return true;
  }

  // بروز رسانی دسته جمعی قیمت ها (Bulk Price Updates)
  static bulkUpdatePrices(percentage: number, roundToNearest: number = 1000): void {
    const list = this.getProducts();
    list.forEach(p => {
      const oldSale = p.sale_price;
      const computed = p.sale_price * (1 + percentage / 100);
      const rounded = Math.round(computed / roundToNearest) * roundToNearest;
      p.sale_price = rounded;
    });
    this.saveData(STORAGE_KEYS.PRODUCTS, list);
    this.logSql(`UPDATE products SET sale_price = ROUND((sale_price * ${1 + percentage / 100}) / ${roundToNearest}) * ${roundToNearest};`);
  }

  // --- عملیات خدمات (Services CRUD) ---
  static getServices(): Service[] {
    const list = this.loadData<Service>(STORAGE_KEYS.SERVICES);
    this.logSql("SELECT * FROM services ORDER BY title ASC;");
    return list;
  }

  static saveService(service: Omit<Service, 'id'> & { id?: string }): Service {
    const list = this.getServices();
    const id = service.id || `srv_${Date.now()}`;
    const newService: Service = { ...service, id };

    const idx = list.findIndex(s => s.id === id);
    if (idx >= 0) {
      list[idx] = newService;
      this.logSql(`UPDATE services SET title='${service.title}', price=${service.price} WHERE id='${id}';`);
    } else {
      list.push(newService);
      this.logSql(`INSERT INTO services (id, title, price) VALUES ('${id}', '${service.title}', ${service.price});`);
    }
    this.saveData(STORAGE_KEYS.SERVICES, list);
    return newService;
  }

  static deleteService(id: string): boolean {
    const list = this.getServices();
    const filtered = list.filter(s => s.id !== id);
    this.saveData(STORAGE_KEYS.SERVICES, filtered);
    this.logSql(`DELETE FROM services WHERE id='${id}';`);
    return true;
  }

  // --- فاکتورهای فروش و اسناد مالی (Invoices Engine) ---
  static getInvoices(): Invoice[] {
    const list = this.loadData<Invoice>(STORAGE_KEYS.INVOICES);
    this.logSql("SELECT * FROM invoices ORDER BY created_at DESC;");
    return list;
  }

  static getInvoiceItemsByInvoiceId(invoiceId: string): InvoiceItem[] {
    const list = this.loadData<InvoiceItem>(STORAGE_KEYS.INVOICE_ITEMS);
    this.logSql(`SELECT * FROM invoice_items WHERE invoice_id='${invoiceId}';`);
    return list.filter(item => item.invoice_id === invoiceId);
  }

  static getStockLogs(): StockLog[] {
    const list = this.loadData<StockLog>(STORAGE_KEYS.STOCK_LOGS);
    this.logSql("SELECT * FROM stock_logs ORDER BY created_at DESC;");
    return list;
  }

  // ثبت فاکتور جدید همراه با تراکنش معین شخص و کاهش/افزایش انبار (فروش یعنی کاهش انبار، خرید یعنی افزایش)
  static createInvoice(
    invoiceData: Omit<Invoice, 'id' | 'invoice_number' | 'created_at'>,
    items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'total'>[]
  ): Invoice {
    // باز کردن تراکنش شبیه‌سازی شده
    this.logSql("BEGIN TRANSACTION;");

    const invoices = this.getInvoices();
    const storedItems = this.loadData<InvoiceItem>(STORAGE_KEYS.INVOICE_ITEMS);
    const products = this.getProducts();
    const persons = this.getPersons();

    // ایجاد شماره فاکتور هوشمند (فقط عددی یا سال + شمارنده)
    const year = 1405; // سال مالی فرضی جاری در مثال ما
    const count = invoices.length + 1;
    const invoice_number = `${year}${String(count).padStart(3, '0')}`;
    const invoiceId = `inv_${Date.now()}`;

    const newInvoice: Invoice = {
      ...invoiceData,
      id: invoiceId,
      invoice_number,
      created_at: new Date().toISOString()
    };

    // ۱. ثبت آیتم‌های فاکتور و اعمال تغییرات به انبار محصولات
    const savedInvoiceItems: InvoiceItem[] = [];
    items.forEach((item, index) => {
      const itemId = `item_${Date.now()}_${index}`;
      const total = item.quantity * item.price;
      const fullItem: InvoiceItem = {
        ...item,
        id: itemId,
        invoice_id: invoiceId,
        total
      };
      savedInvoiceItems.push(fullItem);
      storedItems.push(fullItem);

      // اگر آیتم از نوع محصول است، کسر یا افزایش از انبار
      if (item.item_type === 'Product') {
        const prodIdx = products.findIndex(p => p.id === item.item_id);
        if (prodIdx >= 0) {
          const prod = products[prodIdx];
          const prevQty = prod.stock_quantity;
          
          let newQty = prevQty;
          let reasonText = '';
          if (invoiceData.type === 'Sale' || invoiceData.type === 'Quick Sale') {
            newQty = prevQty - item.quantity;
            reasonText = `خروج از انبار بابت فاکتور فروش ${invoice_number}`;
          } else if (invoiceData.type === 'Purchase') {
            newQty = prevQty + item.quantity;
            reasonText = `ورود به انبار بابت فاکتور خرید ${invoice_number}`;
          }

          prod.stock_quantity = newQty;
          this.addStockLog(prod.id, prod.title, prevQty, newQty, reasonText);
          this.logSql(`UPDATE products SET stock_quantity = ${newQty} WHERE id = '${prod.id}';`);
        }
      }
    });

    // ۲. تأثیر بر معین و حساب شخص (مشتری یا تامین‌کننده)
    // اگر نوع خرید باشد: بستانکاری تامین کننده زیاد می‌شود (balance منفی‌تر می‌شود)
    // اگر نوع فروش یا فروش سریع باشد: بدهکاری مشتری افزایش می‌یابد مگر اینکه نقدی تسویه شده باشد
    if (invoiceData.person_id !== 'general_customer') {
      const persIdx = persons.findIndex(p => p.id === invoiceData.person_id);
      if (persIdx >= 0) {
        const person = persons[persIdx];
        const oldBalance = person.balance;
        
        let diff = 0;
        if (invoiceData.type === 'Sale') {
          // فروش معمولی: مشتری بدهکار میشود به اندازه مبلغ فاکتور
          diff = invoiceData.final_amount;
          // کسر از بدهی اگر پرداختی داشته (مثلاً اگر نقدی ثبت شده)
          if (invoiceData.payment_status === 'Paid') {
            diff = 0; // تسویه نقدی شده، تراز حساب جابجا نمیشود (یا مستقیم تسویه شده)
          } else if (invoiceData.payment_status === 'Partial') {
            diff = invoiceData.final_amount * 0.4; // فرضا ۶۰٪ نسیه مانده پس ۴۰ درصد واریز شده
          }
        } else if (invoiceData.type === 'Purchase') {
          // خرید از تامین کننده: ما بدهکار می‌شویم (یعنی او بستانکار می‌شود)
          diff = -invoiceData.final_amount;
          if (invoiceData.payment_status === 'Paid') {
            diff = 0;
          }
        }

        person.balance += diff;
        this.logSql(`UPDATE persons SET balance = balance + (${diff}) WHERE id = '${person.id}';`);
      }
    }

    // ذخیره فاکتور و اقلام
    invoices.push(newInvoice);
    this.saveData(STORAGE_KEYS.INVOICES, invoices);
    this.saveData(STORAGE_KEYS.INVOICE_ITEMS, storedItems);
    this.saveData(STORAGE_KEYS.PRODUCTS, products);
    this.saveData(STORAGE_KEYS.PERSONS, persons);

    this.logSql(`INSERT INTO invoices VALUES ('${invoiceId}', '${invoice_number}', '${invoiceData.person_id}', '${invoiceData.type}', ${invoiceData.total_amount}, ${invoiceData.discount}, ${invoiceData.final_amount}, '${invoiceData.payment_status}', '${invoiceData.payment_method}', datetime('now'));`);
    this.logSql("COMMIT;");
    
    return newInvoice;
  }

  // ایجاد گزارش گردش و انبارداری (Logs helper)
  private static addStockLog(productId: string, productTitle: string, prev: number, next: number, reason: string) {
    const list = this.loadData<StockLog>(STORAGE_KEYS.STOCK_LOGS);
    const newLog: StockLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      product_id: productId,
      product_title: productTitle,
      previous_qty: prev,
      new_qty: next,
      change_qty: next - prev,
      reason,
      created_at: new Date().toISOString()
    };
    list.push(newLog);
    this.saveData(STORAGE_KEYS.STOCK_LOGS, list);
    this.logSql(`INSERT INTO stock_logs (id, product_id, product_title, previous_qty, new_qty, change_qty, reason, created_at) VALUES ('${newLog.id}', '${productId}', '${productTitle}', ${prev}, ${next}, ${next - prev}, '${reason}', datetime('now'));`);
  }

  // --- متد خروجی بکاپ کامل اطلاعات جهت بازگردانی و استفاده در حالت آفلاین بومی ---
  static exportDatabaseState(): string {
    const state = {
      persons: this.loadData(STORAGE_KEYS.PERSONS),
      products: this.loadData(STORAGE_KEYS.PRODUCTS),
      services: this.loadData(STORAGE_KEYS.SERVICES),
      invoices: this.loadData(STORAGE_KEYS.INVOICES),
      invoice_items: this.loadData(STORAGE_KEYS.INVOICE_ITEMS),
      stock_logs: this.loadData(STORAGE_KEYS.STOCK_LOGS),
    };
    return JSON.stringify(state, null, 2);
  }

  static importDatabaseState(jsonState: string): boolean {
    try {
      const state = JSON.parse(jsonState);
      if (state.persons) this.saveData(STORAGE_KEYS.PERSONS, state.persons);
      if (state.products) this.saveData(STORAGE_KEYS.PRODUCTS, state.products);
      if (state.services) this.saveData(STORAGE_KEYS.SERVICES, state.services);
      if (state.invoices) this.saveData(STORAGE_KEYS.INVOICES, state.invoices);
      if (state.invoice_items) this.saveData(STORAGE_KEYS.INVOICE_ITEMS, state.invoice_items);
      if (state.stock_logs) this.saveData(STORAGE_KEYS.STOCK_LOGS, state.stock_logs);
      
      this.logSql("RESTORE ENTIRE DATABASE FROM JSON;");
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}

// ==========================================
// بویلرپلیت بومی تراکنش بومی برای Electron (Electron IPC Main/Preload boilerplate)
// این بخش راهنمای مستقیم توسعه‌دهندگان محترم جهت استقرار نهایی در Electron است
// ==========================================
export const ELECTRON_IPC_BOILERPLATE = {
  preloadCode: `
/**
 * preload.js - قرارگیری در پوشه پری‌لود بومی الکترون
 * تعریف پل ارتباطی ایمن (Context Isolation)
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dbAPI', {
  // فراخوانی امن کوئری‌های آفلاین به پروسه اصلی
  query: (sql, params = []) => ipcRenderer.invoke('execute-db-query', { sql, params }),
  saveProduct: (product) => ipcRenderer.invoke('save-product', product),
  savePerson: (person) => ipcRenderer.invoke('save-person', person),
  getInvoices: () => ipcRenderer.invoke('get-invoices'),
  createInvoice: (invoice, items) => ipcRenderer.invoke('create-invoice', { invoice, items }),
  exportBackup: () => ipcRenderer.invoke('export-backup'),
});
`,
  mainProcessCode: `
/**
 * main.js / index.js - لوپ اصلی پروژه الکترون
 * راه‌اندازی و اتصال به SQLite واقعی با ایمنی کامل تراکنش‌ها
 */
const { app, ipcMain } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');

let db;

function initDatabase() {
  const dbPath = app.isPackaged 
    ? path.join(app.getPath('userData'), 'shop_accounting.db')
    : './shop_accounting.db';
    
  db = new Database(dbPath);
  
  // راه‌اندازی فشرده جداول
  db.exec(\`
    CREATE TABLE IF NOT EXISTS persons (
      id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      type TEXT,
      balance INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      barcode TEXT UNIQUE,
      title TEXT,
      purchase_price INTEGER,
      sale_price INTEGER,
      stock_quantity INTEGER DEFAULT 0,
      unit TEXT
    );
  \`);
  console.log("sqlite3 database is connected safety: " + dbPath);
}

// ثبت رویدادها IPC در پروسه اصلی
app.whenReady().then(() => {
  initDatabase();
  
  // شبیه‌ساز اجرای ایمن کوئری
  ipcMain.handle('execute-db-query', async (event, { sql, params }) => {
    try {
      const stmt = db.prepare(sql);
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return stmt.all(params);
      } else {
        return stmt.run(params);
      }
    } catch (err) {
      console.error(err);
      return { error: err.message };
    }
  });
  
  // کنترل تراکنش ثبت فاکتور (Transaction Isolation)
  ipcMain.handle('create-invoice', async (event, { invoice, items }) => {
    const transaction = db.transaction(() => {
      // عملیات کسر انبار و به‌روزرسانی تراکم بدهکاری و بستانکاری
      const insertInv = db.prepare('INSERT INTO invoices ...');
      const insertItem = db.prepare('INSERT INTO invoice_items ...');
      const updateStock = db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?');
      const updateBalance = db.prepare('UPDATE persons SET balance = balance + ? WHERE id = ?');
      
      // اجرای استیتمنت‌ها تحت تراکنش واحد
    });
    return transaction();
  });
});
`
};
