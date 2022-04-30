import React, { useEffect, useState } from "react";
import MapView, { PROVIDER_GOOGLE, Overlay, Marker } from "react-native-maps";
import * as SecureStore from "expo-secure-store";
import { View, StyleSheet, Text, Dimensions, Linking } from "react-native";
import { Button} from "react-native-elements"
import { Dialog, Paragraph } from "react-native-paper";
import { THEME } from "jpark/src/theme";
import { SERVER_IP } from "jpark/src/config";
import { ParkingMarkerIcon, OKUIcon } from "jpark/src/image";
import { MyHeader } from "jpark/src/components/header";
import { formatAmPm, isObjEmpty } from "jpark/src/components/utility";
import SitumPlugin from "react-native-situm-plugin";

export default function ReservedPS({ route, navigation }) {
  const { parkingSpaceId, reservationId } = route.params;
  const [location, setLocation] = useState({});
  const [psInfo, setPsInfo] = useState({});
  const [reservationInfo, setReservationInfo] = useState({});
  const [building, setBuilding] = useState({})

  const [showConfirmArriveDialog, setShowConfirmArriveDialog] = useState(false);
  const [showConfirmCancelDialog, setShowConfirmCancelDialog] = useState(false);

  useEffect(() => {
    async function initLocation() {
      const accessToken = await SecureStore.getItemAsync("accessToken");
      if (!accessToken) return;

      const res = await fetch(
        `http://${SERVER_IP}/api/user/parking-lot/location`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      setLocation(await res.json());
    }

    const getBuildings = () => {
      SitumPlugin.fetchBuildings(
        (buildings) => {
          setBuilding(buildings[0]);
        },
        (error) => {
          console.log(error)
        }
      );
    };
  

    async function initPSInfo() {
      const accessToken = await SecureStore.getItemAsync("accessToken");
      if (!accessToken) return;

      const res = await fetch(
        `http://${SERVER_IP}/api/user/parking-space?parkingSpaceId=${parkingSpaceId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      setPsInfo(await res.json());
    }

    async function initReservationInfo() {
      const accessToken = await SecureStore.getItemAsync("accessToken");
      if (!accessToken) return;

      const res = await fetch(
        `http://${SERVER_IP}/api/user/reservations/info?reservationId=${reservationId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      setReservationInfo(await res.json());
    }

    initLocation();
    initPSInfo();
    initReservationInfo();
    getBuildings();
    const handle = setInterval(() => {}, 1000);

    return () => {
      clearInterval(handle);
    };
  }, []);

  async function handleCancelReservation() {
    const accessToken = await SecureStore.getItemAsync("accessToken");
    if (!accessToken) return;

    const res = await fetch(
      `http://${SERVER_IP}/api/user/parking-space/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parkingSpaceId: psInfo._id,
        }),
      }
    );
  }

  async function handleUnlockPB() {
    const accessToken = await SecureStore.getItemAsync("accessToken");
    if (!accessToken) return;

    await fetch(`http://${SERVER_IP}/api/user/parking-space/unlock`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parkingSpaceId: psInfo._id,
      }),
    });
  }

  function getBound(corner) {
    const { topRight, bottomLeft } = corner;

    return [
      [topRight.lat, bottomLeft.lng],
      [bottomLeft.lat, topRight.lng],
    ];
  }

  function getMapRegion(location) {
    return {
      latitude: location.lat,
      longitude: location.lng,
      latitudeDelta: 0.00075,
      longitudeDelta: 0.00075,
    };
  }

  return (
    <>
      <View style={{ flex: 1 }}>
        <MyHeader title="Reservation" navigation={navigation} />
        {isObjEmpty(psInfo) ? (
          <></>
        ) : (
          <View style={styles.container}>
            <View style={styles.mapContainer}>
              {isObjEmpty(location) || isObjEmpty(building)? (
                <></>
              ) : (
                <MapView
                  style={styles.map}
                  region={getMapRegion(psInfo.coordinate)}
                  pitchEnabled={false}
                  rotateEnabled={false}
                  zoomEnabled={false}
                  scrollEnabled={false}
                  provider={PROVIDER_GOOGLE}
                  toolbarEnabled={false}
                >
                  <Overlay
                    image={psInfo.floorMap}
                    bounds={[
                      [
                        building.bounds.southWest.latitude,
                        building.bounds.southWest.longitude,
                      ],
                      [
                        building.bounds.northEast.latitude,
                        building.bounds.northEast.longitude,
                      ],
                    ]}
                    zIndex={1000}
                    location={[location.latitude, location.longitude]}
                    bearing={(location.rotation * 180) / Math.PI}
                    anchor={[0.5, 0.5]}
                    width={location.dimension.width}
                    height={location.dimension.height}
                  />
                  <Marker
                    key={reservationInfo.parkingSpace}
                    coordinate={{
                      latitude: psInfo.coordinate.lat,
                      longitude: psInfo.coordinate.lng,
                    }}
                    pinColor="cyan"
                    icon={psInfo.isOKU ? OKUIcon : ParkingMarkerIcon}
                  ></Marker>
                </MapView>
              )}
            </View>
            <View style={styles.psContainer}>
              <Text style={styles.psName}>{psInfo.name}</Text>
            </View>
            <View style={styles.mainContainer}>
              <View style={{ flex: 1 }}>
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.data}>Floor: {psInfo.floorName}</Text>
                </View>
                {isObjEmpty(reservationInfo) ? (
                  <></>
                ) : (
                  <Timer
                    reservationInfo={reservationInfo}
                    navigation={navigation}
                  />
                )}
                <View>
                  <Button
                    type="clear"
                    title={"Cancel reservation"}
                    titleStyle={{ color: "#dc3545" , fontFamily:"OpenSans-Bold"}}
                    onPress={async () => {
                      setShowConfirmCancelDialog(true);
                    }}
                  />
                </View>
                <View>
                  <Text style={{fontFamily:"OpenSans-Regular"}}></Text>
                </View>
              </View>
              <View style={styles.buttonContainer}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Button
                  containerViewStyle={{width: '100%', marginLeft: 0}}
                    buttonStyle={{backgroundColor: "#1e81b0" }}
                    titleStyle={{fontFamily:"OpenSans-Bold"}}
                    onPress={() => {
                      navigation.navigate("PSNavigation", {
                        psInfo: psInfo,
                        location: location,
                      });
                    }}
                    title={"Navigate"}
                  />
                </View>
                <View style={{flex: 1, marginLeft: 4}}>
                  <Button
                    buttonStyle={{backgroundColor: THEME.primaryColor }}
                    titleStyle={{fontFamily:"OpenSans-Bold"}}
                    onPress={async () => {
                      setShowConfirmArriveDialog(true);
                    }}
                    title={"Arrived"}
                  />
                </View>
              </View>
              <View style={{marginHorizontal:16, marginBottom: 16}}>
                  <Text style={{fontFamily:"OpenSans-Regular", textAlign:"center", color:"#1e81b0"}} onPress={()=>{
                    Linking.openURL(`tel:04-6310138`);
                  }}>Having trouble? Kindly contact 04-6310138</Text>
                </View>
            </View>
          </View>
        )}
      </View>
      <Dialog visible={showConfirmArriveDialog}>
        <Dialog.Title style={{fontFamily:"OpenSans-Bold"}}>Confirmation</Dialog.Title>
        <Dialog.Content>
          <Paragraph style={{fontFamily:"OpenSans-Regular"}}>Unlock your parking space now?</Paragraph>
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            labelStyle={{ color: THEME.primaryColor, fontFamily:"OpenSans-Bold" }}
            onPress={async () => {
              await handleUnlockPB();
              setShowConfirmArriveDialog(false);
              navigation.pop();
            }}
          >
            Yes
          </Button>
          <Button
            labelStyle={{ color: THEME.primaryColor , fontFamily:"OpenSans-Bold"}}
            onPress={() => setShowConfirmArriveDialog(false)}
          >
            No
          </Button>
        </Dialog.Actions>
      </Dialog>
      <Dialog visible={showConfirmCancelDialog}>
        <Dialog.Title>Confirmation</Dialog.Title>
        <Dialog.Content>
          <Paragraph>
            Reservation cancellation is not reversible and refundable. Are you
            sure you want to cancel the reservation?
          </Paragraph>
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            labelStyle={{ color: THEME.primaryColor }}
            onPress={async () => {
              await handleCancelReservation();
              setShowConfirmCancelDialog(false);
              navigation.pop();
            }}
          >
            Yes
          </Button>
          <Button
            labelStyle={{ color: THEME.primaryColor }}
            onPress={() => setShowConfirmCancelDialog(false)}
          >
            No
          </Button>
        </Dialog.Actions>
      </Dialog>
    </>
  );
}

