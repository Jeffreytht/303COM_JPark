import React, { useState, useEffect, useContext, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Dialog, Paragraph, Button } from "react-native-paper";
import { THEME } from "jpark/src/theme";
import * as SecureStore from "expo-secure-store";
import { AppContext } from "jpark/src/global";
import { SERVER_IP } from "jpark/src/config";
import { MyHeader } from "jpark/src/components/header";
import { formatAmPm, isObjEmpty } from "jpark/src/components/utility";
import MapView, { PROVIDER_GOOGLE, Overlay, Marker } from "react-native-maps";
import { ParkingMarkerIcon, OKUIcon } from "jpark/src/image";
import SitumPlugin from "react-native-situm-plugin";

export default function PsReservation({ route, navigation }) {
  const { parkingSpaceId } = route.params;

  const [psInfo, setPsInfo] = useState({});
  const [location, setLocation] = useState({});
  const [setting, _setSetting] = useState({});
  const [duration, _setDuration] = useState(1);
  const [building, setBuilding] = useState({});
  const [reservation, setReservationTime] = useState({
    startTime: new Date(),
    endTime: new Date(Date.now() + duration * 60 * 60 * 1000),
  });
  const [insBalDialogVisible, setInsBalDialogVisible] = useState(false);
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [context, setContext] = useContext(AppContext);

  const durationRef = useRef(duration);
  const settingRef = useRef(setting);

  function setDuration(duration) {
    durationRef.current = duration;
    _setDuration(duration);
  }
  function setSetting(setting) {
    settingRef.current = setting;
    _setSetting(setting);
  }

  function showInsBalDialog() {
    setInsBalDialogVisible(true);
  }

  function hideInsBalDialog() {
    setInsBalDialogVisible(false);
  }

  function showConfirmDialog() {
    setConfirmDialogVisible(true);
  }

  function hideConfirmDialog() {
    setConfirmDialogVisible(false);
  }

  function getBound(corner) {
    const { topRight, bottomLeft } = corner;
    return [
      [topRight.lat, bottomLeft.lng],
      [bottomLeft.lat, topRight.lng],
    ];
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

  function getMapRegion(location) {
    return {
      latitude: location.lat,
      longitude: location.lng,
      latitudeDelta: 0.00075,
      longitudeDelta: 0.00075,
    };
  }

  useEffect(() => {
    async function initParkingSpaceInfo() {
      const accessToken = await SecureStore.getItemAsync("accessToken");
      if (!accessToken) return;

      const res = await fetch(
        `http://${SERVER_IP}/api/user/parking-space?parkingSpaceId=${parkingSpaceId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (res.status === 200) {
        setPsInfo(await res.json());
      }
    }

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

    async function initSetting() {
      const accessToken = await SecureStore.getItemAsync("accessToken");
      if (!accessToken) return;

      const res = await fetch(`http://${SERVER_IP}/api/user/setting/`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.status === 200) {
        setSetting(await res.json());
      }
    }

    initParkingSpaceInfo();
    initLocation();
    initSetting();
    getBuildings();

    const reservationTimeInterval = setInterval(() => {
      const startTime = Date.now();
      const endTime = startTime + durationRef.current * 60 * 60 * 1000;

      const date = new Date();
      const day = date.getDay();

      const setting = settingRef.current;
      if (!isObjEmpty(setting)) {
        const operatingHour = setting.operatingHours[day];

        if (operatingHour.closed === true) {
          alert("Parking lot is closed");
          return navigation.pop();
        }

        if (operatingHour.open24Hour === true) {
          return setReservationTime({
            startTime: new Date(startTime),
            endTime: new Date(endTime),
          });
        }

        let [sHour, sMin] = operatingHour.startTime.split(":").map(Number);
        let [eHour, eMin] = operatingHour.endTime.split(":").map(Number);

        if (
          date.getHours() < sHour ||
          (date.getHours() == sHour && date.getMinutes() < sMin)
        ) {
          alert("Parking lot haven't open");
          return navigation.pop();
        } else if (
          date.getHours() > eHour ||
          (date.getHours() == eHour && date.getMinutes() > eMin)
        ) {
          alert("Parking lot is closed");
          return navigation.pop();
        } else {
          setReservationTime({
            startTime: new Date(startTime),
            endTime: new Date(endTime),
          });
        }
      }
    }, 1000);

    return () => {
      clearInterval(reservationTimeInterval);
    };
  }, []);

  async function initAccountInfo() {
    const accessToken = await SecureStore.getItemAsync("accessToken");
    const res = await fetch(`http://${SERVER_IP}/api/user/accountInfo`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    setContext(await res.json());
  }

  async function handleReserve() {
    if (context.credits < duration * setting.reservationFeePerHour) {
      return showInsBalDialog();
    }

    const accessToken = await SecureStore.getItemAsync("accessToken");
    if (!accessToken) return;

    const res = await fetch(
      `http://${SERVER_IP}/api/user/parking-space/reserve`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "accept-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          parkingSpaceId: parkingSpaceId,
          duration: duration,
        }),
      }
    );

    if (res.status === 200) {
      initAccountInfo();
      navigation.navigate("ReservationDialog");
    } else {
      console.log(await res.json());
    }
  }

  if (isObjEmpty(setting)) return <></>;

  return (
    <>
      <View style={{ flex: 1 }}>
        <MyHeader title="Reservation" navigation={navigation} />
        <View style={styles.container}>
          <View style={styles.mapContainer}>
            {!isObjEmpty(psInfo) && !isObjEmpty(location) && !isObjEmpty(building) && (
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
                  bounds={
                    [
                      [
                        building.bounds.southWest.latitude,
                        building.bounds.southWest.longitude,
                      ],
                      [
                        building.bounds.northEast.latitude,
                        building.bounds.northEast.longitude,
                      ],
                    ]
                  }
                  zIndex={1000}
                  location={[location.latitude, location.longitude]}
                  bearing={(location.rotation * 180) / Math.PI}
                  anchor={[0.5, 0.5]}
                  width={location.dimension.width}
                  height={location.dimension.height}
                />
                <Marker
                  key={parkingSpaceId}
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
                <Text style={styles.heading}>
                  {setting.reservationFeePerHour} credit(s) per hour
                </Text>
              </View>
              <View
                style={{
                  marginBottom: 32,
                  justifyContent: "center",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Button
                  mode="contained"
                  style={{ backgroundColor: THEME.primaryColor }}
                  onPress={() => {
                    if (duration - 1 >= 1) {
                      setDuration(duration - 1);
                    }
                  }}
                >
                  -
                </Button>
                <View style={{ marginHorizontal: 32 }}>
                  <Text style={{ ...styles.data, fontSize: 32 }}>
                    {duration}
                  </Text>
                  <Text style={styles.data}>Hour(s)</Text>
                </View>
                <Button
                  mode="contained"
                  style={{ backgroundColor: THEME.primaryColor }}
                  onPress={() => {
                    const day = new Date().getDay();
                    const operatingHour = setting.operatingHours[day];
                    let [sHour, sMin] = operatingHour.startTime
                      .split(":")
                      .map(Number);

                    let [eHour, eMin] = operatingHour.endTime
                      .split(":")
                      .map(Number);

                    const date = new Date();

                    if (!operatingHour.open24Hour) {
                      if (
                        sHour > date.getHours() ||
                        date.getHours() + duration + 1 > eHour
                      )
                        return;

                      if (sHour == date.getHours() && sMin > date.getMinutes())
                        return;

                      if (
                        eHour == date.getHours() + duration + 1 &&
                        eMin < date.getMinutes()
                      )
                        return;
                    }

                    if (duration + 1 <= setting.maxReservationDuration)
                      setDuration(duration + 1);
                  }}
                >
                  +
                </Button>
              </View>
              <View></View>
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.data}>
                  {formatAmPm(reservation.startTime)} -{" "}
                  {formatAmPm(reservation.endTime)}
                </Text>
              </View>
              <Text style={styles.data}>
                {setting.reservationFeePerHour * duration} Credit(s)
              </Text>
            </View>
            <View style={styles.buttonContainer}>
              <Button
                labelStyle={{ color: "white", fontFamily:"OpenSans-Bold" }}
                style={{ backgroundColor: THEME.primaryColor, flex: 1 }}
                onPress={showConfirmDialog}
              >
                Reserve Now
              </Button>
            </View>
          </View>
        </View>
      </View>

      <Dialog visible={insBalDialogVisible} onDismiss={hideInsBalDialog}>
        <Dialog.Title style={{fontFamily:"OpenSans-Bold"}}>Opps</Dialog.Title>
        <Dialog.Content>
          <Paragraph style={{fontFamily:"OpenSans-Regular"}}>Insufficient credit balance</Paragraph>
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            labelStyle={{ color: THEME.primaryColor, fontFamily:"OpenSans-Bold" }}
            onPress={() => {
              hideInsBalDialog();
              navigation.navigate("WalletStack");
            }}
          >
            Reload Now
          </Button>
        </Dialog.Actions>
      </Dialog>
      <Dialog visible={confirmDialogVisible} onDismiss={hideConfirmDialog}>
        <Dialog.Title style={{fontFamily:"OpenSans-Bold"}}>Confirmation</Dialog.Title>
        <Dialog.Content>
          <Paragraph style={{fontFamily:"OpenSans-Regular"}}>
            Reservation will cost you {duration * setting.reservationFeePerHour}{" "}
            credit(s). Are you sure that you want to reserve {psInfo.name} for{" "}
            {duration} hour?
          </Paragraph>
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            labelStyle={{ color: THEME.primaryColor, fontFamily:"OpenSans-Bold"}}
            onPress={() => {
              hideConfirmDialog();
            }}
          >
            No
          </Button>
          <Button
            labelStyle={{ color: THEME.primaryColor, fontFamily:"OpenSans-Bold"}}
            onPress={() => {
              hideConfirmDialog();
              handleReserve();
            }}
          >
            Confirm
          </Button>
        </Dialog.Actions>
      </Dialog>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white", alignItems: "center" },
  heading: {
    color: THEME.primaryColor,
    textAlign: "center",
    fontSize: 18,
    fontFamily:"OpenSans-Bold"
  },
  mapContainer: {
    flex: 1,
    flexDirection: "row",
    borderBottomColor: "lightgrey",
    borderBottomWidth: 2,
  },
  map: {
    flex: 1,
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
  data: {
    color: THEME.secondaryColor,
    textAlign: "center",
    fontSize: 16,
    fontFamily:"OpenSans-Regular"
  },
  buttonContainer: {
    marginHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
  },
});
