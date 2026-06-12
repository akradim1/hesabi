import React from 'react';

interface InvoiceShapesProps {
  primaryColor: string;
  styleName?: 'none' | 'modern-diagonal' | 'minimal-geometric' | 'abstract-wave';
}

export default function InvoiceShapes({ primaryColor, styleName = 'modern-diagonal' }: InvoiceShapesProps) {
  if (styleName === 'none') return null;

  // Derive some translucent hues for harmonious geometric layout
  const primaryTint70 = `${primaryColor}b3`; // 70% opacity
  const primaryTint30 = `${primaryColor}4d`; // 30% opacity
  const primaryTint15 = `${primaryColor}26`; // 15% opacity

  if (styleName === 'modern-diagonal') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" id="invoice-decorative-shapes-diagonal">
        {/* Top-Right Decorative Shapes (Exactly matching mockup) */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] pointer-events-none">
          <svg viewBox="0 0 300 300" className="w-full h-full opacity-85" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Soft cyan stripe */}
            <path 
              d="M130 0 L240 0 L300 110 L300 220 Z" 
              fill="#92cfd4" 
              fillOpacity="0.75" 
            />
            {/* Elegant peach/salmon stripe */}
            <path 
              d="M60 0 L150 0 L300 230 L300 300 L260 300 Z" 
              fill="#fca590" 
              fillOpacity="0.8" 
            />
            {/* Theme primary color stripe (ties custom branding into shapes!) */}
            <path 
              d="M180 0 L220 0 L300 130 L300 90 Z" 
              fill={primaryColor} 
              fillOpacity="0.4"
            />
            {/* Pastel violet/lavender stripe */}
            <path 
              d="M210 0 L280 0 L300 40 L300 10 Z" 
              fill="#c2bcde" 
              fillOpacity="0.6" 
            />
            <path 
              d="M0 0 H100 L0 100 Z" 
              fill="#e2f1f3" 
              fillOpacity="0.5" 
            />
          </svg>
        </div>

        {/* Bottom-Right Decorative Shapes (Mockup) */}
        <div className="absolute bottom-0 right-0 w-[340px] h-[340px] pointer-events-none">
          <svg viewBox="0 0 340 340" className="w-full h-full opacity-85" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Soft lavender diagonal band upward */}
            <path 
              d="M200 340 L340 340 L340 200 L120 340 Z" 
              fill="#b4abd4" 
              fillOpacity="0.55" 
            />
            {/* Classic salmon stripe */}
            <path 
              d="M120 340 L220 340 L340 120 L340 50 L310 50 Z" 
              fill="#fca590" 
              fillOpacity="0.75" 
            />
            {/* Theme Primary color stripe */}
            <path 
              d="M50 340 L130 340 L340 30 L340 0 L310 0 Z" 
              fill={primaryColor} 
              fillOpacity="0.35" 
            />
            {/* Soft cyan stripe */}
            <path 
              d="M0 340 L60 340 L340 0 L260 0 L0 260 Z" 
              fill="#92cfd4" 
              fillOpacity="0.65" 
            />
            {/* Soft complementary tan block */}
            <path 
              d="M280 340 H340 V280 Z" 
              fill="#d9c5b2" 
              fillOpacity="0.8" 
            />
          </svg>
        </div>
      </div>
    );
  }

  if (styleName === 'minimal-geometric') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" id="invoice-decorative-shapes-minimal">
        {/* Elegant Abstract Circles */}
        <div className="absolute -top-12 -right-12 w-[240px] h-[240px] opacity-40">
          <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="80" stroke={primaryColor} strokeWidth="8" strokeOpacity="0.2" />
            <circle cx="120" cy="80" r="60" fill={primaryColor} fillOpacity="0.1" />
            <circle cx="60" cy="140" r="40" stroke="#fca590" strokeWidth="2" strokeDasharray="4 4" />
          </svg>
        </div>

        <div className="absolute -bottom-16 -left-16 w-[300px] h-[300px] opacity-35">
          <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="90" fill={primaryColor} fillOpacity="0.08" />
            <circle cx="100" cy="100" r="70" stroke={primaryColor} strokeWidth="1" strokeDasharray="5 5" strokeOpacity="0.4" />
            <circle cx="130" cy="130" r="50" fill="#92cfd4" fillOpacity="0.15" />
          </svg>
        </div>
      </div>
    );
  }

  if (styleName === 'abstract-wave') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" id="invoice-decorative-shapes-wave">
        {/* Beautiful wave curves */}
        <div className="absolute top-0 left-0 right-0 h-[100px] opacity-60">
          <svg viewBox="0 0 600 100" preserveAspectRatio="none" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M0 0 H600 V60 C400 90, 200 30, 0 80 Z" 
              fill={primaryTint30} 
            />
            <path 
              d="M0 0 H600 V40 C450 70, 150 10, 0 50 Z" 
              fill={primaryColor} 
              fillOpacity="0.15"
            />
            <path 
              d="M0 0 H600 V20 C300 40, 100 0, 0 15 Z" 
              fill="#92cfd4" 
              fillOpacity="0.3"
            />
          </svg>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[120px] opacity-60">
          <svg viewBox="0 0 600 120" preserveAspectRatio="none" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M0 120 H600 V40 C455 100, 200 20, 0 80 Z" 
              fill={primaryTint15} 
            />
            <path 
              d="M0 120 H600 V10 C350 90, 150 15, 0 50 Z" 
              fill={primaryColor} 
              fillOpacity="0.1"
            />
          </svg>
        </div>
      </div>
    );
  }

  return null;
}
