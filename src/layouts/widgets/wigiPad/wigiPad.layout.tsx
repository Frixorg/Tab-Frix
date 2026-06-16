import { WidgetContainer } from "../widget-container";
import { ClockDisplay } from "./clock-display/clock-display";
import { DateDisplay } from "./date-display/date.display";
import { useGetNotifications } from "@/services/hooks/extension/getNotifications.hook";
import { RenderWigiPadItem } from "./info-panel/components/ann-item";
import { Pet } from "@/layouts/widgetify-card/pets/pet";
import { PetProvider } from "@/layouts/widgetify-card/pets/pet.context";

export function WigiPadWidget() {
  const { data: fetchedData } = useGetNotifications();

  return (
    <WidgetContainer className="flex flex-col !p-1.5 !pb-0">
      <div className="relative grid justify-between grid-cols-2 rounded-2xl">
        <DateDisplay />
        <ClockDisplay />
      </div>
      <div className="flex-1 min-h-0 flex flex-col px-1 mt-1">
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto gap-y-0.5 scrollbar-none pb-4">
          {fetchedData?.wigiPad.map((notification, index) => (
            <RenderWigiPadItem key={index} notification={notification} />
          ))}
        </div>
      </div>
      <div className="relative w-full h-12 shrink-0 overflow-hidden">
        <PetProvider>
          <Pet />
        </PetProvider>
      </div>
    </WidgetContainer>
  );
}
