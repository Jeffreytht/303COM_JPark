import React, { useState, useEffect } from "react";
import { View, FlatList, Text, StatusBar, Image } from "react-native";
import { MyHeader } from "../header";
import { SERVER_IP } from "jpark/src/config";
import * as SecureStore from "expo-secure-store";
import { formatAmPm, formatYyyyMMdd } from "../utility";
import { THEME } from "../../theme";
import {ReloadTransactionIcon, ReservedTransactionIcon} from "jpark/src/image"

export default function TransactionHistory({ navigation }) {
  const [transaction, setTransaction] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  async function initTransactions() {
    const jwtToken = await SecureStore.getItemAsync("accessToken");
    if (!jwtToken) return;

    const res = await fetch(`http://${SERVER_IP}/api/user/wallet/history`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });

    const data = await res.json();
    data.sort(
      (t1, t2) =>
        new Date(t1.createdAt).getTime() < new Date(t2.createdAt).getTime()
    );
    setTransaction(data);
  }

  useEffect(() => {
    initTransactions();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content"/>
      <MyHeader title="Transactions" navigation={navigation} />
      <FlatList
        keyExtractor={(item) => item._id.toString()}
        data={transaction}
        onRefresh={async () => {
          setRefreshing(true);
          await initTransactions();
          setRefreshing(false);
        }}
        refreshing={refreshing}
        renderItem={({ item }) => (
          <View
            key={item._id.toString()}
            style={{
              backgroundColor: "white",
              flexDirection: "row",
              justifyContent: "space-between",
              padding: 16,
              marginBottom: 1,
              alignItems: "center",
            }}
          >
            <Image style={{width:48, height: 48}} source={item.credit > 0 ? ReloadTransactionIcon : ReservedTransactionIcon}/ >
            <View style={{marginHorizontal: 16, flex: 1}}>
              <Text style={{ color: "black", fontSize:16,  fontFamily:"OpenSans-Regular" }}>
                {item.description}
              </Text>
              <Text style={{ color: "gray", fontSize: 12, fontFamily:"OpenSans-Regular" }}>
                {formatYyyyMMdd(new Date(item.createdAt)) +
                  " " +
                  formatAmPm(new Date(item.createdAt))}
              </Text>
            </View>
            <View>
              <Text
                style={{
                  textAlign: "right",
                  color: item.credit > 0 ? THEME.primaryColor : "black",
                  fontSize: 16,
                  fontFamily: "OpenSans-Regular",
                }}
              >
                {item.credit} credit(s)
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}
