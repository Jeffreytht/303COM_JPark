import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  FlatList,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as SecureStore from "expo-secure-store";
import { Card } from "react-native-elements";
import { SERVER_IP } from "jpark/src/config";
import { MyHeader } from "jpark/src/components/header";
import { isObjEmpty } from "jpark/src/components/utility";
import { THEME } from "jpark/src/theme";
import { OKUImg, NearestDistanceImg } from "jpark/src/image";
import { Button, DataTable } from "react-native-paper";
import { StatusBar } from "react-native";

export default function FloorSelector({ navigation }) {
  const [floors, setFloors] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  async function handleClosestEntrance() {
    const accessToken = await SecureStore.getItemAsync("accessToken");
    if (!accessToken) return;

    const res = await fetch(
      `http://${SERVER_IP}/api/user/parking-space/nearest-to-entrance`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (res.status === 200) {
      const ps = await res.json();
      if (isObjEmpty(ps)) {
        return alert("No available parking space");
      }
      navigation.navigate("ParkingSpace", { parkingSpaceId: ps._id });
    }
  }

  async function handleOKU() {
    const accessToken = await SecureStore.getItemAsync("accessToken");
    if (!accessToken) return;

    const res = await fetch(`http://${SERVER_IP}/api/user/parking-space/oku`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.status === 200) {
      const ps = await res.json();
      if (isObjEmpty(ps)) {
        return alert("No available parking space");
      }
      navigation.navigate("ParkingSpace", { parkingSpaceId: ps._id });
    }
  }

  async function initFloors() {
    const accessToken = await SecureStore.getItemAsync("accessToken");
    const res = await fetch(`http://${SERVER_IP}/api/user/parking-lot`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const parkingLot = await res.json();
    const floorObj = [];
    for (const floor of parkingLot.floors) {
      let nEmptyParkingSpaces = 0;
      for (const parkingSpace of floor.parkingSpaces) {
        if (parkingSpace.state === "empty") {
          nEmptyParkingSpaces++;
        }
      }
      floorObj.push({
        ...floor,
        emptyParkingSpaces: nEmptyParkingSpaces,
      });
    }
    setFloors(floorObj);
  }

  useEffect(() => {
    initFloors();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await initFloors();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <MyHeader title="Reserve" navigation={navigation} />
      <View style={styles.selectFloorContainer}>
        <FlatList
          scrollEnabled={false}
          keyExtractor={(item) => item._id.toString()}
          data={floors}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          renderItem={({ item }) => (
            <TouchableNativeFeedback
              onPress={(_) => {
                navigation.navigate("ParkingLotMap", { floorId: item._id });
              }}
              background={
                Platform.OS === "android"
                  ? TouchableNativeFeedback.SelectableBackground()
                  : ""
              }
            >
              <Card containerStyle={styles.floorCardContainer}>
                <View style={styles.floorCardContentContainer}>
                  <Text style={styles.floorName}>{item.name}</Text>
                  <Text style={styles.psInfo}>
                    {item.emptyParkingSpaces} parking spaces available
                  </Text>
                  <View
                    style={{
                      backgroundColor: "white",
                      borderRadius: 20,
                    }}
                  >
                    <Icon
                      name="arrow-right"
                      type="material"
                      color={THEME.primaryColor}
                      size={18}
                    />
                  </View>
                </View>
              </Card>
            </TouchableNativeFeedback>
          )}
        />
      </View>
      <View style={{marginTop: 4, paddingHorizontal: 16, backgroundColor: "white"}}>
          <Text style={{fontFamily:"OpenSans-Bold", fontSize: 18, marginVertical: 16}}>Quick Reserve</Text>
          <TouchableNativeFeedback onPress={async (_) => {await handleOKU();}} >
            <View style={styles.cardContainer}>
              <Image style={styles.logo} source={OKUImg} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Disabilities</Text>
                <Text style={styles.cardContent}>
                  Parking spaces for a person who uses a wheelchair or other
                  assistive devices.
                </Text>
              </View>
            </View>
          </TouchableNativeFeedback>
          <TouchableNativeFeedback onPress={async (_) => {await handleClosestEntrance();}}>
            <View style={styles.cardContainer}>
              <Image style={styles.logo} source={NearestDistanceImg} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Closest entrance</Text>
                <Text style={styles.cardContent}>
                  Parking spaces that are closest to the entrance.
                </Text>
              </View>
            </View>
          </TouchableNativeFeedback>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  floorCardContainer: {
    marginVertical: 0,
    borderWidth: 0,
    elevation: 0,
  },
  floorCardContentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  floorName: { fontSize: 22, color: THEME.primaryColor, fontFamily:"OpenSans-Bold" },
  psInfo: { color:"black", fontSize: 16, fontFamily:"OpenSans-Regualr", textAlign:"right", flex:1, marginRight:16 },
  selectFloorContainer: {
    backgroundColor: "white",
    marginBottom: 8,
  },
  cardContainer: {
    backgroundColor: "white",
    flexDirection: "row",
    marginBottom: 16,
    padding: 8 ,
    elevation: 2,
  },
  logo: {
    height: 72,
    width: 72,
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily:"OpenSans-Bold",
    color: "black",
  },
  cardContent: {
    fontSize:14,
    fontFamily:"OpenSans-Regular"
  },
});
