import React, { useState, useEffect } from 'react';
import { 
  X, Mail, RefreshCw, CheckCircle2, AlertTriangle, 
  Clock, Eye, ArrowRight, ShieldCheck, Trash2, Send, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, query, where, onSnapshot, addDoc, 
  deleteDoc, doc, getDocs, writeBatch, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Medicine } from '../types';

interface MailboxModalProps {
  onClose: () => void;
  user: any;
  medicines: Medicine[];
}

interface MailDocument {
  id: string;
  to: string;
  message: {
    subject: string;
    text: string;
    html: string;
  };
  createdAt?: number;
  // Trigger email extension adds a 'delivery' block
  delivery?: {
    attempts: number;
    endTime?: any;
    error?: string;
    state: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'ERROR';
  };
}

export const MailboxModal: React.FC<MailboxModalProps> = ({ onClose, user, medicines }) => {
  const [emails, setEmails] = useState<MailDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<MailDocument | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [testSentSuccess, setTestSentSuccess] = useState<string | null>(null);

  // Real-time listen to queue updates for this user
  useEffect(() => {
    if (!user?.email) return;

    setIsLoading(true);
    const q = query(
      collection(db, 'mail'),
      where('to', '==', user.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mailList = snapshot.docs.map(doc => {
        const data = doc.data();
        let createdAtMillis = Date.now();
        if (data.timestamp) {
          createdAtMillis = typeof data.timestamp.toMillis === 'function' 
            ? data.timestamp.toMillis() 
            : Number(data.timestamp);
        }
        return {
          id: doc.id,
          to: data.to,
          message: data.message,
          createdAt: createdAtMillis,
          delivery: data.delivery
        } as MailDocument;
      });

      // Deduplicate by ID to prevent duplicate keys
      const uniqueMail = Array.from(new Map(mailList.map(m => [m.id, m])).values());

      // Sort in-memory to dodge custom indexing requirements
      const sorted = uniqueMail.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setEmails(sorted);
      setIsLoading(false);
    }, (error) => {
      console.error("Mail subscription failed:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Method to manually queue a high-fidelity test alert
  const triggerTestEmailAlert = async (type: 'expiry' | 'refill') => {
    if (!user || isSending) return;
    setIsSending(true);
    setTestSentSuccess(null);

    try {
      // Find a medicine to populate fields, or make a plausible mock
      const sampleMed = medicines.filter(m => !m.isDeleted)[0] || {
        name: "Lisinopril",
        dosage: "10mg",
        expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        quantity: 3
      };

      let subject = '';
      let text = '';
      let html = '';

      if (type === 'expiry') {
        subject = `⚠️ Expiration Alert: Your prescription for ${sampleMed.name} is expiring soon`;
        text = `DawaLens AI Alert: Your medicine ${sampleMed.name} (${sampleMed.dosage}) expires on ${sampleMed.expirationDate}. Please check your medicine vault.`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e1e8ed; border-radius: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="background-color: #fff8f6; color: #ff5232; font-size: 32px; width: 64px; height: 64px; line-height: 64px; border-radius: 50%; display: inline-block; text-align: center; margin-bottom: 12px; font-weight: bold;">⚠️</div>
              <h2 style="color: #1a1a1a; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Medicine Expiry Alert</h2>
              <p style="color: #657786; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold; margin: 4px 0 0 0;">DawaLens AI Automated Alerts</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #e1e8ed; margin-bottom: 24px;" />
            <div style="background-color: #fafbfc; border: 1px solid #e1e8ed; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0; color: #657786; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Medication Details</p>
              <h3 style="margin: 0; color: #1a1a1a; font-size: 20px; font-weight: 700;">${sampleMed.name} (${sampleMed.dosage})</h3>
              <p style="margin: 8px 0 0 0; color: #d32f2f; font-size: 14px; font-weight: bold; display: flex; align-items: center;">
                📅 Expiration Date: ${sampleMed.expirationDate}
              </p>
            </div>
            <p style="color: #24292e; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
              This is an automated safety alert from DawaLens AI. Our smart tracking system detected that your stored stock of <strong>${sampleMed.name}</strong> is entering its critical expiration window. Please inspect the container to verify label integrity before administering.
            </p>
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="https://ais-pre-6s2xsbjvqxz4mrntmcjjld-190562511229.asia-southeast1.run.app" style="background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 14px; font-weight: bold; font-size: 14px; display: inline-block;">Manage My Vault</a>
            </div>
            <p style="color: #657786; font-size: 11px; line-height: 1.5; text-align: center; margin: 0;">
              This notification was generated because you checked the 'Email Notifications Enabled' option in your app configuration. to stop receiving these alerts, toggle email alerts off in your Settings panel.
            </p>
          </div>
        `;
      } else {
        subject = `💊 Refill Required: ${sampleMed.name} is running extremely low`;
        text = `DawaLens AI alert: Your medicine ${sampleMed.name} quantity is down to ${sampleMed.quantity || 3}. Please replenish your stocks soon.`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e1e8ed; border-radius: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="background-color: #f0f7ff; color: #0070f3; font-size: 32px; width: 64px; height: 64px; line-height: 64px; border-radius: 50%; display: inline-block; text-align: center; margin-bottom: 12px; font-weight: bold;">💊</div>
              <h2 style="color: #1a1a1a; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Low Stock Warning</h2>
              <p style="color: #657786; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold; margin: 4px 0 0 0;">DawaLens AI Replenishment Engine</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #e1e8ed; margin-bottom: 24px;" />
            <div style="background-color: #fafbfc; border: 1px solid #e1e8ed; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0; color: #657786; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Current Quantities</p>
              <h3 style="margin: 0; color: #1a1a1a; font-size: 20px; font-weight: 700;">${sampleMed.name}</h3>
              <p style="margin: 8px 0 0 0; color: #0070f3; font-size: 14px; font-weight: bold;">
                ⚠️ Remaining Balance: ${sampleMed.quantity || 3} unit(s) left
              </p>
            </div>
            <p style="color: #24292e; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
              Your remaining count has dropped below your app's designated low-quantity limit. To preserve treatment consistency and avoid missing required dosages, we recommend scheduling a refill order with your clinician or local pharmacy soon.
            </p>
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="https://ais-pre-6s2xsbjvqxz4mrntmcjjld-190562511229.asia-southeast1.run.app" style="background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 14px; font-weight: bold; font-size: 14px; display: inline-block;">Go to App Dashboard</a>
            </div>
          </div>
        `;
      }

      await addDoc(collection(db, 'mail'), {
        to: user.email,
        message: {
          subject,
          text,
          html
        },
        timestamp: serverTimestamp()
      });

      setTestSentSuccess(`Success! A test "${type === 'expiry' ? 'Expiry Alert' : 'Low Stock Warning'}" email document was added to the queue.`);
    } catch (err: any) {
      console.error("Test email dispatch error:", err);
      alert(`Simulation failed: ${err.message || err}`);
    } finally {
      setIsSending(false);
    }
  };

  // Safe method to empty out sent mailbox documents completely
  const clearSentHistory = async () => {
    if (!user?.email || emails.length === 0) return;
    if (window.confirm("This will permanently clear your outbox/mail queue history. Continue?")) {
      try {
        const q = query(collection(db, 'mail'), where('to', '==', user.email));
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        setEmails([]);
        setSelectedEmail(null);
      } catch (err: any) {
        console.error("Failed to delete emails:", err);
        alert("Operation denied: " + err.message);
      }
    }
  };

  const getStatusDisplay = (delivery: MailDocument['delivery']) => {
    if (!delivery) {
      return {
        label: 'Queued',
        style: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        icon: <Clock size={12} className="animate-pulse" />
      };
    }
    switch (delivery.state) {
      case 'SUCCESS':
        return {
          label: 'Delivered',
          style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: <CheckCircle2 size={12} />
        };
      case 'PROCESSING':
        return {
          label: 'Sending...',
          style: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          icon: <RefreshCw size={12} className="animate-spin" />
        };
      case 'ERROR':
        return {
          label: 'Error',
          style: 'bg-red-500/10 text-red-400 border-red-500/20',
          icon: <AlertTriangle size={12} />
        };
      default:
        return {
          label: 'Pending',
          style: 'bg-white/10 text-white/50 border-white/20',
          icon: <Clock size={12} />
        };
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#070707]/90 backdrop-blur-xl flex items-center justify-center p-0 md:p-6"
    >
      <div className="w-full max-w-4xl h-full md:h-[85vh] bg-[#121212] border-0 rounded-none md:rounded-[36px] overflow-hidden shadow-2xl flex flex-col">
        {/* Header Section */}
        <header className="p-4 sm:p-6 bg-gradient-to-r from-white/[0.02] to-transparent flex justify-between items-center shrink-0 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-white shrink-0">
              <Mail size={20} className="sm:size-[22px]" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base md:text-xl font-bold tracking-tight text-white flex flex-wrap items-center gap-1.5 sm:gap-2">
                DawaLens AI Mailbox Outbox
                <span className="text-[8px] sm:text-[10px] px-2.5 py-1 bg-white/10 border border-white/5 rounded-full font-bold uppercase tracking-wider text-accent/85">
                  Trigger-Mail Connection
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs text-white/40 font-medium mt-0.5 sm:mt-1">Verify automatic, cloud-sent prescription notifications</p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 sm:p-3 hover:bg-white/10 active:scale-95 border border-white/10 rounded-2xl text-white/60 hover:text-white transition-all w-11 h-11 flex items-center justify-center shrink-0 ml-2"
            title="Close outbox modal"
          >
            <X size={20} />
          </button>
        </header>

        {/* Action Panel: Dispatch Tests */}
        <div className="px-4 sm:px-6 py-4 bg-white/[0.01] shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5 shrink-0">
              <Play size={12} className="text-accent" /> Trigger Tester Alerts:
            </span>
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 w-full">
              <button
                onClick={() => triggerTestEmailAlert('expiry')}
                disabled={isSending}
                className="py-3 sm:py-2.5 px-5 sm:px-4 bg-orange-500/10 hover:bg-orange-500/20 active:scale-95 border border-orange-500/30 hover:border-orange-500/50 rounded-xl text-xs font-bold text-orange-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/5 min-h-[44px]"
              >
                <Send size={12} />
                Expiry Test Email
              </button>
              <button
                onClick={() => triggerTestEmailAlert('refill')}
                disabled={isSending}
                className="py-3 sm:py-2.5 px-5 sm:px-4 bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-95 border border-indigo-500/30 hover:border-indigo-500/50 rounded-xl text-xs font-bold text-indigo-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/5 min-h-[44px]"
              >
                <Send size={12} />
                Refill Stock Warning
              </button>
            </div>
          </div>

          {emails.length > 0 && (
            <button
              onClick={clearSentHistory}
              className="py-3 sm:py-2 px-4 border border-red-500/15 bg-red-500/5 hover:bg-red-500/15 active:scale-95 rounded-xl text-xs text-red-400 font-bold flex items-center justify-center gap-2 transition-all shrink-0 w-full md:w-auto min-h-[44px]"
            >
              <Trash2 size={13} />
              Clear Mail Logs
            </button>
          )}
        </div>

        {/* Body Content Areas */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left panel: List of Emails */}
          <div className="w-full md:w-[40%] overflow-y-auto flex flex-col h-1/2 md:h-full bg-black/20">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <RefreshCw size={24} className="animate-spin text-white/40" />
                <p className="text-sm text-white/40 mt-4">Connecting to Mail Queue...</p>
              </div>
            ) : emails.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full border border-white/5 bg-white/[0.01] flex items-center justify-center text-white/20">
                  <Mail size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white/60">Outbox Queue Empty</h4>
                  <p className="text-xs text-white/30 max-w-[200px] mx-auto mt-1 leading-relaxed">
                    Once automated alert emails or reports are triggered, they'll match and synchronize right here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-white/5 pb-20">
                {emails.map((mail, idx) => {
                  const status = getStatusDisplay(mail.delivery);
                  const isSelected = selectedEmail?.id === mail.id;
                  
                  return (
                    <button
                      key={`mail-${mail.id || idx}-${idx}`}
                      onClick={() => setSelectedEmail(mail)}
                      className={`w-full text-left p-5 transition-all flex flex-col gap-2 border-l-[3px] ${
                        isSelected 
                          ? 'bg-white/[0.05] border-accent/80' 
                          : 'hover:bg-white/[0.02] border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-widest flex items-center gap-1.5 ${status.style}`}>
                          {status.icon}
                          {status.label}
                        </span>
                        <time className="text-[10px] text-white/30 font-mono">
                          {new Date(mail.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </time>
                      </div>
                      
                      <h4 className="text-sm font-bold text-white group-hover:text-amber-300 leading-tight tracking-tight mt-1 line-clamp-2">
                        {mail.message.subject}
                      </h4>
                      
                      <p className="text-xs text-white/40 line-clamp-1 truncate mt-0.5 font-medium">
                        {mail.message.text}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right panel: Single Mail Preview */}
          <div className="w-full md:w-[60%] overflow-y-auto h-1/2 md:h-full flex flex-col bg-[#101010]">
            {selectedEmail ? (
              <div className="p-6 space-y-6">
                
                {/* Header Information */}
                <div className="bg-white/[0.02] p-6 rounded-3xl space-y-4">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-white/30">Target Recipient</span>
                      <p className="text-sm font-bold text-white selection:bg-white">{selectedEmail.to}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-white/30">Timestamp</span>
                      <p className="text-xs text-white/50 font-mono">
                        {new Date(selectedEmail.createdAt || Date.now()).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-white/30">Subject Line</span>
                    <h3 className="text-base font-bold text-white mt-0.5">{selectedEmail.message.subject}</h3>
                  </div>

                  {/* Delivery Status Insights */}
                  {selectedEmail.delivery && selectedEmail.delivery.error && (
                    <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5">
                      <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-red-400 uppercase">Trigger Mail Error</p>
                        <p className="text-[11px] text-red-300/80 leading-relaxed mt-0.5">{selectedEmail.delivery.error}</p>
                      </div>
                    </div>
                  )}

                  {selectedEmail.delivery && selectedEmail.delivery.state === 'SUCCESS' && (
                    <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <p className="text-xs font-medium text-emerald-400">
                        Email processed and delivered securely via SMTP configuration.
                      </p>
                    </div>
                  )}
                </div>

                {/* HTML Envelope Panel */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block ml-1">
                    📩 Rendered Template Body:
                  </span>
                  <div className="bg-white rounded-[24px] overflow-hidden max-h-[500px]">
                    <iframe
                      title="Email Body Preview"
                      srcDoc={selectedEmail.message.html}
                      className="w-full h-[400px] border-0 select-none"
                      sandbox="allow-popups allow-popups-to-escape-sandbox"
                    />
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-[24px] flex items-center justify-center text-white/20 shadow-inner">
                  <Eye size={26} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white/75">Select a message</h3>
                  <p className="text-xs text-white/40 max-w-[240px] mx-auto mt-1 leading-relaxed">
                    Click any queued notification or consultation report in the left pain to inspect its live SMTP delivery metadata and rendered email envelope.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
};
