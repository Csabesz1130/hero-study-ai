import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface SpacerProps extends HTMLAttributes<HTMLDivElement> {
    size?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    axis?: "horizontal" | "vertical";
}

export const Spacer = ({
    className,
    size = 4,
    axis = "vertical",
    ...props
}: SpacerProps) => {
    return (
        <div
            className={cn(
                axis === "vertical" ? `h-${size}` : `w-${size}`,
                className
            )}
            {...props}
        />
    );
}; 