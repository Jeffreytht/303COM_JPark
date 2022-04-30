import React, {useState, useEffect} from "react";
import { SERVER_IP } from "jpark/src/config";
import MapView, { PROVIDER_GOOGLE} from "react-native-maps";
import { StatusBar, StyleSheet, Text, View, Image, ScrollView, TouchableNativeFeedback, Platform, Linking, RefreshControl } from "react-native"
import { Button, Card, Icon } from "react-native-elements"
import { THEME } from "../../theme";
import * as SecureStore from "expo-secure-store";
import {UserIcon, WalletIcon, ReserveIcon, ReservationsIcon, TransactionsIcon} from "jpark/src/image"

export default function Home({navigation}) {
  const DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const [operatingHours, setOperatingHours] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [refreshing, setRefreshing] = useState(false)

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
        reservationList.filter((reservation) => reservation.status === "Active")
      );
    }
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
      let operatingHours = []
      let ohs = (await res.json()).operatingHours
      ohs.forEach(oh => {
        if (oh.open24Hour == true) {
          operatingHours.push("Open 24 hours")
        } else if (oh.closed) {
          operatingHours.push("Closed")
        } else {
          operatingHours.push(`${oh.startTime} to ${oh.endTime}`)
        }
      })
      setOperatingHours(operatingHours)
    }
  }

  useEffect(() => {
    initSetting()
    getReservations()
  }, [])
  
  return (
    <View style={styles.main}>
      <StatusBar/>
      <View style={styles.header}>
        <View style={{flex: 1}}>
          <Text style={styles.headerSubtitle}>Parking Lot</Text>
          <Text style={styles.headerTitle}>INTI College Penang</Text>
        </View>
        <TouchableNativeFeedback onPress={()=> navigation.push("ProfileStack")}>
            <Image source={UserIcon} style={{width: 48, height: 48 }}/>
        </TouchableNativeFeedback>
      </View>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async ()=>{
              setRefreshing(true)
              await getReservations()
              setRefreshing(false)
            }}
          />
        }
      >
        <View style={styles.featuresBar}>
          <View style={styles.featureContainer}> 
            <TouchableNativeFeedback
              onPress={()=> {navigation.push("FloorSelector")}}>
              <Image source={ReserveIcon} style={{width: 64, height: 64 }}/>
            </TouchableNativeFeedback>
            <Text style={styles.featureTitle}>Reserve</Text>
          </View>
          <View style={styles.featureContainer}> 
            <TouchableNativeFeedback
              onPress={()=> {navigation.push("Reservation")}}>
              <Image source={ReservationsIcon} style={{width: 64, height: 64 }}/>
            </TouchableNativeFeedback>
            <Text style={styles.featureTitle}>Reservations</Text>
          </View>
          <View style={styles.featureContainer}> 
            <TouchableNativeFeedback
              onPress={()=> {navigation.push("WalletStack")}}>
              <Image source={WalletIcon} style={{width: 64, height: 64 }}/>
            </TouchableNativeFeedback>
            <Text style={styles.featureTitle}>Wallet</Text>
          </View>
          <View style={styles.featureContainer}> 
            <TouchableNativeFeedback
              onPress={()=> {navigation.push("TransactionHistory")}}>
              <Image source={TransactionsIcon} style={{width: 64, height: 64 }}/>
            </TouchableNativeFeedback>
            <Text style={styles.featureTitle}>Transactions</Text>
          </View>
        </View>
        <View style={{minHeight:4, backgroundColor:"#EDEDED"}}/>
        <View style={styles.content}>
          <View style={{marginBottom: 28}}>
            <Text style={styles.title}>Current Reservation</Text>
            {reservations.length == 0 && <Text style={{fontFamily:"OpenSans-Regular"}}>No Reservation Found</Text>}
            {
              reservations.map(reservation => {
                return (
                  <Card key={reservation._id} containerStyle={{marginHorizontal:0, marginTop:4, elevation:0}}>
                  <View style={styles.reservationContainer}>
                    <Text style={styles.reservationParkingSpace}>{reservation.parkingSpaceName}</Text>
                    <View style={{alignItems:"flex-end"}}>
                      <Timer reservationInfo={reservation}></Timer>
                      <Text style={styles.reservationTimeLabel}>remaining</Text>
                    </View>
                    <Button 
                      type="clear" 
                      icon={<Icon name="arrowright" type="antdesign"></Icon>}
                      onPress={()=>{
                        navigation.navigate("ReservedPS", {
                          parkingSpaceId: reservation.parkingSpace,
                          reservationId: reservation._id,
                        });
                      }}
                    />
                  </View>
                </Card>
                )
              })
            }
          </View>
          <View style={{marginBottom: 28}}>
            <View style={{flexDirection:"row", justifyContent:"space-between"}}>
              <Text style={styles.title}>Location</Text>
              <Button 
                type="clear" 
                buttonStyle={{margin:0, padding:0}} 
                titleStyle={{fontFamily:"OpenSans-Bold", color:THEME.primaryColor}}
                title={"Navigate"} 
                onPress={()=>{
                  const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
                  const latLng = `${5.341583},${100.281841}`;
                  const label = 'Navigate';
                  const url = Platform.select({
                    ios: `${scheme}${label}@${latLng}`,
                    android: `${scheme}${latLng}(${label})`
                  });
                  

                  Linking.openURL(url);                  
                }}
                style={styles.title}>
                  Location
              </Button>
            </View>
            <Text style={styles.address}>1-Z, Lebuh Bukit Jambul, Bukit Jambul, 11900 Bayan Lepas, Pulau Pinang</Text>
            <MapView
                initialRegion={{
                  latitude: 5.341583, 
                  longitude: 100.281841,
                  latitudeDelta: 0.001,
                  longitudeDelta: 0.001,
                }}
                pitchEnabled={false}
                rotateEnabled={false}
                zoomEnabled={false}
                scrollEnabled={false}
                provider={PROVIDER_GOOGLE}
                toolbarEnabled={false}
                style={{width: "100%", height: 178, marginTop:4}}
            />
          </View>
          <View style={{marginBottom: 28}}>
            <Text style={styles.title}>Operating Hours</Text>
            {
              operatingHours.map((oh, idx) =>  {
                const isToday = new Date().getDay() == idx;
                return (
                  <View key={`operatingHour${idx}`} style={styles.operatingHoursContainer}>
                    <Text style={isToday ? styles.operatingHourDaySelected : styles.operatingHourDay}>{DAYS[idx]}</Text>
                    <Text style={isToday ? styles.operatingHourSelected : styles.operatingHour}>{oh}</Text>
                  </View>
              )})
            }
          </View>
        </View>
      </ScrollView>
    </View>
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

  function setRemainingTime() {
    const time = getEndTime(props.reservationInfo) - new Date();

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
    <Text style={styles.reservationTime}>{timer}</Text>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor:"white"
  },
  header:{
    backgroundColor: THEME.primaryColor,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    flexDirection:"row",
    alignItems:"center"
  },
  headerSubtitle:{
    color:"white",
    fontFamily:"OpenSans-Bold",
    fontSize: 16,
  },
  headerTitle:{
    color: "white",
    fontFamily: "OpenSans-Bold",
    fontSize: 24
  },
  featuresBar: {
    flexDirection:"row",
    paddingVertical: 16,
  },
  featureContainer: {
    flex: 1,
    alignItems:"center"
  },
  featureTitle:{
    marginTop:4,
    fontFamily: "OpenSans-Regular",
    fontSize: 12
  },
  content:{
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title:{
    fontFamily: "OpenSans-Bold",
    fontSize: 18,
  },
  reservationContainer: {
    flexDirection: "row"
  },
  reservationParkingSpace: {
    fontFamily: "OpenSans-Bold",
    fontSize: 22,
    color: THEME.primaryColor,
    flex: 1
  },
  reservationTime: {
    fontFamily: "OpenSans-Bold",
    fontSize: 16
  },
  reservationTimeLabel: {
    fontFamily: "OpenSans-Regular",
    fontSize: 14
  },
  address: {
    marginTop: 4,
    fontFamily: "OpenSans-Regular",
    fontSize: 14
  },
  operatingHourDay: {
    fontFamily: "OpenSans-Regular",
    fontSize: 14,
    width: 100,
  },
  operatingHour:{
    fontFamily: "OpenSans-Regular",
    fontSize: 14,
    flex: 1
  },
  operatingHoursContainer: {
    flexDirection: "row",
    marginTop: 4,
  },
  operatingHourSelected:{
    fontFamily: "OpenSans-Bold",
    fontSize: 14,
    flex: 1,
    color: THEME.primaryColor
  }, 
  operatingHourDaySelected:{
    fontFamily: "OpenSans-Bold",
    fontSize: 14,
    width: 100,
    color: THEME.primaryColor
  }
})