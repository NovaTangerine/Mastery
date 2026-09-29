import React, { useState } from 'react';

export default function BlurRevealImage({ url, alt, className, revealDelay }: { url: string, alt: string, className?: string, revealDelay?: number }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  
  // Use passed delay or fallback to random
  const fallbackDelay = React.useMemo(() => Math.floor(Math.random() * 600), []);
  const delay = revealDelay !== undefined ? revealDelay : fallbackDelay;
  const [transitionDone, setTransitionDone] = useState(false);

  const handleImageLoaded = () => {
    // Wait a tiny bit before triggering the transition to ensure the initial blurry state has rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setLoaded(true);
      });
    });
  };

  React.useEffect(() => {
    if (imgRef.current?.complete) {
      handleImageLoaded();
    }
  }, [url]);

  React.useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => {
        setTransitionDone(true);
      }, delay + 700); // Wait for delay + transition duration
      return () => clearTimeout(timer);
    }
  }, [loaded, delay]);
  
  return (
    <>
      <div 
        className={`absolute inset-0 bg-zinc-800 transition-opacity duration-700 z-10 pointer-events-none ${loaded ? 'opacity-0' : 'animate-pulse'}`} 
        style={{ transitionDelay: loaded ? `${delay}ms` : '0ms' }}
      />
      <img
        ref={imgRef}
        src={url}
        alt={alt}
        onLoad={handleImageLoaded}
        className={`${className || ''} ${loaded ? 'opacity-100 blur-none' : 'opacity-0 blur-md'}`}
        style={{ transitionDelay: transitionDone ? '0ms' : `${loaded ? delay : 0}ms` }}
      />
    </>
  );
}
