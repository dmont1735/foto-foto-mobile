import InstructionsScreen, {
  InstructionStep,
} from "@/components/instructionsScreen";
import { globalStyles } from "@/styles/global";
import { router } from "expo-router";
import { Image, View } from "react-native";

const STEPS: InstructionStep[] = [
  {
    id: "step-1",
    title: "How to Use Foto-Foto",
    description:
      "Follow these simple steps to create your very own custom photobooth strip",
    accentColor: "#6C63FF",
    illustration: (
      <Image
        source={require("../assets/previews/start-preview.png")}
        style={{ width: "100%", height: "100%", borderRadius: 32 }}
        resizeMode="cover"
      />
    ),
  },
  {
    id: "step-2",
    title: "Select a Layout",
    description: "From our selection of options, or create your own!",
    accentColor: "#FF6B6B",
    illustration: (
      <Image
        source={require("../assets/previews/step1.png")}
        style={{ width: "100%", height: "100%", borderRadius: 32 }}
        resizeMode="cover"
      />
    ),
  },
  {
    id: "step-3",
    title: "Choose a Background Design",
    description: "You may select any color or image background",
    accentColor: "#43D9AD",
    illustration: (
      <Image
        source={require("../assets/previews/step2.png")}
        style={{ width: "100%", height: "100%", borderRadius: 32 }}
        resizeMode="cover"
      />
    ),
  },
  {
    id: "step-4",
    title: "Take or Upload your Pictures",
    description:
      "Use your device camera to capture your moments, or upload from your camera roll",
    accentColor: "#43D9AD",
    illustration: (
      <Image
        source={require("../assets/previews/step3.png")}
        style={{ width: "100%", height: "100%", borderRadius: 32 }}
        resizeMode="cover"
      />
    ),
  },
  {
    id: "step-5",
    title: "Edit your Photo Strip",
    description:
      "Customize your creation with a selection of filters and stickers",
    accentColor: "#43D9AD",
    illustration: (
      <Image
        source={require("../assets/previews/step4.png")}
        style={{ width: "100%", height: "100%", borderRadius: 32 }}
        resizeMode="cover"
      />
    ),
  },
  {
    id: "step-6",
    title: "Save and Share your Creation!",
    description:
      "Once done, you may save your customized Strip and share it with your friends",
    accentColor: "#FFA940",
    illustration: (
      <Image
        source={require("../assets/previews/step4.png")}
        style={{ width: "100%", height: "100%", borderRadius: 32 }}
        resizeMode="cover"
      />
    ),
  },
  {
    id: "step-7",
    title: "You're all set!",
    description:
      "Now you're ready to use Foto-Foto! Let's create some memories!",
    accentColor: "#FFA940",
  },
];

export default function Instructions() {
  return (
    <View style={globalStyles.container}>
      <InstructionsScreen
        steps={STEPS}
        onFinish={() => router.push("/layout-selection")}
        onSkip={() => router.push("/layout-selection")}
        finishLabel="Get Started"
        skipLabel="Skip"
      />
    </View>
  );
}
