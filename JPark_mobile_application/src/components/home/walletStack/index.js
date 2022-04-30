import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ReloadDialog from "./reloadDialog";
import Wallet from "./wallet";
const Stack = createNativeStackNavigator();

export default function WalletStack({ navigation }) {
  return (
    <Stack.Navigator initialRouteName="Wallet">
      <Stack.Screen
        name="Wallet"
        component={Wallet}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReloadDialog"
        component={ReloadDialog}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
