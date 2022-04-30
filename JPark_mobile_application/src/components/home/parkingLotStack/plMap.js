import React, { useState, useEffect } from "react";
import MapView, { PROVIDER_GOOGLE, Overlay, Marker } from "react-native-maps";
import { View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { MyHeader } from "jpark/src/components/header";
import { SERVER_IP } from "jpark/src/config";
import { ParkingMarkerIcon, EntranceIcon, OKUIcon } from "jpark/src/image";
import SitumPlugin from "react-native-situm-plugin";
import { isObjEmpty } from "jpark/src/components/utility";


export default function PLMap({ route, navigation }) {
  const { floorId } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [parkingLot, setParkingLot] = useState({});
  const [building, setBuilding] = useState({})

  const getMapRegion = (parkingLot) => {
    return {
      latitude: parkingLot.location.lat,
      longitude: parkingLot.location.lng,
      latitudeDelta: 0.0015,
      longitudeDelta: 0.0015,
    };
  };

  const getBuildings = () => {
    setIsLoading(true);
    SitumPlugin.fetchBuildings(
      (buildings) => {
        setBuilding(buildings[0]);
      },
      (error) => {
        console.log(error)
        setIsLoading(false);
      }
    );
  };

  function getAvailableParkingSpaces(parkingLot, floorId) {
    for (const floor of parkingLot.floors)
      if (floorId === floor._id)
        return floor.parkingSpaces.filter((ps) => ps.state === "empty");
  }

  function getEntrances(parkingLot, floorId) {
    for (const floor of parkingLot.floors)
      if (floorId === floor._id) {
        return floor.entrances;
      }
  }

  function getFloorPlanUrl(parkingLot, floorId) {
    for (const floor of parkingLot.floors)
      if (floorId === floor._id) return floor.map.url;
  }

  function handleParkingSpaceClicked(parkingSpaceId) {
    navigation.navigate("ParkingSpace", { parkingSpaceId: parkingSpaceId });
  }

  useEffect(() => {
    const getParkingLot = async () => {
      const accessToken = await SecureStore.getItemAsync("accessToken");
      const res = await fetch(`http://${SERVER_IP}/api/user/parking-lot`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      setParkingLot(await res.json());
      setIsLoading(false);
    };

    getParkingLot();
    getBuildings();
  }, []);

  if (isLoading) return <></>;
  if (isObjEmpty(building)) return <></>

  return (
    <View style={{ flex: 1 }}>
      <MyHeader title="Map" navigation={navigation} />
      <View style={{ flex: 1 }}>
        <MapView
          style={{ flex: 1 }}
          region={getMapRegion(parkingLot)}
          provider={PROVIDER_GOOGLE}
          rotateEnabled={false}
          toolbarEnabled={false}
        >

        <Overlay
            image={getFloorPlanUrl(parkingLot, floorId)}
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
              ]}
            zIndex={1000}
            location={[
              building.center.latitude,
              building.center.longitude,
            ]}
            bearing={(building.rotation * 180) / Math.PI}
            anchor={[0.5, 0.5]}
            width={building.dimensions.width}
            height={building.dimensions.height}
          />

          {getEntrances(parkingLot, floorId).map((entrance) => (
            <Marker
              key={entrance._id}
              coordinate={{
                latitude: entrance.coordinate.lat,
                longitude: entrance.coordinate.lng,
              }}
              title={entrance.name}
              pinColor="cyan"
              icon={EntranceIcon}
            ></Marker>
          ))}
            
          {getAvailableParkingSpaces(parkingLot, floorId).map((ps) => (
            <Marker
              key={ps._id}
              coordinate={{
                latitude: ps.coordinate.lat,
                longitude: ps.coordinate.lng,
              }}
              title={ps.name}
              pinColor="cyan"
              icon={ps.isOKU ? OKUIcon : ParkingMarkerIcon}
              onPress={() => handleParkingSpaceClicked(ps._id)}
            ></Marker>
          ))}
        </MapView>
      </View>
    </View>
  );
}
