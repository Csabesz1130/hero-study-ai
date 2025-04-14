import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    variant?: "default" | "display" | "subtitle";
    weight?: "normal" | "medium" | "semibold" | "bold";
    align?: "left" | "center" | "right";
    truncate?: boolean;
}

export const Heading = ({
    className,
    level = 1,
    variant = "default",
    weight = "bold",
    align = "left",
    truncate = false,
    children,
    ...props
}: HeadingProps) => {
    const Tag = `h${level}` as keyof JSX.IntrinsicElements;

    return (
        <Tag
            className={cn(
                "font-sans",
                {
                    "text-4xl md:text-5xl lg:text-6xl": level === 1 && variant === "display",
                    "text-3xl md:text-4xl lg:text-5xl": level === 1 && variant === "default",
                    "text-2xl md:text-3xl lg:text-4xl": level === 2,
                    "text-xl md:text-2xl lg:text-3xl": level === 3,
                    "text-lg md:text-xl lg:text-2xl": level === 4,
                    "text-base md:text-lg lg:text-xl": level === 5,
                    "text-sm md:text-base lg:text-lg": level === 6,
                    "text-gray-900": variant === "default",
                    "text-gray-700": variant === "subtitle",
                    "font-normal": weight === "normal",
                    "font-medium": weight === "medium",
                    "font-semibold": weight === "semibold",
                    "font-bold": weight === "bold",
                    "text-left": align === "left",
                    "text-center": align === "center",
                    "text-right": align === "right",
                    "truncate": truncate,
                },
                className
            )}
            {...props}
        >
            {children}
        </Tag>
    );
}; 