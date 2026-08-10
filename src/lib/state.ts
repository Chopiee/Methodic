/**
 * Central State Manager using LocalStorage
 * Maintains unified, interrelated states for:
 * - Products & Inventory
 * - Invoices (Purchases & Sales)
 * - Costs & Expenditures
 * - Partners (Customers & Distributors)
 * - General Ledger & Journal Entries (Accounting)
 */

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  stock: number;
  price: number; // Unit Cost
  sellPrice: number; // Unit Selling Price
  hop: number; // HPP (Cost of Goods Manufactured / Acquisition Cost)
  image: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  brand?: string;
  weight?: string;
  minStock?: number;
}

export interface DocumentActivityLog {
  id: string;
  type: 'created' | 'updated' | 'paid' | 'general';
  title: string;
  user: string;
  timestamp: string;
  details: string;
}

export interface InvoiceItem {
  id: string;
  partnerName: string; // Distributor or Customer
  ref: string;
  date: string; // MM/DD/YYYY
  due: string; // MM/DD/YYYY
  type: 'Invoice' | 'Quotation' | 'Delivery' | 'Return';
  status: string;
  remaining: number;
  total: number;
  isSales: boolean; // true for Sales, false for Purchase
  items?: { productId: string; name: string; qty: number; price: number }[];
  paymentBank?: string;
  driver?: string;
  vehicleNo?: string;
  customDebitAccount?: string;
  customCreditAccount?: string;
  customPaymentDebitAccount?: string;
  customPaymentCreditAccount?: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  paidAt?: string;
  paidBy?: string;
  logs?: DocumentActivityLog[];
}

