import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ReservedPS from "./reservedPS";
import Reservation from "./reservation";
import PsNavigation from "./psNavigation";

const Stack = createNativeStackNavigator();

export default function ReservationStack() {
  return (
    <Stack.Navigator initialRouteName="Reservation">
      <Stack.Screen
        name="Reservation"
        component={Reservation}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReservedPS"
        component={ReservedPS}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PSNavigation"
        component={PsNavigation}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
