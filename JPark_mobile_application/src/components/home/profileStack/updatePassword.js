import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Header } from "react-native-elements";
import { TextInput, Button, Text, HelperText } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import { THEME } from "jpark/src/theme";
import { SERVER_IP } from "jpark/src/config";
import { MyHeader } from "jpark/src/components/header";

export default function UpdatePassword({ route, navigation }) {
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");

  async function handleUpdatePassword() {
    const accessToken = await SecureStore.getItemAsync("accessToken");
    if (!accessToken) return;

    const res = await fetch(`http://${SERVER_IP}/api/user/password`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
        "Accept-type": "application/json",
      },
      body: JSON.stringify({ oldPassword: password, password: newPassword }),
    });

    if (res.status === 200) navigation.pop();
    else {
      setPasswordError((await res.json()).error);
    }
  }

  function isSaveButtonEnable() {
    return (
      password.length > 0 &&
      newPassword.length > 0 &&
      passwordError === "" &&
      newPasswordError === ""
    );
  }

  function handleOnChangePassword(password) {
    setPassword(password);
    setPasswordError("");
  }

  function handleOnChangeNewPassword(newPassword) {
    setNewPassword(newPassword);

    if (newPassword.length < 8 || newPassword.length > 20) {
      setNewPasswordError("Password's length should be in between 8-20");
    } else if (
      newPassword.search(/[A-Za-z]+/) === -1 ||
      newPassword.search(/[0-9]/) === -1
    ) {
      setNewPasswordError("Password must contain both letter and number");
    } else {
      setNewPasswordError("");
    }
  }

  return (
    <View style={styles.container}>
      <MyHeader title="Password" navigation={navigation} />
      <View style={styles.main}>
        <TextInput
          label="Current Password"
          style={styles.formInput}
          theme={{
            colors: {
              primary: THEME.secondaryColor,
            },
          }}
          value={password}
          selectionColor={THEME.selectionColor}
          underlineColor={THEME.secondaryColor}
          placeholderTextColor={THEME.secondaryColor}
          onChangeText={handleOnChangePassword}
          secureTextEntry={true}
        ></TextInput>
        <HelperText type="error" visible={passwordError}>
          {passwordError}
        </HelperText>
        <TextInput
          label="New Password"
          style={styles.formInput}
          theme={{
            colors: {
              primary: THEME.secondaryColor,
            },
          }}
          value={newPassword}
          selectionColor={THEME.selectionColor}
          underlineColor={THEME.secondaryColor}
          placeholderTextColor={THEME.secondaryColor}
          onChangeText={handleOnChangeNewPassword}
          secureTextEntry={true}
        ></TextInput>
        <HelperText type="error" visible={newPasswordError}>
          {newPasswordError}
        </HelperText>
        <View style={{ marginVertical: 16 }}>
          <Button
            mode="contained"
            color={THEME.primaryColor}
            theme={{ colors: { primary: "white" } }}
            onPress={handleUpdatePassword}
            disabled={!isSaveButtonEnable()}
          >
            <Text style={{ color: "white" , fontFamily:"OpenSans-Bold" }}>Save</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  main: {
    padding: 8,
    backgroundColor: "white",
  },
  formInput: {
    backgroundColor: "white",
  },
});
