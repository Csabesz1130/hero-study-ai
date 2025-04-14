import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";
import { useResponsive } from "@/hooks/useResponsive";

interface ResponsiveContainerProps extends HTMLAttributes<HTMLDivElement> {
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
    padding?: "none" | "sm" | "md" | "lg" | "xl";
    centered?: boolean;
    fluid?: boolean;
}

export const ResponsiveContainer = ({
    className,
    maxWidth = "lg",
    padding = "md",
    centered = true,
    fluid = false,
    children,
    ...props
}: ResponsiveContainerProps) => {
    const { isMobile, isTablet } = useResponsive();

    const getPadding = () => {
        if (padding === "none") return "p-0";
        if (isMobile) return `p-${padding === "sm" ? 2 : padding === "md" ? 4 : padding === "lg" ? 6 : 8}`;
        if (isTablet) return `p-${padding === "sm" ? 4 : padding === "md" ? 6 : padding === "lg" ? 8 : 10}`;
        return `p-${padding === "sm" ? 6 : padding === "md" ? 8 : padding === "lg" ? 10 : 12}`;
    };

    return (
        <div
            className={cn(
                "w-full",
                centered && "mx-auto",
                !fluid && {
                    "max-w-screen-sm": maxWidth === "sm",
                    "max-w-screen-md": maxWidth === "md",
                    "max-w-screen-lg": maxWidth === "lg",
                    "max-w-screen-xl": maxWidth === "xl",
                    "max-w-screen-2xl": maxWidth === "2xl",
                },
                getPadding(),
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}; 