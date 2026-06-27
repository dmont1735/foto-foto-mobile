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
  LayoutType,
} from "@/components/photobooth-strip";
import { useSession } from "../context/session-context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function layoutNameToType(name: string): LayoutType {
  return name.split(" ")[1] as LayoutType;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FilterPreviewScreen() {
  const { session } = useSession();

  // Derive safely before any guard — no hooks in this screen beyond useSession,
  // but the pattern is kept consistent so future hooks are safe to add.
  const type = session.layout ? layoutNameToType(session.layout.name) : null;
  const natural = type ? getStripNaturalSize(type) : { width: 1, height: 1 };
  const scaleRatio = type
    ? Math.min(CARD_WIDTH / natural.width, CARD_HEIGHT / natural.height)
    : 1;

  // ── Guard — after all hooks ──────────────────────────────────────────────

  if (!session.layout || !type || session.photos.length === 0) return null;

  // ── Render ──────────────────────────────────────────────────────────────────

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
              images={session.photos}
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
        onPress={() => router.push("/sticker-selection")}
        accentColor={colors.accent}
      />
    </ScreenContainer>
  );
}
