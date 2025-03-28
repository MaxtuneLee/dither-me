import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { DitherOptions } from '@/lib/types';
import { useTransition } from 'react';

interface DitherTypeControlProps {
    options: DitherOptions;
    onOptionsChange: (options: DitherOptions) => void;
}

export function DitherTypeControl({ options, onOptionsChange }: DitherTypeControlProps) {
    const [_isPending, setTransition] = useTransition();

    const handleTypeChange = (newType: number) => {
        setTransition(() => {
            onOptionsChange({
                ...options,
                ditherType: newType
            });
        });
    };

    const handleBayerSizeChange = (value: string) => {
        setTransition(() => {
            onOptionsChange({
                ...options,
                bayerSize: Number.parseInt(value)
            });
        });
    };

    const handleAmountChange = (value: number[]) => {
        const newAmount = value[0];
        setTransition(() => {
            onOptionsChange({
                ...options,
                ditherAmount: newAmount
            });
        });
    };

    return (
        <>
            <div>
                <h3 className="font-medium mb-2">Dither Type</h3>
                <div className="grid grid-cols-3 gap-2">
                    <Button
                        variant={options.ditherType === 0 ? "default" : "outline"}
                        onClick={() => handleTypeChange(0)}
                        className="w-full"
                    >
                        Bayer
                    </Button>
                    <Button
                        variant={options.ditherType === 1 ? "default" : "outline"}
                        onClick={() => handleTypeChange(1)}
                        className="w-full"
                    >
                        Floyd
                    </Button>
                    <Button
                        variant={options.ditherType === 2 ? "default" : "outline"}
                        onClick={() => handleTypeChange(2)}
                        className="w-full"
                    >
                        Ordered
                    </Button>
                </div>
            </div>

            {/* 当选择 Bayer 抖动时显示矩阵大小选项 */}
            {options.ditherType === 0 && (
                <div>
                    <h3 className="font-medium mb-2">Bayer Matrix Size</h3>
                    <Select
                        value={String(options.bayerSize ?? 1)}
                        onValueChange={handleBayerSizeChange}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Bayer matrix size" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">2x2</SelectItem>
                            <SelectItem value="1">4x4</SelectItem>
                            <SelectItem value="2">8x8</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div>
                <div className="flex justify-between mb-2">
                    <h3 className="font-medium">Dither Amount</h3>
                    <span className="text-sm text-muted-foreground">
                        {Math.round((options.ditherAmount || 0) * 100)}%
                    </span>
                </div>
                <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    defaultValue={[options.ditherAmount || 0]}
                    onValueChange={handleAmountChange}
                />
            </div>
        </>
    );
}