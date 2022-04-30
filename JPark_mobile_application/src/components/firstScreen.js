import React from 'react'
import { View, ImageBackground, StyleSheet, StatusBar, Text, Dimensions } from 'react-native'
import { FirstScreenBackground } from "jpark/src/image"
import { Button } from 'react-native-elements/dist/buttons/Button'
import { THEME } from "jpark/src/theme";

export default function FirstScreen({navigation}) {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={THEME.primaryColor}/>
      <ImageBackground source={FirstScreenBackground} resizeMode="stretch" style={styles.imageBg}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>JPark</Text>
          <Text style={styles.subtitle}>Find your carpark easily</Text>
        </View>
      </ImageBackground>
      <View style={styles.buttonContainer}>
        <View style={{marginVertical:8}}></View>
        <Button onPress={()=>navigation.push("Login")} title="Log In" titleStyle={{fontFamily:"OpenSans-Bold", fontSize:18}} buttonStyle={{backgroundColor:THEME.primaryColor}}></Button>
        <View style={{marginVertical:8}}></View>
        <Button onPress={()=>navigation.push("Register")} type="outline" title="New member? Sign Up!" titleStyle={{fontFamily:"OpenSans-Bold", fontSize:18, color:THEME.secondaryTextColor}} buttonStyle={{backgroundColor:"white"}}></Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex:1, 
    marginTop:-4,
    backgroundColor:"white"
  },
  imageBg:{
    width:Dimensions.get('window').width,
    height:Dimensions.get('window').height - 176
  },
  titleContainer: {
    flex: 1,
    marginTop:60,
    textAlign:"center",
    alignItems:"center"
  },
  title:{
    color:"white",
    fontFamily:"OpenSans-Bold",
    fontSize:40
  },
  subtitle:{
    color:"white",
    fontFamily:"OpenSans-Regular",
    fontSize:16,
    marginTop:8,
  },
  buttonContainer:{
    marginHorizontal:16
  }
})
