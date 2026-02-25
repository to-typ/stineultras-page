import { Event, Visibility } from "@/types/planner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Eye, EyeOff, Info, Trash2, Star, AlertTriangle } from "lucide-react";
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerHueSlider,
  ColorPickerTrigger,
} from "@/components/ui/color-picker";
import { COLORS } from "@/lib/planner-utils";
import { useState } from "react";

interface EventCardProps {
  event: Event;
  onToggle: () => void;
  onRemove: () => void;
  onToggleSub: (subName: string) => void;
  onShowInfo: () => void;
  onColorChange: (color: string) => void;
  onPrioritize: () => void;
  onPrioritizeSub: (subName: string) => void;
}

export function EventCard({
  event,
  onToggle,
  onRemove,
  onToggleSub,
  onShowInfo,
  onColorChange,
  onPrioritize,
  onPrioritizeSub,
}: EventCardProps) {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  // Prüfe ob alle Termine ausgeblendet sind
  const allHidden = event.events.every(
    (subEv) => subEv.active === Visibility.Hidden,
  );

  return (
    <Card
      className={`transition-all overflow-hidden group ${
        allHidden
          ? "border-2 border-orange-500 bg-orange-50/50 dark:bg-orange-950/20"
          : ""
      } ${
        event.active === Visibility.Hidden ? "opacity-50" : ""
      } w-full origin-right`}>
      <div className="flex relative">
        {/* Farbiger Streifen am linken Rand */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5 group-hover:w-3 transition-all cursor-pointer hover:opacity-80 z-10"
          style={{ backgroundColor: event.bgcolor }}
          onClick={() => setColorPickerOpen(true)}
          title="Farbe ändern"
        />
        <ColorPicker
          defaultFormat="hex"
          defaultValue={event.bgcolor}
          open={colorPickerOpen}
          onOpenChange={setColorPickerOpen}
          onValueChange={(value) => onColorChange(value)}>
          <ColorPickerTrigger asChild>
            <div className="display-none" />
          </ColorPickerTrigger>
          <ColorPickerContent>
            <ColorPickerArea />
            <div className="flex items-center gap-2">
              <ColorPickerHueSlider />
            </div>
            <div className="grid grid-cols-8 grid-rows-2 gap-2">
              {COLORS.map((color, index) => (
                <button
                  key={index}
                  type="button"
                  className="size-8 rounded border-2 border-transparent hover:border-border focus:border-ring focus:outline-none"
                  style={{ backgroundColor: color }}
                  onClick={() => onColorChange(color)}
                  aria-label={`Select color ${color}`}
                  title={`Farbe ${color} auswählen`}
                />
              ))}
            </div>
          </ColorPickerContent>
        </ColorPicker>
        <div className="flex-1">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle
                  className={`text-sm ${event.active === Visibility.Hidden ? "line-through" : ""}`}>
                  {event.name}
                </CardTitle>
                {allHidden && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Alle Termine ausgeblendet
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="h-7 w-7 p-0 hover:bg-accent"
                  title={
                    event.active === Visibility.Visible
                      ? "Ausblenden"
                      : "Einblenden"
                  }>
                  {event.active === Visibility.Visible ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPrioritize}
                  className={`h-7 w-7 p-0 hover:bg-accent ${
                    event.prioritized
                      ? "text-yellow-500"
                      : "hover:text-yellow-500"
                  }`}
                  title="Priorisieren">
                  <Star
                    className={`h-3.5 w-3.5 ${event.prioritized ? "fill-yellow-500" : ""}`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShowInfo}
                  className="h-7 w-7 p-0 hover:bg-accent"
                  title="Informationen anzeigen">
                  <Info className="h-3.5 w-3.5" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                  title="Veranstaltung entfernen">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {event.events.length > 1 && (
            <CardContent className="pt-0 pb-3">
              <Separator className="mb-3" />
              <Accordion type="single" collapsible>
                <AccordionItem value="sub-events" className="border-none">
                  <AccordionTrigger className="text-xs font-medium py-2 hover:no-underline">
                    {event.events.length} Gruppe
                    {event.events.length !== 1 ? "n" : ""}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1.5 pt-2">
                      {event.events.map((subEv) => (
                        <div
                          key={subEv.name}
                          className="flex items-center justify-between text-xs p-2 rounded-md hover:bg-accent/50 transition-colors">
                          <span
                            className={`flex-1 ${
                              subEv.active === Visibility.Hidden
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}>
                            {subEv.name}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onPrioritizeSub(subEv.name)}
                              className={`h-6 w-6 p-0 hover:bg-accent ${
                                subEv.prioritized
                                  ? "text-yellow-500"
                                  : "hover:text-yellow-500"
                              }`}
                              title="Priorisieren">
                              <Star
                                className={`h-3 w-3 ${subEv.prioritized ? "fill-yellow-500" : ""}`}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onToggleSub(subEv.name)}
                              className="h-6 w-6 p-0 hover:bg-accent"
                              title={
                                subEv.active === Visibility.Visible
                                  ? "Ausblenden"
                                  : "Einblenden"
                              }>
                              {subEv.active === Visibility.Visible ? (
                                <Eye className="h-3 w-3" />
                              ) : (
                                <EyeOff className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          )}
        </div>
      </div>
    </Card>
  );
}
