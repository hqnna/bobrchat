import * as React from "react";

import { cn } from "~/lib/utils";

type SliderProps = React.InputHTMLAttributes<HTMLInputElement> & {
    labels?: [string, string];
};

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
    ({ className, labels, ...props }, ref) => (
        <div className="space-y-2">
            <input
                ref={ref}
                type="range"
                className={cn(
                    `
            w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-primary
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:border
            [&::-webkit-slider-thumb]:border-primary
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-primary
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:border
            [&::-moz-range-thumb]:border-primary
          `,
                    className,
                )}
                {...props}
            />
            {labels && (
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{labels[0]}</span>
                    <span>{labels[1]}</span>
                </div>
            )}
        </div>
    ),
);

Slider.displayName = "Slider";

export { Slider };
