import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, Button, Text, HelperText } from "react-native-paper";
import { THEME } from "jpark/src/theme";
import * as SecureStore from "expo-secure-store";
import { SERVER_IP } from "jpark/src/config";
import { MyHeader } from "jpark/src/components/header";

export default function UpdateContactNum({ route, navigation }) {
  const { contactNum } = route.params;
  const [newContactNum, setNewContactNum] = useState(contactNum);
  const [error, setError] = useState("");

  async function handleUpdateContactNum() {
    const accessToken = await SecureStore.getItemAsync("accessToken");
    if (!accessToken) return;

    const res = await fetch(`http://${SERVER_IP}/api/user/contactNum`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
        "Accept-type": "application/json",
      },
      body: JSON.stringify({ contactNum: newContactNum }),
    });

    if (res.status === 200) navigation.pop();
    else {
      setError((await res.json()).contactNum.msg);
    }
  }

  function handleOnChangeContact(contact) {
    setNewContactNum(contact);
    if (contact.length === 0) {
      setError("Contact number cannot be empty");
    } else if (!contact.match(/^[0-9]{3}-[0-9]{7,8}$/)) {
      setError("Contact number should be in this format 012-3456789");
    } else {
      setError("");
    }
  }

  function isSaveButtonEnable() {
    return error === "" && newContactNum !== contactNum;
  }

  return (
    <View style={styles.container}>
      <MyHeader title="Contact Number" navigation={navigation} />
      <View style={styles.main}>
        <TextInput
          label="Contact Number"
          style={styles.formInput}
          theme={{
            colors: {
              primary: THEME.secondaryColor,
            },
          }}
          value={newContactNum}
          selectionColor={THEME.selectionColor}
          underlineColor={THEME.secondaryColor}
          placeholderTextColor={THEME.secondaryColor}
          onChangeText={handleOnChangeContact}
        ></TextInput>
        <HelperText type="error" visible={error}>
          {error}
        </HelperText>
        <View style={{ marginVertical: 16 }}>
          <Button
            mode="contained"
            color={THEME.primaryColor}
            theme={{ colors: { primary: "white" } }}
            onPress={handleUpdateContactNum}
            disabled={!isSaveButtonEnable()}
          >
            <Text style={{ color: "white", fontFamily:"OpenSans-Bold"  }}>Save</Text>
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
