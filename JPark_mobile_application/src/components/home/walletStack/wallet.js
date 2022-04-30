import React, { useState, useContext } from "react";
import { View, Text, StyleSheet, StatusBar } from "react-native";
import { Button, Divider } from "react-native-elements";
import { TextInput, HelperText } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import { THEME } from "jpark/src/theme";
import { AppContext } from "jpark/src/global";
import { SERVER_IP } from "jpark/src/config";
import { MyHeader } from "jpark/src/components/header";

export default function Wallet({ navigation }) {
  const [amount, setAmount] = useState("");
  const [context, setContext] = useContext(AppContext);

  async function initAccountInfo() {
    const accessToken = await SecureStore.getItemAsync("accessToken");
    const res = await fetch(`http://${SERVER_IP}/api/user/accountInfo`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const json = await res.json();
    setContext(json);
  }

  function handleOnChangeAmount(amount) {
    if (amount.match(/^[0-9]{0,3}$/)) {
      if (amount.length > 0) setAmount(parseInt(amount).toString());
      else setAmount(amount.toString());
    }
  }

  function isReloadButtonEnable() {
    return amount !== "" && parseInt(amount) >= 10;
  }

  async function handleReload() {
    if (amount < 10 || amount > 999) return;

    const accessToken = await SecureStore.getItemAsync("accessToken");
    if (!accessToken) {
      return;
    }

    const res = await fetch(`http://${SERVER_IP}/api/user/wallet/reload`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        credit: amount,
      }),
    });

    if (res.status === 200) {
      await initAccountInfo();
      navigation.replace("ReloadDialog");
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <StatusBar barStyle="dark-content"/>
      <MyHeader title="Wallet" navigation={navigation} />
      <View style={styles.container}>
        <View style={styles.reloadAmount}>
          <View style={{ marginBottom: 16 }}>
            <TextInput
              keyboardType="numeric"
              label="Enter preferable amount"
              style={{ backgroundColor: "white"}}
              theme={{
                colors: {
                  primary: "black",
                },
              }}
              selectionColor={THEME.selectionColor}
              underlineColor={THEME.secondaryColor}
              placeholderTextColor={THEME.secondaryColor}
              onChangeText={handleOnChangeAmount}
              value={amount}
            />
            <HelperText style={{fontFamily: "OpenSans-Regular"}}>Min reload amount is 10 credits</HelperText>
          </View>
          <View style={styles.rowButtons}>
            <Button
              {...(amount === "10" ? selectedStyle : unselectedStyle)}
              title="10"
              type="outline"
              onPress={() => handleOnChangeAmount("10")}
            />
            <Button
              {...(amount === "20" ? selectedStyle : unselectedStyle)}
              title="20"
              type="outline"
              onPress={() => handleOnChangeAmount("20")}
            />
            <Button
              {...(amount === "30" ? selectedStyle : unselectedStyle)}
              title="30"
              type="outline"
              onPress={() => handleOnChangeAmount("30")}
            />
          </View>
          <View style={styles.rowButtons}>
            <Button
              {...(amount === "50" ? selectedStyle : unselectedStyle)}
              title="50"
              type="outline"
              onPress={() => handleOnChangeAmount("50")}
            />
            <Button
              {...(amount === "100" ? selectedStyle : unselectedStyle)}
              title="100"
              type="outline"
              onPress={() => handleOnChangeAmount("100")}
            />
            <Button
              {...(!["10", "20", "30", "50", "100"].includes(amount)
                ? selectedStyle
                : unselectedStyle)}
              title="Others"
              type="outline"
              onPress={() => {
                handleOnChangeAmount("");
              }}
            />
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Text style={styles.reloadTotal}>
            Total: RM {amount === "" ? 0 : amount}
          </Text>
          <Divider orientation="horizontal" style={{ marginVertical: 16 }} />
          <Button
            title="Pay Now"
            titleStyle={{fontFamily:"OpenSans-Bold"}}
            buttonStyle={{ backgroundColor: THEME.primaryColor }}
            disabled={!isReloadButtonEnable()}
            onPress={handleReload}
          ></Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  rowButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  colButton: {
    flex: 1,
    margin: 8,
    color: THEME.primaryColor,
  },
  reloadAmount: {
    // marginTop: 16,
  },
  reloadTotal: {
    fontSize: 18,
    fontFamily:"OpenSans-Bold",
    color: "black",
  },
  bottomSection: {
    marginVertical: 16,
    marginHorizontal:8
  },
});

const selectedStyle = {
  buttonStyle: {
    borderColor: THEME.primaryColor,
    borderWidth: 1,
    backgroundColor: THEME.primaryColor,
  },
  titleStyle: { color: "white", fontFamily:"OpenSans-Bold" },
  containerStyle: styles.colButton,
};

const unselectedStyle = {
  buttonStyle: {
    borderColor: "black",
    borderWidth: 1,
  },
  titleStyle: { color: "black", fontFamily:"OpenSans-Regular" },
  containerStyle: styles.colButton,
};
