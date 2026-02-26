import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerHueSlider,
  ColorPickerTrigger,
} from "@/components/ui/color-picker";
import { COLORS } from "@/lib/planner-utils";

interface ColorPickerComponentProps {
    open: boolean;
    onClose: () => void;
    defaultColor: string;
    onColorChange: (color: string) => void;
}

export function ColorPickerComponent({
    open,
    onClose,
    defaultColor,
    onColorChange,
}: ColorPickerComponentProps) {
    return (
        <ColorPicker defaultFormat="hex" defaultValue={defaultColor} open={open} onOpenChange={onClose} onValueChange={(value) => onColorChange(value)}>
            <ColorPickerTrigger asChild>
            <div className="display-none"/>
            </ColorPickerTrigger>
            <ColorPickerContent style = {{ zIndex: 999 }}>
            <ColorPickerArea />
            <div className="flex items-center gap-2">
                <ColorPickerHueSlider />
            </div>
            <div className="flex grid grid-cols-8 grid-rows-2 gap-2">
                {COLORS.map((color, index) => (
                <button
                    key={index}
                    type="button"
                    className="size-8 rounded border-2 border-transparent hover:border-border focus:border-ring focus:outline-none"
                    style={{ backgroundColor: color }}
                    onClick={() => onColorChange(color)}
                    aria-label={`Select color ${color}`}
                />
                ))}
            </div>
            </ColorPickerContent>
        </ColorPicker>
    );
}
