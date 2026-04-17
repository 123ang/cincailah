import React from "react";
import { Pressable, Text, Linking, type PressableProps } from "react-native";

type Props = PressableProps & {
  href: string;
  children: React.ReactNode;
};

export function ExternalLink({ href, children, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      onPress={async (event) => {
        rest.onPress?.(event);
        if (href) await Linking.openURL(href);
      }}
    >
      <Text>{children}</Text>
    </Pressable>
  );
}
