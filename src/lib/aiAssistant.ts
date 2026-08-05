import { 
  getStoredProducts, 
  getStoredInvoices, 
  getStoredCosts, 
  getStoredPartners, 
  getStoredAccounts, 
  getStoredLedger,
  getInvoiceLogs,
  InvoiceItem,
  ProductItem,
  CostItem,
  PartnerItem,
  AccountItem
} from './state';

export interface AppContextData {
  products: ProductItem[];
  invoices: InvoiceItem[];
  costs: CostItem[];
  partners: PartnerItem[];
  accounts: AccountItem[];
  warehouses: any[];
  summary: {
    totalSales: number;
    totalSalesPaid: number;
    totalSalesRemaining: number;
    salesCount: number;
    totalPurchases: number;
    totalPurchasesPaid: number;
    totalPurchasesRemaining: number;
    purchasesCount: number;
    totalCosts: number;
    costsByCategory: Record<string, number>;
    totalProducts: number;
    lowStockProducts: ProductItem[];
    outOfStockProducts: ProductItem[];
    totalPartners: number;
    customersCount: number;
    distributorsCount: number;
    cashBankAccounts: AccountItem[];
    netIncomeEstimate: number;
  };
}

export function getLiveAppContextData(): AppContextData {
  const products = getStoredProducts();
  const invoices = getStoredInvoices();
  const costs = getStoredCosts();
  const partners = getStoredPartners();
  const accounts = getStoredAccounts();

  let warehouses: any[] = [];
  try {
    const whRaw = localStorage.getItem('methodic_warehouses_v3');
    if (whRaw) warehouses = JSON.parse(whRaw);
  } catch (e) {
    warehouses = [];
  }

  const salesInvoices = invoices.filter(i => i.isSales);
  const purchaseInvoices = invoices.filter(i => !i.isSales);

  const totalSales = salesInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const totalSalesRemaining = salesInvoices.reduce((sum, i) => sum + (i.remaining || 0), 0);
  const totalSalesPaid = totalSales - totalSalesRemaining;

  const totalPurchases = purchaseInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const totalPurchasesRemaining = purchaseInvoices.reduce((sum, i) => sum + (i.remaining || 0), 0);
  const totalPurchasesPaid = totalPurchases - totalPurchasesRemaining;

  const totalCosts = costs.reduce((sum, c) => sum + (c.amount || 0), 0);
  const costsByCategory: Record<string, number> = {};
  costs.forEach(c => {
    const cat = c.category || 'Operational';
    costsByCategory[cat] = (costsByCategory[cat] || 0) + (c.amount || 0);
  });

  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= (p.minStock || 10));
  const outOfStockProducts = products.filter(p => p.stock <= 0);

  const customersCount = partners.filter(p => p.category === 'Customer').length;
  const distributorsCount = partners.filter(p => p.category === 'Distributor').length;

  const cashBankAccounts = accounts.filter(a => 
    a.subCategory === 'Cash' || a.subCategory === 'Bank' || a.name.toLowerCase().includes('kas') || a.name.toLowerCase().includes('bank')
  );

  const netIncomeEstimate = totalSales - totalPurchases - totalCosts;

  return {
    products,
    invoices,
    costs,
    partners,
    accounts,
    warehouses,
    summary: {
      totalSales,
      totalSalesPaid,
      totalSalesRemaining,
      salesCount: salesInvoices.length,
      totalPurchases,
      totalPurchasesPaid,
      totalPurchasesRemaining,
      purchasesCount: purchaseInvoices.length,
      totalCosts,
      costsByCategory,
      totalProducts: products.length,
      lowStockProducts,
      outOfStockProducts,
      totalPartners: partners.length,
      customersCount,
      distributorsCount,
      cashBankAccounts,
      netIncomeEstimate
    }
  };
}

export function formatRP(val: number): string {
  return 'Rp ' + (val || 0).toLocaleString('id-ID');
}

