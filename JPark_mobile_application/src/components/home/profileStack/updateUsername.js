import React, { useState, useContext } from "react";
import { View, StyleSheet } from "react-native";
import { Header } from "react-native-elements";
import { TextInput, Button, Text, HelperText } from "react-native-paper";
import { THEME } from "jpark/src/theme";
import { AppContext } from "jpark/src/global";
import * as SecureStore from "expo-secure-store";
import { SERVER_IP } from "jpark/src/config";
import { MyHeader } from "jpark/src/components/header";

export default function UpdateUsername({ route, navigation }) {
  const { username } = route.params;
  const [newUsername, setNewUsername] = useState(username);
  const [error, setError] = useState("");
  const [context, setContext] = useContext(AppContext);

  async function handleUpdateUsername() {
    const accessToken = await SecureStore.getItemAsync("accessToken");
    if (!accessToken) return;

    const res = await fetch(`http://${SERVER_IP}/api/user/username`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
        "Accept-type": "application/json",
      },
      body: JSON.stringify({ username: newUsername }),
    });

    if (res.status === 200) {
      setContext({ ...context, username: newUsername });
      navigation.pop();
    } else {
      setError((await res.json()).username.msg);
    }
  }

  function handleOnChangeUsername(username) {
    setNewUsername(username);
    if (username.length < 6 || username.length > 20) {
      setError("Username's length must be in between 6-20");
    } else {
      setError("");
    }
  }

  function isSaveButtonEnable() {
    return username !== newUsername && error === "";
  }

  return (
    <View style={styles.container}>
      <MyHeader title="Username" navigation={navigation} />
      <View style={styles.main}>
        <TextInput
          label="Username"
          style={styles.formInput}
          theme={{
            colors: {
              primary: THEME.secondaryColor,
            },
          }}
          value={newUsername}
          selectionColor={THEME.selectionColor}
          underlineColor={THEME.secondaryColor}
          placeholderTextColor={THEME.secondaryColor}
          onChangeText={handleOnChangeUsername}
        ></TextInput>
        <HelperText type="error" visible={error}>
          {error}
        </HelperText>
        <View style={{ marginVertical: 16 }}>
          <Button
            mode="contained"
            color={THEME.primaryColor}
            theme={{ colors: { primary: "white" } }}
            onPress={handleUpdateUsername}
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
