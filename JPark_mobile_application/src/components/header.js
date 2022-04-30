import React from "react";
import { Header } from "react-native-elements";

export function MyHeader(props) {
  return (
    <Header
      backgroundColor="white"
      leftComponent={{
        size: 22,
        icon: "arrow-back",
        iconStyle: { color: "black" },
        onPress: () => props.navigation.pop(),
      }}
      centerComponent={{
        text: props.title,
        style: { fontSize: 22, color: "black", fontFamily:"OpenSans-Bold" },
      }}
      elevated={true}
    />
  );
}