export function buildPromptContextString(data: AppContextData): string {
  const { summary, products, invoices, costs, partners, accounts, warehouses } = data;

  const salesInvoices = invoices.filter(i => i.isSales);
  const purchaseInvoices = invoices.filter(i => !i.isSales);

  return `
[LIVE APPLICATION DATA CONTEXT]
1. SUMMARY KEUANGAN & TRANSAKSI:
- Total Penjualan (Sales): ${formatRP(summary.totalSales)} (${summary.salesCount} transaksi | Lunas: ${formatRP(summary.totalSalesPaid)} | Piutang Belum Lunas: ${formatRP(summary.totalSalesRemaining)})
- Total Pembelian (Purchases): ${formatRP(summary.totalPurchases)} (${summary.purchasesCount} transaksi | Lunas: ${formatRP(summary.totalPurchasesPaid)} | Utang Belum Lunas: ${formatRP(summary.totalPurchasesRemaining)})
- Total Biaya Operasional (Costs): ${formatRP(summary.totalCosts)}
- Perkiraan Laba Bersih Sederhana: ${formatRP(summary.netIncomeEstimate)}

2. REKAPITULASI KAS & BANK:
${summary.cashBankAccounts.map(a => `- ${a.code} - ${a.name}: ${formatRP(a.balance)}`).join('\n') || '- Tidak ada akun Kas/Bank khusus'}

3. PRODUK & INVENTORY (${summary.totalProducts} Jenis Produk):
${products.map(p => `- [SKU: ${p.sku}] ${p.name} | Stok: ${p.stock} | Harga Beli: ${formatRP(p.price)} | Harga Jual: ${formatRP(p.sellPrice)} | Status: ${p.status}`).join('\n')}

4. DAFTAR FAKTUR PENJUALAN RECENT:
${salesInvoices.map(i => `- ${i.id} | Customer: ${i.partnerName} | Total: ${formatRP(i.total)} | Sisa: ${formatRP(i.remaining)} | Status: ${i.status} | Tanggal: ${i.date}`).join('\n')}

5. DAFTAR FAKTUR PEMBELIAN RECENT:
${purchaseInvoices.map(i => `- ${i.id} | Distributor: ${i.partnerName} | Total: ${formatRP(i.total)} | Sisa: ${formatRP(i.remaining)} | Status: ${i.status} | Tanggal: ${i.date}`).join('\n')}

6. DAFTAR BIAYA OPERASIONAL (COSTS):
${costs.map(c => `- [${c.category}] ${c.desc}: ${formatRP(c.amount)} | Tanggal: ${c.date} | Status: ${c.status}`).join('\n')}

7. MITRA & PELANGGAN (${summary.totalPartners} Partners):
${partners.map(p => `- ${p.name} (${p.category}) | Saldo: ${formatRP(p.balance)} | Status: ${p.status} | Email: ${p.email || '-'}`).join('\n')}

8. GUDANG & FASILITAS (${warehouses.length} Gudang):
${warehouses.map(w => `- ${w.name} (${w.code}) | Lokasi: ${w.location} | Kapasitas: ${w.capacity} unit | Status: ${w.status}`).join('\n')}

9. LOG AKTIVITAS DOKUMEN RECENT:
${invoices.slice(0, 5).flatMap(i => getInvoiceLogs(i)).map(l => `- [${l.timestamp}] ${l.title} (${l.user}): ${l.details}`).join('\n')}
`;
}

export async function askSmartPlanningAI(userQuery: string): Promise<string> {
  const contextData = getLiveAppContextData();
  const contextPrompt = buildPromptContextString(contextData);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: userQuery,
        context: contextPrompt
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.text) {
        return data.text;
      }
    }
  } catch (err) {
    console.warn('API /api/chat not available or failed, falling back to smart local AI engine:', err);
  }

  // Fallback to local intelligent assistant engine
  return generateLocalAIResponse(userQuery, contextData);
}

