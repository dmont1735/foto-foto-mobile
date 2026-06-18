import BackgroundImageTray, {
  BackgroundImageOption,
} from "@/components/background-picker-tray";
import PhotoboothStrip, {
  getStripNaturalSize,
  LayoutType,
} from "@/components/photobooth-strip";
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
import { generateBackgroundPngUri } from "@/utils/generate-background-png";
import { StripBackground } from "@/utils/strip-layouts";
import { useBackgroundImagePicker } from "@/utils/use-background-image-picker";
import { router } from "expo-router";
import { useEffect } from "react";
import { useSession } from "../context/session-context";

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DesignSelectionScreen() {
  const { session, setBackground } = useSession();
  const { layout, photos } = session;

  const imagePicker = useBackgroundImagePicker();

  if (!layout) return null;

  const type = layoutNameToType(layout.name);
  const images = photos;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleImageSelect = (opt: BackgroundImageOption) => {
    imagePicker.selectImage(opt);
    setBackground(backgroundFromOption(opt));
  };

  const handleRequestCustomImage = () => {
    imagePicker.requestCustomImage((source) => {
      const newOpt = imagePicker.addCustomImage(source);
      setBackground(backgroundFromOption(newOpt));
    });
  };

  const natural = getStripNaturalSize(type);
  const scaleRatio = Math.min(
    CARD_WIDTH / natural.width,
    CARD_HEIGHT / natural.height,
  );

  useEffect(() => {
    const bg = session.background;
    if (bg.type === "svg" && !bg.generatePngUri) {
      setBackground({
        type: "svg",
        component: bg.component,
        color: bg.color,
        generatePngUri: () =>
          generateBackgroundPngUri(
            bg.component,
            bg.color,
            natural.width,
            natural.height,
          ),
      });
    }
  }, [type]);
  // ─── Helpers ──────────────────────────────────────────────────────────────────

  function layoutNameToType(name: string): LayoutType {
    return name.split(" ")[1] as LayoutType;
  }

  function backgroundFromOption(opt: BackgroundImageOption): StripBackground {
    if (opt.type === "svg") {
      return {
        type: "svg",
        component: opt.component,
        color: opt.color,
        generatePngUri: () =>
          generateBackgroundPngUri(
            opt.component,
            opt.color,
            natural.width,
            natural.height,
          ),
      };
    }
    return { type: "image", source: opt.source };
  }
  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Choose a design"
        subtitle="Pick background that sets the mood."
      />

      <PreviewSection>
        <PreviewSlide>
          <PreviewCard>
            <PhotoboothStrip
              type={type}
              images={images}
              background={session.background}
              scaleRatio={scaleRatio}
            />
          </PreviewCard>
        </PreviewSlide>
      </PreviewSection>

      <BackgroundImageTray
        presets={imagePicker.presets}
        customImages={imagePicker.customImages}
        onRequestCustomImage={handleRequestCustomImage}
        color={colors.defaultBackgroundColor}
        accentColor={colors.accent}
        activeId={null}
        onSelect={handleImageSelect}
      />

      <ScreenFooter
        label="Use this design"
        onPress={() => router.push("/color-selection")}
        accentColor={colors.accent}
      />
    </ScreenContainer>
  );
}