function Timer(props) {
  const [timer, setTimer] = useState("");

  function getEndTime(reservationInfo) {
    const endTime =
      new Date(reservationInfo.dateTime).getTime() +
      reservationInfo.duration * 60 * 60 * 1000;
    return new Date(endTime);
  }

  function getEndTimeStr(reservationInfo) {
    return formatAmPm(getEndTime(reservationInfo));
  }

  function setRemainingTime() {
    const time = getEndTime(props.reservationInfo) - new Date();
    if (time < 0) {
      setTimer("Expired");
      props.navigation.pop();
      return;
    }

    let sec = time / 1000;
    let min = sec / 60;
    let hour = min / 60;
    min %= 60;
    sec %= 60;
    setTimer(
      `${Math.floor(hour)} hr ${Math.floor(min)} min ${Math.floor(sec)} sec`
    );
  }

  useEffect(() => {
    const handle = setInterval(setRemainingTime, 1000);

    return () => {
      clearInterval(handle);
    };
  }, []);
  return (
    <>
      <View style={styles.timerContainer}>
        <View>
          <Text style={styles.timer}>{timer}</Text>
          <Text style={styles.timerRemain}>remaining</Text>
        </View>
      </View>
      <View style={{ marginBottom: 32 }}>
        <Text style={styles.data}>
          Ends at {getEndTimeStr(props.reservationInfo)}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white", alignItems: "center" },
  mapContainer: {
    flex: 1,
    flexDirection: "row",
    borderBottomColor: "lightgrey",
    borderBottomWidth: 2,
  },
  map: {
    flex: 1,
  },
  data: {
    color: THEME.secondaryColor,
    textAlign: "center",
    fontSize: 18,
    fontFamily:"OpenSans-Bold"
  },
  psContainer: {
    backgroundColor: "white",
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: -50,
    borderColor: "lightgrey",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  psName: {
    fontSize: 36,
    fontFamily:"OpenSans-Bold",
    textAlign: "center",
    color: THEME.primaryColor,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "white",
    width: "100%",
  },
  timerContainer: {
    marginBottom: 16,
    justifyContent: "center",
    flexDirection: "row",
  },
  timer: {
    fontSize: 24,
    color: THEME.primaryColor,
    fontFamily:"OpenSans-Bold",
    textAlign: "center",
  },
  timerRemain: {
    fontSize: 18,
    color: THEME.primaryColor,
    textAlign: "right",
    fontFamily:"OpenSans-Regular"
  },
  buttonContainer: {
    marginHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
  },
});
