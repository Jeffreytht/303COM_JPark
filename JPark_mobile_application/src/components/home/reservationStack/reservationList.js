import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableNativeFeedback,
} from "react-native";
import { Card } from "react-native-paper";
import { Button } from "react-native-elements";
import * as SecureStore from "expo-secure-store";
import { useIsFocused } from "@react-navigation/native";
import { THEME } from "jpark/src/theme";
import { SERVER_IP } from "jpark/src/config";
import { NoReservationIcon } from "jpark/src/image";
import { formatAmPm } from "jpark/src/components/utility";
import { formatYyyyMMdd } from "../../utility";

export default function ReservationList({ navigation, route }) {
  const [reservations, setReservations] = useState([]);
  const isFocused = useIsFocused();
  const [isRefresh, setIsRefresh] = useState(false);
  const { type } = route.params;

  async function getReservations() {
    const accessToken = await SecureStore.getItemAsync("accessToken");
    if (!accessToken) return;

    const res = await fetch(`http://${SERVER_IP}/api/user/reservations/`, {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 200) {
      const reservationList = await res.json();
      reservationList.sort(
        (r1, r2) =>
          new Date(r1.dateTime).getTime() < new Date(r2.dateTime).getTime()
      );
      setReservations(
        reservationList.filter((reservation) => reservation.status === type)
      );
    }
  }

  function handleReservationNow() {
    navigation.navigate("FloorSelector");
  }

  useEffect(() => {
    getReservations();
  }, [isFocused]);

  return (
    <View style={{ flex: 1, backgroundColor:"white" }}>
      {reservations.length == 0 ? (
        <View
          style={{
            flex: 1,
            marginHorizontal: 16,
            alignItems: "center",
            marginTop:32
          }}
        >
          <Image source={NoReservationIcon} style={{ height: 75, width: 75 }} />
          <Text
            style={{
              fontSize: 16,
              textAlign: "center",
              fontFamily:"OpenSans-Regular",
              marginBottom: 8,
              color: THEME.secondaryColor,
            }}
          >
            No reservations yet
          </Text>
          {type == "Active" ? (
            <Button
              title="Reserve Now"
              onPress={handleReservationNow}
              titleStyle={{fontFamily:"OpenSans-Bold"}}
              buttonStyle={{ backgroundColor: THEME.primaryColor, width: 220 }}
            ></Button>
          ) : (
            <></>
          )}
        </View>
      ) : (
        <FlatList
          style={{ paddingHorizontal: 8 }}
          keyExtractor={(item) => item._id.toString()}
          data={reservations}
          refreshing={isRefresh}
          onRefresh={async () => {
            setIsRefresh(true);
            await getReservations();
            setIsRefresh(false);
          }}
          renderItem={({ item }) => {
            return (
              <TouchableNativeFeedback
                disabled={type !== "Active"}
                onPress={() => {
                  navigation.navigate("ReservedPS", {
                    parkingSpaceId: item.parkingSpace,
                    reservationId: item._id,
                  });
                }}
                background={
                  Platform.OS === "android"
                    ? TouchableNativeFeedback.SelectableBackground()
                    : ""
                }
              >
                <Card
                  style={
                    type !== "Active"
                      ? { marginBottom: 8, backgroundColor: "white", elevation: 0}
                      : { marginBottom: 8, elevation: 5 }
                  }
                >
                  <Card.Title
                    title={item.parkingSpaceName}
                    titleStyle={{
                      color: THEME.primaryColor,
                      fontFamily:"OpenSans-Bold"
                    }}
                  />
                  <Card.Content style={{ margin: 0 }}>
                    <Text style={{ fontSize: 16, fontFamily:"OpenSans-Regular"  }}>
                      Date: {formatYyyyMMdd(new Date(item.dateTime))}
                    </Text>
                    <Text style={{ fontSize: 16, fontFamily:"OpenSans-Regular"  }}>
                      Reserved at: {formatAmPm(new Date(item.dateTime))}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={{ fontSize: 16, fontFamily:"OpenSans-Regular" }}>
                        Duration: {item.duration} Hour(s)
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          color: THEME.primaryColor,
                          fontFamily:"OpenSans-Bold"
                        }}
                      >
                        {type}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              </TouchableNativeFeedback>
            );
          }}
        />
      )}
    </View>
  );
}
