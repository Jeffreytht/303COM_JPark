import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { THEME } from "jpark/src/theme";
import { View } from "react-native";
import { MyHeader } from "jpark/src/components/header";
import { StatusBar } from "react-native";
import ReservationList from "./reservationList";

const Tab = createMaterialTopTabNavigator();

export default function Reservation({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor:"white" }}>
      <StatusBar barStyle="dark-content"/>
      <MyHeader title="Reservations" navigation={navigation} />
      <Tab.Navigator
        initialRouteName="Active"
        screenOptions={{
          tabBarActiveTintColor: THEME.secondaryColor,
          tabBarIndicatorStyle: { backgroundColor: THEME.primaryColor },
          tabBarScrollEnabled: true,
          tabBarLabelStyle: {
            fontFamily: "OpenSans-Regular",

          },
      }}>
        <Tab.Screen
          name="Active"
          component={ReservationList}
          initialParams={{ type: "Active" }}
        />
        <Tab.Screen
          name="Completed"
          component={ReservationList}
          initialParams={{ type: "Completed" }}
        />
        <Tab.Screen
          name="Cancelled"
          component={ReservationList}
          initialParams={{ type: "Cancelled" }}
        />
        <Tab.Screen
          name="Expired"
          component={ReservationList}
          initialParams={{ type: "Expired" }}
        />
      </Tab.Navigator>
    </View>
  );
}
