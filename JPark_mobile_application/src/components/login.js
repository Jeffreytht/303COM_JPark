import React, { useState, useEffect, useContext } from "react";
import {
  View,
  KeyboardAvoidingView,
  StatusBar,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import { Text } from "react-native-elements";
import { THEME } from "../theme";
import {Input, Button, Icon} from "react-native-elements"
import * as SecureStore from "expo-secure-store";
import { AppContext } from "../global";
import { SERVER_IP } from "../config";
import { MyHeader } from "./header";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [context, setContext] = useContext(AppContext);

  const initAccountInfo = async () => {
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
  };

  const handleSignInNow = async () => {
    try {
      const res = await fetch(`http://${SERVER_IP}/api/user/login`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      if (res.status >= 200 && res.status < 300) {
        const json = await res.json();
        await SecureStore.setItemAsync("accessToken", json.accessToken);
        await SecureStore.setItemAsync("refreshToken", json.refreshToken);
        await initAccountInfo();

        setError("");
        navigation.replace("Home");
      } else {
        let json = await res.json();
        setError(`*${json[Object.keys(json)[0]].msg}`);
      }
    } catch (error) {
      setError(error.toString());
    }
  };

  useEffect(() => {
    const handleAutoSignIn = async () => {
      const refreshToken = await SecureStore.getItemAsync("refreshToken");
      if (!refreshToken) return;

      const res = await fetch(`http://${SERVER_IP}/api/user/token`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: refreshToken }),
      });

      if (res.status !== 200) {
        return;
      }

      const json = await res.json();
      await SecureStore.setItemAsync("accessToken", json.accessToken);
      await initAccountInfo();
      navigation.popToTop();
      navigation.replace("Home");
    };

    handleAutoSignIn();
  }, []);


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content"></StatusBar>
      <KeyboardAvoidingView style={styles.container}>
        <MyHeader title="Login" navigation={navigation}/>
        <ScrollView>
          <View style={styles.main}>
            <View style={styles.formBody}>
              <Text style={styles.formLabel}>Email Address</Text>
              <Input 
                inputStyle={{fontFamily:"OpenSans-Regular", fontSize:16}} 
                containerStyle={{paddingHorizontal:0}} 
                renderErrorMessage={false}
                placeholder="johndoe@gmail.com" 
                onChangeText={(email) => setEmail(email)}
              />
              <View style={{ minHeight: 16 }}></View>
              <Text style={styles.formLabel}>Password</Text>
              <Input 
                secureTextEntry={true}
                inputStyle={{fontFamily:"OpenSans-Regular", fontSize:16}}  
                onChangeText={(password) => setPassword(password)}
                containerStyle={{paddingHorizontal:0}} 
                renderErrorMessage={false}
                placeholder="shh..."
              />
              <Text style={styles.errorMessage} visible={error}>
                {error}
              </Text>
              <Button
                type="solid"
                buttonStyle={{backgroundColor: THEME.primaryColor}}
                titleStyle={{fontFamily:"OpenSans-Bold", fontSize:18}}
                title="Log In"
                onPress={handleSignInNow}
              >
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  main: {
    paddingTop: 16,
    flex: 1,
    width: "100%",
    minHeight:
      Dimensions.get("window").height -
      (Platform.OS === "android" ? StatusBar.currentHeight : 0),
    backgroundColor: "white",
    alignItems: "center",
  },
  formLabel:{
    fontSize:16,
    fontFamily:"OpenSans-Bold",
    color:THEME.secondaryTextColor
  },
  formBody: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 32,
  },
  errorMessage:{
    fontFamily:"OpenSans-Regular",
    color:"red",
    marginVertical:8,
    fontSize:14
  }
});
