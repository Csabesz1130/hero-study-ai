import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface GridProps extends HTMLAttributes<HTMLDivElement> {
    cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    responsive?: {
        sm?: 1 | 2 | 3 | 4 | 5 | 6;
        md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
        lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    };
}

export const Grid = ({
    className,
    cols = 1,
    gap = 4,
    responsive,
    ...props
}: GridProps) => {
    return (
        <div
            className={cn(
                "grid",
                `grid-cols-${cols}`,
                `gap-${gap}`,
                responsive?.sm && `sm:grid-cols-${responsive.sm}`,
                responsive?.md && `md:grid-cols-${responsive.md}`,
                responsive?.lg && `lg:grid-cols-${responsive.lg}`,
                className
            )}
            {...props}
        />
    );
}; 