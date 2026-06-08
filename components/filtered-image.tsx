import {
    Canvas,
    ColorMatrix,
    Image,
    useImage,
} from "@shopify/react-native-skia";

type Props = {
  uri: string;
  matrix: number[];
  width: number;
  height: number;
};

export default function FilteredImage({ uri, matrix, width, height }: Props) {
  const image = useImage(uri);

  if (!image) {
    return null;
  }

  return (
    <Canvas style={{ width, height }}>
      <Image
        image={image}
        x={0}
        y={0}
        width={width}
        height={height}
        fit="cover"
      >
        <ColorMatrix matrix={matrix} />
      </Image>
    </Canvas>
  );
}
