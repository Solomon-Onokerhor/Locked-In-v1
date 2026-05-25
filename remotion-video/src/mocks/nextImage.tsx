import React from 'react';

export default function Image({ src, alt, className, fill, width, height, ...props }: any) {
  const isString = typeof src === 'string';
  const displaySrc = isString ? src : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop';
  
  return (
    <img 
      src={displaySrc} 
      alt={alt} 
      className={className} 
      style={fill ? { width: '100%', height: '100%', objectFit: 'cover' } : { width, height }}
      {...props}
    />
  );
}
