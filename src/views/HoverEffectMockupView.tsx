import React, { useState } from 'react';
import { useUI } from '../contexts/UIContext';

// Common real-world IGDB cover aspect ratios
const MOCK_IMAGES = [
  'https://images.igdb.com/igdb/image/upload/t_720p/co1x7f.jpg',
  'https://images.igdb.com/igdb/image/upload/t_720p/co1syk.jpg',
  'https://images.igdb.com/igdb/image/upload/t_720p/co2vdg.jpg',
  'https://images.igdb.com/igdb/image/upload/t_720p/co1r7f.jpg',
  'https://images.igdb.com/igdb/image/upload/t_720p/co1wz1.jpg',
  'https://images.igdb.com/igdb/image/upload/t_720p/co1y38.jpg'
];

export default function HoverEffectMockupView() {
  const { navigateTo } = useUI();
  
  const [containerAnim, setContainerAnim] = useState('group-hover:scale-105');
  const [imgScale, setImgScale] = useState('group-hover:scale-100');
  const [easing, setEasing] = useState('ease-out');
  const [duration, setDuration] = useState('duration-300');
  const [filter, setFilter] = useState('none');
  const [overlay, setOverlay] = useState('none');
  
  const [borderPos, setBorderPos] = useState('none');
  const [borderSize, setBorderSize] = useState('2');
  const [borderColor, setBorderColor] = useState('amber-400');

  const [customContainerScale, setCustomContainerScale] = useState<number | ''>('');
  const [customImgScale, setCustomImgScale] = useState<number | ''>('');

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Box Art Hover Effects</h1>
        <button 
          onClick={() => navigateTo('dashboard')}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-semibold transition-colors"
        >
          Return to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Controls */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-6 max-h-[80vh] overflow-y-auto pr-4 scrollbar-hide">
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Container Animation</h3>
              <p className="text-xs text-zinc-500 mb-2">How the entire box art frame behaves</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <ControlButton current={containerAnim} value="group-hover:scale-100" label="None" onClick={setContainerAnim} />
                <ControlButton current={containerAnim} value="group-hover:-translate-y-1" label="Lift (-y-1)" onClick={setContainerAnim} />
                <ControlButton current={containerAnim} value="group-hover:-translate-y-2" label="High Lift (-y-2)" onClick={setContainerAnim} />
                <ControlButton current={containerAnim} value="group-hover:scale-[1.02]" label="Scale (1.02)" onClick={setContainerAnim} />
                <ControlButton current={containerAnim} value="group-hover:scale-105" label="Scale (1.05) [Current]" onClick={setContainerAnim} />
                <ControlButton current={containerAnim} value="group-hover:-translate-y-1 group-hover:scale-[1.02]" label="Lift + Scale" onClick={setContainerAnim} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-zinc-400 uppercase">Custom Manual Scale:</span>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="e.g. 1.05"
                  value={customContainerScale}
                  onChange={e => setCustomContainerScale(e.target.value ? parseFloat(e.target.value) : '')}
                  className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded px-2 py-1 w-24 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Internal Image Scale</h3>
              <p className="text-xs text-zinc-500 mb-2">How the image inside the frame behaves</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <ControlButton current={imgScale} value="group-hover:scale-100" label="None" onClick={setImgScale} />
                <ControlButton current={imgScale} value="group-hover:scale-[1.02]" label="Subtle (1.02)" onClick={setImgScale} />
                <ControlButton current={imgScale} value="group-hover:scale-105" label="Medium (1.05)" onClick={setImgScale} />
                <ControlButton current={imgScale} value="group-hover:scale-110" label="Large (1.10) [Current]" onClick={setImgScale} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-zinc-400 uppercase">Custom Manual Scale:</span>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="e.g. 1.10"
                  value={customImgScale}
                  onChange={e => setCustomImgScale(e.target.value ? parseFloat(e.target.value) : '')}
                  className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded px-2 py-1 w-24 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Timing</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <ControlButton current={duration} value="duration-150" label="150ms" onClick={setDuration} />
                <ControlButton current={duration} value="duration-300" label="300ms [Current]" onClick={setDuration} />
                <ControlButton current={duration} value="duration-500" label="500ms" onClick={setDuration} />
                <ControlButton current={duration} value="duration-700" label="700ms" onClick={setDuration} />
              </div>
              <div className="flex flex-wrap gap-2">
                <ControlButton current={easing} value="ease-linear" label="Linear" onClick={setEasing} />
                <ControlButton current={easing} value="ease-in" label="Ease In" onClick={setEasing} />
                <ControlButton current={easing} value="ease-out" label="Ease Out" onClick={setEasing} />
                <ControlButton current={easing} value="ease-in-out" label="Ease In Out" onClick={setEasing} />
                <ControlButton current={easing} value="ease-[cubic-bezier(0.33,1,0.68,1)]" label="Bouncy" onClick={setEasing} />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Border Hover Effect</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <ControlButton current={borderPos} value="none" label="None" onClick={setBorderPos} />
                <ControlButton current={borderPos} value="inset" label="Inside (Inset)" onClick={setBorderPos} />
                <ControlButton current={borderPos} value="outset" label="Outside (Outset)" onClick={setBorderPos} />
              </div>
              
              {borderPos !== 'none' && (
                <>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <ControlButton current={borderSize} value="1" label="1px" onClick={setBorderSize} />
                    <ControlButton current={borderSize} value="2" label="2px" onClick={setBorderSize} />
                    <ControlButton current={borderSize} value="4" label="4px" onClick={setBorderSize} />
                    <ControlButton current={borderSize} value="8" label="8px" onClick={setBorderSize} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ControlButton current={borderColor} value="amber-400" label="Amber" onClick={setBorderColor} />
                    <ControlButton current={borderColor} value="white" label="White" onClick={setBorderColor} />
                    <ControlButton current={borderColor} value="zinc-400" label="Zinc" onClick={setBorderColor} />
                    <ControlButton current={borderColor} value="blue-500" label="Blue" onClick={setBorderColor} />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">CSS Filters & Blends</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <ControlButton current={filter} value="none" label="None" onClick={setFilter} />
                <ControlButton current={filter} value="group-hover:saturate-150" label="Boost Sat" onClick={setFilter} />
                <ControlButton current={filter} value="group-hover:saturate-0" label="Grayscale" onClick={setFilter} />
                <ControlButton current={filter} value="group-hover:brightness-125" label="Brighten" onClick={setFilter} />
                <ControlButton current={filter} value="group-hover:brightness-50" label="Darken" onClick={setFilter} />
                <ControlButton current={filter} value="group-hover:contrast-125 group-hover:saturate-125" label="Vivid" onClick={setFilter} />
                <ControlButton current={filter} value="group-hover:blur-[2px]" label="Blur" onClick={setFilter} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Overlays</h3>
              <div className="flex flex-wrap gap-2">
                <ControlButton current={overlay} value="none" label="None" onClick={setOverlay} />
                <ControlButton current={overlay} value="dark-gradient" label="Dark Bottom Gradient" onClick={setOverlay} />
                <ControlButton current={overlay} value="white-wash" label="Soft White Wash" onClick={setOverlay} />
                <ControlButton current={overlay} value="amber-tint" label="Amber Tint" onClick={setOverlay} />
                <ControlButton current={overlay} value="scanlines" label="Scanlines" onClick={setOverlay} />
              </div>
            </div>
          </div>

        </div>

        {/* Preview Grid */}
        <div className="md:col-span-7 lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-xl p-8 flex flex-col h-full sticky top-8">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6">Live Preview (Hover the Box Arts)</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6" style={{ perspective: '1000px' }}>
            {MOCK_IMAGES.map((url, i) => (
              <MockImageContainer 
                key={i} 
                url={url} 
                containerAnim={containerAnim}
                imgScale={imgScale}
                customContainerScale={customContainerScale}
                customImgScale={customImgScale}
                easing={easing}
                duration={duration}
                filter={filter}
                overlay={overlay}
                borderPos={borderPos}
                borderSize={borderSize}
                borderColor={borderColor}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function ControlButton({ current, value, label, onClick }: { current: string, value: string, label: string, onClick: (v: string) => void }) {
  const active = current === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
        active 
          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200'
      }`}
    >
      {label}
    </button>
  );
}

function MockImageContainer({ 
  url, 
  containerAnim,
  imgScale, 
  customContainerScale,
  customImgScale,
  easing, 
  duration, 
  filter, 
  overlay,
  borderPos,
  borderSize,
  borderColor
}: { 
  url: string, 
  containerAnim: string,
  imgScale: string, 
  customContainerScale: number | '',
  customImgScale: number | '',
  easing: string, 
  duration: string, 
  filter: string,
  overlay: string,
  borderPos: string,
  borderSize: string,
  borderColor: string
}) {
  
  const [isHovered, setIsHovered] = useState(false);

  // Evaluate Custom Values
  const useManualContainerAnim = customContainerScale !== '';
  const useManualImgScale = customImgScale !== '';

  const activeContainerAnim = (useManualContainerAnim || containerAnim === 'none') ? '' : containerAnim;
  const activeImgScale = (useManualImgScale || imgScale === 'none') ? '' : imgScale;

  // Base classes for the image
  const imgClasses = `absolute inset-0 w-full h-full object-cover transition-all ${duration} ${easing} ${activeImgScale} ${filter !== 'none' ? filter : ''}`;

  let borderOverlayClasses = '';
  if (borderPos !== 'none') {
    const sizeMap: { [key: string]: string } = {
      '1': 'border',
      '2': 'border-2',
      '4': 'border-4',
      '8': 'border-8',
    };
    const colorMap: { [key: string]: string } = {
      'amber-400': 'border-amber-400',
      'white': 'border-white',
      'zinc-400': 'border-zinc-400',
      'blue-500': 'border-blue-500',
    };

    borderOverlayClasses = `${sizeMap[borderSize] || ''} ${colorMap[borderColor] || ''}`;
  }

  // Handle active JS state for custom manual scalings
  const inlineContainerStyle = useManualContainerAnim ? { transform: `scale(${isHovered ? customContainerScale : 1})` } : {};
  const inlineImgStyle = useManualImgScale ? { transform: `scale(${isHovered ? customImgScale : 1})` } : {};

  return (
    <div 
      className="relative group aspect-[264/374] rounded-md cursor-pointer block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`absolute inset-0 bg-zinc-900 rounded-md transition-all ${duration} ${easing} ${activeContainerAnim}`}
        style={inlineContainerStyle}
      >
        <div className="absolute inset-0 overflow-hidden rounded-md">
          {/* Image Layer */}
          <img 
            src={url} 
            alt="Mock Box Art"
            className={imgClasses}
            style={inlineImgStyle}
          />
          
          {/* Overlay Layers */}
          {overlay === 'dark-gradient' && (
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity ${duration} ${easing} z-10 pointer-events-none`} />
          )}
          {overlay === 'white-wash' && (
            <div className={`absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity ${duration} ${easing} z-10 pointer-events-none mix-blend-overlay`} />
          )}
          {overlay === 'amber-tint' && (
            <div className={`absolute inset-0 bg-amber-500/30 opacity-0 group-hover:opacity-100 transition-opacity ${duration} ${easing} z-10 pointer-events-none mix-blend-color`} />
          )}
          {overlay === 'scanlines' && (
            <div className={`absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8cGF0aCBkPSJNMCAwTDAgMUw0IDFMNCAwWk0wIDJMMCAzTDQgM0w0IDJaIiBmaWxsPSJyZ2JhKDAsMCwwLDAuNSkiLz4KPC9zdmc+')] opacity-0 group-hover:opacity-100 transition-opacity ${duration} ${easing} z-10 pointer-events-none mix-blend-multiply`} />
          )}

          {/* Frame Border */}
          <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)] rounded-md z-20 pointer-events-none" />
        </div>

        {/* Hover Border Effect Layer */}
        {borderPos !== 'none' && (
          <div 
            className={`absolute z-30 pointer-events-none rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${duration} ${easing} ${borderOverlayClasses}`}
            style={borderPos === 'outset' ? { 
                top: `-${borderSize}px`, bottom: `-${borderSize}px`, left: `-${borderSize}px`, right: `-${borderSize}px` 
            } : {
                top: '0', bottom: '0', left: '0', right: '0'
            }}
          />
        )}
      </div>
    </div>
  );
}

