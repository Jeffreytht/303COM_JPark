import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Header } from "react-native-elements";
import { TextInput, Button, Text, HelperText } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import { THEME } from "jpark/src/theme";
import { SERVER_IP } from "jpark/src/config";
import { MyHeader } from "jpark/src/components/header";

export default function UpdateEmail({ route, navigation }) {
  const { email } = route.params;
  const [newEmail, setNewEmail] = useState(email);
  const [error, setError] = useState("");

  async function handleUpdateEmail() {
    const accessToken = await SecureStore.getItemAsync("accessToken");
    if (!accessToken) return;

    const res = await fetch(`http://${SERVER_IP}/api/user/email`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
        "Accept-type": "application/json",
      },
      body: JSON.stringify({ email: newEmail }),
    });

    if (res.status === 200) navigation.pop();
    else {
      setError((await res.json()).email.msg);
    }
  }

  async function handleOnChangeEmail(email) {
    setNewEmail(email);

    if (
      !email.match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      )
    ) {
      setError("Invalid email");
    }

    const res = await fetch(`http://${SERVER_IP}/api/user/email`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
      }),
    });

    if (res.status !== 200) {
      setError((await res.json()).email.msg);
    } else {
      setError("");
    }
  }

  function isSaveButtonEnable() {
    return email !== newEmail && error === "";
  }

  return (
    <View style={styles.container}>
      <MyHeader title="Email" navigation={navigation} />
      <View style={styles.main}>
        <TextInput
          label="Email"
          style={styles.formInput}
          theme={{
            colors: {
              primary: THEME.secondaryColor,
            },
          }}
          value={newEmail}
          selectionColor={THEME.selectionColor}
          underlineColor={THEME.secondaryColor}
          placeholderTextColor={THEME.secondaryColor}
          onChangeText={handleOnChangeEmail}
        ></TextInput>
        <HelperText type="error" visible={error}>
          {error}
        </HelperText>
        <View style={{ marginVertical: 16 }}>
          <Button
            mode="contained"
            color={THEME.primaryColor}
            theme={{ colors: { primary: "white" } }}
            onPress={handleUpdateEmail}
            disabled={!isSaveButtonEnable()}
          >
            <Text style={{ color: "white", fontFamily:"OpenSans-Bold" }}>Save</Text>
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
