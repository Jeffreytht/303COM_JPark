import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Button } from "react-native-elements";
import { THEME } from "jpark/src/theme";
import { ReservationDoneIcon } from "jpark/src//image";

export default function ReservationDialog({ navigation }) {
  function handlePressDone() {
    navigation.popToTop();
  }

  return (
    <View style={styles.container}>
      <View style={{ alignItems: "center" }}>
        <Image style={styles.icon} source={ReservationDoneIcon} />
        <View style={styles.divider}></View>
        <Text style={styles.title}>Reserve </Text>
        <Text style={styles.title}>successfully </Text>
        <View style={styles.divider}></View>
        <Text style={styles.content}>
          You can find your reservation in the "Reservation" page.
        </Text>
      </View>

      <Button
        title="Done"
        buttonStyle={{
          backgroundColor: THEME.primaryColor,
          width: 150,
        }}
        titleStyle={{ textAlign: "center", fontFamily:"OpenSans-Bold" }}
        onPress={handlePressDone}
      ></Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-around",
    alignItems: "center",
    padding: 32,
  },
  title: {
    fontSize: 20,
    textAlign: "center",
    color: THEME.primaryColor,
    fontFamily:"OpenSans-Bold"
  },
  content: {
    fontSize: 14,
    textAlign: "center",
    color: THEME.secondaryColor,
    fontFamily:"OpenSans-Regular"
  },
  icon: {
    height: 100,
    width: 100,
  },
  divider: {
    marginVertical: 8,
  },
  sectionDivider: {
    marginVertical: 24,
  },
});
