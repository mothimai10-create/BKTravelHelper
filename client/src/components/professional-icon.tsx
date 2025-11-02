import React from "react";
import { cn } from "@/lib/utils";

interface ProfessionalIconProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "filled" | "outline" | "minimal";
  background?: boolean;
  bgColor?: "primary" | "secondary" | "accent" | "success" | "warning" | "destructive" | "muted";
  className?: string;
}

/**
 * Professional Icon Component
 * Wraps lucide-react icons with enhanced styling for better visual hierarchy
 * 
 * Usage:
 * <ProfessionalIcon size="md" background bgColor="primary">
 *   <MapPin className="w-5 h-5" />
 * </ProfessionalIcon>
 */
export const ProfessionalIcon: React.FC<ProfessionalIconProps> = ({
  children,
  size = "md",
  variant = "filled",
  background = false,
  bgColor = "primary",
  className,
}) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const bgColorClasses = {
    primary: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30",
    secondary: "bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30",
    accent: "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30",
    success: "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30",
    warning: "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30",
    destructive: "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30",
    muted: "bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 shadow-lg shadow-gray-400/30",
  };

  const iconClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-xl",
        background ? `${sizeClasses[size]} ${bgColorClasses[bgColor]}` : "",
        className
      )}
    >
      <div className={variant === "filled" ? "font-semibold" : ""}>
        {React.cloneElement(children as React.ReactElement, {
          className: cn(
            (children as React.ReactElement).props.className || "",
            background ? "" : iconClasses[size],
            variant === "filled" ? "fill-current" : ""
          ),
        })}
      </div>
    </div>
  );
};

/**
 * Icon Badge Component
 * Displays an icon with a subtle background for header/navigation use
 */
export const IconBadge: React.FC<{
  children: React.ReactNode;
  count?: number;
  className?: string;
}> = ({ children, count, className }) => (
  <div className={cn("relative inline-flex", className)}>
    {React.cloneElement(children as React.ReactElement, {
      className: cn(
        (children as React.ReactElement).props.className || "",
        "w-5 h-5 transition-all duration-200"
      ),
    })}
    {count !== undefined && count > 0 && (
      <span className="absolute top-0 right-0 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg shadow-red-500/30">
        {count > 9 ? "9+" : count}
      </span>
    )}
  </div>
);

/**
 * Header Icon Button Wrapper
 * Enhanced styling for header navigation icons
 */
export const HeaderIcon: React.FC<{
  children: React.ReactNode;
  count?: number;
  onClick?: () => void;
  className?: string;
}> = ({ children, count, onClick, className }) => (
  <button
    onClick={onClick}
    className={cn(
      "relative p-2 rounded-lg text-white hover:bg-white/20 transition-all duration-200 hover:shadow-md",
      className
    )}
  >
    <div className="flex items-center justify-center">
      {React.cloneElement(children as React.ReactElement, {
        className: cn(
          (children as React.ReactElement).props.className || "",
          "w-5 h-5"
        ),
      })}
    </div>
    {count !== undefined && count > 0 && (
      <span className="absolute top-0 right-0 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg shadow-red-500/30">
        {count > 9 ? "9+" : count}
      </span>
    )}
  </button>
);