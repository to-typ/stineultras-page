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
import { Eye, EyeOff, Trash2 } from "lucide-react";

interface EventCardProps {
  event: Event;
  onToggle: () => void;
  onRemove: () => void;
  onToggleSub: (subName: string) => void;
}

export function EventCard({
  event,
  onToggle,
  onRemove,
  onToggleSub,
}: EventCardProps) {
  return (
    <Card
      className={`transition-all overflow-hidden ${event.active === Visibility.Hidden ? "opacity-50" : ""}`}>
      <div className="flex">
        {/* Farbiger Streifen am linken Rand */}
        <div
          className="w-1.5 flex-shrink-0"
          style={{ backgroundColor: event.bgcolor }}
        />
        <div className="flex-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle
                  className={`text-sm ${event.active === Visibility.Hidden ? "line-through" : ""}`}>
                  {event.name}
                </CardTitle>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="h-7 w-7 p-0 hover:bg-accent">
                  {event.active === Visibility.Visible ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {event.events.length > 1 && (
            <CardContent className="pt-0">
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleSub(subEv.name)}
                            className="h-6 w-6 p-0 hover:bg-accent">
                            {subEv.active === Visibility.Visible ? (
                              <Eye className="h-3 w-3" />
                            ) : (
                              <EyeOff className="h-3 w-3" />
                            )}
                          </Button>
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
