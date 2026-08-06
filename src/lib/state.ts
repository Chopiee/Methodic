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

export const getStoredAccounts = (): AccountItem[] => {
  return getAccountsWithDynamicBalances();
};

export const saveAccounts = (accounts: AccountItem[]): void => {
  setStorageItem<AccountItem[]>('methodic_custom_accounts_v1', accounts);
  window.dispatchEvent(new Event('accounts-updated'));
};

export const addAccountAndPropagate = (account: AccountItem) => {
  const customAccounts = getStorageItem<AccountItem[]>('methodic_custom_accounts_v1', []);
  const existingIdx = customAccounts.findIndex(a => a.code === account.code);
  if (existingIdx > -1) {
    customAccounts[existingIdx] = account;
  } else {
    customAccounts.push(account);
  }
  setStorageItem<AccountItem[]>('methodic_custom_accounts_v1', customAccounts);
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
      // 1. Invoice recognition
      ledger.unshift({
        id: `JV-2026-0${ledger.length + 1}`,
        date: dateFormatted,
        account: 'Piutang Usaha',
        category: 'Asset',
        description: desc,
        debit: invoice.total,
        credit: '-',
        status: 'Posted'
      }, {
        id: `JV-2026-0${ledger.length + 2}`,
        date: dateFormatted,
        account: 'Penjualan Produk',
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
          id: `JV-2026-0${ledger.length + 1}`,
          date: dateFormatted,
          account: bankName,
          category: 'Asset',
          description: `Pelunasan: ${desc}`,
          debit: paidAmount,
          credit: '-',
          status: 'Posted'
        }, {
          id: `JV-2026-0${ledger.length + 2}`,
          date: dateFormatted,
          account: 'Piutang Usaha',
          category: 'Asset',
          description: `Pelunasan: ${desc}`,
          debit: '-',
          credit: paidAmount,
          status: 'Posted'
        });
      }
    } else {
      // 1. Invoice recognition
      ledger.unshift({
        id: `JV-2026-0${ledger.length + 1}`,
        date: dateFormatted,
        account: 'Harga Pokok Penjualan',
        category: 'Expense',
        description: desc,
        debit: invoice.total,
        credit: '-',
        status: 'Posted'
      }, {
        id: `JV-2026-0${ledger.length + 2}`,
        date: dateFormatted,
        account: 'Utang Usaha',
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
          id: `JV-2026-0${ledger.length + 1}`,
          date: dateFormatted,
          account: 'Utang Usaha',
          category: 'Liability',
          description: `Pembayaran: ${desc}`,
          debit: paidAmount,
          credit: '-',
          status: 'Posted'
        }, {
          id: `JV-2026-0${ledger.length + 2}`,
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
      // 1. Invoice recognition
      filteredLedger.unshift({
        id: `JV-2026-0${filteredLedger.length + 1}`,
        date: dateFormatted,
        account: 'Piutang Usaha',
        category: 'Asset',
        description: desc,
        debit: fullUpdatedInvoice.total,
        credit: '-',
        status: 'Posted'
      }, {
        id: `JV-2026-0${filteredLedger.length + 2}`,
        date: dateFormatted,
        account: 'Penjualan Produk',
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
          id: `JV-2026-0${filteredLedger.length + 1}`,
          date: dateFormatted,
          account: bankName,
          category: 'Asset',
          description: `Pelunasan: ${desc}`,
          debit: paidAmount,
          credit: '-',
          status: 'Posted'
        }, {
          id: `JV-2026-0${filteredLedger.length + 2}`,
          date: dateFormatted,
          account: 'Piutang Usaha',
          category: 'Asset',
          description: `Pelunasan: ${desc}`,
          debit: '-',
          credit: paidAmount,
          status: 'Posted'
        });
      }
    } else {
      // 1. Invoice recognition
      filteredLedger.unshift({
        id: `JV-2026-0${filteredLedger.length + 1}`,
        date: dateFormatted,
        account: 'Harga Pokok Penjualan',
        category: 'Expense',
        description: desc,
        debit: fullUpdatedInvoice.total,
        credit: '-',
        status: 'Posted'
      }, {
        id: `JV-2026-0${filteredLedger.length + 2}`,
        date: dateFormatted,
        account: 'Utang Usaha',
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
          id: `JV-2026-0${filteredLedger.length + 1}`,
          date: dateFormatted,
          account: 'Utang Usaha',
          category: 'Liability',
          description: `Pembayaran: ${desc}`,
          debit: paidAmount,
          credit: '-',
          status: 'Posted'
        }, {
          id: `JV-2026-0${filteredLedger.length + 2}`,
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
  if (cost.bayarNanti || cost.method === 'Pay Later (A/P)' || cost.method === 'Utang Usaha') {
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
        const accName = item.account ? (item.account.split(' ').slice(1).join(' ') || item.account) : 'Beban Operasional';
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
    const expenseAcc = accountMap[cost.category] || 'Beban Lain-lain';
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
  const products = getStoredProducts();
  let invoices = getStoredInvoices();
  let costs = getStoredCosts();
  const partners = getStoredPartners();

  const parseDateStr = (dateStr: string): Date => {
    const parts = dateStr.split('/').map(Number);
    let day = parts[0];
    let month = parts[1];
    let year = parts[2] || 2026;
    if (month > 12 && day <= 12) {
      day = parts[1];
      month = parts[0];
    }
    return new Date(year, month - 1, day);
  };

  // Pre-process and clean invoices to ensure numbers and normalized properties
  const cleanedInvoices = invoices.map(inv => {
    let total = 0;
    if (typeof inv.total === 'number') {
      total = inv.total;
    } else if (typeof inv.total === 'string') {
      total = Number((inv.total as string).replace(/\./g, '').replace(/,/g, '')) || 0;
    }

    let remaining = 0;
    if (typeof inv.remaining === 'number') {
      remaining = inv.remaining;
    } else if (typeof inv.remaining === 'string') {
      remaining = Number((inv.remaining as string).replace(/\./g, '').replace(/,/g, '')) || 0;
    }

    let isSales = inv.isSales;
    if (isSales === undefined) {
      if ((inv as any).distributor || (inv.id && (inv.id.includes('RK') || inv.id.includes('PRC') || inv.id.includes('PUR')))) {
        isSales = false;
      } else {
        isSales = true;
      }
    }

    const partnerName = inv.partnerName || (inv as any).distributor || 'Distributor/Customer';

    return {
      ...inv,
      total,
      remaining,
      isSales,
      partnerName
    };
  });

  if (startDate && endDate) {
    invoices = cleanedInvoices.filter(inv => {
      try {
        const d = parseDateStr(inv.date);
        return d >= startDate && d <= endDate;
      } catch (e) {
        return true;
      }
    });
    costs = costs.filter(c => {
      try {
        const d = parseDateStr(c.date);
        return d >= startDate && d <= endDate;
      } catch (e) {
        return true;
      }
    });
  } else {
    invoices = cleanedInvoices;
  }

  // If year is 2025, return standard zero figures for new user
  if (selectedYear === '2025') {
    return {
      revenue: 0,
      cogs: 0,
      operatingExpenses: [],
      otherIncome: 0,
      assets: {
        lancar: [],
        tetap: []
      },
      liabilities: {
        pendek: [],
        panjang: []
      },
      equity: []
    };
  }

  // Calculate 2026 dynamically!
  const accounts = getAccountsWithDynamicBalances();

  const getBal = (code: string) => accounts.find(a => a.code === code)?.balance || 0;

  const totalSalesRevenue = getBal('4100');
  const otherIncome = getBal('4200');
  const dynamicCOGS = getBal('5100');

  const operatingExpenses = accounts
    .filter(a => a.category === 'Beban' && !a.isHeader)
    .map(a => ({ name: a.name, amount: a.balance }));

  return {
    revenue: totalSalesRevenue,
    cogs: dynamicCOGS,
    openingInventory: 0,
    totalPurchase: dynamicCOGS,
    closingInventory: 0,
    operatingExpenses,
    otherIncome,
    assets: {
      lancar: accounts
        .filter(a => a.category === 'Aset' && ['Current Asset', 'Cash', 'Bank', 'Receivable', 'Inventory', 'Prepaid'].includes(a.subCategory || '') && !a.isHeader)
        .map(a => ({ name: a.name, amount: a.balance })),
      tetap: accounts
        .filter(a => a.category === 'Aset' && ['Fixed Asset', 'Contra Asset'].includes(a.subCategory || '') && !a.isHeader)
        .map(a => ({ name: a.name, amount: a.balance }))
    },
    liabilities: {
      pendek: accounts
        .filter(a => a.category === 'Liabilitas' && !a.isHeader)
        .map(a => ({ name: a.name, amount: a.balance })),
      panjang: []
    },
    equity: accounts
      .filter(a => a.category === 'Ekuitas' && !a.isHeader)
      .map(a => ({ name: a.name, amount: a.balance }))
  };
};

export const getAccountsWithDynamicBalances = (): AccountItem[] => {
  const invoices = getStoredInvoices();
  const costs = getStoredCosts();
  const products = getStoredProducts();

  const validInvoices = invoices.filter(inv => inv.status !== 'Draft');
  const salesInvoices = validInvoices.filter(inv => inv.isSales && inv.type === 'Invoice');
  const purchaseInvoices = validInvoices.filter(inv => !inv.isSales && inv.type === 'Invoice');

  // Sales Revenue: sum of all actual Sales invoices
  let totalSalesRevenue = salesInvoices.reduce((sum, inv) => sum + inv.total, 0);

  // Total Purchases from Purchase Invoices
  const totalPurchase = purchaseInvoices.reduce((sum, inv) => sum + inv.total, 0);

  // COGS / HPP (Purchases of trade goods recognized directly)
  let dynamicCOGS = totalPurchase;

  // Receivables & Payables
  let dynamicReceivables = salesInvoices.reduce((sum, inv) => sum + inv.remaining, 0);
  let dynamicPayables = purchaseInvoices.reduce((sum, inv) => sum + inv.remaining, 0);

  // Inventory value set to 0 (unallocated earnings used in equity)
  let dynamicInventoryValue = 0;

  // Operating costs breakdown based on actual Cost transactions
  const expenseBalances: Record<string, number> = {
    '6100': 0, // Beban Gaji
    '6110': 0, // Beban Sewa
    '6120': 0, // Beban Listrik & Air
    '6130': 0, // Beban Internet
    '6140': 0, // Beban Iklan & Promosi
    '6150': 0, // Beban Pengiriman
    '6160': 0, // Beban Administrasi Bank (base)
    '6170': 0, // Beban Penyusutan (base)
    '6180': 0, // Beban ATK
    '6190': 0, // Beban Lain-lain
  };

  let costPayables = 0; // Utang Usaha from Costs with bayarNanti / Pay Later

  costs.filter(c => c.status !== 'Draft').forEach(c => {
    // Check if unpaid cost (Pay Later)
    if (c.bayarNanti || c.method === 'Pay Later (A/P)' || c.method === 'Utang Usaha') {
      costPayables += c.amount;
    }

    if (c.lineItems && c.lineItems.length > 0) {
      c.lineItems.forEach(item => {
        const amt = Number(item.amount) || 0;
        if (amt <= 0 || !item.account) return;

        // Extract 4-digit code if present
        const codeMatch = item.account.match(/^\d{4}/);
        const code = codeMatch ? codeMatch[0] : null;

        if (code && expenseBalances[code] !== undefined) {
          expenseBalances[code] += amt;
        } else {
          // Name matching fallback
          const accLower = item.account.toLowerCase();
          if (accLower.includes('gaji')) expenseBalances['6100'] += amt;
          else if (accLower.includes('sewa')) expenseBalances['6110'] += amt;
          else if (accLower.includes('listrik') || accLower.includes('air')) expenseBalances['6120'] += amt;
          else if (accLower.includes('internet')) expenseBalances['6130'] += amt;
          else if (accLower.includes('iklan') || accLower.includes('promosi') || accLower.includes('marketing')) expenseBalances['6140'] += amt;
          else if (accLower.includes('pengiriman') || accLower.includes('ongkir')) expenseBalances['6150'] += amt;
          else if (accLower.includes('bank') || accLower.includes('admin')) expenseBalances['6160'] += amt;
          else if (accLower.includes('penyusutan')) expenseBalances['6170'] += amt;
          else if (accLower.includes('atk') || accLower.includes('kertas')) expenseBalances['6180'] += amt;
          else expenseBalances['6190'] += amt;
        }
      });
    } else {
      // Fallback if no line items
      if (c.category === 'Marketing') expenseBalances['6140'] += c.amount;
      else if (c.category === 'Procurement') expenseBalances['6150'] += c.amount;
      else expenseBalances['6190'] += c.amount;
    }
  });

  const bebanGajiVal = expenseBalances['6100'];
  const bebanSewaVal = expenseBalances['6110'];
  const bebanListrikVal = expenseBalances['6120'];
  const bebanInternetVal = expenseBalances['6130'];
  const bebanPromosiVal = expenseBalances['6140'];
  const bebanPengirimanVal = expenseBalances['6150'];
  const bebanAdminBankVal = expenseBalances['6160'];
  const bebanPenyusutanVal = expenseBalances['6170'];
  const bebanATKVal = expenseBalances['6180'];
  const bebanLainVal = expenseBalances['6190'];

  // Bank & Cash Balances
  let balanceKasKecil = 0;
  let balanceKasToko = 0;
  let balanceBca = 0;
  let balanceMandiri = 0;

  // Sales payments received
  salesInvoices.forEach(inv => {
    const paidAmount = inv.total - inv.remaining;
    if (paidAmount <= 0) return;
    const bank = inv.paymentBank || 'BCA';
    if (bank.includes('BCA')) balanceBca += paidAmount;
    else if (bank.includes('Mandiri')) balanceMandiri += paidAmount;
    else if (bank.includes('Kecil') || bank.includes('Cash')) balanceKasKecil += paidAmount;
    else balanceKasToko += paidAmount;
  });

  // Purchase payments made
  purchaseInvoices.forEach(inv => {
    const paidAmount = inv.total - inv.remaining;
    if (paidAmount <= 0) return;
    const bank = inv.paymentBank || 'BCA';
    if (bank.includes('BCA')) balanceBca -= paidAmount;
    else if (bank.includes('Mandiri')) balanceMandiri -= paidAmount;
    else if (bank.includes('Kecil')) balanceKasKecil -= paidAmount;
    else balanceKasToko -= paidAmount;
  });

  // Costs payments made
  costs.forEach(c => {
    if (c.status === 'Draft' || c.bayarNanti || c.method === 'Pay Later (A/P)' || c.method === 'Utang Usaha') return;
    const amount = c.amount;
    const source = c.dibayarDari || c.method || 'Cash';
    if (source.includes('Kas Kecil') || source.includes('1110')) balanceKasKecil -= amount;
    else if (source.includes('Mandiri') || source.includes('1140')) balanceMandiri -= amount;
    else if (source.includes('BCA') || source.includes('1130')) balanceBca -= amount;
    else balanceKasToko -= amount; // Default Kas di Toko
  });

  // Calculate Ledger (Jurnal Umum / Transaksi Manual) Impact
  const ledger = getStoredLedger();
  const validLedger = ledger.filter(entry => entry.status !== 'Draft');
  const ledgerDeltas: Record<string, number> = {};

  validLedger.forEach(entry => {
    let code: string | null = null;
    const match = entry.account.match(/^\d{4}/);
    if (match) {
      code = match[0];
    } else {
      const accNameLower = entry.account.toLowerCase();
      if (accNameLower.includes('kas kecil')) code = '1110';
      else if (accNameLower.includes('kas di toko') || accNameLower.includes('kas toko')) code = '1120';
      else if (accNameLower.includes('bca')) code = '1130';
      else if (accNameLower.includes('mandiri')) code = '1140';
      else if (accNameLower.includes('piutang')) code = '1200';
      else if (accNameLower.includes('persediaan')) code = '1300';
      else if (accNameLower.includes('uang muka')) code = '1400';
      else if (accNameLower.includes('peralatan')) code = '1510';
      else if (accNameLower.includes('kendaraan')) code = '1520';
      else if (accNameLower.includes('akumulasi penyusutan')) code = '1530';
      else if (accNameLower.includes('utang usaha')) code = '2100';
      else if (accNameLower.includes('utang pajak')) code = '2200';
      else if (accNameLower.includes('utang gaji')) code = '2300';
      else if (accNameLower.includes('pendapatan diterima dimuka')) code = '2400';
      else if (accNameLower.includes('modal')) code = '3100';
      else if (accNameLower.includes('prive')) code = '3200';
      else if (accNameLower.includes('laba ditahan')) code = '3300';
      else if (accNameLower.includes('penjualan')) code = '4100';
      else if (accNameLower.includes('pendapatan lain')) code = '4200';
      else if (accNameLower.includes('hpp') || accNameLower.includes('harga pokok')) code = '5100';
      else if (accNameLower.includes('gaji')) code = '6100';
      else if (accNameLower.includes('sewa')) code = '6110';
      else if (accNameLower.includes('listrik') || accNameLower.includes('air')) code = '6120';
      else if (accNameLower.includes('internet')) code = '6130';
      else if (accNameLower.includes('iklan') || accNameLower.includes('promosi')) code = '6140';
      else if (accNameLower.includes('pengiriman')) code = '6150';
      else if (accNameLower.includes('bank') || accNameLower.includes('admin')) code = '6160';
      else if (accNameLower.includes('penyusutan')) code = '6170';
      else if (accNameLower.includes('atk')) code = '6180';
      else if (accNameLower.includes('lain')) code = '6190';
    }

    if (!code) return;

    const debitVal = typeof entry.debit === 'number' ? entry.debit : 0;
    const creditVal = typeof entry.credit === 'number' ? entry.credit : 0;

    let impact = 0;
    if (code.startsWith('1') || code.startsWith('5') || code.startsWith('6') || code === '3200') {
      if (code === '1530') {
        impact = creditVal - debitVal;
      } else {
        impact = debitVal - creditVal;
      }
    } else {
      impact = creditVal - debitVal;
    }

    ledgerDeltas[code] = (ledgerDeltas[code] || 0) + impact;
  });

  // Apply ledger deltas to account variables
  balanceKasKecil += (ledgerDeltas['1110'] || 0);
  balanceKasToko += (ledgerDeltas['1120'] || 0);
  balanceBca += (ledgerDeltas['1130'] || 0);
  balanceMandiri += (ledgerDeltas['1140'] || 0);

  dynamicReceivables += (ledgerDeltas['1200'] || 0);
  dynamicInventoryValue += (ledgerDeltas['1300'] || 0);
  const uangMukaVal = (ledgerDeltas['1400'] || 0);

  const peralatanVal = (ledgerDeltas['1510'] || 0);
  const kendaraanVal = (ledgerDeltas['1520'] || 0);
  const akumulasiPenyusutanVal = (ledgerDeltas['1530'] || 0);
  const asetTetapTotal = peralatanVal + kendaraanVal - akumulasiPenyusutanVal;

  dynamicPayables += (ledgerDeltas['2100'] || 0);
  const utangPajakVal = (ledgerDeltas['2200'] || 0);
  const utangGajiVal = (ledgerDeltas['2300'] || 0);
  const pendapatanDiterimaDimukaVal = (ledgerDeltas['2400'] || 0);

  const modalPemilikVal = (ledgerDeltas['3100'] || 0);
  const priveVal = (ledgerDeltas['3200'] || 0);
  const labaDitahanVal = (ledgerDeltas['3300'] || 0);

  totalSalesRevenue += (ledgerDeltas['4100'] || 0);
  const otherIncome = (ledgerDeltas['4200'] || 0);

  dynamicCOGS += (ledgerDeltas['5100'] || 0);

  expenseBalances['6100'] += (ledgerDeltas['6100'] || 0);
  expenseBalances['6110'] += (ledgerDeltas['6110'] || 0);
  expenseBalances['6120'] += (ledgerDeltas['6120'] || 0);
  expenseBalances['6130'] += (ledgerDeltas['6130'] || 0);
  expenseBalances['6140'] += (ledgerDeltas['6140'] || 0);
  expenseBalances['6150'] += (ledgerDeltas['6150'] || 0);
  expenseBalances['6160'] += (ledgerDeltas['6160'] || 0);
  expenseBalances['6170'] += (ledgerDeltas['6170'] || 0);
  expenseBalances['6180'] += (ledgerDeltas['6180'] || 0);
  expenseBalances['6190'] += (ledgerDeltas['6190'] || 0);

  const kasDanSetaraKasTotal = balanceKasKecil + balanceKasToko + balanceBca + balanceMandiri;
  const totalAsetVal = kasDanSetaraKasTotal + dynamicReceivables + dynamicInventoryValue + uangMukaVal + asetTetapTotal;

  const totalLiabilitasVal = dynamicPayables + costPayables + utangPajakVal + utangGajiVal + pendapatanDiterimaDimukaVal;
  const totalPendapatanVal = totalSalesRevenue + otherIncome;
  const totalHPPVal = dynamicCOGS;
  const totalBebanOperasionalVal = bebanGajiVal + bebanSewaVal + bebanListrikVal + bebanInternetVal + bebanPromosiVal + bebanPengirimanVal + bebanAdminBankVal + bebanPenyusutanVal + bebanATKVal + bebanLainVal +
    (ledgerDeltas['6100']||0) + (ledgerDeltas['6110']||0) + (ledgerDeltas['6120']||0) + (ledgerDeltas['6130']||0) + (ledgerDeltas['6140']||0) + (ledgerDeltas['6150']||0) + (ledgerDeltas['6160']||0) + (ledgerDeltas['6170']||0) + (ledgerDeltas['6180']||0) + (ledgerDeltas['6190']||0);
  
  const unallocatedCurrentEarnings = totalPendapatanVal - totalHPPVal - totalBebanOperasionalVal;
  const totalEkuitasVal = modalPemilikVal - priveVal + labaDitahanVal + unallocatedCurrentEarnings;

  const exactAccountsFromImage: AccountItem[] = [
    // ASET
    { code: '1000', name: 'ASET', category: '', subCategory: '', normalBal: 'Debit', level: 1, parent: '', balance: totalAsetVal, isHeader: true },
    { code: '1100', name: 'Kas & Setara Kas', category: 'Aset', subCategory: 'Current Asset', normalBal: 'Debit', level: 2, parent: '1000', balance: kasDanSetaraKasTotal, isHeader: true },
    { code: '1110', name: 'Kas Kecil', category: 'Aset', subCategory: 'Cash', normalBal: 'Debit', level: 3, parent: '1100', balance: balanceKasKecil },
    { code: '1120', name: 'Kas di Toko', category: 'Aset', subCategory: 'Cash', normalBal: 'Debit', level: 3, parent: '1100', balance: balanceKasToko },
    { code: '1130', name: 'Bank BCA', category: 'Aset', subCategory: 'Bank', normalBal: 'Debit', level: 3, parent: '1100', balance: balanceBca },
    { code: '1140', name: 'Bank Mandiri', category: 'Aset', subCategory: 'Bank', normalBal: 'Debit', level: 3, parent: '1100', balance: balanceMandiri },
    { code: '1200', name: 'Piutang Usaha', category: 'Aset', subCategory: 'Receivable', normalBal: 'Debit', level: 2, parent: '1000', balance: dynamicReceivables },
    { code: '1300', name: 'Persediaan Barang Dagang', category: 'Aset', subCategory: 'Inventory', normalBal: 'Debit', level: 2, parent: '1000', balance: dynamicInventoryValue },
    { code: '1400', name: 'Uang Muka Pembelian', category: 'Aset', subCategory: 'Prepaid', normalBal: 'Debit', level: 2, parent: '1000', balance: uangMukaVal },
    { code: '1500', name: 'Aset Tetap', category: 'Aset', subCategory: 'Fixed Asset', normalBal: 'Debit', level: 2, parent: '1000', balance: asetTetapTotal, isHeader: true },
    { code: '1510', name: 'Peralatan', category: 'Aset', subCategory: 'Fixed Asset', normalBal: 'Debit', level: 3, parent: '1500', balance: peralatanVal },
    { code: '1520', name: 'Kendaraan', category: 'Aset', subCategory: 'Fixed Asset', normalBal: 'Debit', level: 3, parent: '1500', balance: kendaraanVal },
    { code: '1530', name: 'Akumulasi Penyusutan', category: 'Aset', subCategory: 'Contra Asset', normalBal: 'Kredit', level: 3, parent: '1500', balance: akumulasiPenyusutanVal },

    // LIABILITAS
    { code: '2000', name: 'LIABILITAS', category: '', subCategory: '', normalBal: 'Kredit', level: 1, parent: '', balance: totalLiabilitasVal, isHeader: true },
    { code: '2100', name: 'Utang Usaha', category: 'Liabilitas', subCategory: 'Current Liability', normalBal: 'Kredit', level: 2, parent: '2000', balance: dynamicPayables + costPayables },
    { code: '2200', name: 'Utang Pajak', category: 'Liabilitas', subCategory: 'Tax', normalBal: 'Kredit', level: 2, parent: '2000', balance: utangPajakVal },
    { code: '2300', name: 'Utang Gaji', category: 'Liabilitas', subCategory: 'Payroll', normalBal: 'Kredit', level: 2, parent: '2000', balance: utangGajiVal },
    { code: '2400', name: 'Pendapatan Diterima Dimuka', category: 'Liabilitas', subCategory: 'Deferred Revenue', normalBal: 'Kredit', level: 2, parent: '2000', balance: pendapatanDiterimaDimukaVal },

    // EKUITAS
    { code: '3000', name: 'EKUITAS', category: '', subCategory: '', normalBal: 'Kredit', level: 1, parent: '', balance: totalEkuitasVal, isHeader: true },
    { code: '3100', name: 'Modal Pemilik', category: 'Ekuitas', subCategory: 'Capital', normalBal: 'Kredit', level: 2, parent: '3000', balance: modalPemilikVal },
    { code: '3200', name: 'Prive', category: 'Ekuitas', subCategory: 'Drawing', normalBal: 'Debit', level: 2, parent: '3000', balance: priveVal },
    { code: '3300', name: 'Laba Ditahan', category: 'Ekuitas', subCategory: 'Retained Earnings', normalBal: 'Kredit', level: 2, parent: '3000', balance: labaDitahanVal },
    { code: '3400', name: 'Penghasilan belum teralokasi pada tahun terkini', category: 'Ekuitas', subCategory: 'Current Earnings', normalBal: 'Kredit', level: 2, parent: '3000', balance: unallocatedCurrentEarnings },

    // PENDAPATAN
    { code: '4000', name: 'PENDAPATAN', category: '', subCategory: '', normalBal: 'Kredit', level: 1, parent: '', balance: totalPendapatanVal, isHeader: true },
    { code: '4100', name: 'Penjualan Produk', category: 'Pendapatan', subCategory: 'Sales', normalBal: 'Kredit', level: 2, parent: '4000', balance: totalSalesRevenue },
    { code: '4200', name: 'Pendapatan Lain-lain', category: 'Pendapatan', subCategory: 'Other Income', normalBal: 'Kredit', level: 2, parent: '4000', balance: 0 },

    // HARGA POKOK PENJUALAN
    { code: '5000', name: 'HARGA POKOK PENJUALAN', category: '', subCategory: '', normalBal: 'Debit', level: 1, parent: '', balance: totalHPPVal, isHeader: true },
    { code: '5100', name: 'Harga Pokok Penjualan', category: 'HPP', subCategory: 'COGS', normalBal: 'Debit', level: 2, parent: '5000', balance: dynamicCOGS },

    // BEBAN OPERASIONAL
    { code: '6000', name: 'BEBAN OPERASIONAL', category: '', subCategory: '', normalBal: 'Debit', level: 1, parent: '', balance: totalBebanOperasionalVal, isHeader: true },
    { code: '6100', name: 'Beban Gaji', category: 'Beban', subCategory: 'Operating Expense', normalBal: 'Debit', level: 2, parent: '6000', balance: bebanGajiVal },
    { code: '6110', name: 'Beban Sewa', category: 'Beban', subCategory: 'Operating Expense', normalBal: 'Debit', level: 2, parent: '6000', balance: bebanSewaVal },
    { code: '6120', name: 'Beban Listrik & Air', category: 'Beban', subCategory: 'Operating Expense', normalBal: 'Debit', level: 2, parent: '6000', balance: bebanListrikVal },
    { code: '6130', name: 'Beban Internet', category: 'Beban', subCategory: 'Operating Expense', normalBal: 'Debit', level: 2, parent: '6000', balance: bebanInternetVal },
    { code: '6140', name: 'Beban Iklan & Promosi', category: 'Beban', subCategory: 'Operating Expense', normalBal: 'Debit', level: 2, parent: '6000', balance: bebanPromosiVal },
    { code: '6150', name: 'Beban Pengiriman', category: 'Beban', subCategory: 'Operating Expense', normalBal: 'Debit', level: 2, parent: '6000', balance: bebanPengirimanVal },
    { code: '6160', name: 'Beban Administrasi Bank', category: 'Beban', subCategory: 'Operating Expense', normalBal: 'Debit', level: 2, parent: '6000', balance: bebanAdminBankVal },
    { code: '6170', name: 'Beban Penyusutan', category: 'Beban', subCategory: 'Operating Expense', normalBal: 'Debit', level: 2, parent: '6000', balance: bebanPenyusutanVal },
    { code: '6180', name: 'Beban ATK', category: 'Beban', subCategory: 'Operating Expense', normalBal: 'Debit', level: 2, parent: '6000', balance: bebanATKVal },
    { code: '6190', name: 'Beban Lain-lain', category: 'Beban', subCategory: 'Operating Expense', normalBal: 'Debit', level: 2, parent: '6000', balance: bebanLainVal },
  ];

  // User created custom accounts & overrides
  const customAccounts = getStorageItem<AccountItem[]>('methodic_custom_accounts_v1', []);
  const baseWithOverrides = exactAccountsFromImage.map(baseAcc => {
    const override = customAccounts.find(c => c.code === baseAcc.code);
    if (override) {
      return {
        ...baseAcc,
        name: override.name,
        category: override.category || baseAcc.category,
        subCategory: override.subCategory || baseAcc.subCategory,
        normalBal: override.normalBal || baseAcc.normalBal,
      };
    }
    return baseAcc;
  });
  const customOnly = customAccounts.filter(c => !exactAccountsFromImage.some(b => b.code === c.code));

  return [...baseWithOverrides, ...customOnly];
};
