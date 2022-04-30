import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import UpdateUsername from "./updateUsername";
import UpdateContactNum from "./updateContactNum";
import UpdateEmail from "./updateEmail";
import UpdatePassword from "./updatePassword";
import Profile from "./profile";

export default function ProfileStack() {
  const Stack = createNativeStackNavigator();

  return (
    <Stack.Navigator initialRouteName="Profile">
      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UpdateUsername"
        component={UpdateUsername}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UpdateContactNum"
        component={UpdateContactNum}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UpdateEmail"
        component={UpdateEmail}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UpdatePassword"
        component={UpdatePassword}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
