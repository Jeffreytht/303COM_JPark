import React from "react"
import { navLocations } from "jpark/src/navigationLocations";
import MapView, {
    PROVIDER_GOOGLE,
    Overlay,
    Marker,
    Polyline,
    MAP_TYPES,
  } from "react-native-maps";
import {View,Text} from "react-native"

export default function RouteSimulation({navigaiton}) {

    let colors = ["red", "blue", "green", "yellow"]
    let floors = {}

    function getPolyline() {
        let polylines = []

        let polyline = []
        const numOfPoints = navLocations.length

        let prevFloor = null;

        console.log("Num of points are " + numOfPoints)

        for (let i = 0 ; i < numOfPoints; i++) {
            const loc = navLocations[i]
            if (!(loc.floorIdentifier in floors)) {
                floors[`${loc.floorIdentifier}`] = colors[Object.keys(floors).length]
            }
    
            if (prevFloor != loc.floorIdentifier) {
                console.log("Floor changed " + loc.floorIdentifier + " " +   i)
                if (i != 0) {
                    polylines.push({
                        key: `polyline${polylines.length}`,
                        polyline: polyline,
                        color: floors[`${prevFloor}`]
                    })
                }
    
                prevFloor = loc.floorIdentifier
                polyline = []
            }  

            polyline.push(loc.coordinate)
        }

        polylines.push({
            key: `polyline${polylines.length}`,
            polyline: polyline,
            color: floors[`${prevFloor}`]
        })
        console.log(floors)
        return polylines
    }

    getPolyline()

    return (
        <View style={{flex: 1}}>
            <MapView
                style={{flex: 1}}
                provider={PROVIDER_GOOGLE}
                region={{
                    latitude: 5.341644, 
                    longitude: 100.281829,
                    latitudeDelta: 0.00075,
                    longitudeDelta: 0.00075,
                }}
            >
                {
                    getPolyline().map((polyline) => (
                        <Polyline
                        key={polyline.key}
                        coordinates={polyline.polyline}
                        strokeColor={polyline.color}
                        zIndex={1001}
                        fillColor={polyline.color}
                        strokeWidth={5}
                        />
                    ))
                }
            </MapView>
        </View>
    )
}