export const formatLogTimestamp = (date: Date = new Date()): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${mins} WIB`;
};

export function getInvoiceLogs(inv: InvoiceItem): DocumentActivityLog[] {
  if (inv.logs && inv.logs.length > 0) {
    return inv.logs;
  }

  const result: DocumentActivityLog[] = [];
  const createdUser = inv.createdBy || 'Admin';
  const createdTime = inv.createdAt || `${inv.date || '01/08/2026'}, 09:00 WIB`;

  // 1. Dibuat log
  result.push({
    id: `log-created-${inv.id}`,
    type: 'created',
    title: 'Surat Dibuat',
    user: createdUser,
    timestamp: createdTime,
    details: `Surat ini dibuat oleh ${createdUser} pada ${createdTime}`
  });

  // 2. Diupdate log (if updated or if updatedAt exists)
  if (inv.updatedAt || inv.updatedBy) {
    const updatedUser = inv.updatedBy || 'Admin';
    const updatedTime = inv.updatedAt || `${inv.date || '01/08/2026'}, 11:30 WIB`;
    result.push({
      id: `log-updated-${inv.id}`,
      type: 'updated',
      title: 'Surat Diupdate',
      user: updatedUser,
      timestamp: updatedTime,
      details: `Diupdate oleh ${updatedUser} pada ${updatedTime}`
    });
  }

  // 3. Dibayar log (if status is Paid or Partially Paid or paidAt exists)
  if (inv.paidAt || inv.status === 'Paid' || inv.status === 'Partially Paid') {
    const paidUser = inv.paidBy || 'Admin (Finance)';
    const paidTime = inv.paidAt || `${inv.date || '01/08/2026'}, 14:00 WIB`;
    const payMethod = inv.paymentBank || 'Transfer Bank';
    result.push({
      id: `log-paid-${inv.id}`,
      type: 'paid',
      title: 'Surat Dibayar',
      user: paidUser,
      timestamp: paidTime,
      details: `Dibayar oleh ${paidUser} pada ${paidTime} via ${payMethod}`
    });
  }

  return result;
}

export interface CostLineItem {
  id?: string | number;
  account: string;
  description?: string;
  amount: number;
  tax?: string;
}

export interface CostItem {
  id: string;
  category: 'Procurement' | 'Marketing' | 'Operational';
  desc: string;
  date: string; // DD/MM/YYYY or YYYY-MM-DD
  amount: number;
  method: string;
  status: string;
  penerima?: string;
  dibayarDari?: string;
  bayarNanti?: boolean;
  memo?: string;
  pesan?: string;
  lineItems?: CostLineItem[];
  customDebitAccount?: string;
  customCreditAccount?: string;
}

export interface PartnerItem {
  id: string;
  name: string;
  category: 'Customer' | 'Distributor';
  pic: string;
  email: string;
  phone: string;
  address: string;
  balance: number;
  status: 'Active' | 'Inactive';
  npwp?: string;
}

export interface AccountItem {
  code: string;
  name: string;
  category: string;
  subCategory?: string;
  normalBal?: 'Debit' | 'Kredit';
  level?: number;
  parent?: string;
  balance: number;
  isHeader?: boolean;
}

export const subCategoryOptionsMap: Record<string, Array<{ value: string; label: string }>> = {
  'Aset': [
    { value: 'Cash', label: 'Cash (Kas Tunai / Toko / Kecil)' },
    { value: 'Bank', label: 'Bank (Rekening Bank BCA, Mandiri, BSI, dll)' },
    { value: 'Receivable', label: 'Receivable (Piutang Usaha)' },
    { value: 'Inventory', label: 'Inventory (Persediaan Barang)' },
    { value: 'Prepaid', label: 'Prepaid (Biaya Dibayar Dimuka)' },
    { value: 'Current Asset', label: 'Current Asset (Aset Lancar Lainnya)' },
    { value: 'Fixed Asset', label: 'Fixed Asset (Aset Tetap)' },
    { value: 'Contra Asset', label: 'Contra Asset (Akumulasi Penyusutan)' },
  ],
  'Liabilitas': [
    { value: 'Current Liability', label: 'Current Liability (Utang Usaha / Utang Lancar)' },
    { value: 'Long Term Liability', label: 'Long Term Liability (Utang Jangka Panjang)' },
    { value: 'Tax', label: 'Tax (Utang Pajak)' },
    { value: 'Payroll', label: 'Payroll (Utang Gaji)' },
    { value: 'Deferred Revenue', label: 'Deferred Revenue (Pendapatan Diterima Dimuka)' },
  ],
  'Ekuitas': [
    { value: 'Capital', label: 'Capital (Modal Pemilik)' },
    { value: 'Drawing', label: 'Drawing (Prive)' },
    { value: 'Retained Earnings', label: 'Retained Earnings (Laba Ditahan)' },
  ],
  'Pendapatan': [
    { value: 'Sales', label: 'Sales (Penjualan Utama)' },
    { value: 'Other Income', label: 'Other Income (Pendapatan Lain-lain)' },
  ],
  'HPP': [
    { value: 'COGS', label: 'COGS (Harga Pokok Penjualan)' },
  ],
  'Beban': [
    { value: 'Operating Expense', label: 'Operating Expense (Beban Operasional)' },
    { value: 'Other Expense', label: 'Other Expense (Beban Lain-lain)' },
  ]
};

export const getSubCategoriesForCategory = (category: string) => {
  return subCategoryOptionsMap[category] || [
    { value: 'General', label: 'General (Umum)' }
  ];
};

export interface CompanySettings {
  companyName: string;
  companyAddress: string;
  companyLogo: string;
  companyEmail: string;
  companyPhone: string;
  taxId: string;
}

export const defaultCompanySettings: CompanySettings = {
  companyName: 'Methodic Serene Indonesia',
  companyAddress: 'Jl. Sudirman No. 88, Jakarta Selatan, DKI Jakarta 12190',
  companyLogo: '',
  companyEmail: 'contact@methodicserene.co.id',
  companyPhone: '+62 812 3456 7890',
  taxId: '01.234.567.8-012.000',
};

export const getCompanySettings = (): CompanySettings => {
  const stored = getStorageItem<CompanySettings | null>('methodic_company_settings_v1', null);
  return stored ? { ...defaultCompanySettings, ...stored } : defaultCompanySettings;
};

export const saveCompanySettings = (settings: CompanySettings): void => {
  setStorageItem<CompanySettings>('methodic_company_settings_v1', settings);
};

export interface IdPrefixSettings {
  salesInvoicePrefix: string;
  purchaseInvoicePrefix: string;
  salesQuotationPrefix: string;
  purchaseQuotationPrefix: string;
  deliveryOrderPrefix: string;
  returnSalesPrefix: string;
  returnPurchasePrefix: string;
  costPrefix: string;
  inventoryDocPrefix: string;
  productPrefix: string;
  customerPrefix: string;
  distributorPrefix: string;
}

export const defaultIdPrefixSettings: IdPrefixSettings = {
  salesInvoicePrefix: 'SLS-',
  purchaseInvoicePrefix: 'PUR-',
  salesQuotationPrefix: 'QSL-',
  purchaseQuotationPrefix: 'QPR-',
  deliveryOrderPrefix: 'SJL-',
  returnSalesPrefix: 'RTS-',
  returnPurchasePrefix: 'RTP-',
  costPrefix: 'CST-',
  inventoryDocPrefix: 'INV-',
  productPrefix: 'PRD-',
  customerPrefix: 'CSTMR-',
  distributorPrefix: 'DIST-',
};

export const getIdPrefixSettings = (): IdPrefixSettings => {
  const stored = getStorageItem<IdPrefixSettings | null>('methodic_id_prefix_settings_v2', null);
  return stored ? { ...defaultIdPrefixSettings, ...stored } : defaultIdPrefixSettings;
};

export const saveIdPrefixSettings = (settings: IdPrefixSettings): void => {
  const oldSettings = getIdPrefixSettings();
  
  const updatePrefix = (oldId: string, oldPref: string, newPref: string) => {
    if (oldId && oldPref && newPref && oldPref !== newPref && oldId.startsWith(oldPref)) {
      return newPref + oldId.slice(oldPref.length);
    }
    return oldId;
  };

  // 1. Update Products
  const products = getStoredProducts();
  let productsChanged = false;
  products.forEach(p => {
    const newId = updatePrefix(p.id, oldSettings.productPrefix || 'PRD-', settings.productPrefix || 'PRD-');
    if (newId !== p.id) {
      p.id = newId;
      productsChanged = true;
    }
  });
  if (productsChanged) saveProducts(products);

  // 2. Update Partners (Customers and Distributors)
  const partners = getStoredPartners();
  let partnersChanged = false;
  partners.forEach(p => {
    let newId = p.id;
    if (p.category === 'Customer') {
      newId = updatePrefix(newId, oldSettings.customerPrefix || 'CSTMR-', settings.customerPrefix || 'CSTMR-');
    } else {
      newId = updatePrefix(newId, oldSettings.distributorPrefix || 'DIST-', settings.distributorPrefix || 'DIST-');
    }
    if (newId !== p.id) {
      p.id = newId;
      partnersChanged = true;
    }
  });
  if (partnersChanged) savePartners(partners);

  // 3. Update Costs
  const costs = getStoredCosts();
  let costsChanged = false;
  costs.forEach(c => {
    const newId = updatePrefix(c.id, oldSettings.costPrefix || 'CST-', settings.costPrefix || 'CST-');
    if (newId !== c.id) {
      c.id = newId;
      costsChanged = true;
    }
  });
  if (costsChanged) saveCosts(costs);

  // 4. Update Invoices (and Quotations, Deliveries, Returns)
  const invoices = getStoredInvoices();
  let invoicesChanged = false;
  invoices.forEach(inv => {
    let oldPref = '';
    let newPref = '';
    
    if (inv.type === 'Invoice') {
      oldPref = inv.isSales ? (oldSettings.salesInvoicePrefix || 'SLS-') : (oldSettings.purchaseInvoicePrefix || 'PUR-');
      newPref = inv.isSales ? (settings.salesInvoicePrefix || 'SLS-') : (settings.purchaseInvoicePrefix || 'PUR-');
    } else if (inv.type === 'Quotation') {
      oldPref = inv.isSales ? (oldSettings.salesQuotationPrefix || 'QSL-') : (oldSettings.purchaseQuotationPrefix || 'QPR-');
      newPref = inv.isSales ? (settings.salesQuotationPrefix || 'QSL-') : (settings.purchaseQuotationPrefix || 'QPR-');
    } else if (inv.type === 'Delivery') {
      oldPref = inv.isSales ? (oldSettings.deliveryOrderPrefix || 'SJL-') : 'SJR-';
      newPref = inv.isSales ? (settings.deliveryOrderPrefix || 'SJL-') : 'SJR-';
    } else if (inv.type === 'Return') {
      oldPref = inv.isSales ? (oldSettings.returnSalesPrefix || 'RTS-') : (oldSettings.returnPurchasePrefix || 'RTP-');
      newPref = inv.isSales ? (settings.returnSalesPrefix || 'RTS-') : (settings.returnPurchasePrefix || 'RTP-');
    }
    
    if (oldPref && newPref) {
      const newId = updatePrefix(inv.id, oldPref, newPref);
      if (newId !== inv.id) {
        inv.id = newId;
        invoicesChanged = true;
      }
    }
    
    // Also update product IDs inside invoice items
    if (inv.items && Array.isArray(inv.items)) {
      inv.items.forEach(item => {
        if (item.productId) {
          const newProductId = updatePrefix(item.productId, oldSettings.productPrefix || 'PRD-', settings.productPrefix || 'PRD-');
          if (newProductId !== item.productId) {
            item.productId = newProductId;
            invoicesChanged = true;
          }
        }
      });
    }
  });
  if (invoicesChanged) saveInvoices(invoices);

  // 5. Update Ledger (Journal Entries)
  // JournalEntry currently does not store document IDs, only descriptions.
  // We can skip updating the ledger references.

  setStorageItem<IdPrefixSettings>('methodic_id_prefix_settings_v2', settings);
};

export const parseAnyDate = (val?: string | Date | null): Date | null => {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  const s = String(val).trim();
  if (!s) return null;

  // 1. Check YYYY-MM-DD or DD-MM-YYYY format with dashes
  if (s.includes('-')) {
    const parts = s.split('-').map(p => p.trim()).filter(Boolean);
    if (parts.length === 3) {
      const p0 = Number(parts[0]);
      const p1 = Number(parts[1]);
      const p2 = Number(parts[2]);
      if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
        if (p0 > 1000) return new Date(p0, p1 - 1, p2);
        if (p2 > 1000) return new Date(p2, p1 - 1, p0);
      }
    }
  }

  // 2. Check MM/DD/YYYY or DD/MM/YYYY format with slashes
  if (s.includes('/')) {
    const parts = s.split('/').map(p => p.trim()).filter(Boolean);
    if (parts.length === 3) {
      const p0 = Number(parts[0]);
      const p1 = Number(parts[1]);
      const p2 = Number(parts[2]);
      if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
        if (p2 > 1000) {
          if (p0 > 12) return new Date(p2, p1 - 1, p0); // DD/MM/YYYY
          if (p1 > 12) return new Date(p2, p0 - 1, p1); // MM/DD/YYYY
          return new Date(p2, p0 - 1, p1); // MM/DD/YYYY default for InvoiceItem
        }
        if (p0 > 1000) {
          return new Date(p0, p1 - 1, p2);
        }
      }
    }
  }

  // 3. Try standard JS Date parsing
  const stdDate = new Date(s);
  if (!isNaN(stdDate.getTime())) {
    return stdDate;
  }

  // 4. Parse Indonesian and English text date strings (e.g. "9 Agustus 2026", "14 Juli 2026", "08 Agu 2026")
  const monthMap: Record<string, number> = {
    januari: 0, jan: 0,
    februari: 1, feb: 1,
    maret: 2, mar: 2,
    april: 3, apr: 3,
    mei: 4, may: 4,
    juni: 5, jun: 5,
    juli: 6, jul: 6,
    agustus: 7, agu: 7, ags: 7, aug: 7, august: 7,
    september: 8, sep: 8,
    oktober: 9, okt: 9, oct: 9, october: 9,
    november: 10, nov: 10,
    desember: 11, des: 11, dec: 11, december: 11
  };

  const cleanStr = s.replace(/,/g, ' ').replace(/\s+/g, ' ').toLowerCase();
  const tokens = cleanStr.split(' ');

  let foundDay: number | null = null;
  let foundMonth: number | null = null;
  let foundYear: number | null = null;

  for (const token of tokens) {
    const num = Number(token);
    if (!isNaN(num)) {
      if (num > 1000) {
        foundYear = num;
      } else if (num >= 1 && num <= 31 && foundDay === null) {
        foundDay = num;
      }
    } else if (monthMap[token] !== undefined) {
      foundMonth = monthMap[token];
    }
  }

  if (foundYear !== null && foundMonth !== null && foundDay !== null) {
    return new Date(foundYear, foundMonth, foundDay);
  }

  return null;
};

export const getNextId = (items: { id: string }[], prefix: string): string => {
  let max = 0;
  if (Array.isArray(items)) {
    items.forEach(item => {
      if (item && item.id) {
        const cleanId = String(item.id).replace(/\s+/g, '');
        const cleanPrefix = prefix.replace(/\s+/g, '');
        if (cleanId.startsWith(cleanPrefix)) {
          const numPart = parseInt(cleanId.replace(cleanPrefix, ''), 10);
          if (!isNaN(numPart) && numPart > max) {
            max = numPart;
          }
        }
      }
    });
  }
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
};

export const getStoredAccounts = (startDate?: Date, endDate?: Date): AccountItem[] => {
  return getAccountsWithDynamicBalances(startDate, endDate);
};

export const saveAccounts = (accounts: AccountItem[]): void => {
  setStorageItem<AccountItem[]>('methodic_custom_accounts_v1', accounts);
  window.dispatchEvent(new Event('accounts-updated'));
};

export const addAccountAndPropagate = (account: AccountItem) => {
  const customAccounts = getStorageItem<AccountItem[]>('methodic_custom_accounts_v1', []);
  const initialBal = Number(account.balance) || 0;
  const existingIdx = customAccounts.findIndex(a => a.code === account.code);

  const accountToSave = { ...account, balance: 0 };

  if (existingIdx > -1) {
    customAccounts[existingIdx] = accountToSave;
  } else {
    customAccounts.push(accountToSave);
  }
  setStorageItem<AccountItem[]>('methodic_custom_accounts_v1', customAccounts);

  if (initialBal > 0) {
    const ledger = getStoredLedger();
    const isDebitNormal = account.normalBal === 'Debit' || ['Aset', 'HPP', 'Beban'].includes(account.category) || ['1', '5', '6'].some(p => account.code.startsWith(p));

    const debitAcc = isDebitNormal ? `${account.code} - ${account.name}` : '3100 - Modal Pemilik';
    const creditAcc = isDebitNormal ? '3100 - Modal Pemilik' : `${account.code} - ${account.name}`;

    const jvId = `JV-2026-INIT-${account.code}`;
    const filteredLedger = ledger.filter(l => l.id !== jvId);

    const mapCategory = (cat?: string): 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense' => {
      if (!cat) return 'Asset';
      if (cat === 'Liabilitas') return 'Liability';
      if (cat === 'Ekuitas') return 'Equity';
      if (cat === 'Pendapatan') return 'Revenue';
      if (cat === 'Beban' || cat === 'HPP') return 'Expense';
      return 'Asset';
    };

    filteredLedger.unshift({
      id: jvId,
      date: '2026-01-01',
      account: debitAcc,
      category: mapCategory(account.category),
      description: `Saldo Awal Akun ${account.code} - ${account.name}`,
      debit: initialBal,
      credit: '-',
      status: 'Posted'
    });
    filteredLedger.unshift({
      id: jvId,
      date: '2026-01-01',
      account: creditAcc,
      category: 'Equity',
      description: `Saldo Awal Akun ${account.code} - ${account.name}`,
      debit: '-',
      credit: initialBal,
      status: 'Posted'
    });
    saveLedger(filteredLedger);
  }

  window.dispatchEvent(new Event('accounts-updated'));
};

export const updateAccountAndPropagate = (
  oldCode: string,
  oldName: string,
  updatedAccount: AccountItem
) => {
  // 1. Update stored custom accounts
  const customAccounts = getStorageItem<AccountItem[]>('methodic_custom_accounts_v1', []);
  const existingIdx = customAccounts.findIndex(a => a.code === oldCode || a.code === updatedAccount.code);
  
  if (existingIdx > -1) {
    customAccounts[existingIdx] = updatedAccount;
  } else {
    customAccounts.push(updatedAccount);
  }
  setStorageItem<AccountItem[]>('methodic_custom_accounts_v1', customAccounts);

  // 2. Propagate name/code change to Costs
  const newName = updatedAccount.name;
  const newCode = updatedAccount.code;

  const costs = getStoredCosts();
  let costsChanged = false;

  costs.forEach(cost => {
    // Update dibayarDari
    if (cost.dibayarDari) {
      if (cost.dibayarDari.includes(oldName) || (oldCode && cost.dibayarDari.includes(oldCode))) {
        if (oldName && newName && cost.dibayarDari.includes(oldName)) {
          cost.dibayarDari = cost.dibayarDari.replace(oldName, newName);
        }
        if (oldCode && newCode && oldCode !== newCode && cost.dibayarDari.includes(oldCode)) {
          cost.dibayarDari = cost.dibayarDari.replace(oldCode, newCode);
        }
        costsChanged = true;
      }
    }
    // Update category or method if matching oldName
    if (cost.category && oldName && (cost.category as string).toLowerCase().includes(oldName.toLowerCase())) {
      cost.category = newName as any;
      costsChanged = true;
    }
    // Update line items
    if (cost.lineItems && cost.lineItems.length > 0) {
      cost.lineItems.forEach(item => {
        if (item.account) {
          if (oldName && item.account.includes(oldName)) {
            item.account = item.account.replace(oldName, newName);
            costsChanged = true;
          }
          if (oldCode && newCode && oldCode !== newCode && item.account.includes(oldCode)) {
            item.account = item.account.replace(oldCode, newCode);
            costsChanged = true;
          }
        }
      });
    }
  });

  if (costsChanged) {
    saveCosts(costs);
  }

  // 3. Propagate to Ledger
  const ledger = getStoredLedger();
  let ledgerChanged = false;
  ledger.forEach(entry => {
    if (entry.account) {
      if (oldName && entry.account.includes(oldName)) {
        entry.account = entry.account.replace(oldName, newName);
        ledgerChanged = true;
      }
      if (oldCode && newCode && oldCode !== newCode && entry.account.includes(oldCode)) {
        entry.account = entry.account.replace(oldCode, newCode);
        ledgerChanged = true;
      }
    }
  });
  if (ledgerChanged) {
    saveLedger(ledger);
  }

  // 4. Propagate to Invoices
  const invoices = getStoredInvoices();
  let invoicesChanged = false;
  invoices.forEach(inv => {
    if (inv.paymentBank && oldName && inv.paymentBank.includes(oldName)) {
      inv.paymentBank = inv.paymentBank.replace(oldName, newName);
      invoicesChanged = true;
    }
  });
  if (invoicesChanged) {
    saveInvoices(invoices);
  }

  // 5. Notify all listeners
  window.dispatchEvent(new Event('accounts-updated'));
  window.dispatchEvent(new Event('costs-updated'));
  window.dispatchEvent(new Event('invoices-updated'));
  window.dispatchEvent(new Event('ledger-updated'));
};

export interface JournalEntry {
  id: string;
  date: string;
  account: string;
  category: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  description: string;
  debit: number | '-';
  credit: number | '-';
  status: 'Posted' | 'Pending' | 'Draft';
}

// ================================= DEFAULT DATA =================================

const defaultProducts: ProductItem[] = [];

const defaultPartners: PartnerItem[] = [];

const defaultInvoices: InvoiceItem[] = [];

const defaultCosts: CostItem[] = [];

const defaultAccounts: AccountItem[] = [
  { code: '1-10001', name: 'Kas di Toko', category: 'Kas & Bank', balance: 0 },
  { code: '1-10002', name: 'Bank BCA', category: 'Kas & Bank', balance: 0 },
  { code: '1-10003', name: 'Bank BRI', category: 'Kas & Bank', balance: 0 },
  { code: '1-10100', name: 'Piutang Usaha', category: 'Akun Piutang', balance: 0 },
  { code: '1-10200', name: 'Persediaan Barang Dagang', category: 'Persediaan', balance: 0 },
  { code: '1-20001', name: 'Peralatan', category: 'Aktiva Tetap', balance: 0 },
  { code: '1-20002', name: 'Akumulasi Penyusutan Peralatan', category: 'Aktiva Tetap', balance: 0 },
  { code: '2-20001', name: 'Utang Usaha', category: 'Akun Hutang', balance: 0 },
  { code: '3-30001', name: 'Modal Pemilik', category: 'Ekuitas', balance: 0 },
  { code: '3-30002', name: 'Laba Ditahan', category: 'Ekuitas', balance: 0 },
  { code: '4-40001', name: 'Penjualan Produk', category: 'Pendapatan', balance: 0 },
  { code: '5-50001', name: 'Harga Pokok Penjualan', category: 'Beban Pokok Penjualan', balance: 0 },
  { code: '6-60001', name: 'Beban Gaji', category: 'Beban Operational', balance: 0 },
  { code: '6-60002', name: 'Beban Sewa', category: 'Beban Operational', balance: 0 },
  { code: '6-60003', name: 'Beban Listrik & Air', category: 'Beban Operational', balance: 0 },
  { code: '6-60004', name: 'Beban Iklan & Promosi', category: 'Beban Operational', balance: 0 },
  { code: '6-60005', name: 'Beban ATK', category: 'Beban Operational', balance: 0 },
];

const defaultLedger: JournalEntry[] = [];

// ================================= HELPERS =================================

const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (e) {
    return defaultValue;
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing to localStorage', e);
  }
};

// ================================= PUBLIC API =================================

export const getStoredProducts = (): ProductItem[] => {
  return getStorageItem<ProductItem[]>('methodic_products_v4', defaultProducts);
};

export const saveProducts = (products: ProductItem[]): void => {
  setStorageItem<ProductItem[]>('methodic_products_v4', products);
};

export const getStoredInvoices = (): InvoiceItem[] => {
  return getStorageItem<InvoiceItem[]>('methodic_invoices_v4', defaultInvoices);
};

export const saveInvoices = (invoices: InvoiceItem[]): void => {
  setStorageItem<InvoiceItem[]>('methodic_invoices_v4', invoices);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('invoices-updated'));
  }
};

export const parseInvoiceDueDate = (dueStr: string): Date | null => {
  if (!dueStr) return null;
  const str = String(dueStr).trim();
  if (str.includes('-')) {
    const parts = str.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      if (parts[0] > 1000) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
      if (parts[2] > 1000) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
    }
  }
  if (str.includes('/')) {
    const parts = str.split('/').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      if (parts[2] > 1000) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
      if (parts[0] > 1000) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

export const isInvoiceOverdueAndUnpaid = (inv: InvoiceItem): boolean => {
  if (inv.type && inv.type !== 'Invoice') return false;

  const remNum = typeof inv.remaining === 'number'
    ? inv.remaining
    : parseFloat(String(inv.remaining || '0').replace(/[^0-9.-]+/g, '')) || 0;

  if (remNum <= 0 || inv.status === 'Paid') return false;

  if (inv.status === 'Overdue') return true;

  if (!inv.due) return false;
  const dueDate = parseInvoiceDueDate(inv.due);
  if (!dueDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
};

export const getStoredCosts = (): CostItem[] => {
  return getStorageItem<CostItem[]>('methodic_costs_v4', defaultCosts);
};

export const saveCosts = (costs: CostItem[]): void => {
  setStorageItem<CostItem[]>('methodic_costs_v4', costs);
};

export const getStoredPartners = (): PartnerItem[] => {
  return getStorageItem<PartnerItem[]>('methodic_partners_v4', defaultPartners);
};

export const savePartners = (partners: PartnerItem[]): void => {
  setStorageItem<PartnerItem[]>('methodic_partners_v4', partners);
};

export const getStoredLedger = (): JournalEntry[] => {
  return getStorageItem<JournalEntry[]>('methodic_ledger_v4', defaultLedger);
};

export const saveLedger = (ledger: JournalEntry[]): void => {
  setStorageItem<JournalEntry[]>('methodic_ledger_v4', ledger);
};

export const addManualTransaction = (tx: {
  date: string;
  debitAccountCode: string;
  debitAccountName: string;
  creditAccountCode: string;
  creditAccountName: string;
  amount: number;
  description: string;
  ref?: string;
}) => {
  const ledger = getStoredLedger();
  const refId = tx.ref || `JV-2026-${String(Math.floor(ledger.length / 2) + 1).padStart(3, '0')}`;
  
  const getCat = (code: string): 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense' => {
    if (code.startsWith('1')) return 'Asset';
    if (code.startsWith('2')) return 'Liability';
    if (code.startsWith('3')) return 'Equity';
    if (code.startsWith('4')) return 'Revenue';
    return 'Expense';
  };

  // Create Debit Entry
  const debitEntry: JournalEntry = {
    id: refId,
    date: tx.date,
    account: `${tx.debitAccountCode} - ${tx.debitAccountName}`,
    category: getCat(tx.debitAccountCode),
    description: tx.description,
    debit: tx.amount,
    credit: '-',
    status: 'Posted'
  };

  // Create Credit Entry
  const creditEntry: JournalEntry = {
    id: refId,
    date: tx.date,
    account: `${tx.creditAccountCode} - ${tx.creditAccountName}`,
    category: getCat(tx.creditAccountCode),
    description: tx.description,
    debit: '-',
    credit: tx.amount,
    status: 'Posted'
  };

  ledger.unshift(debitEntry, creditEntry);
  saveLedger(ledger);

  // If debit is an expense account (code starts with 6), also register to Costs for operational expense tracking
  if (tx.debitAccountCode.startsWith('6')) {
    const costs = getStoredCosts();
    const cPrefix = getIdPrefixSettings().costPrefix || 'CST-';
    const newCost: CostItem = {
      id: getNextId(costs, cPrefix),
      category: 'Operational',
      desc: tx.description,
      date: tx.date,
      amount: tx.amount,
      method: tx.creditAccountName,
      status: 'Paid',
      dibayarDari: `${tx.creditAccountCode} - ${tx.creditAccountName}`,
      memo: tx.description,
      lineItems: [{
        account: `${tx.debitAccountCode} - ${tx.debitAccountName}`,
        amount: tx.amount,
        description: tx.description
      }]
    };
    costs.unshift(newCost);
    saveCosts(costs);
    window.dispatchEvent(new Event('costs-updated'));
  }

  window.dispatchEvent(new Event('ledger-updated'));
  window.dispatchEvent(new Event('accounts-updated'));
};

/**
 * Adds a new invoice and automatically integrates its effects:
 * - Increases stock for Purchases (if type is Invoice)
 * - Decreases stock for Sales (if type is Invoice)
 * - Updates Partner balances
 * - Creates an Accounting Journal Ledger entry automatically!
 */
export const registerNewInvoice = (invoice: Omit<InvoiceItem, 'status'> & { status?: string }) => {
  const invoices = getStoredInvoices();
  const products = getStoredProducts();
  const partners = getStoredPartners();
  const ledger = getStoredLedger();

  const finalStatus = invoice.status || (invoice.remaining === 0 ? 'Paid' : invoice.remaining < invoice.total ? 'Partially Paid' : 'Unpaid');
  const fullInvoice: InvoiceItem = {
    ...invoice,
    status: finalStatus,
  };

  // Add to Invoices
  invoices.unshift(fullInvoice);
  saveInvoices(invoices);

  // If this is a real transaction invoice, let's link its effects!
  if (invoice.type === 'Invoice') {
    // 1. Stock / Inventory Adjustment
    if (invoice.items && invoice.items.length > 0) {
      invoice.items.forEach(item => {
        const prodIndex = products.findIndex(p => p.id === item.productId || p.sku === item.productId);
        if (prodIndex > -1) {
          if (invoice.isSales) {
            products[prodIndex].stock = Math.max(0, products[prodIndex].stock - item.qty);
          } else {
            products[prodIndex].stock += item.qty;
          }
          // Update status based on stock
          if (products[prodIndex].stock === 0) {
            products[prodIndex].status = 'Out of Stock';
          } else if (products[prodIndex].stock <= (products[prodIndex].minStock ?? 50)) {
            products[prodIndex].status = 'Low Stock';
          } else {
            products[prodIndex].status = 'In Stock';
          }
        }
      });
      saveProducts(products);
    }

    // 2. Partner Balance adjustment
    const safePartnerName = invoice.partnerName || (invoice as any).distributor || 'General Partner';
    const partnerIdx = partners.findIndex(p => p.name.toLowerCase() === safePartnerName.toLowerCase());
    if (partnerIdx > -1) {
      // Balance is what they owe or we owe
      partners[partnerIdx].balance += invoice.remaining;
      savePartners(partners);
    } else {
      // Create new partner
      const isCust = invoice.isSales;
      const pPrefix = isCust ? (getIdPrefixSettings().customerPrefix || 'CSTMR-') : (getIdPrefixSettings().distributorPrefix || 'DIST-');
      
      // Calculate max id for this specific prefix
      const partnersWithSamePrefix = partners.filter(p => p.id && String(p.id).startsWith(pPrefix));
      let maxNum = 0;
      partnersWithSamePrefix.forEach(p => {
        const numPart = parseInt(String(p.id).replace(pPrefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      });
      const nextId = `${pPrefix}${String(maxNum + 1).padStart(3, '0')}`;

      const newPartner: PartnerItem = {
        id: nextId,
        name: safePartnerName,
        category: isCust ? 'Customer' : 'Distributor',
        pic: 'Contact PIC',
        email: 'info@' + safePartnerName.toLowerCase().replace(/[^a-z]/g, '') + '.com',
        phone: '+62 812-0000-0000',
        address: 'Indonesia',
        balance: invoice.remaining,
        status: 'Active'
      };
      partners.push(newPartner);
      savePartners(partners);
    }

    // 3. Accounting Ledger Entry
    const dateFormatted = new Date(invoice.date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const desc = invoice.isSales 
      ? `Sales Invoice ${invoice.id} for ${safePartnerName} (${invoice.ref || '-'})`
      : `Purchase Invoice ${invoice.id} from ${safePartnerName} (${invoice.ref || '-'})`;

    const bankCode = invoice.paymentBank || 'BCA';
    const bankName = bankCode === 'Cash' || bankCode === 'Kas' ? 'Kas di Toko' : (bankCode.startsWith('Bank') ? bankCode : 'Bank ' + bankCode);

    if (invoice.isSales) {
      const debitAcc = (invoice as any).customDebitAccount ? (invoice as any).customDebitAccount.replace(/^\d+\s*-\s*/, '') : 'Piutang Usaha';
      const creditAcc = (invoice as any).customCreditAccount ? (invoice as any).customCreditAccount.replace(/^\d+\s*-\s*/, '') : 'Penjualan Produk';
      const jvInvId = `JV-2026-INV-${invoice.id}`;
      const jvPayId = `JV-2026-PAY-${invoice.id}`;

      // 1. Invoice recognition
      ledger.unshift({
        id: jvInvId,
        date: dateFormatted,
        account: debitAcc,
        category: 'Asset',
        description: desc,
        debit: invoice.total,
        credit: '-',
        status: 'Posted'
      }, {
        id: jvInvId,
        date: dateFormatted,
        account: creditAcc,
        category: 'Revenue',
        description: desc,
        debit: '-',
        credit: invoice.total,
        status: 'Posted'
      });

      // 2. Payment recognition
      const paidAmount = invoice.total - invoice.remaining;
      if (paidAmount > 0) {
        ledger.unshift({
          id: jvPayId,
          date: dateFormatted,
          account: bankName,
          category: 'Asset',
          description: `Pelunasan: ${desc}`,
          debit: paidAmount,
          credit: '-',
          status: 'Posted'
        }, {
          id: jvPayId,
          date: dateFormatted,
          account: debitAcc,
          category: 'Asset',
          description: `Pelunasan: ${desc}`,
          debit: '-',
          credit: paidAmount,
          status: 'Posted'
        });
      }
    } else {
      const debitAcc = (invoice as any).customDebitAccount ? (invoice as any).customDebitAccount.replace(/^\d+\s*-\s*/, '') : 'Harga Pokok Penjualan';
      const creditAcc = (invoice as any).customCreditAccount ? (invoice as any).customCreditAccount.replace(/^\d+\s*-\s*/, '') : 'Utang Usaha';
      const jvInvId = `JV-2026-INV-${invoice.id}`;
      const jvPayId = `JV-2026-PAY-${invoice.id}`;

      // 1. Invoice recognition
      ledger.unshift({
        id: jvInvId,
        date: dateFormatted,
        account: debitAcc,
        category: 'Expense',
        description: desc,
        debit: invoice.total,
        credit: '-',
        status: 'Posted'
      }, {
        id: jvInvId,
        date: dateFormatted,
        account: creditAcc,
        category: 'Liability',
        description: desc,
        debit: '-',
        credit: invoice.total,
        status: 'Posted'
      });

      // 2. Payment recognition
      const paidAmount = invoice.total - invoice.remaining;
      if (paidAmount > 0) {
        ledger.unshift({
          id: jvPayId,
          date: dateFormatted,
          account: creditAcc,
          category: 'Liability',
          description: `Pembayaran: ${desc}`,
          debit: paidAmount,
          credit: '-',
          status: 'Posted'
        }, {
          id: jvPayId,
          date: dateFormatted,
          account: bankName,
          category: 'Asset',
          description: `Pembayaran: ${desc}`,
          debit: '-',
          credit: paidAmount,
          status: 'Posted'
        });
      }
    }
    saveLedger(ledger);
  }
};

export const updateInvoice = (updatedInvoice: Omit<InvoiceItem, 'status'> & { status?: string }, originalInvoice: InvoiceItem) => {
  const invoices = getStoredInvoices();
  const products = getStoredProducts();
  const partners = getStoredPartners();
  const ledger = getStoredLedger();

  const safeNewPartnerName = updatedInvoice.partnerName || (updatedInvoice as any).distributor || (originalInvoice ? (originalInvoice.partnerName || (originalInvoice as any).distributor) : '') || 'General Partner';
  const safeOldPartnerName = originalInvoice ? (originalInvoice.partnerName || (originalInvoice as any).distributor || '') : '';

  const finalStatus = updatedInvoice.status || (updatedInvoice.remaining === 0 ? 'Paid' : updatedInvoice.remaining < updatedInvoice.total ? 'Partially Paid' : 'Unpaid');
  const fullUpdatedInvoice: InvoiceItem = { ...updatedInvoice, partnerName: safeNewPartnerName, status: finalStatus };

  // 1. Replace in Invoices array
  const invIdx = invoices.findIndex(i => i.id === originalInvoice.id);
  if (invIdx > -1) {
    invoices[invIdx] = fullUpdatedInvoice;
  }
  saveInvoices(invoices);

  // Revert old effects
  if (originalInvoice.type === 'Invoice') {
    // Revert stock
    if (originalInvoice.items && originalInvoice.items.length > 0) {
      originalInvoice.items.forEach(item => {
        const prodIndex = products.findIndex(p => p.id === item.productId || p.sku === item.productId);
        if (prodIndex > -1) {
          if (originalInvoice.isSales) {
            products[prodIndex].stock += item.qty;
          } else {
            products[prodIndex].stock -= item.qty;
          }
        }
      });
    }
    // Revert partner balance
    if (safeOldPartnerName) {
      const oldPartnerIdx = partners.findIndex(p => p.name.toLowerCase() === safeOldPartnerName.toLowerCase());
      if (oldPartnerIdx > -1) {
        partners[oldPartnerIdx].balance -= originalInvoice.remaining;
      }
    }
  }

  // Apply new effects
  if (fullUpdatedInvoice.type === 'Invoice') {
    if (fullUpdatedInvoice.items && fullUpdatedInvoice.items.length > 0) {
      fullUpdatedInvoice.items.forEach(item => {
        const prodIndex = products.findIndex(p => p.id === item.productId || p.sku === item.productId);
        if (prodIndex > -1) {
          if (fullUpdatedInvoice.isSales) {
            products[prodIndex].stock = Math.max(0, products[prodIndex].stock - item.qty);
          } else {
            products[prodIndex].stock += item.qty;
          }
          // Update status based on stock
          if (products[prodIndex].stock === 0) {
            products[prodIndex].status = 'Out of Stock';
          } else if (products[prodIndex].stock <= (products[prodIndex].minStock ?? 50)) {
            products[prodIndex].status = 'Low Stock';
          } else {
            products[prodIndex].status = 'In Stock';
          }
        }
      });
    }
    // Update partner balance
    const newPartnerIdx = partners.findIndex(p => p.name.toLowerCase() === safeNewPartnerName.toLowerCase());
    if (newPartnerIdx > -1) {
      partners[newPartnerIdx].balance += fullUpdatedInvoice.remaining;
    } else {
      const isCust = fullUpdatedInvoice.isSales;
      const pPrefix = isCust ? (getIdPrefixSettings().customerPrefix || 'CSTMR-') : (getIdPrefixSettings().distributorPrefix || 'DIST-');

      // Calculate max id for this specific prefix
      const partnersWithSamePrefix = partners.filter(p => p.id && String(p.id).startsWith(pPrefix));
      let maxNum = 0;
      partnersWithSamePrefix.forEach(p => {
        const numPart = parseInt(String(p.id).replace(pPrefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      });
      const nextId = `${pPrefix}${String(maxNum + 1).padStart(3, '0')}`;

      const newPartner: PartnerItem = {
        id: nextId,
        name: safeNewPartnerName,
        category: isCust ? 'Customer' : 'Distributor',
        pic: 'Contact PIC',
        email: 'info@' + safeNewPartnerName.toLowerCase().replace(/[^a-z]/g, '') + '.com',
        phone: '+62 812-0000-0000',
        address: 'Indonesia',
        balance: fullUpdatedInvoice.remaining,
        status: 'Active'
      };
      partners.push(newPartner);
    }
  }

  saveProducts(products);
  savePartners(partners);

  const filteredLedger = ledger.filter(l => !l.description.includes(originalInvoice.id));
  
  if (fullUpdatedInvoice.type === 'Invoice') {
    const dateFormatted = new Date(fullUpdatedInvoice.date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const desc = fullUpdatedInvoice.isSales 
      ? `Sales Invoice ${fullUpdatedInvoice.id} for ${safeNewPartnerName} (${fullUpdatedInvoice.ref || '-'})`
      : `Purchase Invoice ${fullUpdatedInvoice.id} from ${safeNewPartnerName} (${fullUpdatedInvoice.ref || '-'})`;

    const bankCode = fullUpdatedInvoice.paymentBank || 'BCA';
    const bankName = bankCode === 'Cash' || bankCode === 'Kas' ? 'Kas di Toko' : (bankCode.startsWith('Bank') ? bankCode : 'Bank ' + bankCode);

    if (fullUpdatedInvoice.isSales) {
      const debitAcc = (fullUpdatedInvoice as any).customDebitAccount ? (fullUpdatedInvoice as any).customDebitAccount.replace(/^\d+\s*-\s*/, '') : 'Piutang Usaha';
      const creditAcc = (fullUpdatedInvoice as any).customCreditAccount ? (fullUpdatedInvoice as any).customCreditAccount.replace(/^\d+\s*-\s*/, '') : 'Penjualan Produk';
      const jvInvId = `JV-2026-INV-${fullUpdatedInvoice.id}`;
      const jvPayId = `JV-2026-PAY-${fullUpdatedInvoice.id}`;

      // 1. Invoice recognition
      filteredLedger.unshift({
        id: jvInvId,
        date: dateFormatted,
        account: debitAcc,
        category: 'Asset',
        description: desc,
        debit: fullUpdatedInvoice.total,
        credit: '-',
        status: 'Posted'
      }, {
        id: jvInvId,
        date: dateFormatted,
        account: creditAcc,
        category: 'Revenue',
        description: desc,
        debit: '-',
        credit: fullUpdatedInvoice.total,
        status: 'Posted'
      });

      // 2. Payment recognition
      const paidAmount = fullUpdatedInvoice.total - fullUpdatedInvoice.remaining;
      if (paidAmount > 0) {
        filteredLedger.unshift({
          id: jvPayId,
          date: dateFormatted,
          account: bankName,
          category: 'Asset',
          description: `Pelunasan: ${desc}`,
          debit: paidAmount,
          credit: '-',
          status: 'Posted'
        }, {
          id: jvPayId,
          date: dateFormatted,
          account: debitAcc,
          category: 'Asset',
          description: `Pelunasan: ${desc}`,
          debit: '-',
          credit: paidAmount,
          status: 'Posted'
        });
      }
    } else {
      const debitAcc = (fullUpdatedInvoice as any).customDebitAccount ? (fullUpdatedInvoice as any).customDebitAccount.replace(/^\d+\s*-\s*/, '') : 'Harga Pokok Penjualan';
      const creditAcc = (fullUpdatedInvoice as any).customCreditAccount ? (fullUpdatedInvoice as any).customCreditAccount.replace(/^\d+\s*-\s*/, '') : 'Utang Usaha';
      const jvInvId = `JV-2026-INV-${fullUpdatedInvoice.id}`;
      const jvPayId = `JV-2026-PAY-${fullUpdatedInvoice.id}`;

      // 1. Invoice recognition
      filteredLedger.unshift({
        id: jvInvId,
        date: dateFormatted,
        account: debitAcc,
        category: 'Expense',
        description: desc,
        debit: fullUpdatedInvoice.total,
        credit: '-',
        status: 'Posted'
      }, {
        id: jvInvId,
        date: dateFormatted,
        account: creditAcc,
        category: 'Liability',
        description: desc,
        debit: '-',
        credit: fullUpdatedInvoice.total,
        status: 'Posted'
      });

      // 2. Payment recognition
      const paidAmount = fullUpdatedInvoice.total - fullUpdatedInvoice.remaining;
      if (paidAmount > 0) {
        filteredLedger.unshift({
          id: jvPayId,
          date: dateFormatted,
          account: creditAcc,
          category: 'Liability',
          description: `Pembayaran: ${desc}`,
          debit: paidAmount,
          credit: '-',
          status: 'Posted'
        }, {
          id: jvPayId,
          date: dateFormatted,
          account: bankName,
          category: 'Asset',
          description: `Pembayaran: ${desc}`,
          debit: '-',
          credit: paidAmount,
          status: 'Posted'
        });
      }
    }
  }
  saveLedger(filteredLedger);
};

export const deleteInvoice = (invoiceId: string) => {
  const invoices = getStoredInvoices();
  const updatedInvoices = invoices.filter(inv => inv.id !== invoiceId);
  saveInvoices(updatedInvoices);

  const ledger = getStoredLedger();
  const filteredLedger = ledger.filter(l => !l.description.includes(invoiceId) && !l.id.includes(invoiceId));
  saveLedger(filteredLedger);
};

/**
 * Adds or updates an operational cost/expense and integrates its effects:
 * - Deducts Cash / Bank Account or posts Payable
 * - Adds or updates General Ledger Accounting entries for each expense account
 */
export const registerNewCost = (cost: Omit<CostItem, 'status'> & { status?: string }) => {
  const costs = getStoredCosts();
  const existingIndex = costs.findIndex(c => c.id === cost.id);

  const finalCost: CostItem = {
    ...cost,
    status: cost.status || 'Approved'
  };

  if (existingIndex >= 0) {
    costs[existingIndex] = finalCost;
  } else {
    costs.unshift(finalCost);
  }
  saveCosts(costs);

  // Sync General Ledger
  syncCostLedger(finalCost);
};

export const deleteCost = (costId: string) => {
  const costs = getStoredCosts();
  const updatedCosts = costs.filter(c => c.id !== costId);
  saveCosts(updatedCosts);

  const ledger = getStoredLedger();
  const filteredLedger = ledger.filter(l => !l.description.includes(costId));
  saveLedger(filteredLedger);
  window.dispatchEvent(new Event('ledger-updated'));
  window.dispatchEvent(new Event('accounts-updated'));
};

export const updateJournalTransaction = (
  id: string,
  updatedData: {
    date: string;
    description: string;
    debitAccount?: string;
    creditAccount?: string;
    amount?: number;
  },
  originalIndex?: number
) => {
  const ledger = getStoredLedger();
  const mapCat = (code: string): 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense' => {
    if (code.startsWith('1')) return 'Asset';
    if (code.startsWith('2')) return 'Liability';
    if (code.startsWith('3')) return 'Equity';
    if (code.startsWith('4')) return 'Revenue';
    return 'Expense';
  };

  const hasId = Boolean(id && id.trim());
  const matchingEntries = hasId ? ledger.filter(l => l.id === id) : [];

  if (hasId && matchingEntries.length > 0) {
    const isDebitEntry = (l: JournalEntry) => l.debit !== '-' && typeof l.debit === 'number';

    const updatedLedger = ledger.map(entry => {
      if (entry.id !== id) return entry;

      if (isDebitEntry(entry)) {
        const newAcc = updatedData.debitAccount || entry.account;
        const accCode = newAcc.split(' ')[0];
        return {
          ...entry,
          date: updatedData.date || entry.date,
          description: updatedData.description !== undefined ? updatedData.description : entry.description,
          account: newAcc,
          category: mapCat(accCode),
          debit: typeof updatedData.amount === 'number' && updatedData.amount > 0 ? updatedData.amount : entry.debit
        };
      } else {
        const newAcc = updatedData.creditAccount || entry.account;
        const accCode = newAcc.split(' ')[0];
        return {
          ...entry,
          date: updatedData.date || entry.date,
          description: updatedData.description !== undefined ? updatedData.description : entry.description,
          account: newAcc,
          category: mapCat(accCode),
          credit: typeof updatedData.amount === 'number' && updatedData.amount > 0 ? updatedData.amount : entry.credit
        };
      }
    });

    saveLedger(updatedLedger);
  } else if (typeof originalIndex === 'number' && originalIndex >= 0 && ledger[originalIndex]) {
    const target = ledger[originalIndex];
    const isDebit = target.debit !== '-' && typeof target.debit === 'number';

    ledger[originalIndex] = {
      ...target,
      date: updatedData.date || target.date,
      description: updatedData.description !== undefined ? updatedData.description : target.description,
      account: isDebit ? (updatedData.debitAccount || target.account) : (updatedData.creditAccount || target.account),
      debit: isDebit ? (typeof updatedData.amount === 'number' ? updatedData.amount : target.debit) : '-',
      credit: !isDebit ? (typeof updatedData.amount === 'number' ? updatedData.amount : target.credit) : '-'
    };

    saveLedger(ledger);
  }

  if (hasId) {
    const invoices = getStoredInvoices();
    const invIdx = invoices.findIndex(inv => inv.id === id);
    if (invIdx > -1) {
      invoices[invIdx].date = updatedData.date || invoices[invIdx].date;
      if (updatedData.description) invoices[invIdx].ref = updatedData.description;
      if (typeof updatedData.amount === 'number' && updatedData.amount > 0) {
        invoices[invIdx].total = updatedData.amount;
      }
      saveInvoices(invoices);
      window.dispatchEvent(new Event('invoices-updated'));
    }

    const costs = getStoredCosts();
    const costIdx = costs.findIndex(c => c.id === id);
    if (costIdx > -1) {
      costs[costIdx].date = updatedData.date || costs[costIdx].date;
      if (updatedData.description) costs[costIdx].desc = updatedData.description;
      if (typeof updatedData.amount === 'number' && updatedData.amount > 0) {
        costs[costIdx].amount = updatedData.amount;
      }
      saveCosts(costs);
      window.dispatchEvent(new Event('costs-updated'));
    }
  }

  window.dispatchEvent(new Event('ledger-updated'));
  window.dispatchEvent(new Event('accounts-updated'));
};

export const deleteJournalTransaction = (id: string, entryIndex?: number) => {
  const ledger = getStoredLedger();
  let filteredLedger: JournalEntry[];

  if (id && id.trim()) {
    filteredLedger = ledger.filter(l => l.id !== id);
  } else if (typeof entryIndex === 'number' && entryIndex >= 0) {
    filteredLedger = ledger.filter((_, idx) => idx !== entryIndex);
  } else {
    filteredLedger = ledger;
  }

  saveLedger(filteredLedger);

  if (id && id.trim()) {
    const invoices = getStoredInvoices();
    if (invoices.some(inv => inv.id === id)) {
      saveInvoices(invoices.filter(inv => inv.id !== id));
      window.dispatchEvent(new Event('invoices-updated'));
    }

    const costs = getStoredCosts();
    if (costs.some(c => c.id === id)) {
      saveCosts(costs.filter(c => c.id !== id));
      window.dispatchEvent(new Event('costs-updated'));
    }
  }

  window.dispatchEvent(new Event('ledger-updated'));
  window.dispatchEvent(new Event('accounts-updated'));
};

export const syncCostLedger = (cost: CostItem) => {
  const ledger = getStoredLedger();
  // Remove existing entries for this cost ID
  const filteredLedger = ledger.filter(l => !l.description.includes(cost.id));

  // Date parsing
  let dateObj = new Date();
  if (cost.date) {
    if (cost.date.includes('/')) {
      const parts = cost.date.split('/');
      if (parts.length === 3) {
        dateObj = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
    } else if (cost.date.includes('-')) {
      dateObj = new Date(cost.date);
    }
  }

  const dateFormatted = dateObj.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Determine Credit Account (Payment Source or Liability)
  let creditAccount = 'Kas di Toko';
  if (cost.customCreditAccount) {
    creditAccount = cost.customCreditAccount.replace(/^\d+\s*-\s*/, '');
  } else if (cost.bayarNanti || cost.method === 'Pay Later (A/P)' || cost.method === 'Utang Usaha') {
    creditAccount = 'Utang Usaha';
  } else if (cost.dibayarDari) {
    if (cost.dibayarDari.includes('Kas Kecil')) creditAccount = 'Kas Kecil';
    else if (cost.dibayarDari.includes('Kas di Toko') || cost.dibayarDari.includes('Tunai')) creditAccount = 'Kas di Toko';
    else if (cost.dibayarDari.includes('Mandiri')) creditAccount = 'Bank Mandiri';
    else if (cost.dibayarDari.includes('BCA')) creditAccount = 'Bank BCA';
    else {
      creditAccount = cost.dibayarDari.split(' ').slice(1).join(' ') || cost.dibayarDari;
    }
  } else if (cost.method) {
    if (cost.method.includes('Kas Kecil')) creditAccount = 'Kas Kecil';
    else if (cost.method.includes('Cash') || cost.method.includes('Kas') || cost.method.includes('Tunai')) creditAccount = 'Kas di Toko';
    else if (cost.method.includes('Mandiri')) creditAccount = 'Bank Mandiri';
    else if (cost.method.includes('BCA')) creditAccount = 'Bank BCA';
    else creditAccount = cost.method;
  }

  // Debit Entries (Expense Accounts)
  if (cost.lineItems && cost.lineItems.length > 0) {
    cost.lineItems.forEach((item) => {
      const amt = Number(item.amount) || 0;
      if (amt > 0) {
        let accName = item.account ? (item.account.split(' ').slice(1).join(' ') || item.account) : 'Beban Operasional';
        if (cost.customDebitAccount && !item.account) {
           accName = cost.customDebitAccount.replace(/^\d+\s*-\s*/, '');
        }
        filteredLedger.unshift({
          id: `JV-2026-0${filteredLedger.length + 1}`,
          date: dateFormatted,
          account: accName,
          category: 'Expense',
          description: `Biaya: ${item.description || cost.desc} [${cost.id}]`,
          debit: amt,
          credit: '-',
          status: 'Posted'
        });
      }
    });
  } else {
    const accountMap: Record<string, string> = {
      Procurement: 'Harga Pokok Penjualan',
      Marketing: 'Beban Iklan & Promosi',
      Operational: 'Beban Lain-lain'
    };
    let expenseAcc = accountMap[cost.category] || 'Beban Lain-lain';
    if (cost.customDebitAccount) {
      expenseAcc = cost.customDebitAccount.replace(/^\d+\s*-\s*/, '');
    }
    filteredLedger.unshift({
      id: `JV-2026-0${filteredLedger.length + 1}`,
      date: dateFormatted,
      account: expenseAcc,
      category: 'Expense',
      description: `Biaya: ${cost.desc} [${cost.id}]`,
      debit: cost.amount,
      credit: '-',
      status: 'Posted'
    });
  }

  // Credit Entry
  filteredLedger.unshift({
    id: `JV-2026-0${filteredLedger.length + 1}`,
    date: dateFormatted,
    account: creditAccount,
    category: creditAccount === 'Utang Usaha' ? 'Liability' : 'Asset',
    description: `Pengeluaran Biaya ${cost.id} (${cost.penerima || 'Penerima'})`,
    debit: '-',
    credit: cost.amount,
    status: 'Posted'
  });

  saveLedger(filteredLedger);
};

/**
 * Dynamic calculation of full 2026 Financial Reports based on actual transactions in localStorage.
 * Integrates:
 * - Revenues from actual Sales Invoices
 * - COGS (HPP) from actual products/stock sold
 * - Expenses from actual Costs + baseline expenses
 * - Cash, Receivables, Payables, Inventory Assets dynamically calculated!
 */
export const getDynamicFinancials = (selectedYear: '2026' | '2025', startDate?: Date, endDate?: Date) => {
  if (selectedYear === '2025') {
    return {
      revenue: 0,
      revenueDetails: [],
      cogs: 0,
      cogsDetails: [],
      openingInventory: 0,
      totalPurchase: 0,
      closingInventory: 0,
      operatingExpenses: [],
      otherIncome: 0,
      otherIncomeDetails: [],
      assets: { lancar: [], tetap: [] },
      liabilities: { pendek: [], panjang: [] },
      equity: []
    };
  }

  const accounts = getAccountsWithDynamicBalances(startDate, endDate);

  // Revenue Accounts (4xxx or Pendapatan except 4200/Other Income)
  const revenueAccounts = accounts.filter(
    a => (a.category === 'Pendapatan' || a.code.startsWith('4')) &&
         (a.code !== '4200' && a.category !== 'Pendapatan Lainnya' && a.subCategory !== 'Other Income') &&
         !a.isHeader
  );
  const totalSalesRevenue = revenueAccounts.reduce((sum, a) => sum + a.balance, 0);
  const revenueDetails = revenueAccounts.map(a => ({ name: `${a.code} - ${a.name}`, amount: a.balance }));

  // Other Income Accounts (4200 or Pendapatan Lainnya or Other Income)
  const otherIncomeAccounts = accounts.filter(
    a => (a.code === '4200' || a.category === 'Pendapatan Lainnya' || a.subCategory === 'Other Income') &&
         !a.isHeader
  );
  const otherIncome = otherIncomeAccounts.reduce((sum, a) => sum + a.balance, 0);
  const otherIncomeDetails = otherIncomeAccounts.map(a => ({ name: `${a.code} - ${a.name}`, amount: a.balance }));

  // COGS / HPP Accounts (5xxx or HPP or Beban Pokok Penjualan)
  const cogsAccounts = accounts.filter(
    a => (a.category === 'HPP' || a.category === 'Beban Pokok Penjualan' || a.code.startsWith('5')) &&
         !a.isHeader
  );
  const dynamicCOGS = cogsAccounts.reduce((sum, a) => sum + a.balance, 0);
  const cogsDetails = cogsAccounts.map(a => ({ name: `${a.code} - ${a.name}`, amount: a.balance }));

  // Operating Expenses (6xxx or Beban)
  const operatingExpenses = accounts
    .filter(a => (a.category === 'Beban' || a.category === 'Beban Operational' || a.category === 'Beban Operasional' || a.code.startsWith('6')) && !a.isHeader)
    .map(a => ({ name: `${a.code} - ${a.name}`, amount: a.balance }));

  return {
    revenue: totalSalesRevenue,
    revenueDetails,
    cogs: dynamicCOGS,
    cogsDetails,
    openingInventory: 0,
    totalPurchase: dynamicCOGS,
    closingInventory: 0,
    operatingExpenses,
    otherIncome,
    otherIncomeDetails,
    assets: {
      lancar: accounts
        .filter(a => (a.category === 'Aset' || a.code.startsWith('1')) && !a.isHeader && (a.code < '1500' && a.subCategory !== 'Fixed Asset' && a.subCategory !== 'Contra Asset'))
        .map(a => ({ name: `${a.code} - ${a.name}`, amount: a.balance })),
      tetap: accounts
        .filter(a => (a.category === 'Aset' || a.code.startsWith('1')) && !a.isHeader && (a.code >= '1500' || a.subCategory === 'Fixed Asset' || a.subCategory === 'Contra Asset'))
        .map(a => ({ name: `${a.code} - ${a.name}`, amount: a.balance }))
    },
    liabilities: {
      pendek: accounts
        .filter(a => (a.category === 'Liabilitas' || a.code.startsWith('2')) && !a.isHeader && (a.code < '2500' && a.subCategory !== 'Long-term Liability' && a.subCategory !== 'Long Term Liability'))
        .map(a => ({ name: `${a.code} - ${a.name}`, amount: a.balance })),
      panjang: accounts
        .filter(a => (a.category === 'Liabilitas' || a.code.startsWith('2')) && !a.isHeader && (a.code >= '2500' || a.subCategory === 'Long-term Liability' || a.subCategory === 'Long Term Liability'))
        .map(a => ({ name: `${a.code} - ${a.name}`, amount: a.balance }))
    },
    equity: accounts
      .filter(a => (a.category === 'Ekuitas' || a.code.startsWith('3')) && !a.isHeader)
      .map(a => ({ name: `${a.code} - ${a.name}`, amount: a.balance }))
  };
};

export const getAccountsWithDynamicBalances = (startDate?: Date, endDate?: Date): AccountItem[] => {
  const invoices = getStoredInvoices();
  const costs = getStoredCosts();
  const ledger = getStoredLedger();
  const customAccounts = getStorageItem<AccountItem[]>('methodic_custom_accounts_v1', []);

  // Standard base accounts list
  const baseAccounts: AccountItem[] = [
    // ASET
    { code: '1000', name: 'ASET', category: '', subCategory: '', normalBal: 'Debit', level: 1, parent: '', balance: 0, isHeader: true },
    { code: '1100', name: 'Kas & Setara Kas', category: 'Aset', subCategory: 'Current Asset', normalBal: 'Debit', level: 2, parent: '1000', balance: 0, isHeader: true },
    { code: '1110', name: 'Kas Kecil', category: 'Aset', subCategory: 'Cash', normalBal: 'Debit', level: 3, parent: '1100', balance: 0 },
    { code: '1120', name: 'Kas di Toko', category: 'Aset', subCategory: 'Cash', normalBal: 'Debit', level: 3, parent: '1100', balance: 0 },
    { code: '1130', name: 'Bank BCA', category: 'Aset', subCategory: 'Bank', normalBal: 'Debit', level: 3, parent: '1100', balance: 0 },
    { code: '1140', name: 'Bank Mandiri', category: 'Aset', subCategory: 'Bank', normalBal: 'Debit', level: 3, parent: '1100', balance: 0 },
    { code: '1200', name: 'Piutang Usaha', category: 'Aset', subCategory: 'Receivable', normalBal: 'Debit', level: 2, parent: '1000', balance: 0 },
    { code: '1300', name: 'Persediaan Barang Dagang', category: 'Aset', subCategory: 'Inventory', normalBal: 'Debit', level: 2, parent: '1000', balance: 0 },
    { code: '1400', name: 'Uang Muka Pembelian', category: 'Aset', subCategory: 'Prepaid', normalBal: 'Debit', level: 2, parent: '1000', balance: 0 },
    { code: '1500', name: 'Aset Tetap', category: 'Aset', subCategory: 'Fixed Asset', normalBal: 'Debit', level: 2, parent: '1500', balance: 0, isHeader: true },
    { code: '1510', name: 'Peralatan', category: 'Aset', subCategory: 'Fixed Asset', normalBal: 'Debit', level: 3, parent: '1500', balance: 0 },
    { code: '1520', name: 'Kendaraan', category: 'Aset', subCategory: 'Fixed Asset', normalBal: 'Debit', level: 3, parent: '1500', balance: 0 },
    { code: '1530', name: 'Akumulasi Penyusutan', category: 'Aset', subCategory: 'Contra Asset', normalBal: 'Kredit', level: 3, parent: '1500', balance: 0 },

    // LIABILITAS
    { code: '2000', name: 'LIABILITAS', category: '', subCategory: '', normalBal: 'Kredit', level: 1, parent: '', balance: 0, isHeader: true },
    { code: '2100', name: 'Utang Usaha', category: 'Liabilitas', subCategory: 'Current Liability', normalBal: 'Kredit', level: 2, parent: '2000', balance: 0 },
    { code: '2200', name: 'Utang Pajak', category: 'Liabilitas', subCategory: 'Tax', normalBal: 'Kredit', level: 2, parent: '2000', balance: 0 },
    { code: '2300', name: 'Utang Gaji', category: 'Liabilitas', subCategory: 'Payroll', normalBal: 'Kredit', level: 2, parent: '2000', balance: 0 },
    { code: '2400', name: 'Pendapatan Diterima Dimuka', category: 'Liabilitas', subCategory: 'Deferred Revenue', normalBal: 'Kredit', level: 2, parent: '2000', balance: 0 },

    // EKUITAS
    { code: '3000', name: 'EKUITAS', category: '', subCategory: '', normalBal: 'Kredit', level: 1, parent: '', balance: 0, isHeader: true },
    { code: '3100', name: 'Modal Pemilik', category: 'Ekuitas', subCategory: 'Capital', normalBal: 'Kredit', level: 2, parent: '3000', balance: 0 },
    { code: '3200', name: 'Prive', category: 'Ekuitas', subCategory: 'Drawing', normalBal: 'Debit', level: 2, parent: '3000', balance: 0 },
    { code: '3300', name: 'Laba Ditahan', category: 'Ekuitas', subCategory: 'Retained Earnings', normalBal: 'Kredit', level: 2, parent: '3000', balance: 0 },
    { code: '3400', name: 'Penghasilan belum teralokasi pada tahun terkini', category: 'Ekuitas', subCategory: 'Current Earnings', normalBal: 'Kredit', level: 2, parent: '3000', balance: 0 },

    // PENDAPATAN
    { code: '4000', name: 'PENDAPATAN', category: '', subCategory: '', normalBal: 'Kredit', level: 1, parent: '', balance: 0, isHeader: true },
    { code: '4100', name: 'Penjualan Produk', category: 'Pendapatan', subCategory: 'Sales', normalBal: 'Kredit', level: 2, parent: '4000', balance: 0 },
    { code: '4200', name: 'Pendapatan Lain-lain', category: 'Pendapatan', subCategory: 'Other Income', normalBal: 'Kredit', level: 2, parent: '4000', balance: 0 },

    // HARGA POKOK PENJUALAN
    { code: '5000', name: 'HARGA POKOK PENJUALAN', category: '', subCategory: '', normalBal: 'Debit', level: 1, parent: '', balance: 0, isHeader: true },
    { code: '5100', name: 'Harga Pokok Penjualan', category: 'HPP', subCategory: 'COGS', normalBal: 'Debit', level: 2, parent: '5000', balance: 0 },

    // BEBAN OPERASIONAL
    { code: '6000', name: 'BEBAN OPERASIONAL', category: '', subCategory: '', normalBal: 'Debit', level: 1, parent: '', balance: 0, isHeader: true },
    { code: '6100', name: 'Beban Gaji', category: 'Beban', subCategory: 'Operating Expense', normalBal: 'Debit', level: 2, parent: '6000', balance: 0 },
    { code: '6110', name: 'Beban Sewa', category: 'Beban', subCategory: 'Operating Expense', normalBal: 'Debit', level: 2, parent: '6000', balance: 0 },
    { code: '6120', name: 'Beban Listrik & Air', category: 'Beban', subCategory: 'Operating Expense', normalBal: 'Debit', level: 2, parent: '6000', balance: 0 },
    { code: '6130', name: 'Beban Internet', category: 'Beban', subCategory: 'Operating Expense', normalBal: 'Debit', level: 2, parent: '6000', balance: 0 },
    { code: '6140', name: 'Beban Iklan & Promosi', category: 'Beban', subCategory: 'Operating Expense', normalBal: 'Debit', level: 2, parent: '6000', balance: 0 },
    { code: '6150', name: 'Beban Pengiriman', category: 'Beban', subCategory: 'Operating Expense', normalBal: 'Debit', level: 2, parent: '6000', balance: 0 },
    { code: '6160', name: 'Beban Administrasi Bank', category: 'Beban', subCategory: 'Operating Expense', normalBal: 'Debit', level: 2, parent: '6000', balance: 0 },
    { code: '6170', name: 'Beban Penyusutan', category: 'Beban', subCategory: 'Operating Expense', normalBal: 'Debit', level: 2, parent: '6000', balance: 0 },
    { code: '6180', name: 'Beban ATK', category: 'Beban', subCategory: 'Operating Expense', normalBal: 'Debit', level: 2, parent: '6000', balance: 0 },
    { code: '6190', name: 'Beban Lain-lain', category: 'Beban', subCategory: 'Operating Expense', normalBal: 'Debit', level: 2, parent: '6000', balance: 0 },
  ];

  // Merge custom accounts into master account list
  const masterList: AccountItem[] = baseAccounts.map(b => {
    const customMatch = customAccounts.find(c => c.code === b.code);
    if (customMatch) {
      return {
        ...b,
        name: customMatch.name || b.name,
        category: customMatch.category || b.category,
        subCategory: customMatch.subCategory || b.subCategory,
        normalBal: customMatch.normalBal || b.normalBal,
        balance: customMatch.balance || 0,
      };
    }
    return b;
  });

  // Append new custom accounts not in base list
  customAccounts.forEach(c => {
    if (!masterList.some(m => m.code === c.code)) {
      masterList.push({ ...c, balance: c.balance || 0 });
    }
  });

  // Prepare date limits
  let startMs = 0;
  let endMs = Infinity;

  if (startDate) {
    const s = new Date(startDate);
    s.setHours(0, 0, 0, 0);
    startMs = s.getTime();
  }
  if (endDate) {
    const e = new Date(endDate);
    e.setHours(23, 59, 59, 999);
    endMs = e.getTime();
  }

  // Dictionary to accumulate deltas for each account code
  const accDeltas: Record<string, number> = {};

  const addDelta = (code: string, amount: number) => {
    accDeltas[code] = (accDeltas[code] || 0) + amount;
  };

  // Helper to match an account string (code or name) to an account in masterList
  const findAccountCode = (str?: string): string | null => {
    if (!str) return null;
    const cleanStr = String(str).trim();
    // Try code match e.g. "6100", "6200", "1135" or "6200 - Beban Konsumsi"
    const codeMatch = cleanStr.match(/^(\d{4})/);
    if (codeMatch && masterList.some(m => m.code === codeMatch[1])) {
      return codeMatch[1];
    }
    // Match exact code
    const exactCode = masterList.find(m => m.code.toLowerCase() === cleanStr.toLowerCase());
    if (exactCode) return exactCode.code;
    // Match exact name
    const exactName = masterList.find(m => m.name.toLowerCase() === cleanStr.toLowerCase());
    if (exactName) return exactName.code;
    // Match string containing name or code
    const substringMatch = masterList.find(m => cleanStr.toLowerCase().includes(m.name.toLowerCase()) || cleanStr.toLowerCase().includes(m.code.toLowerCase()));
    if (substringMatch) return substringMatch.code;

    return null;
  };

  // 1. Process Invoices
  const validInvoices = invoices.filter(inv => inv.status !== 'Draft');
  validInvoices.forEach(inv => {
    const d = parseAnyDate(inv.date);
    const ms = d ? d.getTime() : 0;
    const isSales = inv.isSales;
    const isPeriodRange = ms >= startMs && ms <= endMs;
    const isPositionRange = ms <= endMs;

    // Sales Invoice
    if (isSales) {
      if (isPeriodRange) {
        addDelta('4100', inv.total || 0); // Sales Revenue
      }
      if (isPositionRange) {
        addDelta('1200', inv.remaining || 0); // Piutang Usaha
        const paidAmount = (inv.total || 0) - (inv.remaining || 0);
        if (paidAmount > 0) {
          const bankCode = findAccountCode(inv.paymentBank) || '1130'; // Bank BCA default or matched
          addDelta(bankCode, paidAmount);
        }
      }
    } else {
      // Purchase Invoice
      if (isPeriodRange) {
        addDelta('5100', inv.total || 0); // HPP
      }
      if (isPositionRange) {
        addDelta('2100', inv.remaining || 0); // Utang Usaha
        const paidAmount = (inv.total || 0) - (inv.remaining || 0);
        if (paidAmount > 0) {
          const bankCode = findAccountCode(inv.paymentBank) || '1130';
          addDelta(bankCode, -paidAmount);
        }
      }
    }
  });

  // 2. Process Costs
  const validCosts = costs.filter(c => c.status !== 'Draft');
  validCosts.forEach(c => {
    const d = parseAnyDate(c.date);
    const ms = d ? d.getTime() : 0;
    const isPeriodRange = ms >= startMs && ms <= endMs;
    const isPositionRange = ms <= endMs;

    if (isPeriodRange) {
      if (c.lineItems && c.lineItems.length > 0) {
        c.lineItems.forEach(item => {
          const amt = Number(item.amount) || 0;
          if (amt <= 0) return;
          const targetCode = findAccountCode(item.account) || '6190';
          addDelta(targetCode, amt);
        });
      } else {
        const amt = Number(c.amount) || 0;
        const targetCode = findAccountCode(c.category) || '6190';
        addDelta(targetCode, amt);
      }
    }

    if (isPositionRange) {
      const amt = Number(c.amount) || 0;
      if (c.bayarNanti || c.method === 'Pay Later (A/P)' || c.method === 'Utang Usaha') {
        addDelta('2100', amt); // Utang Usaha
      } else {
        const sourceCode = findAccountCode(c.dibayarDari || c.method) || '1130';
        addDelta(sourceCode, -amt);
      }
    }
  });

  // 3. Process Manual Journal Entries
  const validLedger = ledger.filter(entry => {
    if (entry.status === 'Draft') return false;
    if (entry.id.startsWith('JV-2026-INV-') || entry.id.startsWith('JV-2026-SLS-') || entry.id.startsWith('JV-2026-PUR-') || entry.id.startsWith('JV-2026-PAY-') || entry.id.startsWith('JV-2026-CST-')) {
      return false;
    }
    const desc = entry.description || '';
    if (desc.includes('Sales Invoice') || desc.includes('Purchase Invoice') || desc.startsWith('Pelunasan:') || desc.startsWith('Pembayaran:') || desc.startsWith('Biaya:') || desc.startsWith('Pengeluaran Biaya')) {
      return false;
    }
    return true;
  });

  validLedger.forEach(entry => {
    const d = parseAnyDate(entry.date);
    const ms = d ? d.getTime() : 0;

    const accCode = findAccountCode(entry.account);
    if (!accCode) return;

    const accObj = masterList.find(m => m.code === accCode);
    const isFlowAccount = accCode.startsWith('4') || accCode.startsWith('5') || accCode.startsWith('6') || (accObj && ['Pendapatan', 'HPP', 'Beban'].includes(accObj.category));

    const inRange = isFlowAccount ? (ms >= startMs && ms <= endMs) : (ms <= endMs);
    if (!inRange) return;

    const debitVal = typeof entry.debit === 'number' ? entry.debit : 0;
    const creditVal = typeof entry.credit === 'number' ? entry.credit : 0;

    const normalBal = accObj?.normalBal || (accCode.startsWith('1') || accCode.startsWith('5') || accCode.startsWith('6') ? 'Debit' : 'Kredit');

    let impact = 0;
    if (normalBal === 'Debit') {
      if (accCode === '1530') {
        impact = creditVal - debitVal; // Contra Asset
      } else {
        impact = debitVal - creditVal;
      }
    } else {
      impact = creditVal - debitVal;
    }

    addDelta(accCode, impact);
  });

  // Update Detail Account Balances with Deltas
  masterList.forEach(acc => {
    if (!acc.isHeader) {
      const delta = accDeltas[acc.code] || 0;
      acc.balance = (acc.balance || 0) + delta;
    }
  });

  // Helper to sum children
  const sumChildren = (parentCode: string): number => {
    return masterList
      .filter(a => a.parent === parentCode && !a.isHeader)
      .reduce((sum, a) => sum + (a.balance || 0), 0);
  };

  // Header Account Calculations
  const kasDanSetaraKasTotal = sumChildren('1100') || (masterList.find(a => a.code === '1110')?.balance || 0) + (masterList.find(a => a.code === '1120')?.balance || 0) + (masterList.find(a => a.code === '1130')?.balance || 0) + (masterList.find(a => a.code === '1140')?.balance || 0);
  const h1100 = masterList.find(a => a.code === '1100');
  if (h1100) h1100.balance = kasDanSetaraKasTotal;

  const asetTetapTotal = (masterList.find(a => a.code === '1510')?.balance || 0) + (masterList.find(a => a.code === '1520')?.balance || 0) - (masterList.find(a => a.code === '1530')?.balance || 0);
  const h1500 = masterList.find(a => a.code === '1500');
  if (h1500) h1500.balance = asetTetapTotal;

  // Calculate ASET (1000)
  const totalAset = masterList
    .filter(a => (a.category === 'Aset' || a.code.startsWith('1')) && !a.isHeader)
    .reduce((sum, a) => sum + (a.code === '1530' ? -Math.abs(a.balance) : a.balance), 0);
  const h1000 = masterList.find(a => a.code === '1000');
  if (h1000) h1000.balance = totalAset;

  // Calculate LIABILITAS (2000)
  const totalLiabilitas = masterList
    .filter(a => (a.category === 'Liabilitas' || a.code.startsWith('2')) && !a.isHeader)
    .reduce((sum, a) => sum + a.balance, 0);
  const h2000 = masterList.find(a => a.code === '2000');
  if (h2000) h2000.balance = totalLiabilitas;

  // Calculate PENDAPATAN (4000)
  const totalPendapatan = masterList
    .filter(a => (a.category === 'Pendapatan' || a.code.startsWith('4')) && !a.isHeader)
    .reduce((sum, a) => sum + a.balance, 0);
  const h4000 = masterList.find(a => a.code === '4000');
  if (h4000) h4000.balance = totalPendapatan;

  // Calculate HARGA POKOK PENJUALAN (5000)
  const totalHPP = masterList
    .filter(a => (a.category === 'HPP' || a.category === 'Beban Pokok Penjualan' || a.code.startsWith('5')) && !a.isHeader)
    .reduce((sum, a) => sum + a.balance, 0);
  const h5000 = masterList.find(a => a.code === '5000');
  if (h5000) h5000.balance = totalHPP;

  // Calculate BEBAN OPERASIONAL (6000)
  const totalBebanOperasional = masterList
    .filter(a => (a.category === 'Beban' || a.category === 'Beban Operational' || a.code.startsWith('6')) && !a.isHeader)
    .reduce((sum, a) => sum + a.balance, 0);
  const h6000 = masterList.find(a => a.code === '6000');
  if (h6000) h6000.balance = totalBebanOperasional;

  // Calculate Current Earnings (3400)
  const unallocatedCurrentEarnings = totalPendapatan - totalHPP - totalBebanOperasional;
  const acc3400 = masterList.find(a => a.code === '3400');
  if (acc3400) acc3400.balance = unallocatedCurrentEarnings;

  // Calculate EKUITAS (3000)
  const totalEkuitas = masterList
    .filter(a => (a.category === 'Ekuitas' || a.code.startsWith('3')) && !a.isHeader)
    .reduce((sum, a) => sum + (a.code === '3200' ? -Math.abs(a.balance) : a.balance), 0);
  const h3000 = masterList.find(a => a.code === '3000');
  if (h3000) h3000.balance = totalEkuitas;

  return masterList;
};
