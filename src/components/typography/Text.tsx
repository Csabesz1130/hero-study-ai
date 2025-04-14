import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface TextProps extends HTMLAttributes<HTMLSpanElement> {
    size?: "xs" | "sm" | "base" | "lg" | "xl";
    weight?: "normal" | "medium" | "semibold" | "bold";
    color?: "default" | "muted" | "primary" | "secondary" | "success" | "warning" | "error";
    transform?: "none" | "uppercase" | "lowercase" | "capitalize";
    decoration?: "none" | "underline" | "line-through";
    truncate?: boolean;
    lineClamp?: number;
}

export const Text = ({
    className,
    size = "base",
    weight = "normal",
    color = "default",
    transform = "none",
    decoration = "none",
    truncate = false,
    lineClamp,
    children,
    ...props
}: TextProps) => {
    return (
        <span
            className={cn(
                "font-sans",
                {
                    "text-xs": size === "xs",
                    "text-sm": size === "sm",
                    "text-base": size === "base",
                    "text-lg": size === "lg",
                    "text-xl": size === "xl",
                    "font-normal": weight === "normal",
                    "font-medium": weight === "medium",
                    "font-semibold": weight === "semibold",
                    "font-bold": weight === "bold",
                    "text-gray-900": color === "default",
                    "text-gray-600": color === "muted",
                    "text-primary-600": color === "primary",
                    "text-secondary-600": color === "secondary",
                    "text-green-600": color === "success",
                    "text-yellow-600": color === "warning",
                    "text-red-600": color === "error",
                    "normal-case": transform === "none",
                    "uppercase": transform === "uppercase",
                    "lowercase": transform === "lowercase",
                    "capitalize": transform === "capitalize",
                    "no-underline": decoration === "none",
                    "underline": decoration === "underline",
                    "line-through": decoration === "line-through",
                    "truncate": truncate,
                    [`line-clamp-${lineClamp}`]: lineClamp,
                },
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}; 