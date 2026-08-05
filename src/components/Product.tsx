import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getStoredProducts, saveProducts, getIdPrefixSettings, getNextId } from '../lib/state';
import { setHasUnsavedChanges } from '../lib/unsaved';
import { 
  Plus, 
  X,
  Check,
  Search, 
  HelpCircle, 
  FileText, 
  TrendingDown, 
  TrendingUp, 
  Hash, 
  Tag, 
  Layers, 
  Package, 
  Coins, 
  AlertTriangle, 
  AlertCircle,
  XCircle,
  Eye,
  Printer,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Info,
  Download,
  Upload,
  Trash2,
  SlidersHorizontal
} from 'lucide-react';

interface ProductItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  stock: number;
  price: number;
  sellPrice: number;
  image: string;
  hop: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  brand?: string;
  weight?: string;
  minStock?: number;
}

const initialProducts: ProductItem[] = [];

const formatIDR = (num: number) => {
  const formatted = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(num);
  return `Rp ${formatted}`;
};

const getAvatarGradient = (name: string) => {
  const gradients = [
    'from-rose-500 to-indigo-600',
    'from-emerald-500 to-teal-700',
    'from-amber-500 to-orange-600',
    'from-purple-500 to-pink-600',
    'from-orange-500 to-amber-600',
    'from-violet-500 to-purple-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

export function Product({ searchQuery = '' }: { searchQuery?: string }) {
  const [products, setProducts] = useState<ProductItem[]>(() => getStoredProducts());
  const [selectedProductForPriceCard, setSelectedProductForPriceCard] = useState<ProductItem | null>(null);

  // Checkbox selection & delete states
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);

  // Search & Import States
  const [localSearch, setLocalSearch] = useState('');
  const [sortFilter, setSortFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showCategoryFilterDropdown, setShowCategoryFilterDropdown] = useState(false);
  const [showBrandFilterDropdown, setShowBrandFilterDropdown] = useState(false);
  const [categoryDropdownSearch, setCategoryDropdownSearch] = useState('');
  const [brandDropdownSearch, setBrandDropdownSearch] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const importFileInputRef = React.useRef<HTMLInputElement>(null);

  // CSV Import Utilities
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const downloadCSVTemplate = () => {
    const headers = "Name,Category,Brand,SKU,Stock,Cost_Price,Sell_Price,Min_Stock\n";
    const row1 = `"Serene Brightening Serum",Skincare,Serene,SKU-SER-001,50,75000,125000,10\n`;
    const row2 = `"L'Oreal Glow Cleanser",Skincare,"L'Oreal",SKU-[#002],30,45000,85000,5`;
    const csvContent = headers + row1 + row2;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `template_product_catalog.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string) => {
    const lines = text.replace(/\r/g, '').split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return {
        success: false,
        error: "File CSV kosong atau hanya berisi header."
      };
    }

    const newItems: ProductItem[] = [];
    const prefix = getIdPrefixSettings().productPrefix || 'PRD-';
    let currentCount = products.length;

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length === 0 || cols.every(c => c === '')) continue;

      if (cols.length < 7) {
        return {
          success: false,
          error: `Kolom tidak lengkap pada baris ${i + 1}. Diperlukan minimal 7 kolom: Name, Category, Brand, SKU, Stock, Cost_Price, Sell_Price.`
        };
      }

      const name = cols[0];
      const category = cols[1] || 'Skincare';
      const brand = cols[2] || 'Serene';
      const sku = cols[3] || `SKU-${String(currentCount + 1).padStart(3, '0')}`;
      const stock = parseInt(cols[4]) || 0;
      const price = parseFloat(cols[5]) || 0;
      const sellPrice = parseFloat(cols[6]) || 0;
      const minStock = cols[7] ? parseInt(cols[7]) : 10;

      if (!name) {
        return {
          success: false,
          error: `Nama produk wajib diisi pada baris ${i + 1}.`
        };
      }

      currentCount++;
      const prodId = getNextId([...products, ...newItems], prefix);
      const status: 'In Stock' | 'Low Stock' | 'Out of Stock' = stock <= 0 ? 'Out of Stock' : stock <= minStock ? 'Low Stock' : 'In Stock';

      newItems.push({
        id: prodId,
        name,
        category,
        brand,
        sku,
        stock,
        price,
        sellPrice,
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=300',
        hop: price,
        status,
        minStock
      });
    }

    if (newItems.length === 0) {
      return { success: false, error: "Tidak ada data produk yang valid ditemukan." };
    }

    const updatedProducts = [...newItems, ...products];
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
    return { success: true, count: newItems.length };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const res = parseCSV(text);
      if (!res.success) {
        setImportError(res.error || "Gagal mengimpor file.");
      } else {
        setImportError(null);
        setShowImportModal(false);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Add Product Modal & Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [view, setView] = useState<'list' | 'create'>('list');
  const [showGuideModal, setShowGuideModal] = useState(false);

  React.useEffect(() => {
    setHasUnsavedChanges(view === 'create' || showAddModal);
  }, [view, showAddModal]);
  const [showImageSection, setShowImageSection] = useState(false);
  const [showTaxSettings, setShowTaxSettings] = useState(false);
  const [buyThisItem, setBuyThisItem] = useState(true);
  const [sellThisItem, setSellThisItem] = useState(true);
  const [trackInventory, setTrackInventory] = useState(false);
  const [newProdUnit, setNewProdUnit] = useState('Pcs');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [showWholesale, setShowWholesale] = useState(false);
  const [wholesalePrice, setWholesalePrice] = useState('0');

  // Custom select dropdown open states
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [newBrandInput, setNewBrandInput] = useState('');
  
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  
  // Brands list state
  const [brands, setBrands] = useState<string[]>(() => {
    const defaultBrands = ['Serene', "L'Oreal", 'Innisfree', 'Somethinc', 'The Ordinary'];
    const storedBrands = localStorage.getItem('methodic_brands_v3');
    if (storedBrands) {
      try {
        return JSON.parse(storedBrands);
      } catch (e) {
        // fallback
      }
    }
    const stored = localStorage.getItem('methodic_products_v2') || localStorage.getItem('methodic_products_v3');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const uniqueBrands = new Set(defaultBrands);
        parsed.forEach((p: any) => {
          if (p.brand) uniqueBrands.add(p.brand);
        });
        return Array.from(uniqueBrands);
      } catch (e) {
        return defaultBrands;
      }
    }
    return defaultBrands;
  });

  const [brandToDelete, setBrandToDelete] = useState<string | null>(null);

  React.useEffect(() => {
    localStorage.setItem('methodic_brands_v3', JSON.stringify(brands));
  }, [brands]);

  const handleConfirmDeleteBrand = () => {
    if (!brandToDelete) return;
    const targetBrand = brandToDelete;

    const updatedBrands = brands.filter(b => b !== targetBrand);
    setBrands(updatedBrands);

    const updatedProducts = products.filter(p => p.brand !== targetBrand);
    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    if (brandFilter === targetBrand) {
      setBrandFilter('');
    }
    if (newProdBrand === targetBrand) {
      setNewProdBrand(updatedBrands[0] || 'Serene');
    }

    setBrandToDelete(null);
    setShowBrandFilterDropdown(false);
  };

  const [categories, setCategories] = useState<string[]>(() => {
    const defaultCategories = ['Skincare', 'Makeup', 'Haircare', 'Bodycare'];
    const storedCats = localStorage.getItem('methodic_categories_v3');
    if (storedCats) {
      try {
        return JSON.parse(storedCats);
      } catch (e) {}
    }
    const stored = localStorage.getItem('methodic_products_v2') || localStorage.getItem('methodic_products_v3');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const uniqueCats = new Set(defaultCategories);
        parsed.forEach((p: any) => {
          if (p.category) uniqueCats.add(p.category);
        });
        return Array.from(uniqueCats);
      } catch (e) {
        return defaultCategories;
      }
    }
    return defaultCategories;
  });

  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  React.useEffect(() => {
    localStorage.setItem('methodic_categories_v3', JSON.stringify(categories));
  }, [categories]);

  const handleConfirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    const targetCategory = categoryToDelete;

    const updatedCategories = categories.filter(c => c !== targetCategory);
    setCategories(updatedCategories);

    const updatedProducts = products.filter(p => p.category !== targetCategory);
    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    if (categoryFilter === targetCategory) {
      setCategoryFilter('');
    }
    if (newProdCategory === targetCategory) {
      setNewProdCategory(updatedCategories[0] || 'Skincare');
    }

    setCategoryToDelete(null);
    setShowCategoryFilterDropdown(false);
    setShowCategoryDropdown(false);
  };

  const handleAddNewBrand = () => {
    const trimmed = newBrandInput.trim();
    if (!trimmed) return;
    if (!brands.includes(trimmed)) {
      setBrands([...brands, trimmed]);
    }
    setNewProdBrand(trimmed);
    setNewBrandInput('');
    setIsAddingBrand(false);
    setShowBrandDropdown(false);
  };

  const handleAddNewCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
    }
    setNewProdCategory(trimmed);
    setNewCategoryInput('');
    setIsAddingCategory(false);
    setShowCategoryDropdown(false);
  };

  const [previewCardTheme, setPreviewCardTheme] = useState<'classic' | 'promo' | 'minimalist'>('minimalist');

  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Skincare');
  const [newProdBrand, setNewProdBrand] = useState('Serene');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdStock, setNewProdStock] = useState('100');
  const [newProdMinStock, setNewProdMinStock] = useState('10');
  const [newProdPrice, setNewProdPrice] = useState('100000');
  const [newProdSellPrice, setNewProdSellPrice] = useState('150000');
  const [newProdHop, setNewProdHop] = useState('80000');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdWeight, setNewProdWeight] = useState('');

  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const handleEditProduct = (p: ProductItem) => {
    setEditingProductId(p.id);
    setNewProdName(p.name);
    setNewProdCategory(p.category);
    setNewProdBrand(p.brand || 'Serene');
    setNewProdSku(p.sku);
    setNewProdStock(String(p.stock));
    setNewProdMinStock(String(p.minStock || 10));
    setNewProdPrice(String(p.price));
    setNewProdSellPrice(String(p.sellPrice));
    setNewProdHop(String(p.hop || p.price));
    setNewProdWeight(p.weight || '');
    setNewProdImage(p.image || '');
    setView('create');
  };

  const handleProductCreateSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newProdName.trim()) return;

    const limitMinStock = Number(newProdMinStock) || 10;
    const currentStock = Number(newProdStock) || 0;

    let updatedProducts: ProductItem[];

    if (editingProductId) {
      updatedProducts = products.map(p => {
        if (p.id === editingProductId) {
          return {
            ...p,
            name: newProdName,
            category: newProdCategory,
            brand: newProdBrand || 'Serene',
            sku: newProdSku || p.sku,
            stock: currentStock,
            price: Number(newProdPrice) || 0,
            sellPrice: Number(newProdSellPrice) || 0,
            hop: Number(newProdHop) || Number(newProdPrice) || 0,
            weight: newProdWeight || '',
            image: newProdImage || p.image,
            minStock: limitMinStock,
            status: currentStock === 0 ? 'Out of Stock' : currentStock <= limitMinStock ? 'Low Stock' : 'In Stock'
          };
        }
        return p;
      });
    } else {
      const prefix = getIdPrefixSettings().productPrefix || 'PRD-';
      const newProduct: ProductItem = {
        id: getNextId(products, prefix),
        name: newProdName,
        category: newProdCategory,
        brand: newProdBrand || 'Serene',
        sku: newProdSku || `SKU/${Math.floor(10000 + Math.random() * 90000)}`,
        stock: currentStock,
        price: Number(newProdPrice) || 0,
        sellPrice: Number(newProdSellPrice) || 0,
        hop: Number(newProdHop) || Number(newProdPrice) || 0,
        weight: newProdWeight || '',
        image: newProdImage || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=100&q=80',
        minStock: limitMinStock,
        status: currentStock === 0 ? 'Out of Stock' : currentStock <= limitMinStock ? 'Low Stock' : 'In Stock'
      };
      updatedProducts = [newProduct, ...products];
    }

    setProducts(updatedProducts);
    saveProducts(updatedProducts);
    setEditingProductId(null);
    setView('list');

    // Reset fields
    setNewProdName('');
    setNewProdCategory('Skincare');
    setNewProdBrand('Serene');
    setNewProdSku('');
    setNewProdStock('100');
    setNewProdMinStock('10');
    setNewProdPrice('100000');
    setNewProdSellPrice('150000');
    setNewProdHop('80000');
    setNewProdImage('');
    setNewProdWeight('');
    setNewProdDesc('');
    setShowImageSection(false);
    setShowTaxSettings(false);
    setBuyThisItem(true);
    setSellThisItem(true);
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleProductCreateSubmit(e);
  };

  // Custom states for the Printable Price Card Label
  const [storeName, setStoreName] = useState('SERENE BEAUTY');
  const [cardTheme, setCardTheme] = useState<'classic' | 'promo' | 'minimalist'>('minimalist');
  const [badgeText, setBadgeText] = useState('BEST SELLER');
  const [promoDiscount, setPromoDiscount] = useState('15% OFF');
  const [customNote, setCustomNote] = useState('100% Authentic Product');
  const [showBarcode, setShowBarcode] = useState(true);
  const [showQRCode, setShowQRCode] = useState(true);
  const [showOriginalPrice, setShowOriginalPrice] = useState(true);
  const [customPrice, setCustomPrice] = useState<number | null>(null);

  // Compute stats dynamically!
  const totalItems = products.length;
  const totalStockVal = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const totalSellVal = products.reduce((sum, p) => sum + (p.stock * p.sellPrice), 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= (p.minStock ?? 50)).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  const dynamicSummaryStats = [
    { title: 'Total Products', value: `${totalItems}`, change: totalItems === 0 ? '0%' : '+20.0%', trend: totalItems === 0 ? 'neutral' : 'up', icon: Package, prev: totalItems === 0 ? '0' : '5' },
    { title: 'Stock Value', value: formatIDR(totalStockVal), change: totalItems === 0 ? '0%' : '+8.6%', trend: totalItems === 0 ? 'neutral' : 'up', icon: Coins, prev: totalItems === 0 ? 'Rp 0' : 'Rp 94.300.000' },
    { title: 'Selling Value', value: formatIDR(totalSellVal), change: totalItems === 0 ? '0%' : '+12.4%', trend: totalItems === 0 ? 'neutral' : 'up', icon: Coins, prev: totalItems === 0 ? 'Rp 0' : 'Rp 123.000.000' },
    { title: 'Low Stock Alert', value: `${lowStockCount}`, change: totalItems === 0 ? '0%' : '-50.0%', trend: totalItems === 0 ? 'neutral' : 'down', icon: AlertTriangle, prev: totalItems === 0 ? '0' : '2' },
    { title: 'Out of Stock', value: `${outOfStockCount}`, change: totalItems === 0 ? '0%' : '+100%', trend: totalItems === 0 ? 'neutral' : 'up', icon: XCircle, prev: totalItems === 0 ? '0' : '0' }
  ];

  const effectiveQuery = (localSearch || searchQuery).toLowerCase().trim();
  let filteredProducts = products.filter(p => {
    const matchesQuery = !effectiveQuery || 
      p.name.toLowerCase().includes(effectiveQuery) || 
      p.id.toLowerCase().includes(effectiveQuery) ||
      p.sku.toLowerCase().includes(effectiveQuery) ||
      p.category.toLowerCase().includes(effectiveQuery) ||
      (p.brand && p.brand.toLowerCase().includes(effectiveQuery));

    const matchesStatus = !statusFilter || p.status === statusFilter;
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    const matchesBrand = !brandFilter || p.brand === brandFilter;

    const minP = minPriceFilter ? Number(minPriceFilter) : 0;
    const maxP = maxPriceFilter ? Number(maxPriceFilter) : Infinity;
    const matchesPrice = p.sellPrice >= minP && (maxP === Infinity || p.sellPrice <= maxP);

    return matchesQuery && matchesStatus && matchesCategory && matchesBrand && matchesPrice;
  });

  if (sortFilter === 'A-Z') {
    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortFilter === 'Z-A') {
    filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sortFilter === 'HighestPrice') {
    filteredProducts.sort((a, b) => b.sellPrice - a.sellPrice);
  } else if (sortFilter === 'LowestPrice') {
    filteredProducts.sort((a, b) => a.sellPrice - b.sellPrice);
  } else if (sortFilter === 'HighestStock') {
    filteredProducts.sort((a, b) => b.stock - a.stock);
  }

  const toggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteProducts = () => {
    let updated: ProductItem[] = [];
    if (productToDelete) {
      updated = products.filter(p => p.id !== productToDelete.id);
      setSelectedProductIds(prev => prev.filter(id => id !== productToDelete.id));
      setProductToDelete(null);
    } else if (selectedProductIds.length > 0) {
      updated = products.filter(p => !selectedProductIds.includes(p.id));
      setSelectedProductIds([]);
    }
    setProducts(updated);
    saveProducts(updated);
    setShowDeleteModal(false);
  };

  const filteredBrands = brands.filter(brand =>
    brand.toLowerCase().includes(brandSearchQuery.toLowerCase())
  );

  const filteredCategories = categories.filter(cat =>
    cat.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  const renderCreateView = () => {
    return (
      <div className="w-full min-h-screen bg-[#0A0A0A] text-white pl-8 pr-8 pb-12 pt-[9px] font-sans">
        <div className="w-full">
          {/* Header bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setView('list')}
              className="p-2 border border-[#2A2A2A] rounded-lg text-[#909090] hover:text-white hover:bg-[#1C1D20] transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <span className="text-[10px] font-bold text-[#EA580C] uppercase tracking-widest block mb-0.5">New Product</span>
              <h1 className="text-[20px] font-semibold tracking-tight text-white leading-tight">
                Add New Product
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => setShowGuideModal(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 border border-[#2A2A2A] rounded-lg hover:bg-[#1E1E20] hover:text-white transition-colors cursor-pointer text-[#D5D5D5]"
            >
              <HelpCircle size={14} className="text-[#EA580C]" />
              <span>Guide</span>
            </button>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-end mb-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center bg-[#18191E] border border-[#2B2E38] rounded-full p-1 shadow-lg">
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (newProdName.trim()) {
                    handleProductCreateSubmit(e);
                  }
                }}
                disabled={!newProdName.trim()}
                className={`flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium transition-all rounded-full ${
                  newProdName.trim() 
                    ? 'text-[#10B981] hover:text-[#34D399] hover:bg-[#10B981]/15 cursor-pointer active:scale-95' 
                    : 'text-gray-500 cursor-not-allowed opacity-50'
                }`}
              >
                <CheckCircle size={15} className={newProdName.trim() ? "text-[#10B981]" : "text-gray-500"} />
                <span>Save</span>
              </button>

              <div className="h-4 w-[1px] bg-[#2C2F3A] my-auto" />

              <button 
                type="button"
                onClick={() => setView('list')}
                className="flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium text-[#EF4444] hover:text-[#F87171] hover:bg-[#EF4444]/15 rounded-full transition-all cursor-pointer active:scale-95"
              >
                <XCircle size={15} className="text-[#EF4444]" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Core Form Content */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleProductCreateSubmit(e);
          }}
          className="w-full space-y-6"
        >
            
            {/* CARD 1: Core Product Information */}
            <div className="bg-[#141518] border border-[#2B2D36] rounded-xl p-6 shadow-xl space-y-6">

              {/* Product Photo Upload Section */}
              <div>
                <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2 flex items-center justify-between">
                  <span>Product Image</span>
                  <span className="text-[10px] text-[#909090] font-normal">Supports drag & drop</span>
                </label>
                {newProdImage ? (
                  <div className="relative border border-[#2B2D36] bg-[#141518] rounded-xl p-3 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <img 
                        src={newProdImage} 
                        alt="Product Preview" 
                        className="w-12 h-12 object-cover rounded-lg border border-[#2B2D36]"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="text-xs font-medium text-white">Product Image Uploaded Successfully</p>
                        <p className="text-[10px] text-gray-500 font-mono">Format: Base64 / Local Image</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewProdImage('')}
                      className="p-1.5 hover:bg-[#20222B] rounded-lg text-gray-400 hover:text-[#EA580C] transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div 
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-[#EA580C]', 'bg-[#EA580C]/10');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-[#EA580C]', 'bg-[#EA580C]/10');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-[#EA580C]', 'bg-[#EA580C]/10');
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setNewProdImage(event.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="border border-dashed border-[#2B2D36] hover:border-[#EA580C] bg-[#141518] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative group"
                  >
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setNewProdImage(event.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="p-3 bg-[#1B1D24] rounded-full border border-[#2B2D36] text-[#909090] group-hover:text-[#EA580C] group-hover:border-[#EA580C] transition-all mb-3">
                      <Plus size={20} />
                    </div>
                    <p className="text-xs font-semibold text-white mb-1">Upload or Drag Product Photo</p>
                    <p className="text-[10px] text-gray-500">Supports PNG, JPG, GIF up to 5MB</p>
                  </div>
                )}
              </div>

              {/* Row 1: Product Name */}
              <div>
                <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">
                  <span className="text-red-500 mr-1">*</span>Product Name
                </label>
                <input 
                  type="text" 
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Brightening Facial Wash"
                  className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all"
                />
              </div>

              {/* Row 2: SKU, Unit & Weight */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2 flex items-center justify-between">
                    <span>Code / SKU</span>
                    <button
                      type="button"
                      onClick={() => setNewProdSku(`SKU/${Math.floor(10000 + Math.random() * 90000)}`)}
                      className="text-[10px] text-[#EA580C] hover:underline cursor-pointer"
                    >
                      Random Code
                    </button>
                  </label>
                  <input 
                    type="text" 
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    placeholder="e.g. SKU/28401"
                    className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] font-mono text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all"
                  />
                </div>

                {/* Custom Unit Dropdown */}
                <div className="relative">
                  <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">
                    <span className="text-red-500 mr-1">*</span>Unit
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUnitDropdown(!showUnitDropdown);
                      setShowCategoryDropdown(false);
                      setShowBrandDropdown(false);
                    }}
                    className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all flex items-center justify-between text-left cursor-pointer"
                  >
                    <span>{newProdUnit}</span>
                    <ChevronDown size={14} className="text-[#909090]" />
                  </button>

                  <AnimatePresence>
                    {showUnitDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowUnitDropdown(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.98 }}
                          transition={{ duration: 0.12 }}
                          className="absolute left-0 top-full mt-2 w-full bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-50 overflow-hidden max-h-[200px] overflow-y-auto"
                        >
                          {['Pcs', 'Box', 'Bottle', 'Tube', 'Gram', 'Dozen'].map((unit) => (
                            <button
                              key={unit}
                              type="button"
                              onClick={() => {
                                setNewProdUnit(unit);
                                setShowUnitDropdown(false);
                              }}
                              className={`w-full text-left px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                                newProdUnit === unit
                                  ? 'bg-[#222530] text-white font-semibold'
                                  : 'text-[#D5D5D5] hover:bg-[#20222B] hover:text-white'
                              }`}
                            >
                              <span>{unit}</span>
                              {newProdUnit === unit && <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Weight Field */}
                <div>
                  <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">
                    Weight (grams)
                  </label>
                  <input 
                    type="text" 
                    value={newProdWeight}
                    onChange={(e) => setNewProdWeight(e.target.value)}
                    placeholder="e.g. 250 or 250g"
                    className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all"
                  />
                </div>
              </div>

              {/* Row 3: Category & Brand / Manufacturer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Custom Category Dropdown */}
                <div className="relative">
                  <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">
                    <span className="text-red-500 mr-1">*</span>Category
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryDropdown(!showCategoryDropdown);
                      setShowUnitDropdown(false);
                      setShowBrandDropdown(false);
                    }}
                    className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all flex items-center justify-between text-left cursor-pointer"
                  >
                    <span>{newProdCategory}</span>
                    <ChevronDown size={14} className="text-[#909090]" />
                  </button>

                  <AnimatePresence>
                    {showCategoryDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => {
                          setShowCategoryDropdown(false);
                          setIsAddingCategory(false);
                          setNewCategoryInput('');
                          setCategorySearchQuery('');
                        }} />
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.98 }}
                          transition={{ duration: 0.12 }}
                          className="absolute left-0 top-full mt-2 w-full bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-50 overflow-hidden"
                        >
                          {/* Search Input */}
                          <div className="p-2 mb-1 border-b border-[#262830] flex items-center gap-2 bg-[#1B1D24] rounded-xl" onClick={(e) => e.stopPropagation()}>
                            <Search size={14} className="text-[#8A8F9E] shrink-0" />
                            <input
                              type="text"
                              value={categorySearchQuery}
                              onChange={(e) => setCategorySearchQuery(e.target.value)}
                              placeholder="Search category..."
                              className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-[#6E7079]"
                            />
                            {categorySearchQuery && (
                              <button
                                type="button"
                                onClick={() => setCategorySearchQuery('')}
                                className="text-[#8A8F9E] hover:text-white shrink-0"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>

                          <div className="max-h-48 overflow-y-auto space-y-0.5">
                            {filteredCategories.length > 0 && filteredCategories.map((cat) => (
                              <div
                                key={cat}
                                className={`w-full px-3.5 py-1.5 text-[13px] font-medium rounded-xl transition-all flex items-center justify-between group ${
                                  newProdCategory === cat
                                    ? 'bg-[#222530] text-white font-semibold'
                                    : 'text-[#D5D5D5] hover:bg-[#20222B] hover:text-white'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewProdCategory(cat);
                                    setShowCategoryDropdown(false);
                                    setCategorySearchQuery('');
                                  }}
                                  className="flex-1 text-left truncate flex items-center justify-between mr-2 cursor-pointer py-1"
                                >
                                  <span className="truncate">{cat}</span>
                                  {newProdCategory === cat && <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0 ml-1.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCategoryToDelete(cat);
                                  }}
                                  className="p-1 text-[#8A8F9E] hover:text-rose-400 hover:bg-[#2B2D38] rounded-lg transition-colors cursor-pointer shrink-0"
                                  title={`Hapus kategori ${cat}`}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>

                          {filteredCategories.length === 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                const trimmed = categorySearchQuery.trim();
                                if (trimmed) {
                                  if (!categories.includes(trimmed)) {
                                    setCategories([...categories, trimmed]);
                                  }
                                  setNewProdCategory(trimmed);
                                  setCategorySearchQuery('');
                                  setShowCategoryDropdown(false);
                                } else {
                                  setIsAddingCategory(true);
                                }
                              }}
                              className="w-full text-left px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all flex items-center gap-1.5 text-[#EA580C] hover:bg-[#20222B] border-t border-[#262830] mt-1 cursor-pointer"
                            >
                              <Plus size={14} />
                              <span>Add "{categorySearchQuery}" as New Category</span>
                            </button>
                          ) : !isAddingCategory ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsAddingCategory(true);
                              }}
                              className="w-full text-left px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all flex items-center gap-1.5 text-[#EA580C] hover:bg-[#20222B] border-t border-[#262830] mt-1 cursor-pointer"
                            >
                              <Plus size={14} />
                              <span>Add New Category</span>
                            </button>
                          ) : (
                            <div className="p-2 border-t border-[#262830] mt-1 flex items-center gap-1.5 bg-[#1B1D24] rounded-xl" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                autoFocus
                                value={newCategoryInput}
                                onChange={(e) => setNewCategoryInput(e.target.value)}
                                placeholder="Type category name..."
                                className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder-[#6E7079]"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddNewCategory();
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={handleAddNewCategory}
                                className="p-1 bg-[#EA580C] hover:bg-[#C2410C] rounded-lg text-white cursor-pointer transition-colors"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingCategory(false);
                                  setNewCategoryInput('');
                                }}
                                className="p-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 cursor-pointer transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Custom Brand Dropdown */}
                <div className="relative">
                  <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">
                    <span className="text-red-500 mr-1">*</span>Brand / Manufacturer
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBrandDropdown(!showBrandDropdown);
                      setShowCategoryDropdown(false);
                      setShowUnitDropdown(false);
                    }}
                    className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all flex items-center justify-between text-left cursor-pointer"
                  >
                    <span>{newProdBrand}</span>
                    <ChevronDown size={14} className="text-[#909090]" />
                  </button>

                  <AnimatePresence>
                    {showBrandDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => {
                          setShowBrandDropdown(false);
                          setIsAddingBrand(false);
                          setNewBrandInput('');
                          setBrandSearchQuery('');
                        }} />
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.98 }}
                          transition={{ duration: 0.12 }}
                          className="absolute left-0 top-full mt-2 w-full bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-50 overflow-hidden"
                        >
                          {/* Search Input */}
                          <div className="p-2 mb-1 border-b border-[#262830] flex items-center gap-2 bg-[#1B1D24] rounded-xl" onClick={(e) => e.stopPropagation()}>
                            <Search size={14} className="text-[#8A8F9E] shrink-0" />
                            <input
                              type="text"
                              value={brandSearchQuery}
                              onChange={(e) => setBrandSearchQuery(e.target.value)}
                              placeholder="Search brand..."
                              className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-[#6E7079]"
                            />
                            {brandSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setBrandSearchQuery('')}
                                className="text-[#8A8F9E] hover:text-white shrink-0"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>

                          <div className="max-h-48 overflow-y-auto space-y-0.5">
                            {filteredBrands.length > 0 && filteredBrands.map((brand) => (
                              <div
                                key={brand}
                                className={`w-full px-3.5 py-1.5 text-[13px] font-medium rounded-xl transition-all flex items-center justify-between group ${
                                  newProdBrand === brand
                                    ? 'bg-[#222530] text-white font-semibold'
                                    : 'text-[#D5D5D5] hover:bg-[#20222B] hover:text-white'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewProdBrand(brand);
                                    setShowBrandDropdown(false);
                                    setBrandSearchQuery('');
                                  }}
                                  className="flex-1 text-left truncate flex items-center justify-between mr-2 cursor-pointer py-1"
                                >
                                  <span className="truncate">{brand}</span>
                                  {newProdBrand === brand && <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0 ml-1.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setBrandToDelete(brand);
                                  }}
                                  className="p-1 text-[#8A8F9E] hover:text-rose-400 hover:bg-[#2B2D38] rounded-lg transition-colors cursor-pointer shrink-0"
                                  title={`Hapus brand ${brand}`}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>

                          {filteredBrands.length === 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                const trimmed = brandSearchQuery.trim();
                                if (trimmed) {
                                  if (!brands.includes(trimmed)) {
                                    setBrands([...brands, trimmed]);
                                  }
                                  setNewProdBrand(trimmed);
                                  setBrandSearchQuery('');
                                  setShowBrandDropdown(false);
                                } else {
                                  setIsAddingBrand(true);
                                }
                              }}
                              className="w-full text-left px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all flex items-center gap-1.5 text-[#EA580C] hover:bg-[#20222B] border-t border-[#262830] mt-1 cursor-pointer"
                            >
                              <Plus size={14} />
                              <span>Add "{brandSearchQuery}" as New Brand</span>
                            </button>
                          ) : !isAddingBrand ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsAddingBrand(true);
                              }}
                              className="w-full text-left px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all flex items-center gap-1.5 text-[#EA580C] hover:bg-[#20222B] border-t border-[#262830] mt-1 cursor-pointer"
                            >
                              <Plus size={14} />
                              <span>Add New Brand</span>
                            </button>
                          ) : (
                            <div className="p-2 border-t border-[#262830] mt-1 flex items-center gap-1.5 bg-[#1B1D24] rounded-xl" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                autoFocus
                                value={newBrandInput}
                                onChange={(e) => setNewBrandInput(e.target.value)}
                                placeholder="Type brand name..."
                                className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder-[#6E7079]"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddNewBrand();
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={handleAddNewBrand}
                                className="p-1 bg-[#EA580C] hover:bg-[#C2410C] rounded-lg text-white cursor-pointer transition-colors"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingBrand(false);
                                  setNewBrandInput('');
                                }}
                                className="p-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 cursor-pointer transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Row 4: Description */}
              <div>
                <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">
                  Product Description
                </label>
                <textarea 
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Write product description, instructions, or main ingredients..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all resize-none"
                />
              </div>
            </div>

             {/* CARD 2: Price & Stock Settings */}
             <div className="bg-[#141518] border border-[#2B2D36] rounded-xl p-6 shadow-xl space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">
                      <span className="text-red-500 mr-1">*</span>Latest Cost Price (COGS)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#6E7079]">Rp</span>
                      <input 
                        type="number"
                        min="0"
                        value={newProdPrice}
                        onChange={(e) => {
                          setNewProdPrice(e.target.value);
                          setNewProdHop(e.target.value);
                        }}
                        className="w-full h-[38px] pl-9 pr-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] font-semibold text-right text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">
                      <span className="text-red-500 mr-1">*</span>Retail Selling Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#6E7079]">Rp</span>
                      <input 
                        type="number"
                        min="0"
                        value={newProdSellPrice}
                        onChange={(e) => setNewProdSellPrice(e.target.value)}
                        className="w-full h-[38px] pl-9 pr-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] font-semibold text-right text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">
                      <span className="text-red-500 mr-1">*</span>Initial Stock Quantity
                    </label>
                    <input 
                      type="number"
                      min="0"
                      value={newProdStock}
                      onChange={(e) => setNewProdStock(e.target.value)}
                      className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] font-semibold text-right text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all"
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">
                      <span className="text-red-500 mr-1">*</span>Minimum Stock (Low Stock)
                    </label>
                    <input 
                      type="number"
                      min="0"
                      value={newProdMinStock}
                      onChange={(e) => setNewProdMinStock(e.target.value)}
                      className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] font-semibold text-right text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all"
                      placeholder="10"
                    />
                  </div>
                </div>
             </div>

           </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full font-sans relative overflow-x-hidden bg-[#0A0A0A]">
      <AnimatePresence mode="wait" initial={false}>
        {view === 'create' ? (
          <motion.div
            key="create-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full flex flex-col"
          >
            {renderCreateView()}
          </motion.div>
        ) : (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full flex flex-col"
          >
            <div className="pl-8 pr-8 pb-8 pt-[9px] overflow-y-auto flex-1 bg-[#0A0A0A]">
        
        {/* Top Right Utilities & Actions Row */}
        <div className="flex items-start justify-between mb-8 pt-0">
          <div className="pb-0" style={{ paddingBottom: '0px' }}>
            <h1 className="text-[18px] font-semibold text-white tracking-tight mb-0 flex items-baseline" style={{ marginBottom: 0 }}>
              Product
            </h1>
            <p className="text-[13px] text-[#909090]">
              Manage skincare & beauty product stock, pricing, and categories.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-4">
            <div className="flex items-center gap-5 text-[12px] font-medium text-[#909090] mb-8">
              <AnimatePresence>
                {selectedProductIds.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex items-center gap-4 mr-1 pr-5 border-r border-[#2A2A2A]"
                  >
                    <span className="text-[#EA580C] font-semibold">{selectedProductIds.length} selected</span>
                    <button 
                      onClick={() => {
                        setProductToDelete(null);
                        setShowDeleteModal(true);
                      }}
                      className="flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors cursor-pointer font-medium"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              <button 
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
              >
                <HelpCircle size={14} /> Guide
              </button>
              <button className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                <FileText size={14} /> PDF
              </button>
            </div>
          </div>
        </div>

        {/* Card Container for Action Bar and Table */}
        {(() => {
          const activeFilterCount = (sortFilter ? 1 : 0) + (statusFilter ? 1 : 0) + (categoryFilter ? 1 : 0) + (brandFilter ? 1 : 0) + (minPriceFilter ? 1 : 0) + (maxPriceFilter ? 1 : 0);
          
          const getCategoryFilterLabel = () => {
            if (categoryFilter) return categoryFilter;
            return 'Kategori';
          };

          const availableCategories = Array.from(new Set([...categories, ...products.map(p => p.category).filter(Boolean)]));
          const availableBrands = Array.from(new Set([...brands, ...products.map(p => p.brand).filter(Boolean)]));

          const filteredCategories = availableCategories.filter(cat => 
            cat.toLowerCase().includes(categoryDropdownSearch.toLowerCase())
          );
          const filteredBrands = availableBrands.filter(b => 
            b.toLowerCase().includes(brandDropdownSearch.toLowerCase())
          );

          return (
            <div className="bg-[#131417] border border-[#232427] rounded-2xl shadow-2xl relative z-10">
              {/* Action Bar (Search and Filters) */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-3.5 border-b border-[#232427] bg-[#16171A] relative z-30 rounded-t-2xl">
                {/* Category Dropdown (replacing Show Filters) */}
                <div className="relative z-30">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowCategoryFilterDropdown(!showCategoryFilterDropdown);
                      setShowBrandFilterDropdown(false);
                      setShowStatusDropdown(false);
                      setCategoryDropdownSearch('');
                    }}
                    className={`flex items-center justify-between gap-2.5 px-3.5 py-2 text-[13px] font-medium text-white bg-[#141518] transition-all cursor-pointer rounded-xl border min-w-[140px] ${
                      showCategoryFilterDropdown 
                        ? 'border-[#EA580C] ring-2 ring-[#EA580C]' 
                        : categoryFilter || showFilterPanel
                          ? 'border-[#EA580C] text-white'
                          : 'border-[#2B2D36] hover:border-[#3E414E]'
                    }`}
                  >
                    <span className="truncate max-w-[110px]">{getCategoryFilterLabel()}</span>
                    <ChevronDown size={15} className={`text-[#8A8F9E] transition-transform duration-200 shrink-0 ${showCategoryFilterDropdown ? 'rotate-180 text-white' : ''}`} />
                    {categoryFilter && (
                      <span className="w-2 h-2 rounded-full bg-[#EA580C] ml-0.5 shrink-0" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showCategoryFilterDropdown && (
                      <>
                        <div className="fixed inset-0 z-[999]" onClick={() => setShowCategoryFilterDropdown(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.98 }}
                          transition={{ duration: 0.12 }}
                          className="absolute left-0 top-full mt-2 w-56 bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-[1000] overflow-hidden"
                        >
                          {/* Search Input for Categories */}
                          <div className="p-1 mb-1 border-b border-[#262830]">
                            <div className="relative flex items-center">
                              <Search size={13} className="absolute left-2.5 text-[#8A8F9E]" />
                              <input
                                type="text"
                                value={categoryDropdownSearch}
                                onChange={(e) => setCategoryDropdownSearch(e.target.value)}
                                placeholder="Cari kategori..."
                                className="w-full bg-[#1C1D21] border border-[#2B2D36] rounded-lg pl-8 pr-2 py-1 text-[12px] text-white focus:outline-none focus:border-[#EA580C] placeholder:text-[#6E7079]"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>

                          <div className="max-h-52 overflow-y-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setCategoryFilter('');
                                setShowCategoryFilterDropdown(false);
                              }}
                              className={`w-full text-left px-3.5 py-2 text-[13px] font-medium rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                                !categoryFilter
                                  ? 'bg-[#222530] text-white'
                                  : 'text-[#D5D5D5] hover:bg-[#20222B] hover:text-white'
                              }`}
                            >
                              <span>Semua Kategori</span>
                              {!categoryFilter && (
                                <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
                              )}
                            </button>

                            {filteredCategories.map((cat) => (
                              <div
                                key={cat}
                                className={`w-full px-3.5 py-1.5 text-[13px] font-medium rounded-xl transition-all flex items-center justify-between group ${
                                  categoryFilter === cat
                                    ? 'bg-[#222530] text-white'
                                    : 'text-[#D5D5D5] hover:bg-[#20222B] hover:text-white'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCategoryFilter(cat);
                                    setShowCategoryFilterDropdown(false);
                                  }}
                                  className="flex-1 text-left truncate flex items-center justify-between mr-2 cursor-pointer py-0.5"
                                >
                                  <span className="truncate">{cat}</span>
                                  {categoryFilter === cat && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0 ml-1.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCategoryToDelete(cat);
                                  }}
                                  className="p-1 text-[#8A8F9E] hover:text-rose-400 hover:bg-[#2B2D38] rounded-lg transition-colors cursor-pointer shrink-0"
                                  title={`Hapus kategori ${cat}`}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                            {filteredCategories.length === 0 && (
                              <div className="px-3 py-2 text-xs text-[#707279] text-center">
                                Kategori tidak ditemukan
                              </div>
                            )}
                          </div>

                          <div className="my-1 border-t border-[#262830]" />

                          <button
                            type="button"
                            onClick={() => {
                              setShowFilterPanel(!showFilterPanel);
                              setShowCategoryFilterDropdown(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-[13px] font-medium text-[#EA580C] hover:bg-[#20222B] hover:text-white transition-all flex items-center justify-between rounded-xl cursor-pointer"
                          >
                            <span>{showFilterPanel ? 'Hide More Filters' : 'More Advanced Filters'}</span>
                            <SlidersHorizontal size={14} />
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Brand Dropdown (replacing Status Dropdown) */}
                <div className="relative z-30">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBrandFilterDropdown(!showBrandFilterDropdown);
                      setShowCategoryFilterDropdown(false);
                      setShowStatusDropdown(false);
                      setBrandDropdownSearch('');
                    }}
                    className={`flex items-center justify-between gap-3 px-3.5 py-2 text-[13px] font-medium text-white bg-[#141518] transition-all cursor-pointer min-w-[130px] rounded-xl border ${
                      showBrandFilterDropdown 
                        ? 'border-[#EA580C] ring-2 ring-[#EA580C]' 
                        : brandFilter
                          ? 'border-[#EA580C] text-white'
                          : 'border-[#2B2D36] hover:border-[#3E414E]'
                    }`}
                  >
                    <span className="truncate max-w-[110px]">{brandFilter ? brandFilter : 'All Brand'}</span>
                    <ChevronDown size={15} className={`text-[#8A8F9E] transition-transform duration-200 shrink-0 ${showBrandFilterDropdown ? 'rotate-180 text-white' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showBrandFilterDropdown && (
                      <>
                        <div className="fixed inset-0 z-[999]" onClick={() => setShowBrandFilterDropdown(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.98 }}
                          transition={{ duration: 0.12 }}
                          className="absolute left-0 top-full mt-2 w-52 bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-[1000] overflow-hidden"
                        >
                          {/* Search Input for Brands */}
                          <div className="p-1 mb-1 border-b border-[#262830]">
                            <div className="relative flex items-center">
                              <Search size={13} className="absolute left-2.5 text-[#8A8F9E]" />
                              <input
                                type="text"
                                value={brandDropdownSearch}
                                onChange={(e) => setBrandDropdownSearch(e.target.value)}
                                placeholder="Cari brand..."
                                className="w-full bg-[#1C1D21] border border-[#2B2D36] rounded-lg pl-8 pr-2 py-1 text-[12px] text-white focus:outline-none focus:border-[#EA580C] placeholder:text-[#6E7079]"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>

                          <div className="max-h-52 overflow-y-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setBrandFilter('');
                                setShowBrandFilterDropdown(false);
                              }}
                              className={`w-full text-left px-3.5 py-2 text-[13px] font-medium rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                                !brandFilter
                                  ? 'bg-[#222530] text-white'
                                  : 'text-[#D5D5D5] hover:bg-[#20222B] hover:text-white'
                              }`}
                            >
                              <span>All Brand</span>
                              {!brandFilter && (
                                <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
                              )}
                            </button>

                            {filteredBrands.map((brand) => (
                              <div
                                key={brand}
                                className={`w-full px-3.5 py-1.5 text-[13px] font-medium rounded-xl transition-all flex items-center justify-between group ${
                                  brandFilter === brand
                                    ? 'bg-[#222530] text-white'
                                    : 'text-[#D5D5D5] hover:bg-[#20222B] hover:text-white'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBrandFilter(brand);
                                    setShowBrandFilterDropdown(false);
                                  }}
                                  className="flex-1 text-left truncate flex items-center justify-between mr-2 cursor-pointer py-0.5"
                                >
                                  <span className="truncate">{brand}</span>
                                  {brandFilter === brand && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0 ml-1.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setBrandToDelete(brand);
                                  }}
                                  className="p-1 text-[#8A8F9E] hover:text-rose-400 hover:bg-[#2B2D38] rounded-lg transition-colors cursor-pointer shrink-0"
                                  title={`Hapus brand ${brand}`}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                            {filteredBrands.length === 0 && (
                              <div className="px-3 py-2 text-xs text-[#707279] text-center">
                                Brand tidak ditemukan
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Search Input */}
                <div className="flex-1 relative flex items-center">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7B7E8C] pointer-events-none">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder="Search product name, SKU, category, brand..."
                    className="w-full bg-[#141518] border border-[#2B2D36] rounded-xl pl-10 pr-12 py-2 text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C] transition-all placeholder:text-[#6E7079]"
                  />
                  {localSearch ? (
                    <button
                      type="button"
                      onClick={() => setLocalSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707279] hover:text-white p-0.5 rounded-full transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  ) : (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                      <kbd className="px-1.5 py-0.5 border border-[#2B2D36] rounded-md bg-[#1D1E24] text-[#8A8F9E] text-[10px] font-medium font-sans">⌘K</kbd>
                    </div>
                  )}
                </div>

                {/* Import Button */}
                <button 
                  type="button"
                  onClick={() => {
                    setImportError(null);
                    setShowImportModal(true);
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#EA580C] bg-[#1E2026] hover:bg-[#282B33] hover:text-[#F97316] transition-all px-3.5 py-2 rounded-xl cursor-pointer shrink-0 active:scale-95 border border-[#2C2F38] shadow-xs"
                >
                  <Upload size={14} />
                  <span>Import</span>
                </button>

                {/* Add Product Button (Positioned like Purchase Page) */}
                <motion.button 
                  type="button"
                  onClick={() => {
                    setEditingProductId(null);
                    setNewProdName('');
                    setNewProdSku('');
                    setNewProdStock('100');
                    setNewProdPrice('100000');
                    setNewProdSellPrice('150000');
                    setView('create');
                  }}
                  whileHover={{ backgroundColor: '#C2410C' }}
                  whileTap={{ scale: 0.95 }}
                  title="Add Product"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white bg-[#EA580C] transition-all cursor-pointer hover:shadow-lg hover:shadow-orange-500/20 active:scale-95 shrink-0"
                >
                  <Plus size={18} />
                </motion.button>
              </div>

              {/* Expandable Filter Panel */}
              <AnimatePresence>
                {showFilterPanel && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="border-b border-[#232427] bg-[#1A1B1F] px-4 py-3 relative z-20"
                  >
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#909299]">
                      {/* Category Filter */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-[#707279]">Category</label>
                        <div className="relative z-30">
                          <button
                            type="button"
                            onClick={() => setShowCategoryFilterDropdown(!showCategoryFilterDropdown)}
                            className="flex items-center justify-between gap-2 px-3 py-1.5 border border-[#2D2E33] rounded-lg text-[12px] font-medium text-[#D5D5D5] bg-[#1C1D21] hover:bg-[#25262B] transition-colors cursor-pointer min-w-[150px]"
                          >
                            <span className="truncate max-w-[120px]">{categoryFilter || 'All Categories'}</span>
                            <ChevronDown size={14} className={`text-[#909299] transition-transform duration-200 ${showCategoryFilterDropdown ? 'rotate-180' : ''}`} />
                          </button>

                          <AnimatePresence>
                            {showCategoryFilterDropdown && (
                              <>
                                <div className="fixed inset-0 z-[999]" onClick={() => setShowCategoryFilterDropdown(false)} />
                                <motion.div
                                  initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                  className="absolute left-0 top-full mt-1.5 w-52 bg-[#1A1B1F] border border-[#2D2E33] rounded-xl shadow-2xl py-1 z-[1000] max-h-48 overflow-y-auto"
                                >
                                  <button
                                    type="button"
                                    onClick={() => { setCategoryFilter(''); setShowCategoryFilterDropdown(false); }}
                                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                                      !categoryFilter ? 'bg-[#EA580C1A] text-[#EA580C] font-medium' : 'text-[#D5D5D5] hover:bg-[#25262B]'
                                    }`}
                                  >
                                    All Categories
                                  </button>
                                  {availableCategories.map((cat) => (
                                    <div
                                      key={cat}
                                      className={`w-full px-3 py-1.5 text-xs transition-colors flex items-center justify-between group ${
                                        categoryFilter === cat ? 'bg-[#EA580C1A] text-[#EA580C] font-medium' : 'text-[#D5D5D5] hover:bg-[#25262B]'
                                      }`}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => { setCategoryFilter(cat); setShowCategoryFilterDropdown(false); }}
                                        className="flex-1 text-left truncate cursor-pointer"
                                      >
                                        {cat}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCategoryToDelete(cat);
                                        }}
                                        className="p-1 text-[#8A8F9E] hover:text-rose-400 hover:bg-[#2F3138] rounded transition-colors cursor-pointer shrink-0"
                                        title={`Hapus kategori ${cat}`}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Brand Filter */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-[#707279]">Brand</label>
                        <div className="relative z-30">
                          <button
                            type="button"
                            onClick={() => setShowBrandFilterDropdown(!showBrandFilterDropdown)}
                            className="flex items-center justify-between gap-2 px-3 py-1.5 border border-[#2D2E33] rounded-lg text-[12px] font-medium text-[#D5D5D5] bg-[#1C1D21] hover:bg-[#25262B] transition-colors cursor-pointer min-w-[150px]"
                          >
                            <span className="truncate max-w-[120px]">{brandFilter || 'All Brands'}</span>
                            <ChevronDown size={14} className={`text-[#909299] transition-transform duration-200 ${showBrandFilterDropdown ? 'rotate-180' : ''}`} />
                          </button>

                          <AnimatePresence>
                            {showBrandFilterDropdown && (
                              <>
                                <div className="fixed inset-0 z-[999]" onClick={() => setShowBrandFilterDropdown(false)} />
                                <motion.div
                                  initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                  className="absolute left-0 top-full mt-1.5 w-52 bg-[#1A1B1F] border border-[#2D2E33] rounded-xl shadow-2xl py-1 z-[1000] max-h-48 overflow-y-auto"
                                >
                                  <button
                                    type="button"
                                    onClick={() => { setBrandFilter(''); setShowBrandFilterDropdown(false); }}
                                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                                      !brandFilter ? 'bg-[#EA580C1A] text-[#EA580C] font-medium' : 'text-[#D5D5D5] hover:bg-[#25262B]'
                                    }`}
                                  >
                                    All Brands
                                  </button>
                                  {availableBrands.map((brand) => (
                                    <div
                                      key={brand}
                                      className={`w-full px-3 py-1.5 text-xs transition-colors flex items-center justify-between group ${
                                        brandFilter === brand ? 'bg-[#EA580C1A] text-[#EA580C] font-medium' : 'text-[#D5D5D5] hover:bg-[#25262B]'
                                      }`}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => { setBrandFilter(brand); setShowBrandFilterDropdown(false); }}
                                        className="flex-1 text-left truncate cursor-pointer"
                                      >
                                        {brand}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setBrandToDelete(brand);
                                        }}
                                        className="p-1 text-[#8A8F9E] hover:text-rose-400 hover:bg-[#2F3138] rounded transition-colors cursor-pointer shrink-0"
                                        title={`Hapus brand ${brand}`}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Status Filter */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-[#707279]">Status</label>
                        <div className="relative z-30">
                          <button
                            type="button"
                            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                            className="flex items-center justify-between gap-2 px-3 py-1.5 border border-[#2D2E33] rounded-lg text-[12px] font-medium text-[#D5D5D5] bg-[#1C1D21] hover:bg-[#25262B] transition-colors cursor-pointer min-w-[130px]"
                          >
                            <span className="truncate max-w-[100px]">{statusFilter || 'All Status'}</span>
                            <ChevronDown size={14} className={`text-[#909299] transition-transform duration-200 ${showStatusDropdown ? 'rotate-180' : ''}`} />
                          </button>

                          <AnimatePresence>
                            {showStatusDropdown && (
                              <>
                                <div className="fixed inset-0 z-[999]" onClick={() => setShowStatusDropdown(false)} />
                                <motion.div
                                  initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                  className="absolute left-0 top-full mt-1.5 w-44 bg-[#1A1B1F] border border-[#2D2E33] rounded-xl shadow-2xl py-1 z-[1000]"
                                >
                                  {[
                                    { label: 'All Status', value: '' },
                                    { label: 'In Stock', value: 'In Stock' },
                                    { label: 'Low Stock', value: 'Low Stock' },
                                    { label: 'Out of Stock', value: 'Out of Stock' },
                                  ].map((opt) => (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => {
                                        setStatusFilter(opt.value);
                                        setShowStatusDropdown(false);
                                      }}
                                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                                        statusFilter === opt.value ? 'bg-[#EA580C1A] text-[#EA580C] font-medium' : 'text-[#D5D5D5] hover:bg-[#25262B]'
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Min Price Filter */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-[#707279]">Min Price (Rp)</label>
                        <input
                          type="text"
                          placeholder="e.g. 50000"
                          value={minPriceFilter}
                          onChange={(e) => setMinPriceFilter(e.target.value)}
                          className="w-32 bg-[#1C1D21] border border-[#2D2E33] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#EA580C] transition-colors"
                        />
                      </div>

                      {/* Max Price Filter */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-[#707279]">Max Price (Rp)</label>
                        <input
                          type="text"
                          placeholder="e.g. 500000"
                          value={maxPriceFilter}
                          onChange={(e) => setMaxPriceFilter(e.target.value)}
                          className="w-32 bg-[#1C1D21] border border-[#2D2E33] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#EA580C] transition-colors"
                        />
                      </div>

                      {/* Reset Filters */}
                      {activeFilterCount > 0 && (
                        <div className="flex flex-col justify-end self-end">
                          <button
                            type="button"
                            onClick={() => {
                              setSortFilter('');
                              setStatusFilter('');
                              setCategoryFilter('');
                              setBrandFilter('');
                              setMinPriceFilter('');
                              setMaxPriceFilter('');
                              setLocalSearch('');
                            }}
                            className="px-3 py-1 text-xs font-medium text-[#EA580C] hover:bg-[#EA580C1A] rounded-lg transition-colors border border-transparent hover:border-[#EA580C33] cursor-pointer"
                          >
                            Reset Filters
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Product Table */}
              <div className="overflow-x-auto rounded-b-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#232427] bg-[#1A1B1F]">
                  <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px]">
                    <span>SKU</span>
                  </th>
                  <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px]">
                    <span>Product Name</span>
                  </th>
                  <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px]">
                    <span>Qty</span>
                  </th>
                  <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px] text-right">
                    <span>Profit</span>
                  </th>
                  <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px] text-right">
                    <span>Unit Price</span>
                  </th>
                  <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px] text-right">
                    <span>Sell Price</span>
                  </th>
                  <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px]">
                    <span>Status</span>
                  </th>
                  <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px] text-center w-28">
                    <span>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#8E9097]">
                      <div className="flex flex-col items-center justify-center">
                        <Package size={36} className="text-[#333] mb-3 animate-pulse" />
                        <p className="text-[13px] text-white font-medium mb-1">No products in inventory</p>
                        <p className="text-[11px] text-[#7A7C85] max-w-[280px] mb-4">Your skincare and beauty catalog is empty. Add a product manually or populate with sample data.</p>
                        <button 
                          onClick={() => setProducts(initialProducts)}
                          className="text-[11px] font-medium text-white bg-[#1C1D21] hover:bg-[#25262B] border border-[#2D2E33] transition-colors px-3.5 py-1.5 rounded-lg"
                        >
                          Load Sample Data
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[13px] text-[#7A7C85]">
                      No products found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p, idx) => (
                    <tr 
                      key={p.id || idx} 
                      onClick={() => handleEditProduct(p)}
                      className="border-b border-[#202125] last:border-b-0 hover:bg-[#18191D] transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4 text-[13px]">
                        <span className="font-semibold text-white tracking-tight hover:text-[#EA580C] transition-colors cursor-pointer font-mono">
                          {p.sku}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[13px]">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${getAvatarGradient(p.name)} flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm`}>
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white text-[13px]">{p.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#8E9097]">
                              <span className="px-1.5 py-0.2 bg-[#222328] border border-[#2A2B30] text-gray-300 rounded font-medium">{p.brand || 'Serene'}</span>
                              <span>•</span>
                              <span>{p.category}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[13px] text-white font-semibold">{p.stock}</td>
                      <td className="py-4 px-4 text-[13px] text-[#10B981] font-semibold text-right">{formatIDR(p.sellPrice - p.price)}</td>
                      <td className="py-4 px-4 text-[13px] text-[#C5C7CE] font-normal text-right">{formatIDR(p.price)}</td>
                      <td className="py-4 px-4 text-[13px] text-white font-semibold text-right">{formatIDR(p.sellPrice)}</td>
                      <td className="py-4 px-4 text-[13px]">
                        {p.status === 'In Stock' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981]">
                            <CheckCircle size={12} className="text-[#10B981]" />
                            {p.status}
                          </span>
                        ) : p.status === 'Low Stock' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#EA580C]/10 border border-[#EA580C]/20 text-[#EA580C]">
                            <AlertTriangle size={12} className="text-[#EA580C]" />
                            {p.status}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444]">
                            <XCircle size={12} className="text-[#EF4444]" />
                            {p.status}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-[13px] text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            type="button"
                            title="View / Edit Product"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProduct(p);
                            }}
                            className="w-8 h-8 rounded-full bg-[#1F2024] hover:bg-[#2A2B30] text-[#909299] hover:text-white border border-[#2A2B30] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            type="button"
                            title="Price Card / Label"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProductForPriceCard(p);
                              setCustomPrice(p.sellPrice);
                              setBadgeText('BEST SELLER');
                              setPromoDiscount('15% OFF');
                            }}
                            className="w-8 h-8 rounded-full bg-[#1F2024] hover:bg-[#2A2B30] text-[#EA580C] hover:text-[#F97316] border border-[#2A2B30] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Tag size={14} />
                          </button>
                          <button
                            type="button"
                            title="Delete Product"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProductToDelete(p);
                              setShowDeleteModal(true);
                            }}
                            className="w-8 h-8 rounded-full bg-[#1F2024] hover:bg-[#2A2B30] text-[#F87171] hover:text-rose-400 border border-[#2A2B30] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    })()}

      {/* Price Card / Printable Label Modal */}
      {selectedProductForPriceCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          {/* Print style tag injected only when modal is active */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              /* Hide all components inside root except the printable wrapper */
              #root > *:not(#printable-price-card-wrapper) {
                display: none !important;
                visibility: hidden !important;
              }
              body {
                background: white !important;
                color: black !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              #printable-price-card-wrapper {
                display: block !important;
                visibility: visible !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 80mm !important;
                height: 50mm !important;
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
              }
              #printable-price-card {
                display: flex !important;
                visibility: visible !important;
                width: 80mm !important;
                height: 50mm !important;
                padding: 4mm !important;
                border: 2px solid #000000 !important;
                background-color: #ffffff !important;
                color: #000000 !important;
                box-sizing: border-box !important;
                box-shadow: none !important;
                border-radius: 0px !important;
                margin: 0 !important;
              }
              #printable-price-card * {
                visibility: visible !important;
                color: #000000 !important;
                border-color: #000000 !important;
              }
              @page {
                size: 80mm 50mm;
                margin: 0;
              }
            }
          ` }} />

          <div className="bg-[#141517] border border-[#2A2A2A] rounded-xl w-full max-w-4xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-[#1C1C1C]">
              <div>
                <h3 className="text-[16px] font-semibold text-white flex items-center gap-2">
                  <Printer size={18} className="text-[#EA580C]" /> Shelf Label Creator (Price Card)
                </h3>
                <p className="text-[12px] text-[#909090]">Generate, customize, and print high-contrast barcodes and pricing tags for retail display.</p>
              </div>
              <button 
                onClick={() => setSelectedProductForPriceCard(null)}
                className="text-white hover:text-[#EA580C] bg-[#1C1D1F] hover:bg-[#2A2A2A] border border-[#2A2A2A] transition-colors px-2.5 py-1 rounded-lg text-[13px] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Side: Controls (5 cols) */}
              <div className="lg:col-span-5 space-y-4 max-h-[480px] overflow-y-auto pr-2">
                <div className="bg-[#0F1012] p-4 rounded-lg border border-[#1C1C1C] space-y-4">
                  <h4 className="text-[12px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-[#1C1C1C] pb-2">
                    <Tag size={13} className="text-[#EA580C]" /> Label Branding & Content
                  </h4>

                  {/* Store Name input */}
                  <div>
                    <label className="block text-[11px] text-[#909090] mb-1 font-medium">Store / Outlet Title</label>
                    <input 
                      type="text" 
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full bg-[#141517] border border-[#2A2A2A] rounded-md px-3 py-1.5 text-[13px] text-white outline-none focus:border-[#EA580C]"
                    />
                  </div>

                  {/* Theme Select */}
                  <div>
                    <label className="block text-[11px] text-[#909090] mb-1 font-medium">Card Template Style</label>
                    <div className="grid grid-cols-3 gap-1 bg-[#141517] p-1 border border-[#2A2A2A] rounded-md">
                      {(['classic', 'promo', 'minimalist'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setCardTheme(t)}
                          className={`py-1 rounded text-[11px] font-medium transition-all capitalize ${
                            cardTheme === t 
                              ? 'bg-[#EA580C] text-white shadow-sm' 
                              : 'text-[#909090] hover:text-white'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Badge Text (if promo) */}
                  {cardTheme === 'promo' && (
                    <div>
                      <label className="block text-[11px] text-[#909090] mb-1 font-medium">Promo Badge Text</label>
                      <input 
                        type="text" 
                        value={badgeText}
                        onChange={(e) => setBadgeText(e.target.value)}
                        placeholder="e.g. SPECIAL OFFER"
                        className="w-full bg-[#141517] border border-[#2A2A2A] rounded-md px-3 py-1.5 text-[13px] text-white outline-none focus:border-[#EA580C]"
                      />
                    </div>
                  )}

                  {/* Pricing Overrides */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#909090] mb-1 font-medium">Shelf Retail Price (Rp)</label>
                      <input 
                        type="number" 
                        value={customPrice !== null ? customPrice : selectedProductForPriceCard.sellPrice}
                        onChange={(e) => setCustomPrice(Number(e.target.value))}
                        className="w-full bg-[#141517] border border-[#2A2A2A] rounded-md px-3 py-1.5 text-[13px] text-white outline-none focus:border-[#EA580C]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#909090] mb-1 font-medium">Original Retail Price</label>
                      <div className="flex items-center h-[34px]">
                        <input 
                          type="checkbox" 
                          id="showOriginal"
                          checked={showOriginalPrice}
                          onChange={(e) => setShowOriginalPrice(e.target.checked)}
                          className="mr-2 accent-[#EA580C]"
                        />
                        <label htmlFor="showOriginal" className="text-[12px] text-[#E5E5E5] cursor-pointer">Show Strike-Price</label>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Note */}
                  <div>
                    <label className="block text-[11px] text-[#909090] mb-1 font-medium">Bottom Footer Slogan</label>
                    <input 
                      type="text" 
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                      className="w-full bg-[#141517] border border-[#2A2A2A] rounded-md px-3 py-1.5 text-[13px] text-white outline-none focus:border-[#EA580C]"
                    />
                  </div>
                </div>

                {/* Print options toggles */}
                <div className="bg-[#0F1012] p-4 rounded-lg border border-[#1C1C1C] space-y-3">
                  <h4 className="text-[12px] font-bold text-white uppercase tracking-wider border-b border-[#1C1C1C] pb-2">
                    Scannable Elements
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[#E5E5E5]">Toggle Line Barcode</span>
                    <input 
                      type="checkbox" 
                      checked={showBarcode} 
                      onChange={(e) => setShowBarcode(e.target.checked)}
                      className="accent-[#EA580C]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[#E5E5E5]">Toggle QR Scan Code</span>
                    <input 
                      type="checkbox" 
                      checked={showQRCode} 
                      onChange={(e) => setShowQRCode(e.target.checked)}
                      className="accent-[#EA580C]"
                    />
                  </div>
                </div>

                {/* Print Trigger Button */}
                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] text-[13px] font-bold text-white py-3 px-4 rounded-lg shadow-lg transition-colors cursor-pointer"
                >
                  <Printer size={16} />
                  <span>Print Label Now (80mm x 50mm)</span>
                </button>
              </div>

              {/* Right Side: Live Visual Shelf Preview (7 cols) */}
              <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 bg-[#0E0F11] border border-[#1C1C1C] rounded-xl relative">
                <span className="absolute top-3 left-3 text-[10px] text-[#666666] font-mono tracking-wider uppercase">Live Tag Preview (80mm x 50mm)</span>
                
                {/* Physical representation card */}
                <div className="bg-white p-4 shadow-xl border border-gray-300 w-[360px] h-[225px] flex flex-col justify-between select-none relative rounded-none transition-all">
                  
                  {/* Outer Frame for Classic Theme */}
                  {cardTheme === 'classic' && (
                    <div className="absolute inset-1 border border-black pointer-events-none"></div>
                  )}

                  {/* 1. CLASSIC THEME */}
                  {cardTheme === 'classic' && (
                    <div className="flex flex-col h-full justify-between z-10 text-black">
                      {/* Header row */}
                      <div className="border-b border-black pb-1 flex justify-between items-center">
                        <span className="text-[10px] font-bold tracking-widest uppercase font-mono">{storeName}</span>
                        <span className="text-[9px] bg-black text-white px-1.5 py-0.2 font-bold uppercase tracking-wider">{selectedProductForPriceCard.category}</span>
                      </div>

                      {/* Title and Badge */}
                      <div className="mt-2">
                        <h4 className="text-[13px] font-extrabold uppercase leading-tight line-clamp-2 text-black font-sans">
                          {selectedProductForPriceCard.name}
                        </h4>
                      </div>

                      {/* Main Price Row */}
                      <div className="flex items-end justify-between my-1">
                        <div className="flex flex-col">
                          {showOriginalPrice && (
                            <span className="text-[10px] line-through text-gray-500 font-mono">
                              {formatIDR((customPrice !== null ? customPrice : selectedProductForPriceCard.sellPrice) * 1.25)}
                            </span>
                          )}
                          <span className="text-[20px] font-black tracking-tight text-black font-sans">
                            {formatIDR(customPrice !== null ? customPrice : selectedProductForPriceCard.sellPrice)}
                          </span>
                        </div>
                        {showQRCode && (
                          <div className="border border-black p-0.5 bg-white">
                            <svg className="w-9 h-9 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <rect x="2" y="2" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="2" />
                              <rect x="16" y="2" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="2" />
                              <rect x="2" y="16" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="2" />
                              <rect x="4" y="4" width="2" height="2" fill="currentColor" />
                              <rect x="18" y="4" width="2" height="2" fill="currentColor" />
                              <rect x="4" y="18" width="2" height="2" fill="currentColor" />
                              <path d="M10 2h2v4h-2zm0 8h4v2h-4zm6 2h2v2h-2zm-6 4h2v2h-2zm6 2h4v2h-4zm-4-4h2v4h-2zm8-2h2v2h-2zm-8-6h4v2h-4zm6 2h2v2h-2z" fill="currentColor" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Bottom Footer Section */}
                      <div className="border-t border-black pt-1.5 flex justify-between items-center">
                        {showBarcode ? (
                          <div className="flex flex-col">
                            {/* Barcode vector mockup */}
                            <div className="flex items-end gap-[1.5px] h-4">
                              {[1,3,1,2,4,1,2,1,3,1,4,1,2,1,3,1,2].map((w, i) => (
                                <div key={i} className="bg-black h-full" style={{ width: `${w * 0.75}px` }}></div>
                              ))}
                            </div>
                            <span className="text-[7px] font-mono tracking-widest mt-0.5">{selectedProductForPriceCard.sku}</span>
                          </div>
                        ) : (
                          <span className="text-[8px] font-mono font-bold">{selectedProductForPriceCard.sku}</span>
                        )}
                        <span className="text-[7px] text-right font-medium italic text-gray-700">{customNote}</span>
                      </div>
                    </div>
                  )}

                  {/* 2. PROMO THEME */}
                  {cardTheme === 'promo' && (
                    <div className="flex flex-col h-full justify-between z-10 text-black">
                      {/* Promo top black bar */}
                      <div className="bg-black text-white px-2 py-1 flex justify-between items-center -mx-4 -mt-4 mb-2">
                        <span className="text-[10px] font-black tracking-widest uppercase flex items-center gap-1">
                          ★ {badgeText}
                        </span>
                        <span className="text-[9px] font-mono tracking-widest">{storeName}</span>
                      </div>

                      {/* Title */}
                      <h4 className="text-[12px] font-extrabold uppercase leading-tight line-clamp-1 text-black font-sans">
                        {selectedProductForPriceCard.name}
                      </h4>

                      {/* Promo details layout */}
                      <div className="grid grid-cols-12 gap-1 items-center flex-1 my-1">
                        <div className="col-span-8 flex flex-col justify-center">
                          {showOriginalPrice && (
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                              <span>NORMAL:</span>
                              <span className="line-through font-mono">
                                {formatIDR((customPrice !== null ? customPrice : selectedProductForPriceCard.sellPrice) * 1.25)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-baseline gap-1">
                            <span className="text-[9px] font-bold">PROMO:</span>
                            <span className="text-[22px] font-black tracking-tight text-black font-sans leading-none">
                              {formatIDR(customPrice !== null ? customPrice : selectedProductForPriceCard.sellPrice)}
                            </span>
                          </div>
                        </div>

                        <div className="col-span-4 flex justify-end">
                          {showQRCode ? (
                            <div className="border border-black p-0.5 bg-white">
                              <svg className="w-8 h-8 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="2" y="2" width="6" height="6" rx="0" stroke="currentColor" strokeWidth="2" />
                                <rect x="16" y="2" width="6" height="6" rx="0" stroke="currentColor" strokeWidth="2" />
                                <rect x="2" y="16" width="6" height="6" rx="0" stroke="currentColor" strokeWidth="2" />
                                <rect x="4" y="4" width="2" height="2" fill="currentColor" />
                                <rect x="18" y="4" width="2" height="2" fill="currentColor" />
                                <rect x="4" y="18" width="2" height="2" fill="currentColor" />
                                <path d="M10 2h2v4h-2zm0 8h4v2h-4zm6 2h2v2h-2zm-6 4h2v2h-2zm6 2h4v2h-4zm-4-4h2v4h-2zm8-2h2v2h-2zm-8-6h4v2h-4zm6 2h2v2h-2z" fill="currentColor" />
                              </svg>
                            </div>
                          ) : (
                            <span className="text-[10px] font-extrabold border border-dashed border-black px-1.5 py-1 rotate-[-4deg]">{promoDiscount}</span>
                          )}
                        </div>
                      </div>

                      {/* Footer barcode/SKU */}
                      <div className="border-t border-black pt-1.5 flex justify-between items-center mt-1">
                        {showBarcode ? (
                          <div className="flex flex-col">
                            <div className="flex items-end gap-[1.5px] h-3.5">
                              {[1,2,1,4,2,1,1,3,1,4,1,1,2,1,3].map((w, i) => (
                                <div key={i} className="bg-black h-full" style={{ width: `${w * 0.75}px` }}></div>
                              ))}
                            </div>
                            <span className="text-[7px] font-mono tracking-widest mt-0.5">{selectedProductForPriceCard.sku}</span>
                          </div>
                        ) : (
                          <span className="text-[8px] font-mono font-bold">{selectedProductForPriceCard.sku}</span>
                        )}
                        <span className="text-[7px] font-bold uppercase tracking-wide bg-black text-white px-1">{customNote}</span>
                      </div>
                    </div>
                  )}

                  {/* 3. MODERN MINIMALIST THEME */}
                  {cardTheme === 'minimalist' && (
                    <div className="flex flex-col h-full justify-between z-10 text-black font-sans bg-white p-0.5">
                      {/* ESL Header */}
                      <div className="flex justify-between items-center border-b-2 border-black pb-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black tracking-wider uppercase bg-black text-white px-1.5 py-0.5 rounded-[2px] leading-tight font-mono">ESL-E3</span>
                          <span className="text-[8px] font-extrabold text-gray-500 uppercase tracking-widest">DIGITAL SHELF LABEL</span>
                        </div>
                        <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-black">{selectedProductForPriceCard.sku}</span>
                      </div>

                      {/* Main Content Grid: Product name, unit, and massive clear price */}
                      <div className="flex-1 grid grid-cols-12 gap-1 items-center py-1">
                        <div className="col-span-7 flex flex-col justify-center text-left pr-2">
                          <h4 className="text-[14px] font-extrabold uppercase tracking-tight text-black leading-tight line-clamp-2">
                            {selectedProductForPriceCard.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[8px] font-bold text-gray-500 uppercase px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded-[2px]">
                              {selectedProductForPriceCard.category}
                            </span>
                            <span className="text-[8px] text-gray-400 font-medium">1 unit</span>
                          </div>
                        </div>

                        {/* Huge, structured premium price display */}
                        <div className="col-span-5 flex flex-col items-end justify-center border-l border-gray-200 pl-2 h-full">
                          {showOriginalPrice && (
                            <span className="text-[9px] text-gray-400 line-through font-medium tracking-wide">
                              {formatIDR((customPrice !== null ? customPrice : selectedProductForPriceCard.sellPrice) * 1.25)}
                            </span>
                          )}
                          <div className="flex items-baseline">
                            <span className="text-[22px] font-black tracking-tighter text-black leading-none">
                              {formatIDR(customPrice !== null ? customPrice : selectedProductForPriceCard.sellPrice)}
                            </span>
                          </div>
                          <span className="text-[7px] text-gray-400 font-bold mt-1 tracking-wider uppercase">
                            HARGA PER UNIT
                          </span>
                        </div>
                      </div>

                      {/* Footer elements with Barcode / note */}
                      <div className="flex justify-between items-end pt-1.5 border-t border-gray-200 mt-1">
                        {showBarcode ? (
                          <div className="flex flex-col text-left">
                            <div className="flex items-end gap-[1.5px] h-3.5">
                              {[1,1,2,1,1,3,1,2,1,2,1,1,3,1,1,2,1].map((w, i) => (
                                <div key={i} className="bg-black h-[14px]" style={{ width: `${w * 0.7}px` }}></div>
                              ))}
                            </div>
                            <span className="text-[6.5px] font-mono tracking-widest text-gray-400 mt-0.5 uppercase">SYSTEM SYNCED</span>
                          </div>
                        ) : (
                          <span className="text-[8px] font-mono uppercase text-gray-400">{selectedProductForPriceCard.category}</span>
                        )}
                        <div className="flex flex-col items-end">
                          <span className="text-[8px] font-black tracking-widest uppercase text-black">{selectedProductForPriceCard.brand || storeName}</span>
                          <span className="text-[7px] text-gray-500 font-semibold tracking-wide italic">{customNote}</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                <div className="mt-4 text-center">
                  <p className="text-[11px] text-[#909090]">
                    💡 <strong>Pro Tip:</strong> Click <strong>Print Label Now</strong> to open the system print dialog. The document is pre-scaled to exactly <strong>80mm x 50mm</strong> for label printer layout alignment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OFF-SCREEN HIDDEN WRAPPER STRICTLY FOR SYSTEM PRINT MEDIA */}
      {selectedProductForPriceCard && (
        <div id="printable-price-card-wrapper" className="hidden">
          <div id="printable-price-card" className="flex flex-col justify-between">
            {/* The exact copy of the active theme to be printed on paper */}
            {cardTheme === 'classic' && (
              <div className="flex flex-col h-full justify-between relative text-black" style={{ width: '100%', height: '100%' }}>
                <div className="absolute inset-0 border border-black pointer-events-none"></div>
                <div className="flex flex-col h-full justify-between p-[1mm] text-black">
                  <div className="border-b border-black pb-1 flex justify-between items-center" style={{ borderColor: '#000000' }}>
                    <span className="text-[11px] font-bold tracking-widest uppercase font-mono">{storeName}</span>
                    <span className="text-[9px] bg-black text-white px-1.5 py-0.2 font-bold uppercase tracking-wider">{selectedProductForPriceCard.category}</span>
                  </div>
                  <div className="mt-2">
                    <h4 className="text-[14px] font-extrabold uppercase leading-tight line-clamp-2 text-black">
                      {selectedProductForPriceCard.name}
                    </h4>
                  </div>
                  <div className="flex items-end justify-between my-1">
                    <div className="flex flex-col">
                      {showOriginalPrice && (
                        <span className="text-[10px] line-through text-gray-500 font-mono">
                          {formatIDR((customPrice !== null ? customPrice : selectedProductForPriceCard.sellPrice) * 1.25)}
                        </span>
                      )}
                      <span className="text-[22px] font-black tracking-tight text-black leading-none">
                        {formatIDR(customPrice !== null ? customPrice : selectedProductForPriceCard.sellPrice)}
                      </span>
                    </div>
                    {showQRCode && (
                      <div className="border border-black p-0.5 bg-white" style={{ borderColor: '#000000' }}>
                        <svg className="w-10 h-10 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="2" y="2" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="2" />
                          <rect x="16" y="2" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="2" />
                          <rect x="2" y="16" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="2" />
                          <rect x="4" y="4" width="2" height="2" fill="currentColor" />
                          <rect x="18" y="4" width="2" height="2" fill="currentColor" />
                          <rect x="4" y="18" width="2" height="2" fill="currentColor" />
                          <path d="M10 2h2v4h-2zm0 8h4v2h-4zm6 2h2v2h-2zm-6 4h2v2h-2zm6 2h4v2h-4zm-4-4h2v4h-2zm8-2h2v2h-2zm-8-6h4v2h-4zm6 2h2v2h-2z" fill="currentColor" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-black pt-1 flex justify-between items-center" style={{ borderColor: '#000000' }}>
                    {showBarcode ? (
                      <div className="flex flex-col">
                        <div className="flex items-end gap-[1.5px] h-4">
                          {[1,3,1,2,4,1,2,1,3,1,4,1,2,1,3,1,2].map((w, i) => (
                            <div key={i} className="bg-black h-full" style={{ width: `${w * 0.75}px` }}></div>
                          ))}
                        </div>
                        <span className="text-[7px] font-mono tracking-widest mt-0.5">{selectedProductForPriceCard.sku}</span>
                      </div>
                    ) : (
                      <span className="text-[8px] font-mono font-bold">{selectedProductForPriceCard.sku}</span>
                    )}
                    <span className="text-[8px] text-right font-medium italic text-black">{customNote}</span>
                  </div>
                </div>
              </div>
            )}

            {cardTheme === 'promo' && (
              <div className="flex flex-col h-full justify-between text-black" style={{ width: '100%', height: '100%' }}>
                <div className="bg-black text-white px-2 py-1 flex justify-between items-center mb-2">
                  <span className="text-[11px] font-black tracking-widest uppercase flex items-center gap-1">
                    ★ {badgeText}
                  </span>
                  <span className="text-[9px] font-mono tracking-widest text-white">{storeName}</span>
                </div>
                <h4 className="text-[14px] font-extrabold uppercase leading-tight line-clamp-1 text-black">
                  {selectedProductForPriceCard.name}
                </h4>
                <div className="grid grid-cols-12 gap-1 items-center flex-1 my-1">
                  <div className="col-span-8 flex flex-col justify-center">
                    {showOriginalPrice && (
                      <div className="flex items-center gap-1.5 text-[10px] text-black">
                        <span>NORMAL:</span>
                        <span className="line-through font-mono">
                          {formatIDR((customPrice !== null ? customPrice : selectedProductForPriceCard.sellPrice) * 1.25)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-[9px] font-bold">PROMO:</span>
                      <span className="text-[24px] font-black tracking-tight text-black leading-none">
                        {formatIDR(customPrice !== null ? customPrice : selectedProductForPriceCard.sellPrice)}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-4 flex justify-end">
                    {showQRCode ? (
                      <div className="border border-black p-0.5 bg-white" style={{ borderColor: '#000000' }}>
                        <svg className="w-9 h-9 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="2" y="2" width="6" height="6" rx="0" stroke="currentColor" strokeWidth="2" />
                          <rect x="16" y="2" width="6" height="6" rx="0" stroke="currentColor" strokeWidth="2" />
                          <rect x="2" y="16" width="6" height="6" rx="0" stroke="currentColor" strokeWidth="2" />
                          <rect x="4" y="4" width="2" height="2" fill="currentColor" />
                          <rect x="18" y="4" width="2" height="2" fill="currentColor" />
                          <rect x="4" y="18" width="2" height="2" fill="currentColor" />
                          <path d="M10 2h2v4h-2zm0 8h4v2h-4zm6 2h2v2h-2zm-6 4h2v2h-2zm6 2h4v2h-4zm-4-4h2v4h-2zm8-2h2v2h-2zm-8-6h4v2h-4zm6 2h2v2h-2z" fill="currentColor" />
                        </svg>
                      </div>
                    ) : (
                      <span className="text-[10px] font-extrabold border border-dashed border-black px-1.5 py-1 rotate-[-4deg]" style={{ borderColor: '#000000' }}>{promoDiscount}</span>
                    )}
                  </div>
                </div>
                <div className="border-t border-black pt-1.5 flex justify-between items-center mt-1" style={{ borderColor: '#000000' }}>
                  {showBarcode ? (
                    <div className="flex flex-col">
                      <div className="flex items-end gap-[1.5px] h-3.5">
                        {[1,2,1,4,2,1,1,3,1,4,1,1,2,1,3].map((w, i) => (
                          <div key={i} className="bg-black h-full" style={{ width: `${w * 0.75}px` }}></div>
                        ))}
                      </div>
                      <span className="text-[7px] font-mono tracking-widest mt-0.5">{selectedProductForPriceCard.sku}</span>
                    </div>
                  ) : (
                    <span className="text-[8px] font-mono font-bold">{selectedProductForPriceCard.sku}</span>
                  )}
                  <span className="text-[8px] font-bold uppercase tracking-wide bg-black text-white px-1">{customNote}</span>
                </div>
              </div>
            )}

            {cardTheme === 'minimalist' && (
              <div className="flex flex-col h-full justify-between text-black font-sans bg-white p-0.5" style={{ width: '100%', height: '100%' }}>
                {/* ESL Header */}
                <div className="flex justify-between items-center border-b-2 border-black pb-1.5 mb-1.5" style={{ borderColor: '#000000' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black tracking-wider uppercase bg-black text-white px-1.5 py-0.5 rounded-[2px] leading-tight font-mono">ESL-E3</span>
                    <span className="text-[8px] font-extrabold text-gray-500 uppercase tracking-widest">DIGITAL SHELF LABEL</span>
                  </div>
                  <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-black">{selectedProductForPriceCard.sku}</span>
                </div>

                {/* Main Content Grid: Product name, unit, and massive clear price */}
                <div className="flex-1 grid grid-cols-12 gap-1 items-center py-1">
                  <div className="col-span-7 flex flex-col justify-center text-left pr-2">
                    <h4 className="text-[14px] font-extrabold uppercase tracking-tight text-black leading-tight line-clamp-2">
                      {selectedProductForPriceCard.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[8px] font-bold text-gray-500 uppercase px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded-[2px]" style={{ borderColor: '#e2e8f0' }}>
                        {selectedProductForPriceCard.category}
                      </span>
                      <span className="text-[8px] text-gray-400 font-medium">1 unit</span>
                    </div>
                  </div>

                  {/* Huge, structured premium price display */}
                  <div className="col-span-5 flex flex-col items-end justify-center border-l border-gray-200 pl-2 h-full" style={{ borderColor: '#e2e8f0' }}>
                    {showOriginalPrice && (
                      <span className="text-[9px] text-gray-400 line-through font-medium tracking-wide">
                        {formatIDR((customPrice !== null ? customPrice : selectedProductForPriceCard.sellPrice) * 1.25)}
                      </span>
                    )}
                    <div className="flex items-baseline">
                      <span className="text-[22px] font-black tracking-tighter text-black leading-none">
                        {formatIDR(customPrice !== null ? customPrice : selectedProductForPriceCard.sellPrice)}
                      </span>
                    </div>
                    <span className="text-[7px] text-gray-400 font-bold mt-1 tracking-wider uppercase">
                      HARGA PER UNIT
                    </span>
                  </div>
                </div>

                {/* Footer elements with Barcode / note */}
                <div className="flex justify-between items-end pt-1.5 border-t border-black mt-1" style={{ borderColor: '#000000' }}>
                  {showBarcode ? (
                    <div className="flex flex-col text-left">
                      <div className="flex items-end gap-[1.5px] h-3.5">
                        {[1,1,2,1,1,3,1,2,1,2,1,1,3,1,1,2,1].map((w, i) => (
                          <div key={i} className="bg-black h-[14px]" style={{ width: `${w * 0.7}px` }}></div>
                        ))}
                      </div>
                      <span className="text-[6.5px] font-mono tracking-widest text-gray-400 mt-0.5 uppercase">SYSTEM SYNCED</span>
                    </div>
                  ) : (
                    <span className="text-[8px] font-mono uppercase text-gray-400">{selectedProductForPriceCard.category}</span>
                  )}
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black tracking-widest uppercase text-black">{selectedProductForPriceCard.brand || storeName}</span>
                    <span className="text-[7px] text-gray-500 font-semibold tracking-wide italic">{customNote}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

        {/* Import Product Modal */}
        <AnimatePresence>
          {showImportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#141517] border border-[#2A2A2A] rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-left"
              >
                <button 
                  onClick={() => setShowImportModal(false)}
                  className="absolute top-4 right-4 text-[#808080] hover:text-white p-1 rounded-lg hover:bg-[#222] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-[#EA580C]/10 text-[#EA580C] rounded-xl border border-[#EA580C]/20">
                    <Upload size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Import Katalog Produk</h3>
                    <p className="text-[12px] text-[#808080]">Upload file CSV data produk ke inventaris</p>
                  </div>
                </div>

                {importError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400 flex items-start gap-2">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="border border-dashed border-[#333] hover:border-[#EA580C] bg-[#0A0A0A] rounded-xl p-6 text-center transition-colors">
                    <Download size={28} className="mx-auto text-[#666] mb-2" />
                    <p className="text-[13px] text-white font-medium mb-1">Pilih File CSV Produk</p>
                    <p className="text-[11px] text-[#707070] mb-4">Format CSV dengan header Name, Category, Brand, SKU, Stock, Cost_Price, Sell_Price</p>
                    
                    <input 
                      type="file" 
                      ref={importFileInputRef}
                      onChange={handleFileUpload}
                      accept=".csv,text/csv"
                      className="hidden" 
                    />
                    
                    <button 
                      type="button"
                      onClick={() => importFileInputRef.current?.click()}
                      className="px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white text-[12px] font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      Pilih File CSV
                    </button>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-[#222]">
                    <span className="text-[12px] text-[#808080]">Belum punya formatnya?</span>
                    <button 
                      type="button"
                      onClick={downloadCSVTemplate}
                      className="text-[12px] text-[#EA580C] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Download size={13} />
                      Download Template CSV
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-[#18181A] border border-[#27272A] rounded-[24px] shadow-2xl w-full max-w-md relative z-10 p-6 overflow-hidden text-left"
              >
                {/* Top Header Row */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-full bg-[#3F1D24] text-[#F87171] border border-red-900/30 flex items-center justify-center">
                    <AlertCircle size={22} />
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setProductToDelete(null);
                    }}
                    className="w-8 h-8 rounded-full bg-[#27272A] hover:bg-[#3F3F46] transition-colors text-[#A1A1AA] hover:text-white flex items-center justify-center cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Title */}
                <h2 className="text-xl font-semibold text-white tracking-tight mb-2">
                  {productToDelete ? 'Delete product permanently?' : 'Delete products permanently?'}
                </h2>

                {/* Description */}
                <p className="text-sm text-[#A1A1AA] leading-relaxed mb-6">
                  {productToDelete 
                    ? <>This will permanently delete <span className="text-white font-medium">{productToDelete.name}</span> ({productToDelete.sku}) and all of its data. This action cannot be undone.</>
                    : <>This will permanently delete <span className="text-white font-medium">{selectedProductIds.length} selected products</span> and all of their data. This action cannot be undone.</>
                  }
                </p>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setProductToDelete(null);
                    }}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-[#27272A] hover:bg-[#3F3F46] rounded-full transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteProducts}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-[#E11D48] hover:bg-[#F43F5E] rounded-full transition-colors cursor-pointer shadow-lg shadow-[#E11D48]/20"
                  >
                    Delete Product
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Brand Confirmation Modal */}
        <AnimatePresence>
          {brandToDelete && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-[#18181A] border border-[#27272A] rounded-[24px] shadow-2xl w-full max-w-md relative z-[2001] p-6 overflow-hidden text-left"
              >
                {/* Top Header Row */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-full bg-[#3F1D24] text-[#F87171] border border-red-900/30 flex items-center justify-center">
                    <AlertCircle size={22} />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setBrandToDelete(null)}
                    className="w-8 h-8 rounded-full bg-[#27272A] hover:bg-[#3F3F46] transition-colors text-[#A1A1AA] hover:text-white flex items-center justify-center cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Title */}
                <h2 className="text-xl font-semibold text-white tracking-tight mb-2">
                  Hapus Brand "{brandToDelete}"?
                </h2>

                {/* Description & Warning */}
                <div className="space-y-3 mb-6 text-sm text-[#A1A1AA]">
                  <div className="p-3 bg-red-950/40 border border-red-900/40 rounded-xl text-xs text-red-200 space-y-1">
                    <p className="font-semibold text-red-400 flex items-center gap-1.5">
                      <AlertTriangle size={14} className="shrink-0" />
                      Peringatan Penting:
                    </p>
                    <p className="leading-relaxed">
                      Jika brand <span className="font-bold text-white">"{brandToDelete}"</span> dihapus, maka <span className="font-bold text-red-400">{products.filter(p => p.brand === brandToDelete).length} produk</span> yang menggunakan brand ini akan ikut terhapus secara permanen.
                    </p>
                  </div>

                  {products.filter(p => p.brand === brandToDelete).length > 0 && (
                    <div className="text-xs bg-[#202024] p-3 rounded-xl border border-[#2B2B30]">
                      <span className="text-[#8A8F9E] font-medium block mb-1">
                        Daftar produk yang akan terhapus ({products.filter(p => p.brand === brandToDelete).length}):
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-white max-h-28 overflow-y-auto pr-1">
                        {products.filter(p => p.brand === brandToDelete).map(p => (
                          <li key={p.id} className="truncate">{p.name} <span className="text-[#8A8F9E]">({p.sku})</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setBrandToDelete(null)}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-[#27272A] hover:bg-[#3F3F46] rounded-full transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteBrand}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-[#E11D48] hover:bg-[#F43F5E] rounded-full transition-colors cursor-pointer shadow-lg shadow-[#E11D48]/20 flex items-center gap-1.5"
                  >
                    <Trash2 size={15} />
                    <span>Ya, Hapus Brand & Produk</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Category Confirmation Modal */}
        <AnimatePresence>
          {categoryToDelete && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-[#18181A] border border-[#27272A] rounded-[24px] shadow-2xl w-full max-w-md relative z-[2001] p-6 overflow-hidden text-left"
              >
                {/* Top Header Row */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-full bg-[#3F1D24] text-[#F87171] border border-red-900/30 flex items-center justify-center">
                    <AlertCircle size={22} />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setCategoryToDelete(null)}
                    className="w-8 h-8 rounded-full bg-[#27272A] hover:bg-[#3F3F46] transition-colors text-[#A1A1AA] hover:text-white flex items-center justify-center cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Title */}
                <h2 className="text-xl font-semibold text-white tracking-tight mb-2">
                  Hapus Kategori "{categoryToDelete}"?
                </h2>

                {/* Description & Warning */}
                <div className="space-y-3 mb-6 text-sm text-[#A1A1AA]">
                  <div className="p-3 bg-red-950/40 border border-red-900/40 rounded-xl text-xs text-red-200 space-y-1">
                    <p className="font-semibold text-red-400 flex items-center gap-1.5">
                      <AlertTriangle size={14} className="shrink-0" />
                      Peringatan Penting:
                    </p>
                    <p className="leading-relaxed">
                      Jika kategori <span className="font-bold text-white">"{categoryToDelete}"</span> dihapus, maka <span className="font-bold text-red-400">{products.filter(p => p.category === categoryToDelete).length} produk</span> yang menggunakan kategori ini akan ikut terhapus secara permanen.
                    </p>
                  </div>

                  {products.filter(p => p.category === categoryToDelete).length > 0 && (
                    <div className="text-xs bg-[#202024] p-3 rounded-xl border border-[#2B2B30]">
                      <span className="text-[#8A8F9E] font-medium block mb-1">
                        Daftar produk yang akan terhapus ({products.filter(p => p.category === categoryToDelete).length}):
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-white max-h-28 overflow-y-auto pr-1">
                        {products.filter(p => p.category === categoryToDelete).map(p => (
                          <li key={p.id} className="truncate">{p.name} <span className="text-[#8A8F9E]">({p.sku})</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCategoryToDelete(null)}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-[#27272A] hover:bg-[#3F3F46] rounded-full transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteCategory}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-[#E11D48] hover:bg-[#F43F5E] rounded-full transition-colors cursor-pointer shadow-lg shadow-[#E11D48]/20 flex items-center gap-1.5"
                  >
                    <Trash2 size={15} />
                    <span>Ya, Hapus Kategori & Produk</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal Panduan Penggunaan Produk (Product Guide Modal) */}
        <AnimatePresence>
          {showGuideModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowGuideModal(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-[#141517] border border-[#2A2A2A] rounded-xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden p-6 space-y-5 text-left"
              >
                <div className="flex justify-between items-center pb-3 border-b border-[#2A2A2A]">
                  <div>
                    <h2 className="text-base font-semibold text-white flex items-center gap-2">
                      <HelpCircle size={18} className="text-[#EA580C]" />
                      Panduan Penambahan & Pengelolaan Produk (Product Guide)
                    </h2>
                    <p className="text-xs text-[#909090] mt-0.5">
                      Petunjuk langkah demi langkah untuk mendaftarkan dan mengelola katalog produk
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGuideModal(false)}
                    className="p-1 hover:bg-[#1C1C1E] rounded-lg transition-colors text-[#909090] hover:text-white cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3.5 text-xs text-[#CCCCCC] max-h-[60vh] overflow-y-auto pr-1">
                  <div className="bg-[#0E0F11] border border-[#2A2A2A] p-3.5 rounded-lg space-y-1.5">
                    <h3 className="font-semibold text-white flex items-center gap-2 text-xs">
                      <span className="w-5 h-5 rounded-full bg-[#EA580C]/20 text-[#EA580C] flex items-center justify-center text-[10px] font-bold">1</span>
                      Informasi Utama Produk (Product Identity)
                    </h3>
                    <p className="text-[#A0A0A0] leading-relaxed pl-7">
                      Isi nama produk, SKU/Kode produk, pilih <strong>Kategori</strong>, <strong>Merek (Brand)</strong>, serta <strong>Satuan (Unit)</strong>. Anda dapat memilih dari daftar atau menambahkan kategori & merek baru secara langsung.
                    </p>
                  </div>

                  <div className="bg-[#0E0F11] border border-[#2A2A2A] p-3.5 rounded-lg space-y-1.5">
                    <h3 className="font-semibold text-white flex items-center gap-2 text-xs">
                      <span className="w-5 h-5 rounded-full bg-[#EA580C]/20 text-[#EA580C] flex items-center justify-center text-[10px] font-bold">2</span>
                      Harga Beli & Harga Jual (Pricing & Margin)
                    </h3>
                    <p className="text-[#A0A0A0] leading-relaxed pl-7">
                      Masukkan <strong>Harga Beli (Cost Price)</strong> dan <strong>Harga Jual (Selling Price)</strong>. Estimasi margin keuntungan dihitung otomatis. Opsi <strong>Harga Grosir</strong> juga dapat diaktifkan jika terdapat skema harga berjenjang.
                    </p>
                  </div>

                  <div className="bg-[#0E0F11] border border-[#2A2A2A] p-3.5 rounded-lg space-y-1.5">
                    <h3 className="font-semibold text-white flex items-center gap-2 text-xs">
                      <span className="w-5 h-5 rounded-full bg-[#EA580C]/20 text-[#EA580C] flex items-center justify-center text-[10px] font-bold">3</span>
                      Manajemen Stok & Batas Minimum (Inventory Control)
                    </h3>
                    <p className="text-[#A0A0A0] leading-relaxed pl-7">
                      Tentukan jumlah <strong>Stok Awal</strong> serta <strong>Stok Minimum</strong>. Apabila persediaan produk mencapai batas stok minimum, status indikator akan otomatis berubah menjadi <em>Low Stock</em> atau <em>Out of Stock</em>.
                    </p>
                  </div>

                  <div className="bg-[#0E0F11] border border-[#2A2A2A] p-3.5 rounded-lg space-y-1.5">
                    <h3 className="font-semibold text-white flex items-center gap-2 text-xs">
                      <span className="w-5 h-5 rounded-full bg-[#EA580C]/20 text-[#EA580C] flex items-center justify-center text-[10px] font-bold">4</span>
                      Pengaturan Tambahan (Pajak, Gambar, & Deskripsi)
                    </h3>
                    <p className="text-[#A0A0A0] leading-relaxed pl-7">
                      Aktifkan opsi pajak jika produk dikenai PPN/Pajak Penjualan. Anda juga dapat mengunggah foto produk dan menuliskan deskripsi singkat produk.
                    </p>
                  </div>

                  <div className="bg-[#0E0F11] border border-[#2A2A2A] p-3.5 rounded-lg space-y-1.5">
                    <h3 className="font-semibold text-white flex items-center gap-2 text-xs">
                      <span className="w-5 h-5 rounded-full bg-[#EA580C]/20 text-[#EA580C] flex items-center justify-center text-[10px] font-bold">5</span>
                      Menyimpan Data Produk
                    </h3>
                    <p className="text-[#A0A0A0] leading-relaxed pl-7">
                      Klik tombol hijau <strong className="text-[#10B981]">Save</strong> di pojok kanan atas untuk menyimpan produk secara permanen ke database toko Anda.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-[#2A2A2A]">
                  <button
                    type="button"
                    onClick={() => setShowGuideModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#EA580C] hover:bg-[#C2410C] rounded-lg transition-colors cursor-pointer"
                  >
                    Saya Mengerti
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
