import FilterPickerTray from "@/components/filter-picker-tray";

import {
  CARD_HEIGHT,
  CARD_WIDTH,
  PreviewCard,
  PreviewSection,
  PreviewSlide,
  ScreenContainer,
  ScreenFooter,
  ScreenHeader,
} from "@/components/screen-layout";

import { colors } from "@/styles/theme";
import { router } from "expo-router";

import PhotoboothStrip, {
  getStripNaturalSize,
} from "@/components/photobooth-strip";
import { useSession } from "../context/session-context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function layoutNameToType(name: string) {
  return name.split(" ")[1] as "A" | "B" | "C" | "D" | "E" | "F";
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FilterPreviewScreen() {
  const { session } = useSession();

  if (!session.layout || session.photos.length === 0) {
    return null;
  }

  const type = layoutNameToType(session.layout.name);

  const images = session.photos;

  const natural = getStripNaturalSize(type);
  const scaleRatio = Math.min(
    CARD_WIDTH / natural.width,
    CARD_HEIGHT / natural.height,
  );

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Choose a filter"
        subtitle="Preview your photo strip with a filter applied"
      />

      <PreviewSection>
        <PreviewSlide>
          <PreviewCard>
            <PhotoboothStrip
              type={type}
              images={images}
              background={session.background}
              scaleRatio={scaleRatio}
              filterMatrix={session.filterMatrix}
            />
          </PreviewCard>
        </PreviewSlide>
      </PreviewSection>

      <FilterPickerTray />

      <ScreenFooter
        label="Continue"
        onPress={() => router.back()}
        accentColor={colors.accent}
      />
    </ScreenContainer>
  );
}
