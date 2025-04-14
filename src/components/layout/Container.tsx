import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
    fluid?: boolean;
    size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export const Container = ({
    className,
    fluid = false,
    size = "lg",
    ...props
}: ContainerProps) => {
    return (
        <div
            className={cn(
                "w-full mx-auto px-4",
                !fluid && {
                    "max-w-screen-sm": size === "sm",
                    "max-w-screen-md": size === "md",
                    "max-w-screen-lg": size === "lg",
                    "max-w-screen-xl": size === "xl",
                    "max-w-screen-2xl": size === "2xl",
                },
                className
            )}
            {...props}
        />
    );
}; 