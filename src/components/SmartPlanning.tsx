import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Mail, 
  MessageSquare, 
  SlidersHorizontal, 
  RefreshCw,
  Globe,
  ChevronDown,
  PlusCircle,
  Image as ImageIcon,
  ArrowRight,
  ArrowUp,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
  Sparkles,
  FileText,
  Paperclip,
  SquarePen,
  Bot,
  Mic
} from 'lucide-react';
import { registerNewInvoice, getStoredProducts } from '../lib/state';
import { askSmartPlanningAI } from '../lib/aiAssistant';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isPurchaseInvoicePrompt?: boolean;
  isSalesInvoicePrompt?: boolean;
  parsedInvoice?: any;
  status?: 'idle' | 'analyzing' | 'parsed' | 'saved';
}

export function SmartPlanning() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const prompts = [
    {
      text: 'Quick import template for Purchase Invoice',
      icon: FileSpreadsheet,
      badge: 'Purchase'
    },
    {
      text: 'Quick import template for Sales Invoice',
      icon: FileSpreadsheet,
      badge: 'Sales'
    },
    {
      text: 'Summarise this article or text for me in one paragraph',
      icon: MessageSquare
    },
    {
      text: 'How does AI work in a technical capacity',
      icon: SlidersHorizontal
    }
  ];

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const downloadSalesCSVTemplate = () => {
    const headers = "Customer,Reference,Document_Type,Product_Name,Quantity,Unit,Discount,Tax,Unit_Price\n";
    const row1 = "\"AeroTech Solutions\",AeroTech Cloud Migration,Invoice,SaaS Enterprise Core Integration,1,Pcs,0%,PPN 11%,30000\n";
    const row2 = "\"AeroTech Solutions\",AeroTech Cloud Migration,Invoice,Technical Onboarding Support T1,10,Pcs,0%,PPN 11%,450";
    const csvContent = headers + row1 + row2;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template_sales_invoice.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePromptClick = async (promptText: string) => {
    // Add user message
    const userMsgId = `msg-${Date.now()}`;
    const newMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text: promptText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMsg]);

    if (promptText === 'Quick import template for Purchase Invoice') {
      const aiMsgId = `msg-${Date.now() + 1}`;
      setMessages(prev => [...prev, {
        id: aiMsgId,
        sender: 'ai',
        text: 'Please upload your purchase invoice CSV file using the template below. Once filled, upload it here and our AI will parse the details automatically so you can review and save it directly!',
        timestamp: new Date(),
        isPurchaseInvoicePrompt: true,
        status: 'idle'
      }]);
    } else if (promptText === 'Quick import template for Sales Invoice') {
      const aiMsgId = `msg-${Date.now() + 1}`;
      setMessages(prev => [...prev, {
        id: aiMsgId,
        sender: 'ai',
        text: 'Please upload your sales invoice CSV file using the template below. Once filled, upload it here and our AI will parse the details automatically so you can review and save it directly!',
        timestamp: new Date(),
        isSalesInvoicePrompt: true,
        status: 'idle'
      }]);
    } else {
      const aiMsgId = `msg-${Date.now() + 1}`;
      // Add thinking placeholder
      setMessages(prev => [...prev, {
        id: aiMsgId,
        sender: 'ai',
        text: 'Sedang menganalisis seluruh data aplikasi...',
        timestamp: new Date()
      }]);

      const responseText = await askSmartPlanningAI(promptText);

      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: responseText } : m));
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsgId = `msg-${Date.now()}`;
    const userText = inputValue;
    setMessages(prev => [...prev, {
      id: userMsgId,
      sender: 'user',
      text: userText,
      timestamp: new Date()
    }]);
    setInputValue('');

    const aiMsgId = `msg-${Date.now() + 1}`;
    // Thinking placeholder
    setMessages(prev => [...prev, {
      id: aiMsgId,
      sender: 'ai',
      text: 'Sedang menganalisis seluruh data di dalam aplikasi...',
      timestamp: new Date()
    }]);

    const responseText = await askSmartPlanningAI(userText);

    setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: responseText } : m));
  };

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
    const headers = "Distributor,Reference,Document_Type,Product_Name,Quantity,Unit,Discount,Tax,Unit_Price\n";
    const row1 = "\"Nexus CRM Inc.\",AeroTech Cloud Migration,Invoice,SaaS Enterprise Core Integration,1,Pcs,0%,PPN 11%,30000\n";
    const row2 = "\"Nexus CRM Inc.\",AeroTech Cloud Migration,Invoice,Technical Onboarding Support T1,10,Pcs,0%,PPN 11%,450";
    const csvContent = headers + row1 + row2;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template_purchase_invoice.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string, isSales: boolean = false) => {
    const lines = text.replace(/\r/g, '').split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return {
        success: false,
        error: "CSV file is empty or only contains headers."
      };
    }

    const products = getStoredProducts();
    const items: any[] = [];
    let expectedDistributor = '';
    let expectedReference = '';
    let expectedDocType = '';
    const mainColHeader = isSales ? "Customer" : "Distributor";

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length === 0 || cols.every(c => c === '')) continue;

      if (cols.length < 9) {
        return {
          success: false,
          error: `Incomplete columns on Row ${i + 1}. Template requires 9 columns: ${mainColHeader}, Reference, Document_Type, Product_Name, Quantity, Unit, Discount, Tax, Unit_Price.`
        };
      }

      const distributor = cols[0];
      const reference = cols[1];
      const docType = cols[2];
      const prodName = cols[3];
      const qtyStr = cols[4];
      const unit = cols[5];
      const discount = cols[6];
      const tax = cols[7];
      const priceStr = cols[8];

      // 1. Validate Distributor/Customer
      if (!distributor) {
        return {
          success: false,
          error: `Row ${i + 1}: ${mainColHeader} cannot be empty.`
        };
      }
      if (!expectedDistributor) {
        expectedDistributor = distributor;
      } else if (distributor.toLowerCase() !== expectedDistributor.toLowerCase()) {
        return {
          success: false,
          error: `Row ${i + 1}: ${mainColHeader} names must be uniform. Current row uses "${distributor}", while previous row used "${expectedDistributor}".`
        };
      }

      // 2. Validate Reference
      if (!reference) {
        return {
          success: false,
          error: `Row ${i + 1}: Reference cannot be empty.`
        };
      }
      if (!expectedReference) {
        expectedReference = reference;
      } else if (reference.toLowerCase() !== expectedReference.toLowerCase()) {
        return {
          success: false,
          error: `Row ${i + 1}: Reference must be uniform. Current row uses "${reference}", while previous row used "${expectedReference}".`
        };
      }

      // 3. Validate Document_Type
      if (!docType) {
        return {
          success: false,
          error: `Row ${i + 1}: Document Type cannot be empty.`
        };
      }
      const allowedDocTypes = ['Invoice', 'Quotation', 'Delivery', 'Return'];
      const matchedDocType = allowedDocTypes.find(t => t.toLowerCase() === docType.toLowerCase()) || docType;
      
      if (!expectedDocType) {
        expectedDocType = matchedDocType;
      } else if (matchedDocType.toLowerCase() !== expectedDocType.toLowerCase()) {
        return {
          success: false,
          error: `Row ${i + 1}: Document Type must be uniform. Current row uses "${docType}", while previous row used "${expectedDocType}".`
        };
      }

      // 4. Validate Product_Name
      if (!prodName) {
        return {
          success: false,
          error: `Row ${i + 1}: Product Name cannot be empty.`
        };
      }
      const matchedProd = products.find(p => p.name.toLowerCase() === prodName.toLowerCase());
      if (!matchedProd) {
        return {
          success: false,
          error: `Row ${i + 1}: Product "${prodName}" not found. Please register it in the Inventory menu first.`
        };
      }

      const qty = parseInt(qtyStr.replace(/[^0-9]+/g, '')) || 1;
      const price = parseFloat(priceStr.replace(/[^0-9.-]+/g, '')) || 0;

      items.push({
        productId: matchedProd.id,
        name: matchedProd.name,
        description: matchedProd.name,
        qty: qty,
        unit: unit || 'Pcs',
        discount: discount || '0%',
        price: price,
        tax: tax || 'Tanpa Pajak'
      });
    }

    return {
      success: true,
      data: {
        supplierName: expectedDistributor,
        ref: expectedReference,
        docType: expectedDocType,
        items
      }
    };
  };

  const processFile = (file: File, msgId: string, isSales: boolean = false) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCSV(text, isSales);

      // Update message to show analyzing state
      setMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          return { ...m, status: 'analyzing' };
        }
        return m;
      }));

      // Simulate AI analysis delay
      setTimeout(() => {
        if (!result.success) {
          setMessages(prev => prev.map(m => {
            if (m.id === msgId) {
              return {
                ...m,
                status: 'idle',
                text: `Analysis failed.\n\n⚠️ ${result.error}\n\nPlease fix your file and upload again.`
              };
            }
            return m;
          }));
          return;
        }

        const parsedData = result.data;
        if (isSales) {
          sessionStorage.setItem('imported_sales_invoice', JSON.stringify(parsedData));
        } else {
          sessionStorage.setItem('imported_purchase_invoice', JSON.stringify(parsedData));
        }
        
        setMessages(prev => prev.map(m => {
          if (m.id === msgId) {
            return {
              ...m,
              status: 'saved',
              parsedInvoice: parsedData,
              text: `Analysis successful!\n\n${isSales ? 'Customer' : 'Distributor'}: ${parsedData?.supplierName}\nReference: ${parsedData?.ref}\nDocument Type: ${parsedData?.docType}\nItems Count: ${parsedData?.items.length}\n\nRedirecting you to the ${isSales ? 'Sales' : 'Purchase'} Invoice creation page...`
            };
          }
          return m;
        }));

        window.dispatchEvent(new CustomEvent('change-tab', { detail: isSales ? 'Sales' : 'Purchase' }));
      }, 1500);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent, msgId: string, isSales: boolean = false) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0], msgId, isSales);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, msgId: string, isSales: boolean = false) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0], msgId, isSales);
    }
  };

  const handleSaveInvoice = (msgId: string, updatedInvoice: any, isSales: boolean = false) => {
    try {
      // Register new invoice in state manager
      registerNewInvoice({
        id: updatedInvoice.id,
        partnerName: updatedInvoice.partnerName,
        ref: updatedInvoice.ref,
        date: updatedInvoice.date,
        due: updatedInvoice.due,
        type: 'Invoice',
        remaining: Number(updatedInvoice.remaining),
        total: Number(updatedInvoice.total),
        isSales: isSales,
        items: updatedInvoice.items
      });

      // Update message status to saved
      setMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          return {
            ...m,
            status: 'saved',
            parsedInvoice: updatedInvoice
          };
        }
        return m;
      }));
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan invoice. Mohon periksa kembali keselarasan tipe data.');
    }
  };

  const updateParsedField = (msgId: string, field: string, value: any) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId && m.parsedInvoice) {
        const updatedInvoice = { ...m.parsedInvoice, [field]: value };
        
        // Recalculate total if items were edited
        if (field === 'items') {
          const newTotal = value.reduce((sum: number, item: any) => sum + (item.qty * item.price), 0);
          updatedInvoice.total = newTotal;
          updatedInvoice.remaining = newTotal;
        }

        return { ...m, parsedInvoice: updatedInvoice };
      }
      return m;
    }));
  };

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const navigateToPurchaseList = () => {
    // Navigate to Purchase list page using our tab-switch event
    window.dispatchEvent(new CustomEvent('change-tab', { detail: 'Purchase' }));
  };

  const navigateToSalesList = () => {
    // Navigate to Sales list page using our tab-switch event
    window.dispatchEvent(new CustomEvent('change-tab', { detail: 'Sales' }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col w-full flex-1 font-sans bg-[#0A0A0B] text-white overflow-hidden h-full">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#212121] bg-[#0A0A0B] text-white shrink-0">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[#1C1D21] transition-colors text-sm font-semibold text-white cursor-pointer">
            <Sparkles size={16} className="text-white" />
            <span>Smart Planning GPT-4o</span>
            <ChevronDown size={14} className="text-[#71717A]" />
          </button>
        </div>
        {messages.length > 0 && (
          <button 
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 text-xs text-[#A1A1AA] hover:text-white bg-[#18191D] hover:bg-[#22242B] border border-[#2B2D35] px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            title="Start New Chat"
          >
            <SquarePen size={14} />
            <span>New chat</span>
          </button>
        )}
      </div>

      {messages.length === 0 ? (
        // ================== LANDING SCREEN (Original Design) ==================
        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full overflow-y-auto custom-scrollbar">
          <div className="w-full mb-10">
            <h1 className="text-4xl tracking-tight mb-0 flex items-baseline" style={{ marginBottom: 0 }}>
              <span className="text-white font-normal">Hi there,</span>
              <span className="text-white font-normal ml-2">Moch</span>
            </h1>
            <h2 className="text-white text-4xl font-normal tracking-tight mb-2">What would you like to know?</h2>
            <p className="text-[#909090] text-[14px]">
              Use one of the most common prompts below or use your own to begin
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-4">
            {prompts.map((prompt, index) => (
              <div 
                key={index} 
                onClick={() => handlePromptClick(prompt.text)}
                className="bg-[#141517] border border-[#2A2A2A] rounded-xl p-4 flex flex-col justify-between min-h-[120px] cursor-pointer hover:bg-[#1C1C1C] hover:border-white/40 transition-all group"
              >
                <p className="text-[13px] text-[#E5E5E5] leading-relaxed group-hover:text-white transition-colors capitalize">
                  {prompt.text}
                </p>
                <div className="mt-4 flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <prompt.icon size={16} className="text-[#909090] group-hover:text-white transition-colors" />
                    {prompt.badge && (
                      <span className="text-[11px] font-semibold text-white px-1.5 py-0.5 rounded bg-white/10 border border-white/20">
                        {prompt.badge}
                      </span>
                    )}
                  </div>
                  <ArrowRight size={14} className="text-transparent group-hover:text-white transition-all transform translate-x-[-4px] group-hover:translate-x-0" />
                </div>
              </div>
            ))}
          </div>

          <div className="w-full flex items-center mb-8">
            <button className="flex items-center gap-1.5 text-[12px] text-[#909090] hover:text-white transition-colors cursor-pointer">
              <RefreshCw size={14} /> Refresh Prompts
            </button>
          </div>

          <div className="w-full bg-[#141517] border border-[#2A2A2A] rounded-2xl p-4 flex flex-col shadow-sm">
            <div className="flex items-start justify-between mb-8">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask whatever you want...."
                className="bg-transparent border-none outline-none text-[15px] text-white placeholder:text-[#666666] flex-1 mr-4"
              />
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0A0A0A] border border-[#2A2A2A] text-[11px] text-[#E5E5E5] hover:bg-[#1C1C1C] transition-colors shrink-0 cursor-pointer">
                <Globe size={12} className="text-[#909090]" /> All Web <ChevronDown size={12} className="text-[#909090]" />
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-4 text-[#909090]">
                <input 
                  type="file" 
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handlePromptClick('Quick import template for Purchase Invoice');
                    }
                  }}
                  className="hidden" 
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-[13px] font-medium hover:text-white transition-colors cursor-pointer"
                >
                  <PlusCircle size={15} /> Add Attachment
                </button>
                <button 
                  type="button"
                  className="flex items-center gap-1.5 text-[13px] font-medium hover:text-white transition-colors cursor-pointer"
                >
                  <ImageIcon size={15} /> Use Image
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-[#666666] font-medium">{inputValue.length}/1000</span>
                <button 
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="w-8 h-8 rounded-lg bg-white hover:bg-gray-200 disabled:opacity-40 flex items-center justify-center text-black transition-colors shadow-sm cursor-pointer"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ================== ACTIVE CONVERSATION SCREEN ==================
        <div className="flex-1 flex flex-col overflow-hidden h-full w-full">
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-3xl mx-auto w-full custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className="w-full">
                {msg.sender === 'user' ? (
                  <div className="flex justify-end mb-4">
                    <div className="bg-[#212121] border border-[#303030] text-[#ECECF1] text-sm leading-relaxed rounded-3xl px-5 py-3 max-w-[85%] shadow-xs whitespace-pre-line">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3.5 mb-6 text-sm text-[#ECECF1] leading-relaxed">
                    <div className="w-8 h-8 rounded-full bg-white/10 text-white border border-white/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles size={16} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-4 pt-1">
                      <p className="whitespace-pre-line">{msg.text}</p>

                      {/* CUSTOM AI PURCHASE & SALES INVOICE WORKFLOW */}
                      {(msg.isPurchaseInvoicePrompt || msg.isSalesInvoicePrompt) && (() => {
                        const isSales = !!msg.isSalesInvoicePrompt;
                        const modeTitle = isSales ? 'Sales' : 'Purchase';
                        const partnerLabel = isSales ? 'Customer Name / Partner' : 'Distributor Name / Partner';
                        const helperTemplateText = `Supports ${isSales ? 'sales' : 'purchase'} invoice template .csv files`;
                        const analyzerText = `Analyzing ${modeTitle} Invoice Document...`;
                        
                        return (
                          <div className="mt-4 space-y-4">
                            
                            {/* 1. File Upload Drag-and-Drop / Selection Zone */}
                            {msg.status === 'idle' && (
                              <div 
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, msg.id, isSales)}
                                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                                  isDragging 
                                    ? 'border-white bg-white/5' 
                                    : 'border-[#333333] hover:border-[#555555] bg-[#171717]'
                                }`}
                              >
                                <input 
                                  type="file" 
                                  accept=".csv"
                                  ref={fileInputRef}
                                  onChange={(e) => handleFileSelect(e, msg.id, isSales)}
                                  className="hidden" 
                                />
                                <div className="flex flex-col items-center justify-center">
                                  <Upload size={28} className="text-[#8E8E8E] mb-2" />
                                  <p className="text-xs font-medium text-white mb-1">
                                    Drag & drop CSV file here, or <span className="text-white underline font-semibold cursor-pointer" onClick={() => fileInputRef.current?.click()}>browse file</span>
                                  </p>
                                  <p className="text-[11px] text-[#71717A]">{helperTemplateText}</p>
                                </div>
                              </div>
                            )}

                            {/* 2. File Analysis Loading State */}
                            {msg.status === 'analyzing' && (
                              <div className="bg-[#171717] border border-[#333333] rounded-2xl p-6 text-center flex flex-col items-center justify-center space-y-3">
                                <div className="relative">
                                  <div className="w-8 h-8 border-2 border-[#333333] border-t-white rounded-full animate-spin" />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs font-semibold text-white">{analyzerText}</p>
                                  <p className="text-[11px] text-[#71717A] animate-pulse">Extracting line-item data using AI...</p>
                                </div>
                              </div>
                            )}

                            {/* 3. Parsed Data Preview & Live Edit Form Dashboard */}
                            {msg.status === 'parsed' && msg.parsedInvoice && (
                              <div className="bg-[#171717] border border-[#303030] rounded-2xl overflow-hidden shadow-lg">
                                <div className="px-4 py-3 border-b border-[#303030] bg-white/5 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-white" />
                                    <span className="text-xs font-semibold text-white uppercase tracking-wider">AI Extraction Results</span>
                                  </div>
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold uppercase">Ready for Review</span>
                                </div>

                                <div className="p-4 space-y-4">
                                  {/* Metadata Grid */}
                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                      <label className="text-[#8E8E8E] block mb-1">Invoice ID / Bill No.</label>
                                      <input 
                                        type="text" 
                                        value={msg.parsedInvoice.id}
                                        onChange={(e) => updateParsedField(msg.id, 'id', e.target.value)}
                                        className="w-full bg-[#212121] border border-[#303030] rounded-xl px-3 py-1.5 text-xs text-white focus:border-white outline-none transition-colors"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[#8E8E8E] block mb-1">{partnerLabel}</label>
                                      <input 
                                        type="text" 
                                        value={msg.parsedInvoice.partnerName}
                                        onChange={(e) => updateParsedField(msg.id, 'partnerName', e.target.value)}
                                        className="w-full bg-[#212121] border border-[#303030] rounded-xl px-3 py-1.5 text-xs text-white focus:border-white outline-none transition-colors"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[#8E8E8E] block mb-1">Invoice Date</label>
                                      <input 
                                        type="text" 
                                        value={msg.parsedInvoice.date}
                                        onChange={(e) => updateParsedField(msg.id, 'date', e.target.value)}
                                        className="w-full bg-[#212121] border border-[#303030] rounded-xl px-3 py-1.5 text-xs text-white focus:border-white outline-none transition-colors"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[#8E8E8E] block mb-1">Due Date</label>
                                      <input 
                                        type="text" 
                                        value={msg.parsedInvoice.due}
                                        onChange={(e) => updateParsedField(msg.id, 'due', e.target.value)}
                                        className="w-full bg-[#212121] border border-[#303030] rounded-xl px-3 py-1.5 text-xs text-white focus:border-white outline-none transition-colors"
                                      />
                                    </div>
                                  </div>

                                  {/* Line Items Table */}
                                  <div className="border border-[#303030] rounded-xl overflow-hidden bg-[#212121]">
                                    <table className="w-full text-left border-collapse">
                                      <thead>
                                        <tr className="border-b border-[#303030] bg-[#171717] text-[11px] text-[#8E8E8E] uppercase">
                                          <th className="px-3 py-2 font-semibold">Product Name</th>
                                          <th className="px-3 py-2 font-semibold text-center w-16">Qty</th>
                                          <th className="px-3 py-2 font-semibold text-right w-28">Unit Price</th>
                                          <th className="px-3 py-2 font-semibold text-right w-28">Total</th>
                                          <th className="px-2 py-2 text-center w-8"></th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-[#303030] text-xs">
                                        {msg.parsedInvoice.items.map((item: any, iIndex: number) => (
                                          <tr key={iIndex} className="hover:bg-[#2A2A2A]">
                                            <td className="px-3 py-2">
                                              <input 
                                                type="text" 
                                                value={item.name}
                                                onChange={(e) => {
                                                  const newItems = [...msg.parsedInvoice.items];
                                                  newItems[iIndex].name = e.target.value;
                                                  updateParsedField(msg.id, 'items', newItems);
                                                }}
                                                className="bg-transparent border-none outline-none text-white w-full"
                                              />
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                              <input 
                                                type="number" 
                                                value={item.qty}
                                                onChange={(e) => {
                                                  const newItems = [...msg.parsedInvoice.items];
                                                  newItems[iIndex].qty = parseInt(e.target.value) || 0;
                                                  updateParsedField(msg.id, 'items', newItems);
                                                }}
                                                className="bg-[#171717] border border-[#303030] rounded text-center w-12 py-0.5 outline-none focus:border-white"
                                              />
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                              <input 
                                                type="number" 
                                                value={item.price}
                                                onChange={(e) => {
                                                  const newItems = [...msg.parsedInvoice.items];
                                                  newItems[iIndex].price = parseFloat(e.target.value) || 0;
                                                  updateParsedField(msg.id, 'items', newItems);
                                                }}
                                                className="bg-[#171717] border border-[#303030] rounded text-right w-20 px-1 py-0.5 outline-none focus:border-white"
                                              />
                                            </td>
                                            <td className="px-3 py-2 text-right font-medium text-white">
                                              {formatRupiah(item.qty * item.price)}
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                              <button 
                                                onClick={() => {
                                                  const newItems = msg.parsedInvoice.items.filter((_: any, idx: number) => idx !== iIndex);
                                                  updateParsedField(msg.id, 'items', newItems);
                                                }}
                                                className="text-[#8E8E8E] hover:text-red-400 p-0.5 transition-colors cursor-pointer"
                                              >
                                                <Trash2 size={13} />
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>

                                    <div className="px-3 py-2 border-t border-[#303030] bg-[#171717] flex justify-start">
                                      <button 
                                        onClick={() => {
                                          const newItems = [...msg.parsedInvoice.items, { productId: 'prod-1', name: 'Barang Baru', qty: 10, price: 150000 }];
                                          updateParsedField(msg.id, 'items', newItems);
                                        }}
                                        className="flex items-center gap-1 text-xs text-white hover:underline font-semibold cursor-pointer"
                                      >
                                        <Plus size={13} /> Add Item
                                      </button>
                                    </div>
                                  </div>

                                  {/* Call to Actions */}
                                  <div className="flex items-center justify-end gap-2.5 pt-2">
                                    <button 
                                      onClick={() => {
                                        setMessages(prev => prev.map(m => {
                                          if (m.id === msg.id) {
                                            return { ...m, status: 'idle', parsedInvoice: null };
                                          }
                                          return m;
                                        }));
                                      }}
                                      className="px-3 py-1.5 border border-[#303030] rounded-xl text-xs text-[#8E8E8E] hover:text-white hover:bg-[#212121] transition-all cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    
                                    <button 
                                      onClick={() => handleSaveInvoice(msg.id, msg.parsedInvoice, isSales)}
                                      className="px-4 py-1.5 rounded-xl text-xs font-medium text-black bg-white hover:bg-gray-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                                    >
                                      <CheckCircle2 size={14} /> Save {modeTitle} Invoice
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 4. Invoice Saved Confirmation Panel */}
                            {msg.status === 'saved' && msg.parsedInvoice && (
                              <div className="bg-white/5 border border-white/20 rounded-2xl p-4 text-[#E5E5E5]">
                                <div className="flex items-start gap-3">
                                  <CheckCircle2 size={18} className="text-white shrink-0 mt-0.5" />
                                  <div className="space-y-2 flex-1">
                                    <p className="text-xs font-semibold text-white">
                                      {modeTitle} Invoice Saved: {msg.parsedInvoice.id} ({msg.parsedInvoice.partnerName})
                                    </p>
                                    <p className="text-xs text-[#A1A1AA]">
                                      Total {formatRupiah(msg.parsedInvoice.total)} recorded in {modeTitle} module.
                                    </p>
                                    <div className="flex items-center gap-2 pt-1">
                                      <button 
                                        onClick={isSales ? navigateToSalesList : navigateToPurchaseList}
                                        className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs text-white font-medium transition-all flex items-center gap-1 cursor-pointer"
                                      >
                                        <FileText size={12} /> View Invoices
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Helper Template Download Action */}
                            {msg.status === 'idle' && (
                              <div className="bg-[#212121] rounded-2xl p-3.5 border border-[#303030] flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                  <FileSpreadsheet size={16} className="text-white" />
                                  <span className="text-xs text-white font-medium">{modeTitle} Invoice CSV Template</span>
                                </div>
                                <button 
                                  onClick={isSales ? downloadSalesCSVTemplate : downloadCSVTemplate}
                                  className="px-3 py-1 rounded-xl text-xs font-medium text-white bg-[#2F2F2F] hover:bg-[#383838] border border-[#3E3E3E] transition-all flex items-center gap-1 cursor-pointer shrink-0"
                                >
                                  <Download size={12} /> Download Template
                                </button>
                              </div>
                            )}

                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* ChatGPT Floating Input Bar at Bottom */}
          <div className="bg-[#0A0A0B]/90 backdrop-blur-md pt-2 pb-4 px-4 border-t border-[#212121] shrink-0">
            <div className="max-w-3xl mx-auto w-full">
              <div className="bg-[#212121] border border-[#303030] focus-within:border-[#555] rounded-[26px] p-2.5 px-4 shadow-xl transition-all">
                <textarea 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Message Smart Planning..."
                  rows={1}
                  className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-[#8E8E8E] resize-none min-h-[36px] max-h-[140px] leading-relaxed custom-scrollbar"
                />

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-[#A1A1AA]">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 hover:text-white hover:bg-[#2F2F2F] rounded-full transition-colors cursor-pointer"
                      title="Attach file"
                    >
                      <Paperclip size={16} />
                    </button>
                    <button 
                      type="button"
                      className="flex items-center gap-1 px-2.5 py-0.5 text-xs hover:text-white bg-[#2F2F2F]/60 hover:bg-[#2F2F2F] rounded-full transition-colors cursor-pointer"
                    >
                      <Globe size={12} />
                      <span>Search</span>
                    </button>
                  </div>

                  <button 
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      inputValue.trim() 
                        ? 'bg-white text-black hover:bg-gray-200 cursor-pointer shadow-xs' 
                        : 'bg-[#383838] text-[#676767] cursor-not-allowed'
                    }`}
                  >
                    <ArrowUp size={16} className="stroke-[2.5]" />
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-[#71717A] mt-2 text-center">
                Smart Planning can make mistakes. Verify important financial details.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
