import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, Droplet, Sparkles, Clock, Plus, Minus, AlertCircle, ShoppingBag, CheckSquare, Square
} from 'lucide-react';
import { Medicine } from '../types';
import { triggerLightHaptic, triggerSuccessHaptic } from '../utils/haptics';

interface DailySummaryWidgetProps {
  medicines: Medicine[];
  onToggleTaken: (medicine: Medicine) => Promise<void>;
  lowQuantityThreshold: number;
  alertThreshold: number;
}

export function DailySummaryWidget({ 
  medicines, 
  onToggleTaken, 
  lowQuantityThreshold, 
  alertThreshold 
}: DailySummaryWidgetProps) {
  // Safe Date key for hydration tracking
  const [todayKey, setTodayKey] = useState('');
  const [waterCups, setWaterCups] = useState(0);

  // Set local-storage-bound water cups based on date
  useEffect(() => {
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    setTodayKey(dateStr);
    
    const stored = localStorage.getItem(`hydration_${dateStr}`);
    if (stored) {
      setWaterCups(parseInt(stored, 10) || 0);
    }
  }, []);

  const changeWater = (amount: number) => {
    triggerLightHaptic();
    const next = Math.max(0, Math.min(12, waterCups + amount));
    setWaterCups(next);
    if (todayKey) {
      localStorage.setItem(`hydration_${todayKey}`, next.toString());
    }
  };

  // Filter out deleted medicines
  const activeMeds = medicines.filter(m => !m.isDeleted);
  const totalMeds = activeMeds.length;
  const completedMeds = activeMeds.filter(m => m.taken).length;
  const completionPercentage = totalMeds > 0 ? Math.round((completedMeds / totalMeds) * 100) : 0;

  // Derive dynamic insights based on actual medicine states
  const getDynamicInsight = () => {
    if (totalMeds === 0) {
      return {
        text: "Add your first medicine manually or snap a scanner photo to begin your secure compliance journal.",
        icon: <Plus className="text-blue-400 shrink-0" size={14} />,
        bg: "bg-blue-500/5 border-blue-500/10"
      };
    }

    if (completedMeds === totalMeds) {
      return {
        text: "All today's recorded medicines taken! Amazing job keeping up with your health compliance goals.",
        icon: <Sparkles className="text-emerald-400 shrink-0 animate-pulse" size={14} />,
        bg: "bg-emerald-500/5 border-emerald-500/10"
      };
    }

    // Check for critical items (expired or expiring soon)
    const hasExpiring = activeMeds.some(m => {
      const [year, month, day] = m.expirationDate.split('-').map(Number);
      const expiry = new Date();
      if (year && month && day) {
        expiry.setFullYear(year, month - 1, day);
      }
      const today = new Date();
      today.setHours(0,0,0,0);
      expiry.setHours(0,0,0,0);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= alertThreshold;
    });

    if (hasExpiring) {
      return {
        text: "Safety warning: One or more medications are entering their alert threshold. Check expiration indices.",
        icon: <AlertCircle className="text-orange-400 shrink-0 animate-bounce" size={14} />,
        bg: "bg-orange-500/5 border-orange-500/10"
      };
    }

    // Check low stock
    const hasLowStock = activeMeds.some(m => !m.taken && m.quantity !== undefined && m.quantity <= lowQuantityThreshold);
    if (hasLowStock) {
      return {
        text: "Supply Warning: One or more active medications are running low. Check stock to avoid a treatment gap.",
        icon: <ShoppingBag className="text-yellow-400 shrink-0" size={14} />,
        bg: "bg-yellow-500/5 border-yellow-500/10"
      };
    }

    return {
      text: "Consistency is key. Double-check scheduled timings below to maintain a safe therapy routine.",
      icon: <Clock className="text-indigo-400 shrink-0" size={14} />,
      bg: "bg-indigo-500/5 border-indigo-500/10"
    };
  };

  const insight = getDynamicInsight();

  // Helper to generate a nice circular ring percentage offset
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (completionPercentage / 100) * circumference;

  return (
    <div className="px-4 mb-6">
      <div className="bg-white/[0.01] backdrop-blur-3xl border border-white/10 rounded-3xl p-5 shadow-xl ring-1 ring-white/5 space-y-4">
        
        {/* Top Header Row with Ring Progress */}
        <div className="flex justify-between items-center bg-white/[0.01] p-3 rounded-2xl border border-white/5">
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Health Core Companion</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </h2>
            <p className="text-[10px] sm:text-xs text-white/40">
              Interactive daily metrics and compliance scorecard
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-white block">
                {completedMeds}/{totalMeds} Doses
              </span>
              <span className="text-[9px] uppercase font-semibold tracking-wider text-white/30">
                Today's Goal
              </span>
            </div>

            {/* Circular Ring Progress */}
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r={radius}
                  className="stroke-white/5"
                  strokeWidth="3.5"
                  fill="transparent"
                />
                <motion.circle
                  cx="24"
                  cy="24"
                  r={radius}
                  className="stroke-emerald-400"
                  strokeWidth="3.5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: strokeOffset }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </svg>
              <span className="absolute text-[10px] sm:text-xs font-mono font-extrabold text-white">
                {completionPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic AI Wellness Insight Banner */}
        <motion.div 
          layout
          className={`flex items-start gap-2.5 p-3 rounded-2xl border text-white/70 text-xs leading-normal leading-relaxed transition-all ${insight.bg}`}
        >
          {insight.icon}
          <div>
            <span className="text-[9px] uppercase tracking-widest font-extrabold block text-white/40 mb-0.5">Wellness AI Insight</span>
            {insight.text}
          </div>
        </motion.div>

        {/* Hydration Tracker Companion & Quick Meds Checklist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          
          {/* Tracker 1: Interactive Water Widget */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 shrink-0">
                    <Droplet size={14} className="animate-pulse" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-white">Hydration Companion</h3>
                    <p className="text-[9px] text-white/40">Take meds with plenty of water</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                  {waterCups}/8 Cups
                </span>
              </div>

              {/* Graphical cups indicator */}
              <div className="flex gap-1.5 my-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 h-5 rounded-md border transition-all ${
                      i < waterCups 
                        ? 'bg-blue-400 border-blue-400 opacity-90 shadow-md shadow-blue-500/20' 
                        : 'border-white/10 bg-white/[0.01]'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => changeWater(-1)}
                disabled={waterCups <= 0}
                className="flex-1 py-1 px-3 border border-white/10 hover:border-white/20 hover:bg-white/5 active:scale-95 disabled:opacity-40 transition-all rounded-xl text-xs text-white/60 font-semibold flex items-center justify-center gap-1 min-h-[34px]"
              >
                <Minus size={12} />
                <span>Reduce</span>
              </button>
              <button
                onClick={() => changeWater(1)}
                disabled={waterCups >= 12}
                className="flex-1 py-1 px-3 bg-blue-400/10 hover:bg-blue-400/20 hover:border-blue-400/40 border border-blue-400/20 active:scale-95 disabled:opacity-40 transition-all rounded-xl text-xs text-blue-400 font-bold flex items-center justify-center gap-1 min-h-[34px]"
              >
                <Plus size={12} />
                <span>Log Cup</span>
              </button>
            </div>
          </div>

          {/* Tracker 2: Miniature Checklist for Active Meds */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-xs font-bold text-white">Today's Fast Track</h3>
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Quick Check</span>
              </div>

              {activeMeds.length === 0 ? (
                <div className="h-16 flex items-center justify-center border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                  <p className="text-[10px] text-white/30">No active medicines logged</p>
                </div>
              ) : (
                <div className="max-h-[84px] overflow-y-auto space-y-1.5 pr-1 text-left custom-scrollbar">
                  {activeMeds.map((med, index) => (
                    <div 
                      key={`chk-${med.id}-${index}`}
                      onClick={() => onToggleTaken(med)}
                      className="group/item flex items-center justify-between p-1.5 hover:bg-white/[0.04] active:scale-[0.98] border border-white/5 hover:border-white/10 rounded-xl cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <span className="shrink-0 text-white/40 group-hover/item:text-white transition-colors">
                          {med.taken ? (
                            <CheckSquare size={14} className="text-emerald-400" />
                          ) : (
                            <Square size={14} />
                          )}
                        </span>
                        <span className={`text-[11px] truncate leading-tight font-medium ${med.taken ? 'text-white/30 line-through' : 'text-white'}`}>
                          {med.name}
                        </span>
                      </div>
                      
                      {med.schedule && (
                        <span className="text-[8px] tracking-tight text-white/30 truncate max-w-[80px]">
                          {med.schedule}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-[9px] text-white/30 text-center font-medium mt-2 italic flex items-center justify-center gap-1">
              <span>* Safe encryption keys secure your medical journals</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
