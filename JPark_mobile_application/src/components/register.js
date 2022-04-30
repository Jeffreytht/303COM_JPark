import React from "react";
import {
  View,
  KeyboardAvoidingView,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
  Dimensions,
  Alert,
} from "react-native";
import { Text, Input, Button } from "react-native-elements";
import { THEME } from "../theme";
import { useState } from "react";
import { SERVER_IP } from "../config";
import { MyHeader } from "./header";

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState({ data: "", error: " " });
  const [username, setUsername] = useState({ data: "", error: " " });
  const [contactNum, setContactNum] = useState({ data: "", error: " " });
  const [pass, setPass] = useState({ data: "", error: " " });
  const [conPass, setConPass] = useState({ data: "", error: " " });

  const validateEmail = async () => {
    if (!email.data) {
      return setEmail({ ...email, error: "Email cannot be empty" });
    }

    if (
      !email.data.match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      )
    ) {
      return setEmail({ ...email, error: "Invalid email" });
    }

    const res = await fetch(`http://${SERVER_IP}/api/user/email`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.data,
      }),
    });

    if (res.status === 400)
      return setEmail({ ...email, error: (await res.json()).email.msg });
    else setEmail({ ...email, error: "" });
  };

  const validateUsername = () => {
    if (!username.data) {
      return setUsername({ ...username, error: "Username cannot be empty" });
    }

    if (username.data.length < 6 || username.data.length > 20)
      return setUsername({
        ...username,
        error: "Username's length should be in between 6-20",
      });
    return setUsername({ ...username, error: "" });
  };

  const validateContactNum = () => {
    if (!contactNum.data) {
      return setContactNum({
        ...contactNum,
        error: "Contact number cannot be empty",
      });
    }
    if (!contactNum.data.match(/^[0-9]{3}-[0-9]{7,8}$/))
      return setContactNum({
        ...contactNum,
        error: "Contact number should be in this format 012-3456789",
      });
    return setContactNum({ ...contactNum, error: "" });
  };

  const validatePass = () => {
    if (!pass.data) {
      return setPass({ ...pass, error: "Password cannot be empty" });
    }

    if (pass.data.length < 8 || pass.data.length > 20) {
      return setPass({
        ...pass,
        error: "Password's length should be in between 8-20",
      });
    }

    if (
      pass.data.search(/[A-Za-z]+/) === -1 ||
      pass.data.search(/[0-9]/) === -1
    ) {
      return setPass({
        ...pass,
        error: "Password must contain both letter and number",
      });
    }

    return setPass({ ...pass, error: "" });
  };

  const validateConPass = () => {
    if (pass.data !== conPass.data)
      return setConPass({
        ...conPass,
        error: "Confirm password and password should be identical",
      });

    return setConPass({ ...conPass, error: "" });
  };

  const handleLoginNow = (_) => {
    navigation.goBack();
  };

  const handleSignUp = async () => {
    await validateEmail();
    validatePass();
    validateContactNum();
    validateConPass();
    validateUsername();

    if (
      email.error +
      pass.error +
      conPass.error +
      username.error +
      contactNum.error
    )
      return;

    try {
      const res = await fetch(`http://${SERVER_IP}/api/user/register`, {
        method: "POST",
        headers: {
          Accept: "Application/json",
          "Content-Type": "Application/json",
        },
        body: JSON.stringify({
          email: email.data,
          password: pass.data,
          username: username.data,
          contactNum: contactNum.data,
        }),
      });

      if (res.status >= 200 && res.status < 300) {
        Alert.alert(
          "Sign Up Successfully",
          "You can sign in to your account now",
          [{ text: "Sign In", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert("Error occurred", (await res.json()).error, [
          { text: "OK", onPress: () => {} },
        ]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const genInputText = (label, state, setState, validation, placeholder, obscure) => (
    <>
      <Text style={styles.formLabel}>{label}</Text>
      <Input
        containerStyle={styles.formInput}
        renderErrorMessage={true}
        errorStyle={{marginHorizontal:0, fontFamily:"OpenSans-Regular"}}
        inputStyle={{fontFamily:"OpenSans-Regular", fontSize:16}} 
        placeholder={placeholder}
        onChangeText={(text) => setState({ ...state, data: text })}
        onEndEditing={async () => await validation()}
        errorMessage={state.error}
        secureTextEntry={obscure}
      />
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content"></StatusBar>
      <KeyboardAvoidingView style={styles.container}>
        <MyHeader title="Sign Up" navigation={navigation}/>
        <ScrollView>
          <View style={styles.main}>
            <View style={styles.formBody}>
              {genInputText(
                "Email", 
                email, 
                setEmail, 
                validateEmail, 
                "johndoe@gmail.com"
              )}
              {genInputText(
                "Username",
                username,
                setUsername,
                validateUsername,
                "John Doe"
              )}
              {genInputText(
                "Contact Number",
                contactNum,
                setContactNum,
                validateContactNum,
                "012-3456789"
              )}
              {genInputText("Password", pass, setPass, validatePass, "Shh...", true)}
              {genInputText(
                "Confirm Password",
                conPass,
                setConPass,
                validateConPass,
                "Shh...",
                true
              )}
              <Button
                disabled={
                  email.error +
                  contactNum.error +
                  username.error +
                  pass.error +
                  conPass.error
                }
                onPress={handleSignUp}
                buttonStyle={{backgroundColor: THEME.primaryColor}}
                title="Sign Up"
                titleStyle={{fontFamily:"OpenSans-Bold", fontSize:18}}
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
    flex: 1,
    backgroundColor:"white",
    paddingHorizontal: 32,
    paddingTop: 16,
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
  },
  formInput: {
    paddingHorizontal:0,
  },
});