export function generateLocalAIResponse(query: string, data: AppContextData): string {
  const q = query.toLowerCase().trim();
  const { summary, products, invoices, costs, partners, accounts, warehouses } = data;

  const salesInvoices = invoices.filter(i => i.isSales);
  const purchaseInvoices = invoices.filter(i => !i.isSales);

  // 1. Tanya tentang Produk / Stok / Inventory
  if (q.includes('produk') || q.includes('stok') || q.includes('barang') || q.includes('inventory') || q.includes('item') || q.includes('habis') || q.includes('menipis')) {
    let response = `### 📦 Laporan Stok & Produk Real-Time\n\nSaat ini terdapat **${summary.totalProducts} jenis produk** terdaftar dalam sistem:\n\n`;
    
    if (summary.lowStockProducts.length > 0 || summary.outOfStockProducts.length > 0) {
      response += `⚠️ **Peringatan Stok Menipis / Habis:**\n`;
      summary.outOfStockProducts.forEach(p => {
        response += `- 🔴 **${p.name}** (${p.sku}): **STOK HABIS (0)** | HPP: ${formatRP(p.hop || p.price)}\n`;
      });
      summary.lowStockProducts.forEach(p => {
        response += `- 🟡 **${p.name}** (${p.sku}): **${p.stock} unit** (Batas Min: ${p.minStock || 10})\n`;
      });
      response += `\n`;
    }

    response += `📋 **Daftar Ringkas Produk:**\n`;
    products.forEach(p => {
      response += `- **${p.name}** (${p.sku}): Stok **${p.stock} unit** | Harga Beli: ${formatRP(p.price)} | Harga Jual: ${formatRP(p.sellPrice)}\n`;
    });

    return response;
  }

  // 2. Tanya tentang Penjualan / Sales / Omset / Revenue
  if (q.includes('jual') || q.includes('sales') || q.includes('penjualan') || q.includes('omset') || q.includes('pendapatan') || q.includes('piutang')) {
    let response = `### 💰 Ringkasan Penjualan (Sales)\n\n`;
    response += `- **Total Transaksi Penjualan:** ${summary.salesCount} Faktur\n`;
    response += `- **Total Nilai Penjualan:** **${formatRP(summary.totalSales)}**\n`;
    response += `- **Sudah Dilunasi (Kas/Bank Masuk):** ${formatRP(summary.totalSalesPaid)}\n`;
    response += `- **Sisa Piutang Pelanggan:** **${formatRP(summary.totalSalesRemaining)}**\n\n`;

    response += `📜 **Detail Faktur Penjualan Terbaru:**\n`;
    salesInvoices.forEach(i => {
      response += `- **${i.id}** | Customer: **${i.partnerName}** | Total: **${formatRP(i.total)}** | Sisa: ${formatRP(i.remaining)} | Status: \`${i.status}\`\n`;
    });

    return response;
  }

  // 3. Tanya tentang Pembelian / Purchases / Utang / Kulakan
  if (q.includes('beli') || q.includes('purchase') || q.includes('pembelian') || q.includes('utang') || q.includes('distributor') || q.includes('vendor')) {
    let response = `### 🛒 Ringkasan Pembelian (Purchases)\n\n`;
    response += `- **Total Transaksi Pembelian:** ${summary.purchasesCount} Faktur\n`;
    response += `- **Total Nilai Pembelian:** **${formatRP(summary.totalPurchases)}**\n`;
    response += `- **Sudah Dibayar Lunas:** ${formatRP(summary.totalPurchasesPaid)}\n`;
    response += `- **Sisa Utang ke Distributor:** **${formatRP(summary.totalPurchasesRemaining)}**\n\n`;

    response += `📜 **Detail Faktur Pembelian Terbaru:**\n`;
    purchaseInvoices.forEach(i => {
      response += `- **${i.id}** | Distributor: **${i.partnerName}** | Total: **${formatRP(i.total)}** | Sisa: ${formatRP(i.remaining)} | Status: \`${i.status}\`\n`;
    });

    return response;
  }

  // 4. Tanya tentang Biaya / Pengeluaran / Costs / Operasional
  if (q.includes('biaya') || q.includes('cost') || q.includes('pengeluaran') || q.includes('operasional') || q.includes('beban') || q.includes('marketing') || q.includes('pengadaan')) {
    let response = `### 💸 Ringkasan Biaya Operasional (Costs)\n\n`;
    response += `- **Total Biaya Terdaftar:** **${formatRP(summary.totalCosts)}** (${costs.length} transaksi)\n\n`;

    response += `📊 **Rincian per Kategori:**\n`;
    Object.entries(summary.costsByCategory).forEach(([cat, amt]) => {
      response += `- **${cat}:** ${formatRP(amt)}\n`;
    });

    response += `\n📜 **Daftar Pengeluaran Terakhir:**\n`;
    costs.forEach(c => {
      response += `- [${c.category}] **${c.desc}**: ${formatRP(c.amount)} | Tanggal: ${c.date} | Status: \`${c.status}\`\n`;
    });

    return response;
  }

  // 5. Tanya tentang Kas, Bank, Keuangan, Laba Rugi, Saldo
  if (q.includes('kas') || q.includes('bank') || q.includes('saldo') || q.includes('keuangan') || q.includes('laba') || q.includes('rugi') || q.includes('profit') || q.includes('uang')) {
    let response = `### 🏦 Ringkasan Keuangan & Laba Rugi\n\n`;
    response += `💵 **Saldo Rekening & Kas:**\n`;
    if (summary.cashBankAccounts.length > 0) {
      summary.cashBankAccounts.forEach(a => {
        response += `- **${a.name}** (${a.code}): **${formatRP(a.balance)}**\n`;
      });
    } else {
      accounts.filter(a => a.category === 'Aset').slice(0, 5).forEach(a => {
        response += `- **${a.name}** (${a.code}): **${formatRP(a.balance)}**\n`;
      });
    }

    response += `\n📈 **Proyeksi Laba Rugi Sederhana:**\n`;
    response += `- Total Penjualan: ${formatRP(summary.totalSales)}\n`;
    response += `- Total Pembelian: -${formatRP(summary.totalPurchases)}\n`;
    response += `- Total Biaya Operasional: -${formatRP(summary.totalCosts)}\n`;
    response += `- **Estimasi Laba Bersih:** **${formatRP(summary.netIncomeEstimate)}** ${summary.netIncomeEstimate >= 0 ? '🟢 (Untung)' : '🔴 (Rugi)'}\n`;

    return response;
  }

  // 6. Tanya tentang Mitra / Partner / Customer / Pelanggan
  if (q.includes('mitra') || q.includes('partner') || q.includes('customer') || q.includes('pelanggan') || q.includes('distributor') || q.includes('vendor')) {
    let response = `### 👥 Ringkasan Mitra Bisnis (Partners)\n\n`;
    response += `Total Mitra Terdaftar: **${summary.totalPartners}** (${summary.customersCount} Customer, ${summary.distributorsCount} Distributor)\n\n`;

    partners.forEach(p => {
      response += `- **${p.name}** [${p.category}] | Saldo / Piutang-Utang: **${formatRP(p.balance)}** | PIC: ${p.pic || '-'} | Kontak: ${p.phone || p.email || '-'}\n`;
    });

    return response;
  }

  // 7. Tanya tentang Gudang / Warehouse / Stock In Out
  if (q.includes('gudang') || q.includes('warehouse') || q.includes('stock in') || q.includes('stock out') || q.includes('audit')) {
    let response = `### 🏢 Informasi Gudang & Fasilitas\n\n`;
    response += `Total Gudang Aktif: **${warehouses.length} Gudang**\n\n`;

    if (warehouses.length > 0) {
      warehouses.forEach(w => {
        response += `- **${w.name}** (${w.code}) | Lokasi: ${w.location} | Kapasitas: ${w.capacity} unit | Status: \`${w.status}\` | Manager: ${w.manager || 'Admin'}\n`;
      });
    } else {
      response += `- **Gudang Utama**: Lokasi Jakarta Pusat | Kapasitas: 10,000 unit | Status: Active\n`;
    }

    return response;
  }

  // 8. Tanya tentang Log / Aktivitas Dokumen / Siapa yang buat atau bayar
  if (q.includes('log') || q.includes('aktivitas') || q.includes('siapa') || q.includes('dibuat') || q.includes('dibayar') || q.includes('diupdate')) {
    let response = `### 📜 Log Aktivitas Dokumen Terbaru\n\n`;
    const allLogs = invoices.flatMap(i => getInvoiceLogs(i));
    if (allLogs.length > 0) {
      allLogs.slice(-10).reverse().forEach(l => {
        response += `- **[${l.timestamp}] ${l.title}**: ${l.details} *(Oleh: ${l.user})*\n`;
      });
    } else {
      response += `Belum ada log aktivitas dokumen yang tercatat.`;
    }
    return response;
  }

  // 9. Default / Pertanyaan Umum: Berikan Executive Business Summary Lengkap & Jawaban Spesifik
  let response = `### 🤖 Smart Planning Assistant - Ringkasan Eksekutif Aplikasi\n\n`;
  response += `Halo! Berdasarkan data terintegrasi di dalam aplikasi saat ini, berikut adalah ringkasan informasi utama:\n\n`;

  response += `📊 **1. Performa Bisnis & Keuangan:**\n`;
  response += `- **Total Omset Penjualan:** ${formatRP(summary.totalSales)} (${summary.salesCount} faktur | Piutang: ${formatRP(summary.totalSalesRemaining)})\n`;
  response += `- **Total Pembelian Produk:** ${formatRP(summary.totalPurchases)} (${summary.purchasesCount} faktur | Utang: ${formatRP(summary.totalPurchasesRemaining)})\n`;
  response += `- **Total Pengeluaran Biaya:** ${formatRP(summary.totalCosts)}\n`;
  response += `- **Estimasi Laba Bersih:** **${formatRP(summary.netIncomeEstimate)}**\n\n`;

  response += `📦 **2. Inventaris & Produk:**\n`;
  response += `- Total Jenis Produk: **${summary.totalProducts} item**\n`;
  if (summary.lowStockProducts.length > 0) {
    response += `- ⚠️ Item Perlu Reorder: ${summary.lowStockProducts.map(p => p.name).join(', ')}\n`;
  } else {
    response += `- ✅ Semua stok produk berada pada tingkat aman.\n`;
  }
  response += `\n`;

  response += `👥 **3. Mitra Bisnis:**\n`;
  response += `- Total Mitra: ${summary.totalPartners} (${summary.customersCount} Pelanggan, ${summary.distributorsCount} Distributor)\n\n`;

  response += `💡 *Jawaban untuk pertanyaan Anda ("${query}"):*\n`;
  response += `Saya dapat membantu Anda memberikan analisa lebih spesifik mengenai penjualan, faktur pembelian, sisa utang/piutang, stok gudang, laporan biaya, akun kas/bank, atau log aktivitas dokumen. Silakan tanyakan detail apapun yang Anda perlukan!`;

  return response;
}
