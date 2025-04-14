import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface ParagraphProps extends HTMLAttributes<HTMLParagraphElement> {
    size?: "sm" | "base" | "lg" | "xl";
    weight?: "normal" | "medium" | "semibold";
    color?: "default" | "muted" | "primary" | "secondary";
    align?: "left" | "center" | "right";
    truncate?: boolean;
    lineClamp?: number;
}

export const Paragraph = ({
    className,
    size = "base",
    weight = "normal",
    color = "default",
    align = "left",
    truncate = false,
    lineClamp,
    children,
    ...props
}: ParagraphProps) => {
    return (
        <p
            className={cn(
                "font-sans leading-relaxed",
                {
                    "text-sm": size === "sm",
                    "text-base": size === "base",
                    "text-lg": size === "lg",
                    "text-xl": size === "xl",
                    "font-normal": weight === "normal",
                    "font-medium": weight === "medium",
                    "font-semibold": weight === "semibold",
                    "text-gray-900": color === "default",
                    "text-gray-600": color === "muted",
                    "text-primary-600": color === "primary",
                    "text-secondary-600": color === "secondary",
                    "text-left": align === "left",
                    "text-center": align === "center",
                    "text-right": align === "right",
                    "truncate": truncate,
                    [`line-clamp-${lineClamp}`]: lineClamp,
                },
                className
            )}
            {...props}
        >
            {children}
        </p>
    );
}; 