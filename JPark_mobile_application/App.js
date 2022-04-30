import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { initSitumSdk } from "./src/situm";
import { AppContext } from "./src/global";
import LoginScreen from "./src/components/login";
import RegisterScreen from "./src/components/register";
import FirstScreen from "./src/components/firstScreen";
import ProfileStack from "./src/components/home/profileStack";
// import ParkingLotStack from "./src/components/home/parkingLotStack";
import WalletStack from "./src/components/home/walletStack";
// import ReservationStack from "./src/components/home/reservationStack";
import TransactionHistory from "./src/components/home/transactionHistory";
import FloorSelector from "./src/components/home/parkingLotStack/floorSelector";
import PLMap from "./src/components/home/parkingLotStack/plMap";
import psReservation from "./src/components/home/parkingLotStack/psReservation";
import reservationDialog from "./src/components/home/parkingLotStack/reservationDialog";
import RouteSimulation from "./src/components/home/reservationStack/routeSimulation";
import ReservedPS from "./src/components/home/reservationStack/reservedPS";
import Reservation from "./src/components/home/reservationStack/reservation";
import PsNavigation from "./src/components/home/reservationStack/psNavigation";
import Home from "./src/components/home";


const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    initSitumSdk();
  }, []);

  const [context, setContext] = useState({});

  return (
    <AppContext.Provider value={[context, setContext]}>
      <View style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="FirstScreen">
            <Stack.Screen
              name="FirstScreen"
              component={FirstScreen}
              options={{headerShown:false}}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{headerShown: false,}}
            />
            <Stack.Screen
              name="Home"
              component={Home}
              options={{headerShown: false,}}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{headerShown: false,}}
            />
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
            <Stack.Screen
              name="ProfileStack"
              component={ProfileStack}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="WalletStack"
              component={WalletStack}
              options={{ headerShown: false }}
            />
            {/* <Stack.Screen
              name="ReservationStack"
              // component={RouteSimulation}
              component={ReservationStack}
              options={{ headerShown: false }}
            /> */}
            <Stack.Screen
              name="TransactionHistory"
              component={TransactionHistory}
              options={{ headerShown: false }}
            />
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
        </NavigationContainer>
      </View>
    </AppContext.Provider>
  );
}
