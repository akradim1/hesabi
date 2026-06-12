export interface AppSettings {
  theme: 'light' | 'slate' | 'amber' | 'emerald';
  productCardBg: string; // very thin light green, yellow, blue etc.
  serviceCardBg: string; // very thin purple, slate etc.
  defaultPaymentMethod: 'Cash' | 'POS' | 'Mixed';
  
  // Print Settings
  paperSize: 'A4' | 'A5' | 'thermal';
  showSignature: boolean;
  showEconomicCode: boolean;
  defaultTaxPct: number;
  
  // Store info
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEconomicCode: string;
  storeNationalId: string;
  storePostalCode: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'slate',
  productCardBg: '#edfcf2', // very thin soft light emerald
  serviceCardBg: '#faf5ff', // very thin soft light purple
  defaultPaymentMethod: 'POS',
  
  paperSize: 'A4',
  showSignature: true,
  showEconomicCode: true,
  defaultTaxPct: 10,
  
  storeName: 'حسابداری فروشگاهی آریا',
  storeAddress: 'تهران، خیابان ولیعصر، تقاطع مطهری، پلاک ۱۲',
  storePhone: '02188889900',
  storeEconomicCode: '411122233344',
  storeNationalId: '10101234567',
  storePostalCode: '1432198765',
};

export class SettingsService {
  private static KEY = 'cofeclick_app_settings_v1';

  static get(): AppSettings {
    const raw = localStorage.getItem(this.KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  static save(settings: AppSettings): void {
    localStorage.setItem(this.KEY, JSON.stringify(settings));
    
    // dispatch a custom event to notify components that styling/settings have been updated
    window.dispatchEvent(new Event('cofeclick_settings_updated'));
  }
}
