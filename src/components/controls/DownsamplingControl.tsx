import { useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DitherOptions } from '@/lib/types';
import { Separator } from '../ui/separator';
import { CardDescription } from '../ui/card';

interface DownsamplingControlProps {
    options: DitherOptions;
    onOptionsChange: (options: DitherOptions) => void;
}

export function DownsamplingControl({ options, onOptionsChange }: DownsamplingControlProps) {
    const handleDownSamplingChange = useCallback((value: string) => {
        onOptionsChange({
            ...options,
            downSampling: Number.parseInt(value)
        });
    }, [options, onOptionsChange]);

    return (
        <div>
            <Separator className="my-4" />
            <h3 className="font-medium mb-2">Downsampling (for high-res images)</h3>
            <CardDescription className=' mb-4'>Reduces image size before processing to improve performance and dither effect visibility</CardDescription>
            <Select
                value={String(options.downSampling ?? 1)}
                onValueChange={handleDownSamplingChange}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Select downsampling factor" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1">None</SelectItem>
                    <SelectItem value="2">1/2 (50%)</SelectItem>
                    <SelectItem value="4">1/4 (25%)</SelectItem>
                    <SelectItem value="8">1/8 (12.5%)</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}