export interface Person {
  id: string;
  name: string;
  phone: string;
  type: 'Customer' | 'Supplier'; // مشتری یا تامین‌کننده
  balance: number; // مثبت: بدهکار (debtor)، منفی: بستانکار (creditor)، صفر: تسویه
}

export interface Product {
  id: string;
  barcode: string;
  title: string;
  purchase_price: number;
  sale_price: number;
  stock_quantity: number;
  unit: string; // عدد، بسته، کیلوگرم، متر و غیره
}

export interface Service {
  id: string;
  title: string;
  price: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  person_id: string; // شناسه شخص (یا مشتری عمومی)
  type: 'Sale' | 'Quick Sale' | 'Purchase'; // فروش، فروش سریع، خرید
  total_amount: number; // جمع کل کالاها
  discount: number; // مبلغ تخفیف
  final_amount: number; // مبلغ نهایی (کل منهای تخفیف)
  payment_status: 'Paid' | 'Unpaid' | 'Partial'; // پرداخت شده، پرداخت نشده، نقدی/نسیه
  payment_method: 'Cash' | 'POS' | 'Mixed'; // نقدی، کارتخوان، ترکیبی
  created_at: string; // تاریخ ثبت فاکتور
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_id: string; // شناسه محصول یا خدمت
  item_type: 'Product' | 'Service';
  quantity: number;
  price: number; // قیمت واحد در زمان فاکتور
  total: number; // تعداد ضربدر قیمت واحد
}

export interface StockLog {
  id: string;
  product_id: string;
  product_title: string;
  previous_qty: number;
  new_qty: number;
  change_qty: number; // تغییر (مثلا ۵ + یا ۲-)
  reason: string; // دلیل تغییر (تعدیل دستی، فاکتور، فروش سریع و غیره)
  created_at: string;
}
