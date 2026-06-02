import React from "react";
import {
  FlexAlignType,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";

type Props = ViewProps & {
  children: React.ReactNode;
  align?: FlexAlignType;
  justify?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";
  gap?: number;
  wrap?: boolean;
};

/**
 * Right-to-left row layout primitive.
 *
 * Eliminates the repeated `flexDirection: "row-reverse"` + `alignItems: "center"`
 * pattern that appears in nearly every component.
 */
export function RowRTL({
  children,
  align = "center",
  justify,
  gap,
  wrap,
  style,
  ...rest
}: Props) {
  return (
    <View
      style={[
        styles.base,
        { alignItems: align },
        justify && { justifyContent: justify },
        gap !== undefined && { gap },
        wrap && { flexWrap: "wrap" },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row-reverse",
  } as ViewStyle,
});
