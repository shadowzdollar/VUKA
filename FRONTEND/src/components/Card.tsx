import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  variant?: "default" | "bordered" | "elevated";
}

export function Card({ 
  children, 
  className = "", 
  padding = "md",
  variant = "default"
}: CardProps) {
  const baseStyles = "bg-white rounded-lg";
  
  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };
  
  const variantStyles = {
    default: "",
    bordered: "border border-gray-200",
    elevated: "shadow-lg",
  };
  
  return (
    <div className={`${baseStyles} ${paddingStyles[padding]} ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
}
