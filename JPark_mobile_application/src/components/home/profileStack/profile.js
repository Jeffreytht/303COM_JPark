import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { Card } from "react-native-elements/dist/card/Card";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { THEME } from "jpark/src/theme";
import * as SecureStore from "expo-secure-store";
import { useIsFocused } from "@react-navigation/native";
import { SERVER_IP } from "jpark/src/config";
import { MyHeader } from "jpark/src/components/header";
import { StatusBar } from "react-native";
import { Button } from "react-native-elements";

export default function Profile({ navigation }) {
  const [accountInfo, setAccountInfo] = useState({});
  const isFocused = useIsFocused();

  useEffect(() => {
    async function initAccountInfo() {
      const accessToken = await SecureStore.getItemAsync("accessToken");

      const res = await fetch(`http://${SERVER_IP}/api/user/accountInfo`, {
        method: "GET",
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.status === 200) {
        setAccountInfo(await res.json());
      }
    }

    initAccountInfo();
  }, [isFocused]);

  return (
    <View style={{flex: 1}}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content"/>
        <MyHeader navigation={navigation} title="Profile" />
        <Card containerStyle={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Username</Text>
            <Icon
              name="pencil"
              type="material"
              color={THEME.primaryColor}
              size={24}
              onPress={() => {
                navigation.navigate("UpdateUsername", {
                  username: accountInfo.username,
                });
              }}
            />
          </View>
          <View style={styles.cardDivider} />
          <Text style={styles.cardContent}>{accountInfo.username}</Text>
        </Card>
        <Card containerStyle={styles.card}>
          <View style={styles.cardHeader}>   
            <Text style={styles.cardTitle}>Email</Text>
            <Icon
              name="pencil"
              type="material"
              color={THEME.primaryColor}
              size={24}
              onPress={() => {
                navigation.navigate("UpdateEmail", {
                  email: accountInfo.email,
                });
              }}
            />
          </View>
          <View style={styles.cardDivider} />
          <Text style={styles.cardContent}>{accountInfo.email}</Text>
        </Card>
        <Card containerStyle={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Password</Text>
            <Icon
              name="pencil"
              type="material"
              color={THEME.primaryColor}
              size={24}
              onPress={() => {
                navigation.navigate("UpdatePassword");
              }}
            />
          </View>
          <View style={styles.cardDivider} />
          <Text style={styles.cardContent}>********</Text>
        </Card>
        <Card containerStyle={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Contact Number</Text>
            <Icon
              name="pencil"
              type="material"
              color={THEME.primaryColor}
              size={24}
              onPress={() => {
                navigation.navigate("UpdateContactNum", {
                  contactNum: accountInfo.contactNum,
                });
              }}
            />
          </View>
          <View style={styles.cardDivider} />
          <Text style={styles.cardContent}>{accountInfo.contactNum}</Text>
        </Card>
      </View>
      <View style={{padding: 16}}>
        <Button title={"Sign Out"} titleStyle={{fontFamily:"OpenSans-Bold"}} buttonStyle={{backgroundColor:THEME.primaryColor}} onPress={ async () => {
          await SecureStore.deleteItemAsync("accessToken");
          await SecureStore.deleteItemAsync("refreshToken");
          navigation.replace("Login");
        }}></Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderWidth: 0,
    elevation: 1,
    backgroundColor: "white",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 16,
    color: THEME.secondaryColor,
    fontFamily:"OpenSans-Regular"
  },
  cardContent: {
    fontFamily:"OpenSans-Bold",
    fontSize: 16,
    color: THEME.textColor,
  },
  cardDivider: {
    marginVertical: 8,
  },
});
