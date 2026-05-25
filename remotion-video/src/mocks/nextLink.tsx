import React from 'react';

export default function Link({ children, href, className, onClick, ...props }: any) {
  return (
    <a 
      href={href} 
      className={className} 
      onClick={(e) => { 
        e.preventDefault(); 
        onClick?.(e); 
      }}
      {...props}
    >
      {children}
    </a>
  );
}
