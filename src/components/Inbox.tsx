import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { setHasUnsavedChanges } from '../lib/unsaved';
import { 
  Inbox as InboxIcon, 
  Search,
  Reply, 
  Trash2, 
  Plus,
  Paperclip,
  Send,
  X,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Smile,
  Star,
  Printer,
  ChevronsUpDown,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link2,
  List,
  ListOrdered,
  AlignLeft,
  FileText,
  FileSpreadsheet,
  MonitorPlay,
  CheckCircle2,
  Building2
} from 'lucide-react';

export interface EmailItem {
  id: number;
  sender: string;
  email: string;
  time: string;
  date: string;
  subject: string;
  preview: string;
  unread: boolean;
  starred: boolean;
  avatarGradient: string;
  content: string;
  recipient?: string;
  attachments?: Array<{ name: string; size: string; type: string }>;
}

export const divisionsList = [
  { id: 'all', name: 'Semua Divisi (All)', email: '' },
  { id: 'warehouse', name: 'Divisi Gudang & Logistik', email: 'warehouse@methodic.co.id' },
];

const defaultEmailsList: EmailItem[] = [];

export function Inbox({ searchQuery = '' }: { searchQuery?: string }) {
  const [emails, setEmails] = useState<EmailItem[]>(() => {
    const stored = localStorage.getItem('methodic_inbox_emails_v5');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any) => {
            const hasValidEmail = item.email && typeof item.email === 'string' && item.email.includes('@');
            let senderEmail = item.email;
            if (!hasValidEmail) {
              if (item.sender === 'Moch Kall') {
                senderEmail = 'moch.kall01@gmail.com';
              } else {
                const cleanSender = (item.sender || 'sender').toLowerCase().replace(/[^a-z0-9]/g, '');
                senderEmail = `${cleanSender}@methodic.co.id`;
              }
            }
            return {
              ...item,
              email: senderEmail,
              recipient: item.recipient || (item.email && !hasValidEmail ? item.email : 'Semua Divisi (All)')
            };
          });
        }
      } catch (e) {
        // fallback
      }
    }
    return defaultEmailsList;
  });

  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(() => {
    return emails.length > 0 ? emails[0] : null;
  });

  useEffect(() => {
    localStorage.setItem('methodic_inbox_emails_v5', JSON.stringify(emails));
  }, [emails]);

  const [localSearch, setLocalSearch] = useState('');
  
  // Replying state
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [emailReplies, setEmailReplies] = useState<Record<number, Array<{ id: number; text: string; time: string; sender: string; avatarGradient: string; attachments?: any[] }>>>({});
  const [replyAttachments, setReplyAttachments] = useState<Array<{ name: string; size: string; type: string }>>([]);

  // Divisions list state with localStorage
  const [divisions, setDivisions] = useState<Array<{ id: string; name: string; email: string }>>(() => {
    const stored = localStorage.getItem('methodic_divisions_v4');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // fallback
      }
    }
    return divisionsList;
  });

  useEffect(() => {
    localStorage.setItem('methodic_divisions_v4', JSON.stringify(divisions));
  }, [divisions]);

  // Compose modal states
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [isComposeMaximized, setIsComposeMaximized] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState('Semua Divisi (All)');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [composeAttachments, setComposeAttachments] = useState<Array<{ name: string; size: string; type: string }>>([]);

  // Division custom dropdown and Add Team states
  const [showDivisionDropdown, setShowDivisionDropdown] = useState(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamEmail, setNewTeamEmail] = useState('');
  const [addTeamError, setAddTeamError] = useState('');

  useEffect(() => {
    setHasUnsavedChanges(showComposeModal || showAddTeamModal);
  }, [showComposeModal, showAddTeamModal]);

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      setAddTeamError('Nama team/divisi wajib diisi.');
      return;
    }
    const cleanName = newTeamName.trim();
    const formattedName = cleanName.toLowerCase().startsWith('divisi') ? cleanName : `Divisi ${cleanName}`;
    const safeEmail = newTeamEmail.trim() || `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}@methodic.co.id`;
    
    const newTeam = {
      id: `div-${Date.now()}`,
      name: formattedName,
      email: safeEmail
    };

    const updated = [...divisions, newTeam];
    setDivisions(updated);
    setComposeRecipient(`${newTeam.name} (${newTeam.email})`);
    
    setNewTeamName('');
    setNewTeamEmail('');
    setAddTeamError('');
    setShowAddTeamModal(false);
  };

  const activeSearchTerm = (searchQuery || localSearch).toLowerCase().trim();

  const filteredEmails = emails.filter(email => 
    !activeSearchTerm ||
    email.subject.toLowerCase().includes(activeSearchTerm) ||
    email.sender.toLowerCase().includes(activeSearchTerm) ||
    email.email.toLowerCase().includes(activeSearchTerm) ||
    email.content.toLowerCase().includes(activeSearchTerm)
  );

  const currentIndex = selectedEmail 
    ? filteredEmails.findIndex(e => e.id === selectedEmail.id) 
    : -1;

  const handlePrevEmail = () => {
    if (currentIndex > 0) {
      setSelectedEmail(filteredEmails[currentIndex - 1]);
      setIsReplying(false);
    }
  };

  const handleNextEmail = () => {
    if (currentIndex >= 0 && currentIndex < filteredEmails.length - 1) {
      setSelectedEmail(filteredEmails[currentIndex + 1]);
      setIsReplying(false);
    }
  };

  const toggleStar = (id: number) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, starred: !e.starred } : e));
    if (selectedEmail && selectedEmail.id === id) {
      setSelectedEmail(prev => prev ? { ...prev, starred: !prev.starred } : null);
    }
  };

  const handleDeleteEmail = () => {
    if (!selectedEmail) return;
    const remaining = emails.filter(e => e.id !== selectedEmail.id);
    setEmails(remaining);
    if (remaining.length > 0) {
      const nextIdx = Math.min(currentIndex, remaining.length - 1);
      setSelectedEmail(remaining[nextIdx >= 0 ? nextIdx : 0]);
    } else {
      setSelectedEmail(null);
    }
  };

  const handleDownloadEmail = () => {
    if (!selectedEmail) return;
    const replies = emailReplies[selectedEmail.id] || [];

    const printWindow = window.open('', '_blank', 'width=850,height=1100');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Surat_Resmi_${selectedEmail.id}_${(selectedEmail.subject || 'Email').replace(/[^a-zA-Z0-9_-]/g, '_')}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4;
              margin: 15mm 20mm 20mm 20mm;
            }
            body {
              font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background-color: #ffffff;
              margin: 0;
              padding: 28px;
              line-height: 1.6;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header-container {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 3px double #0f172a;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .logo-title {
              font-size: 22px;
              font-weight: 800;
              letter-spacing: 0.5px;
              color: #0f172a;
              text-transform: uppercase;
            }
            .logo-sub {
              font-size: 11px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-top: 3px;
            }
            .doc-meta {
              text-align: right;
              font-size: 11px;
              color: #475569;
            }
            .doc-badge {
              display: inline-block;
              background-color: #0284c7;
              color: #ffffff;
              padding: 3px 10px;
              border-radius: 4px;
              font-weight: 700;
              font-size: 10px;
              letter-spacing: 0.5px;
              margin-bottom: 6px;
            }
            .memo-grid {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 16px 20px;
              margin-bottom: 20px;
            }
            .memo-row {
              display: flex;
              margin-bottom: 8px;
              font-size: 13px;
            }
            .memo-row:last-child {
              margin-bottom: 0;
            }
            .memo-label {
              width: 130px;
              font-weight: 700;
              color: #475569;
              text-transform: uppercase;
              font-size: 11px;
              letter-spacing: 0.5px;
            }
            .memo-val {
              flex: 1;
              color: #0f172a;
              font-weight: 500;
            }
            .subject-box {
              background-color: #0f172a;
              color: #ffffff;
              padding: 12px 20px;
              border-radius: 6px;
              font-size: 15px;
              font-weight: 700;
              margin-bottom: 24px;
              letter-spacing: 0.3px;
            }
            .content-body {
              font-size: 14px;
              color: #334155;
              white-space: pre-wrap;
              word-wrap: break-word;
              min-height: 180px;
              line-height: 1.8;
              padding: 0 4px;
            }
            .attachments-section {
              margin-top: 28px;
              padding-top: 16px;
              border-top: 1px solid #e2e8f0;
            }
            .attachment-title {
              font-size: 12px;
              font-weight: 700;
              color: #475569;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .attachment-item {
              display: inline-flex;
              align-items: center;
              background: #f1f5f9;
              border: 1px solid #cbd5e1;
              padding: 6px 12px;
              border-radius: 6px;
              font-size: 12px;
              margin-right: 8px;
              margin-bottom: 8px;
              color: #1e293b;
            }
            .replies-section {
              margin-top: 28px;
              padding-top: 20px;
              border-top: 2px dashed #cbd5e1;
            }
            .reply-card {
              background: #f8fafc;
              border-left: 4px solid #0284c7;
              padding: 12px 16px;
              margin-bottom: 12px;
              border-radius: 0 6px 6px 0;
            }
            .reply-header {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 6px;
            }
            .footer-sign {
              margin-top: 48px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              padding-top: 24px;
              border-top: 1px solid #e2e8f0;
            }
            .stamp-box {
              border: 2px dashed #0284c7;
              color: #0284c7;
              padding: 8px 16px;
              border-radius: 6px;
              font-size: 10px;
              font-weight: 800;
              text-align: center;
              text-transform: uppercase;
              letter-spacing: 1px;
              line-height: 1.4;
            }
            .sign-box {
              text-align: center;
              font-size: 12px;
            }
            .sign-space {
              height: 55px;
            }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="padding: 10px 24px; background: #0284c7; color: white; border: none; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer; shadow: 0 2px 4px rgba(0,0,0,0.1);">
              🖨️ Cetak / Simpan PDF
            </button>
          </div>

          <div class="header-container">
            <div>
              <div class="logo-title">METHODIC ENTERPRISE</div>
              <div class="logo-sub">Official Communication Dispatch & Management System</div>
            </div>
            <div class="doc-meta">
              <div class="doc-badge">SURAT KORESPONDENSI RESMI</div>
              <div>No. Dokumen: DOC-INBOX-${selectedEmail.id.toString().padStart(5, '0')}</div>
              <div>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>

          <div class="memo-grid">
            <div class="memo-row">
              <div class="memo-label">Pengirim</div>
              <div class="memo-val">: <strong>${selectedEmail.sender}</strong> &lt;${selectedEmail.email}&gt;</div>
            </div>
            <div class="memo-row">
              <div class="memo-label">Penerima</div>
              <div class="memo-val">: ${selectedEmail.recipient || 'Semua Divisi (All)'}</div>
            </div>
            <div class="memo-row">
              <div class="memo-label">Waktu Pengiriman</div>
              <div class="memo-val">: ${selectedEmail.date || 'Hari Ini'}, ${selectedEmail.time}</div>
            </div>
          </div>

          <div class="subject-box">
            SUBJEK: ${selectedEmail.subject}
          </div>

          <div class="content-body">${selectedEmail.content}</div>

          ${selectedEmail.attachments && selectedEmail.attachments.length > 0 ? `
            <div class="attachments-section">
              <div class="attachment-title">Lampiran Dokumen (${selectedEmail.attachments.length})</div>
              <div>
                ${selectedEmail.attachments.map((att: any) => `
                  <div class="attachment-item">
                    📎 &nbsp;<strong>${att.name}</strong> &nbsp;<span style="color:#64748b;">(${att.size})</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${replies.length > 0 ? `
            <div class="replies-section">
              <div class="attachment-title" style="margin-bottom: 12px; color: #0284c7;">
                Riwayat Balasan Pesan (${replies.length})
              </div>
              ${replies.map(r => `
                <div class="reply-card">
                  <div class="reply-header">
                    <span>${r.sender}</span>
                    <span style="color: #64748b; font-weight: normal;">${r.time}</span>
                  </div>
                  <div style="font-size: 13px; color: #334155; white-space: pre-wrap;">${r.text}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="footer-sign">
            <div class="stamp-box">
              ✓ TERVERIFIKASI SISTEM INBOX METHODIC<br/>
              DIGITAL SYSTEM SIGNATURE
            </div>
            <div class="sign-box">
              <p style="margin:0; color:#64748b;">Tanda Tangan Pengirim / Penerima</p>
              <div class="sign-space"></div>
              <p style="margin:0; font-weight:bold; text-decoration:underline;">${selectedEmail.sender}</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleComposeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files).map((file: File) => {
      let sizeStr = file.size < 1024 * 1024 ? `${Math.round(file.size / 1024)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      return { name: file.name, size: sizeStr, type: file.name.split('.').pop() || '' };
    });
    setComposeAttachments(prev => [...prev, ...filesArray]);
    e.target.value = '';
  };

  const handleSendCompose = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!composeSubject.trim() || !composeContent.trim()) return;

    const newEmail: EmailItem = {
      id: Date.now(),
      sender: 'Moch Kall',
      email: 'moch.kall01@gmail.com',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: 'Hari Ini',
      subject: composeSubject,
      preview: composeContent.slice(0, 80) + (composeContent.length > 80 ? '...' : ''),
      unread: false,
      starred: false,
      avatarGradient: 'from-[#EA580C] via-[#8B5CF6] to-[#EC4899]',
      content: composeContent,
      recipient: composeRecipient.trim() || 'Semua Divisi (All)',
      attachments: [...composeAttachments]
    };

    setEmails(prev => [newEmail, ...prev]);
    setSelectedEmail(newEmail);
    setComposeRecipient('');
    setComposeSubject('');
    setComposeContent('');
    setComposeAttachments([]);
    setShowComposeModal(false);
  };

  const handleSendReply = () => {
    if ((!replyText.trim() && replyAttachments.length === 0) || !selectedEmail) return;

    const newReply = {
      id: Date.now(),
      text: replyText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: 'Moch Kall',
      avatarGradient: 'from-[#EA580C] via-[#8B5CF6] to-[#EC4899]',
      attachments: [...replyAttachments]
    };

    setEmailReplies(prev => ({
      ...prev,
      [selectedEmail.id]: [...(prev[selectedEmail.id] || []), newReply]
    }));

    setReplyText('');
    setReplyAttachments([]);
    setIsReplying(false);
  };

  const getAttachmentIcon = (type: string) => {
    const t = type.toLowerCase();
    if (['ppt', 'pptx'].includes(t)) return <MonitorPlay size={15} className="text-[#F25F22]" />;
    if (['doc', 'docx', 'word'].includes(t)) return <FileText size={15} className="text-[#2B579A]" />;
    if (['xls', 'xlsx'].includes(t)) return <FileSpreadsheet size={15} className="text-[#217346]" />;
    return <FileText size={15} className="text-[#8E9296]" />;
  };

  return (
    <div className="flex w-full h-[calc(100vh-61px)] font-sans bg-[#0A0A0B] text-white p-3 gap-3 overflow-hidden">
      {/* Left List Sidebar */}
      <div className="w-[340px] shrink-0 flex flex-col bg-[#0A0A0B]">
        {/* Top Header Controls */}
        <div className="flex items-center justify-between mb-2.5 px-1 gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full bg-[#16171A] text-white text-xs placeholder-[#71717A] rounded-xl pl-9 pr-3 py-2 outline-none border border-[#24262C] focus:border-[#383B45] transition-all"
            />
          </div>
          <button 
            onClick={() => setShowComposeModal(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#EA580C] bg-[#1E2026] hover:bg-[#282B33] hover:text-[#FB923C] transition-all px-3 py-2 rounded-xl cursor-pointer shrink-0 active:scale-95 border border-[#2C2F38] shadow-xs"
          >
            <Plus size={15} className="text-[#EA580C]" />
            <span className="hidden sm:inline">Compose</span>
          </button>
        </div>

        {/* Email List Feed */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
          {filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center h-64 text-[#71717A]">
              <InboxIcon size={32} className="mb-2 opacity-50" />
              <p className="text-xs font-medium text-[#A1A1AA]">Belum ada pesan masuk</p>
            </div>
          ) : (
            filteredEmails.map((email) => {
              const isSelected = selectedEmail?.id === email.id;
              return (
                <div 
                  key={email.id}
                  onClick={() => {
                    setSelectedEmail(email);
                    setIsReplying(false);
                    // Mark as read when clicked
                    if (email.unread) {
                      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, unread: false } : e));
                    }
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-all relative group border ${
                    isSelected 
                      ? 'bg-[#18191D] border-[#2B2D35] shadow-sm' 
                      : 'bg-transparent border-transparent hover:bg-[#121316]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Colorful Mesh Gradient Circle Avatar */}
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${email.avatarGradient} shrink-0 shadow-xs`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-semibold truncate ${email.unread ? 'text-white' : 'text-[#E4E4E7]'}`}>
                          {email.sender}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="text-[11px] text-[#A1A1AA]">{email.time}</span>
                          {email.unread && (
                            <span className="w-2 h-2 rounded-full bg-[#EA580C] shrink-0"></span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-xs font-medium truncate flex-1 ${email.unread ? 'text-white' : 'text-[#D4D4D8]'}`}>
                          {email.subject}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(email.id);
                          }}
                          className="shrink-0 text-[#52525B] hover:text-amber-400 transition-colors p-0.5"
                          title={email.starred ? "Unstar" : "Star"}
                        >
                          <Star size={13} className={email.starred ? "fill-amber-400 text-amber-400" : ""} />
                        </button>
                      </div>

                      <div className="text-[11px] text-[#8E9296] truncate leading-tight">
                        {email.preview || email.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Detail Panel */}
      <div className="flex-1 flex flex-col bg-[#121316] rounded-2xl border border-[#202227] overflow-hidden shadow-xl">
        {selectedEmail ? (
          <>
            {/* Action Bar Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#202227] shrink-0 text-[#90929A]">
              {/* Action Icons */}
              <div className="flex items-center gap-3.5">
                <button 
                  onClick={() => setSelectedEmail(null)} 
                  className="p-1.5 rounded-lg hover:text-white hover:bg-[#1C1E23] transition-colors cursor-pointer" 
                  title="Close"
                >
                  <X size={16} />
                </button>
                <button 
                  onClick={handleDeleteEmail} 
                  className="p-1.5 rounded-lg hover:text-white hover:bg-[#1C1E23] transition-colors cursor-pointer" 
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={handleDownloadEmail}
                  className="p-1.5 rounded-lg hover:text-white hover:bg-[#1C1E23] transition-colors cursor-pointer" 
                  title="Download / Cetak Pesan"
                >
                  <Printer size={16} />
                </button>
              </div>

              {/* Navigation Counter */}
              <div className="flex items-center gap-3 text-xs text-[#90929A]">
                <span>{currentIndex >= 0 ? currentIndex + 1 : 1} of {filteredEmails.length}</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={handlePrevEmail} 
                    disabled={currentIndex <= 0}
                    className="p-1 rounded-lg hover:text-white hover:bg-[#1C1E23] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={handleNextEmail} 
                    disabled={currentIndex >= filteredEmails.length - 1}
                    className="p-1 rounded-lg hover:text-white hover:bg-[#1C1E23] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Email Body Scroll Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* Title & Action Icons Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#202227]">
                <h1 className="text-xl font-bold text-white tracking-tight flex-1 min-w-[200px]">
                  {selectedEmail.subject}
                </h1>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-[#8E9296]">{selectedEmail.time}</span>
                  <button 
                    onClick={() => setIsReplying(!isReplying)}
                    className="p-1.5 rounded-lg text-[#90929A] hover:text-white hover:bg-[#1C1E23] transition-colors cursor-pointer"
                    title="Reply"
                  >
                    <Reply size={15} />
                  </button>
                  <button 
                    onClick={() => toggleStar(selectedEmail.id)}
                    className="p-1.5 rounded-lg text-[#90929A] hover:text-amber-400 hover:bg-[#1C1E23] transition-colors cursor-pointer"
                    title="Star"
                  >
                    <Star size={15} className={selectedEmail.starred ? "fill-amber-400 text-amber-400" : ""} />
                  </button>
                </div>
              </div>

              {/* Sender Card Header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${selectedEmail.avatarGradient} shrink-0 shadow-sm flex items-center justify-center font-bold text-white text-sm`}>
                    {selectedEmail.sender.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{selectedEmail.sender}</div>
                    <div className="flex items-center gap-1.5 text-xs text-[#8E9296] mt-0.5">
                      <span>{selectedEmail.email}</span>
                      <button className="flex items-center text-[#8E9296] hover:text-white transition-colors cursor-pointer ml-1">
                        <span>detail</span>
                        <ChevronDown size={12} className="ml-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Division Badge (To :) placed above/before the message body */}
              {selectedEmail.recipient && (
                <div className="pt-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EA580C]/15 border border-[#EA580C]/30 shadow-sm">
                    <span className="text-xs font-semibold text-[#FB923C] flex items-center gap-1.5">
                      <span className="text-[#8E9296] font-medium">To :</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FB923C] animate-pulse" />
                      {selectedEmail.recipient.split('(')[0].trim()}
                    </span>
                  </div>
                </div>
              )}

              {/* Email Content Body */}
              <div className="text-[14px] text-[#D4D4D8] leading-relaxed whitespace-pre-line space-y-4 pt-1 max-w-2xl">
                {selectedEmail.content}
              </div>

              {/* Attachments if any */}
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="pt-6 border-t border-[#202227]">
                  <div className="text-xs font-semibold text-[#8E9296] uppercase tracking-wider mb-3">
                    Attachments ({selectedEmail.attachments.length})
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {selectedEmail.attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 border border-[#24262D] rounded-xl bg-[#16171B] w-60 hover:bg-[#1A1C21] transition-colors cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-[#111215] border border-[#24262D] flex items-center justify-center shrink-0">
                          {getAttachmentIcon(file.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-white truncate">{file.name}</div>
                          <div className="text-[10px] text-[#8E9296]">{file.size}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Thread Replies */}
              {emailReplies[selectedEmail.id] && emailReplies[selectedEmail.id].length > 0 && (
                <div className="pt-6 border-t border-[#202227] space-y-4">
                  <div className="text-xs font-semibold text-[#8E9296] uppercase tracking-wider">
                    Replies ({emailReplies[selectedEmail.id].length})
                  </div>
                  {emailReplies[selectedEmail.id].map((reply) => (
                    <div key={reply.id} className="p-4 border border-[#24262D] rounded-xl bg-[#16171B] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${reply.avatarGradient} shrink-0`} />
                          <span className="text-xs font-semibold text-white">{reply.sender}</span>
                        </div>
                        <span className="text-[10px] text-[#8E9296]">{reply.time}</span>
                      </div>
                      <p className="text-xs text-[#D4D4D8] leading-relaxed pl-9 whitespace-pre-line">
                        {reply.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline Reply Box */}
              {isReplying && (
                <div className="mt-8 border border-[#24262D] rounded-xl bg-[#16171B] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#24262D] bg-[#111215]">
                    <span className="text-xs font-semibold text-[#A1A1AA]">Reply to {selectedEmail.sender}</span>
                    <button 
                      onClick={() => setIsReplying(false)}
                      className="text-[#71717A] hover:text-white p-1 rounded transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="p-4">
                    <textarea 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your response..."
                      className="w-full bg-transparent text-xs text-white placeholder-[#71717A] outline-none border-none resize-none min-h-[100px] leading-relaxed"
                    />
                    <div className="flex items-center justify-between pt-3 border-t border-[#24262D]">
                      <div className="flex items-center gap-1 text-[#71717A]">
                        <button className="p-1.5 hover:text-white rounded hover:bg-[#202227] transition-colors"><Bold size={13} /></button>
                        <button className="p-1.5 hover:text-white rounded hover:bg-[#202227] transition-colors"><Italic size={13} /></button>
                        <button className="p-1.5 hover:text-white rounded hover:bg-[#202227] transition-colors"><Link2 size={13} /></button>
                        <button className="p-1.5 hover:text-white rounded hover:bg-[#202227] transition-colors"><Smile size={13} /></button>
                      </div>
                      <button 
                        onClick={handleSendReply}
                        disabled={!replyText.trim()}
                        className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#EA580C] hover:bg-[#D97706] disabled:bg-[#202227] disabled:text-[#52525B] px-4 py-1.5 rounded-full cursor-pointer transition-all"
                      >
                        <span>Send</span>
                        <Send size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#71717A]">
            <InboxIcon size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium text-[#A1A1AA]">Pilih pesan untuk melihat detail</p>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {showComposeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              className={`bg-[#141518] border border-[#24262D] rounded-2xl w-full overflow-hidden shadow-2xl flex flex-col transition-all ${
                isComposeMaximized ? 'max-w-4xl h-[80vh]' : 'max-w-xl'
              }`}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#24262D] bg-[#101114]">
                <span className="text-xs font-semibold text-white">New Message</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsComposeMaximized(!isComposeMaximized)} 
                    className="text-[#8E9296] hover:text-white p-1 rounded hover:bg-[#1E2026] transition-colors"
                  >
                    {isComposeMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                  </button>
                  <button 
                    onClick={() => setShowComposeModal(false)} 
                    className="text-[#8E9296] hover:text-white p-1 rounded hover:bg-[#1E2026] transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSendCompose} className="flex-1 flex flex-col">
                <div className="p-4 space-y-3 flex-1 flex flex-col">
                  {/* Custom Dropdown for Recipient (To) */}
                  <div className="relative z-30">
                    <button
                      type="button"
                      onClick={() => setShowDivisionDropdown(!showDivisionDropdown)}
                      className={`w-full flex items-center justify-between bg-[#18191D] text-xs text-white px-3.5 py-2.5 rounded-xl outline-none border transition-all cursor-pointer ${
                        showDivisionDropdown 
                          ? 'border-[#EA580C] ring-1 ring-[#EA580C]/30' 
                          : 'border-[#24262D] hover:border-[#383B45]'
                      }`}
                    >
                      <div className="truncate flex items-center gap-1.5">
                        <span className="text-[#8E9296] font-medium shrink-0">To :</span>
                        {composeRecipient ? (
                          <span className="truncate text-white font-medium">
                            {composeRecipient}
                          </span>
                        ) : (
                          <span className="text-[#71717A]">Pilih Divisi / Tim Tujuan</span>
                        )}
                      </div>
                      <ChevronDown size={14} className={`text-[#8E9296] transition-transform duration-200 shrink-0 ${showDivisionDropdown ? 'rotate-180 text-white' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showDivisionDropdown && (
                        <>
                          <div className="fixed inset-0 z-[100]" onClick={() => setShowDivisionDropdown(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                            transition={{ duration: 0.12 }}
                            className="absolute left-0 right-0 top-full mt-1.5 bg-[#18191D] border border-[#2B2D38] rounded-xl shadow-2xl p-1.5 z-[101] max-h-56 overflow-y-auto space-y-0.5"
                          >
                            {divisions.map((div) => {
                              const valueStr = div.email ? `${div.name} (${div.email})` : div.name;
                              const isSelected = composeRecipient === valueStr;
                              return (
                                <button
                                  key={div.id}
                                  type="button"
                                  onClick={() => {
                                    setComposeRecipient(valueStr);
                                    setShowDivisionDropdown(false);
                                  }}
                                  className={`w-full text-left px-3.5 py-2 text-xs rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#EA580C]/15 text-[#FB923C] font-medium'
                                      : 'text-[#D5D5D5] hover:bg-[#22242C] hover:text-white'
                                  }`}
                                >
                                  <div className="truncate pr-2">
                                    <div className="font-medium text-xs">{div.name}</div>
                                    {div.email ? (
                                      <div className="text-[10px] text-[#8E9296] truncate">{div.email}</div>
                                    ) : null}
                                  </div>
                                  {isSelected && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#FB923C] shrink-0 ml-2" />
                                  )}
                                </button>
                              );
                            })}

                            <div className="pt-1 mt-1 border-t border-[#262830]">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowDivisionDropdown(false);
                                  setShowAddTeamModal(true);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#EA580C] hover:bg-[#EA580C]/10 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <Plus size={14} />
                                <span>Add Team / Divisi Baru</span>
                              </button>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  <input 
                    type="text"
                    placeholder="Subject"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    className="w-full bg-[#18191D] text-xs text-white placeholder-[#71717A] px-3.5 py-2.5 rounded-xl outline-none border border-[#24262D] focus:border-[#383B45] transition-all"
                  />
                  <textarea 
                    placeholder="Write your message..."
                    value={composeContent}
                    onChange={(e) => setComposeContent(e.target.value)}
                    className="w-full flex-1 bg-[#18191D] text-xs text-white placeholder-[#71717A] p-3.5 rounded-xl outline-none border border-[#24262D] focus:border-[#383B45] resize-none min-h-[160px] leading-relaxed transition-all"
                  />

                  {composeAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {composeAttachments.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-2.5 py-1.5 bg-[#1E2026] border border-[#2C2F38] rounded-lg text-xs text-white">
                          <Paperclip size={12} className="text-[#8E9296]" />
                          <span className="truncate max-w-[120px]">{file.name}</span>
                          <button 
                            type="button"
                            onClick={() => setComposeAttachments(prev => prev.filter((_, i) => i !== idx))}
                            className="text-[#8E9296] hover:text-white ml-1"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-[#24262D] bg-[#101114]">
                  <div className="flex items-center gap-2">
                    <label htmlFor="compose-file" className="p-2 text-[#8E9296] hover:text-white hover:bg-[#1E2026] rounded-lg cursor-pointer transition-colors">
                      <Paperclip size={15} />
                    </label>
                    <input id="compose-file" type="file" multiple onChange={handleComposeFileChange} className="hidden" />
                  </div>
                  <button 
                    type="submit"
                    disabled={!composeSubject.trim() || !composeContent.trim()}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#EA580C] bg-[#24262C] hover:bg-[#2D3038] hover:text-[#FB923C] disabled:bg-[#1E2026] disabled:text-[#52525B] transition-all px-4 py-2 rounded-full cursor-pointer border border-[#32353E]"
                  >
                    <span>Send</span>
                    <Send size={13} />
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Team / Divisi Baru Modal */}
      <AnimatePresence>
        {showAddTeamModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#18181A] border border-[#27272A] rounded-2xl shadow-2xl w-full max-w-md relative z-[2001] p-5 overflow-hidden text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EA580C]/15 text-[#FB923C] border border-[#EA580C]/30 flex items-center justify-center">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Tambah Tim / Divisi Baru</h3>
                    <p className="text-[11px] text-[#8E9296]">Tambahkan tim penerima pesan ke daftar pilihan</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddTeamModal(false);
                    setAddTeamError('');
                  }}
                  className="w-6 h-6 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] text-[#A1A1AA] hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleAddTeam} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#D5D5D5] mb-1">
                    Nama Tim / Divisi <span className="text-rose-400">*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="Contoh: Divisi IT Support"
                    value={newTeamName}
                    onChange={(e) => {
                      setNewTeamName(e.target.value);
                      if (addTeamError) setAddTeamError('');
                    }}
                    className="w-full bg-[#141518] border border-[#2B2D36] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-[#6E7079] focus:outline-none focus:border-[#EA580C]"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#D5D5D5] mb-1">
                    Email Divisi (Opsional)
                  </label>
                  <input 
                    type="email"
                    placeholder="Contoh: it@methodic.co.id"
                    value={newTeamEmail}
                    onChange={(e) => setNewTeamEmail(e.target.value)}
                    className="w-full bg-[#141518] border border-[#2B2D36] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-[#6E7079] focus:outline-none focus:border-[#EA580C]"
                  />
                </div>

                {addTeamError && (
                  <div className="text-xs text-rose-400 font-medium">
                    {addTeamError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#27272A]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTeamModal(false);
                      setAddTeamError('');
                    }}
                    className="px-3.5 py-2 text-xs font-medium text-[#D5D5D5] hover:text-white bg-[#27272A] hover:bg-[#3F3F46] rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#EA580C] hover:bg-[#D97706] rounded-xl transition-colors cursor-pointer shadow-md shadow-[#EA580C]/20 flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Simpan Tim</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
