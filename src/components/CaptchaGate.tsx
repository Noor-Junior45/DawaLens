import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, RefreshCw, KeyRound, Smartphone, Check, Lock, ChevronRight, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CaptchaGateProps {
  onSuccess: () => void;
  onCancel: () => void;
  actionName?: string;
}

export const CaptchaGate: React.FC<CaptchaGateProps> = ({ 
  onSuccess, 
  onCancel, 
  actionName = "perform this action" 
}) => {
  const [captchaType, setCaptchaType] = useState<'slide' | 'grid' | 'guide'>('slide');
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  
  // Slide to verify states
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Canvas ref for generating noise challenge code
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate alpha-numeric random code
  const generateCode = () => {
    const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // exclude ambiguous characters like 0, 1, O, I, l
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setUserInput('');
    setCaptchaError('');
  };

  // Render text code in canvas with noise and lines to block basic OCR scripts
  const drawCaptcha = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background with nice clean gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1f2937');
    gradient.addColorStop(1, '#111827');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise dots
    for (let i = 0; i < 150; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.25})`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }

    // Add noise lines
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.1 + Math.random() * 0.3})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Draw characters with random rotation, color & scale
    ctx.font = 'bold 32px monospace';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < captchaText.length; i++) {
      const char = captchaText[i];
      const charWidth = canvas.width / (captchaText.length + 1);
      const x = (i + 0.8) * charWidth;
      const y = canvas.height / 2 + (Math.random() * 10 - 5);
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((Math.random() * 30 - 15) * Math.PI / 180);
      
      // Dynamic distinct colors
      const hue = 180 + Math.random() * 80; // Sky-violet-emerald range
      ctx.fillStyle = `hsl(${hue}, 80%, 70%)`;
      
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  };

  useEffect(() => {
    if (captchaType === 'grid') {
      generateCode();
    }
  }, [captchaType]);

  useEffect(() => {
    if (captchaType === 'grid' && captchaText) {
      drawCaptcha();
    }
  }, [captchaText, captchaType]);

  // Handle Text CAPTCHA verification
  const verifyTextCaptcha = () => {
    if (userInput.toUpperCase().trim() === captchaText) {
      onSuccess();
    } else {
      setCaptchaError('Incorrect security key. Click refresh to try again.');
      generateCode();
    }
  };

  // Slide verification handlers
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isVerified) return;
    setIsSliding(true);
  };

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!isSliding || !trackRef.current || !sliderRef.current) return;

    const trackRect = trackRef.current.getBoundingClientRect();
    const sliderWidth = sliderRef.current.offsetWidth;
    const maxDistance = trackRect.width - sliderWidth - 8; // Padding offset
    
    let clientX = 0;
    if (window.TouchEvent && e instanceof TouchEvent) {
      clientX = e.touches[0].clientX;
    } else if (e instanceof MouseEvent) {
      clientX = e.clientX;
    }

    let moveX = clientX - trackRect.left - sliderWidth / 2;
    moveX = Math.max(0, Math.min(moveX, maxDistance));

    setSliderPosition(moveX);

    // If matches/reaches target (> 95% of way)
    if (moveX >= maxDistance * 0.98) {
      setIsSliding(false);
      setIsVerified(true);
      setSliderPosition(maxDistance);
      
      // Trigger success call after slight satisfying delay
      setTimeout(() => {
        onSuccess();
      }, 650);
    }
  };

  const handleEnd = () => {
    if (!isVerified) {
      setIsSliding(false);
      setSliderPosition(0); // bounce back
    }
  };

  useEffect(() => {
    if (isSliding) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isSliding]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md"
    >
      <div className="w-full max-w-md bg-[#161616] border border-white/10 rounded-[32px] p-6 text-white shadow-2xl overflow-hidden relative">
        
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-md opacity-75" />

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/10">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Security Verification</h3>
            <p className="text-xs text-white/40">Please complete the captcha to {actionName}</p>
          </div>
        </div>

        {/* Captcha Mode Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-white/5 border border-white/5 rounded-xl mb-6">
          <button
            onClick={() => setCaptchaType('slide')}
            className={`py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${captchaType === 'slide' ? 'bg-white/10 text-cyan-400' : 'text-white/40 hover:text-white/70'}`}
          >
            Slide Verification
          </button>
          <button
            onClick={() => setCaptchaType('grid')}
            className={`py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${captchaType === 'grid' ? 'bg-white/10 text-cyan-400' : 'text-white/40 hover:text-white/70'}`}
          >
            Alphanumeric Challenge
          </button>
          <button
            onClick={() => setCaptchaType('guide')}
            className={`py-1.5 px-1 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 ${captchaType === 'guide' ? 'bg-white/10 text-cyan-400' : 'text-white/40 hover:text-white/70'}`}
          >
            <BookOpen size={12} /> App Check
          </button>
        </div>

        {/* CHALLENGE WORKSPACE */}
        <div className="min-h-[160px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
            {/* 1. SLIDE-TO-VERIFY */}
            {captchaType === 'slide' && (
              <motion.div 
                key="slide"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 py-2"
              >
                <p className="text-xs text-white/50 text-center">To verify you are not an automated scanner, drag the lock shield entirely to the right edge.</p>
                
                {/* Track */}
                <div 
                  ref={trackRef}
                  className="h-14 bg-white/5 border border-white/5 rounded-2xl relative flex items-center pr-2 pl-1 select-none"
                >
                  {/* Indicator lines */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-white/20 uppercase tracking-widest pl-10">
                      {isVerified ? 'VERIFICATION SECURED' : 'SLIDE LOCK TO RIGHT ➤'}
                    </span>
                  </div>

                  {/* Progressive filled background */}
                  <div 
                    className="absolute left-1 top-1 bottom-1 bg-gradient-to-r from-cyan-500/20 to-teal-500/30 rounded-xl"
                    style={{ width: `${sliderPosition + 22}px` }}
                  />

                  {/* Slider pill */}
                  <div
                    ref={sliderRef}
                    onMouseDown={handleStart}
                    onTouchStart={handleStart}
                    style={{ transform: `translateX(${sliderPosition}px)` }}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-shadow cursor-grab active:cursor-grabbing select-none ${
                      isVerified 
                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                        : isSliding 
                          ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/20' 
                          : 'bg-white/10 hover:bg-white/15 text-white'
                    }`}
                  >
                    {isVerified ? <Check size={20} /> : <Lock size={18} />}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. ALPHANUMERIC CHALLENGE */}
            {captchaType === 'grid' && (
              <motion.div 
                key="grid"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Canvas Display */}
                <div className="flex items-center gap-3 justify-center">
                  <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-inner">
                    <canvas 
                      ref={canvasRef} 
                      width={220} 
                      height={64}
                      className="block"
                    />
                  </div>
                  <button 
                    onClick={generateCode}
                    className="p-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl border border-white/5 transition-colors"
                    title="Refresh Security Code"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>

                {/* Input block */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Enter security digits above"
                    className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/30 rounded-2xl px-4 py-3 text-white placeholder-white/20 select-none text-center font-mono tracking-widest font-bold focus:outline-none transition-all uppercase"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') verifyTextCaptcha();
                    }}
                  />
                  {captchaError && (
                    <p className="text-[11px] text-red-400 text-center font-medium">{captchaError}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={verifyTextCaptcha}
                  className="w-full py-3 bg-cyan-500 text-black rounded-2xl text-xs font-bold hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/10"
                >
                  Verify Code
                </button>
              </motion.div>
            )}

            {/* 3. APP CHECK CLOUD IMPLEMENTATION GUIDE */}
            {captchaType === 'guide' && (
              <motion.div 
                key="guide"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-left space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar text-xs"
              >
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                    <KeyRound size={14} /> reCAPTCHA Enterprise
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed">
                    For production-grade defense, deploy **Firebase App Check** to cryptographically verify that requests are originating exclusively from your authentic app client.
                  </p>
                </div>

                <div className="space-y-2 text-[11px] text-white/50 pl-2">
                  <p className="font-bold text-white/70">Enable in Google Cloud & Firebase:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Go to the <span className="text-cyan-400">Google Cloud Console API Library</span>.</li>
                    <li>Search for and enable **reCAPTCHA Enterprise API**.</li>
                    <li>Open your **Firebase Console** &rarr; **App Check** section.</li>
                    <li>Click **Register** and configure reCAPTCHA Enterprise with your domain.</li>
                    <li>For Android mobile builds, register the **Play Integrity** provider to verify true devices.</li>
                  </ol>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer controls */}
        <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
          <button 
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all text-center"
          >
            Cancel
          </button>
        </div>

      </div>
    </motion.div>
  );
};
