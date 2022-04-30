import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FloorSelector from "./floorSelector";
import PLMap from "./plMap";
import psReservation from "./psReservation";
import reservationDialog from "./reservationDialog";

const Stack = createNativeStackNavigator();

export default function ParkingLotStack() {
  return (
    <Stack.Navigator initialRouteName="FloorSelector">
      <Stack.Screen
        name="FloorSelector"
        component={FloorSelector}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ParkingLotMap"
        component={PLMap}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ParkingSpace"
        component={psReservation}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReservationDialog"
        component={reservationDialog}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
