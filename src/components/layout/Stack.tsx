import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface StackProps extends HTMLAttributes<HTMLDivElement> {
    direction?: "row" | "column";
    spacing?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    align?: "start" | "center" | "end" | "stretch";
    justify?: "start" | "center" | "end" | "between" | "around";
    wrap?: boolean;
}

export const Stack = ({
    className,
    direction = "column",
    spacing = 4,
    align = "stretch",
    justify = "start",
    wrap = false,
    ...props
}: StackProps) => {
    return (
        <div
            className={cn(
                "flex",
                direction === "row" ? "flex-row" : "flex-col",
                `gap-${spacing}`,
                {
                    "items-start": align === "start",
                    "items-center": align === "center",
                    "items-end": align === "end",
                    "items-stretch": align === "stretch",
                    "justify-start": justify === "start",
                    "justify-center": justify === "center",
                    "justify-end": justify === "end",
                    "justify-between": justify === "between",
                    "justify-around": justify === "around",
                    "flex-wrap": wrap,
                },
                className
            )}
            {...props}
        />
    );
}; 