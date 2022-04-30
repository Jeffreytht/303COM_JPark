import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  PermissionsAndroid,
  Text,
  StatusBar,
  Image,
  Alert,
} from "react-native";
import { MyHeader } from "jpark/src/components/header";
import MapView, {
  PROVIDER_GOOGLE,
  Overlay,
  Marker,
  Polyline,
  MAP_TYPES,
} from "react-native-maps";
import { CarIcon } from "jpark/src/image";
import SitumPlugin from "react-native-situm-plugin";
import { isObjEmpty } from "jpark/src/components/utility";
import * as SecureStore from "expo-secure-store";
import { SERVER_IP } from "jpark/src/config";
import { Button } from "react-native-paper";
import { THEME } from "jpark/src/theme";
import { FlatList } from "react-native-gesture-handler";
import { StairIcon, StraightIcon, LeftIcon, RightIcon } from "jpark/src/image";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { navLocations } from "jpark/src/navigationLocations";
import { formatAmPm, getBearing } from "jpark/src/components/utility";

let routeDataIdx = 0;
const debugging = true;
const uploadDebuggingData = false;

export default function PsNavigation({ navigation, route }) {
  const { psInfo } = route.params;
  const [building, setBuilding] = useState({});
  const [_userLoc, _setUserLoc] = useState({});
  const [floors, setFloors] = useState([]);
  const [currFloor, setCurrFloor] = useState({});
  const [_navigationRoute, _setNavigationRoute] = useState([]);
  const [_isNavigating, _setIsNavigating] = useState(false);
  const [navigationMsg, _setNavigationMsg] = useState({});
  const [map, setMap] = useState(null);
  const [_timer, _setTimer] = useState(null)
  const [recenter, setRecenter] = useState(true);
  const [subscriptionId, setSubcriptionId] = useState(-1);
  const [_outOfRouteCount, _setOutOfRouteCount] = useState(0)
  const navigationMsgRef = useRef(navigationMsg);
  const outOfRouteCountRef = useRef(_outOfRouteCount)
  const navigationRouteRef = useRef(_navigationRoute)
  const userLocRef = useRef(_userLoc)
  const isNavigatingRef = useRef(_isNavigating)
  const timerRef = useRef(_timer)

  function setIsNavigating(isNavigating) {
    isNavigatingRef.current = isNavigating
    _setIsNavigating(isNavigating)
  }

  function setTimer(timer) {
    timerRef.current = timer
    _setTimer(timer)
  }

  function setNavigationRoute(navigationRoute) {
    navigationRouteRef.current = navigationRoute;
    _setNavigationRoute(navigationRoute)
  }

  function setUserLoc(userLoc) {
    userLocRef.current = userLoc
    _setUserLoc(userLoc)
  }

  function setNavigationMsg(navigationMsg) {
    navigationMsgRef.current = navigationMsg;
    _setNavigationMsg(navigationMsg);
  }

  function setOutOfRouteCount(outOfRouteCount) {
    outOfRouteCountRef.current = outOfRouteCount;
    _setOutOfRouteCount(outOfRouteCount);
  }

  // *RUN ONLY ONCE INIT PARKING LOT AND FETCH BUILDING
  useEffect(() => {
    async function initParkingLot() {
      const accessToken = await SecureStore.getItemAsync("accessToken");
      const res = await fetch(`http://${SERVER_IP}/api/user/parking-lot`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      const parkingLot = await res.json();
      const floors = parkingLot.floors;
      floors.sort((floor1, floor2) => floor1.level - floor2.level);
      setFloors(floors);
    }

    SitumPlugin.fetchBuildings((buildings) => {
      if (buildings.length == 1) {
        console.log("Building fetched");
        setBuilding(buildings[0]);
      } else {
        console.log("No building found");
      }
    });

    requestLocationPermission();
    SitumPlugin.requestAuthorization();
    console.log("Positioning");

    if (debugging) {
      setUserLoc(navLocations[0]);
    } else {
      setSubcriptionId(SitumPlugin.startPositioning(
        (location) => {
          if (location.floorIdentifier !== "-1") {
            setUserLoc(location);
            SitumPlugin.stopPositioning(subscriptionId);
          }
        },
        (status) => {
          console.log(status);
        },
        (error) => {
          console.log(error);
        },
        {
          useWife: true,
          useBle: true,
          useForegroundService: true,
        }
      ));
    }

    initParkingLot();
    routeDataIdx = 0

    return () => {
      SitumPlugin.stopPositioning(subscriptionId);
    };
  }, []);

  // *RUN ONLY ONCE SET CURR FLOOR TO USER"S FLOOR
  useEffect(() => {
    if (isObjEmpty(floors) || isObjEmpty(_userLoc) || !isObjEmpty(currFloor))
      return;

    const floorId = _userLoc.floorIdentifier;
    if (floorId === "-1") return;

    for (const floor of floors) {
      if (floor._id.toString() === floorId) {
        if (currFloor.id !== floorId)
          return setCurrFloor({ id: floorId, map: floor.map.url });
      }
    }
  }, [floors, _userLoc]);

  // * RUN ONCE TO GET DIRECTION FROM USER LOCATION TO PARKING SPACE
  useEffect(() => {
    if (
      isObjEmpty(building) ||
      isObjEmpty(_userLoc) ||
      isObjEmpty(currFloor) ||
      !isObjEmpty(navigationRouteRef.current)
    )
      return;

    getDirection();
  }, [building, _userLoc, currFloor]);

  // * RECENTER MAP
  useEffect(() => {
    if (isNavigatingRef.current && recenter) {
      setNavigationMsg({ ...navigationMsg });
    }
  }, [recenter]);

  // *RUN ONLY ONCE TO ANIMATE CAMERA TO PARKING LOT
  useEffect(() => {
    if (map && !isObjEmpty(building))
      map.animateCamera({
        center: building.center,
        zoom: 18,
        heading: 0,
      });
  }, [map, building]);

  // *ANIMATE CAMERA WHEN NAV UPDATED
  useEffect(() => {
    if (
      isObjEmpty(navigationMsgRef.current) ||
      !navigationMsgRef.current.previousLocationInRoute ||
      !recenter
    )
      return;

    const bearing = getBearing(
      navigationMsgRef.current.previousLocationInRoute.coordinate,
      navigationMsgRef.current.closestLocationInRoute.coordinate
    );

    for (const floor of floors) {
      if (floor._id.toString() === userLocRef.current.floorIdentifier) {
        if (currFloor.id !== userLocRef.current.floorIdentifier)
          setCurrFloor({
            id: userLocRef.current.floorIdentifier,
            map: floor.map.url,
          });
      }
    }

    map.animateCamera({
      center: navigationMsgRef.current.closestLocationInRoute.coordinate,
      zoom: 20,
      heading: bearing,
    });
  }, [navigationMsg]);

  function getNavigationDuration(sec) {
    if (sec == undefined) return "--";
    return parseInt((sec + 59) / 60);
  }

  function getDirection() {
    SitumPlugin.requestDirections(
      [
        building,
        {
          floorIdentifier: userLocRef.current.floorIdentifier,
          buildingIdentifier: userLocRef.current.buildingIdentifier,
          coordinate: userLocRef.current.coordinate,
        },
        {
          floorIdentifier: `${psInfo.floorId}`,
          buildingIdentifier: userLocRef.current.buildingIdentifier,
          coordinate: {
            latitude: psInfo.coordinate.lat,
            longitude: psInfo.coordinate.lng,
          },
        },
      ],
      (route) => {
        console.log("New route found")
        setOutOfRouteCount(0);
        setNavigationRoute(route.segments);

        if (isNavigatingRef.current) {
          console.log("Stopping")
          stopNavigation()
          console.log("Starting")
          startNavigation()
        }
      },
      (error) => {
        console.log(error);
      }
    );
  }

  function stopNavigation() {
    SitumPlugin.stopPositioning(subscriptionId);
    SitumPlugin.removeNavigationUpdates();
    clearInterval(timerRef.current)
    setIsNavigating(false);
  }

  function getBound(bounds) {
    let minLatitude = Number.MAX_VALUE;
    let minLongitude = Number.MAX_VALUE;
    let maxLatitude = Number.MIN_VALUE;
    let maxLongitude = Number.MIN_VALUE;

    for (const bound in bounds) {
      minLatitude = Math.min(bounds[bound].latitude, minLatitude);
      minLongitude = Math.min(bounds[bound].longitude, minLongitude);
      maxLatitude = Math.max(bounds[bound].latitude, maxLatitude);
      maxLongitude = Math.max(bounds[bound].longitude, maxLongitude);
    }

    return [
      [minLatitude, minLongitude],
      [maxLatitude, maxLongitude],
    ];
  }

  function getDirectionIcon(orientationType) {
    if (!orientationType) return null;
    if (orientationType === "STRAIGHT") return StraightIcon;
    if (orientationType === "LEFT") return LeftIcon;
    if (orientationType === "RIGHT") return RightIcon;
  }

  function getPolyline(navigationRoute, currFloor) {
    let polyline = [];
    for (let segment of navigationRoute) {
      let latLngs = [];
      if (segment.floorIdentifier === currFloor.id) {
        for (let point of segment.points) {
          latLngs.push({
            latitude: point.coordinate.latitude,
            longitude: point.coordinate.longitude,
          });
        }
        polyline.push(latLngs);
      }
    }
    return polyline;
  }

  function getStairMarker(navigationRoute, currFloor) {
    let coordinates = [];
    for (let i = 0; i < navigationRoute.length; i++) {
      if (navigationRoute[i].floorIdentifier === currFloor.id) {
        const points = navigationRoute[i].points;
        if (i !== 0) {
          coordinates.push(points[0].coordinate);
        }

        if (i !== navigationRoute.length - 1) {
          coordinates.push(points[points.length - 1].coordinate);
        }
      }
    }
    return coordinates;
  }

  async function requestLocationPermission() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        navigation.pop();
      }
    } catch (err) {
      navigation.pop();
    }
  }

  async function uploadUserLoc(userLoc) {
    const res = await fetch(`http://${SERVER_IP}/api/user/navigation/entry`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        msg: userLoc,
      }),
    });
  }

  function startNavigation() {
    setRecenter(true);
    setIsNavigating(true);
    if (debugging) {
      setTimer(setInterval(() => {
        setUserLoc(navLocations[routeDataIdx]);
        SitumPlugin.updateNavigationWithLocation(
          navLocations[routeDataIdx],
          (_) => {}
        );
        routeDataIdx += 5;
        if (routeDataIdx >= navLocations.length) {
          clearInterval(timerRef.current)
        };

      }, 500));

    } else {
      setSubcriptionId(SitumPlugin.startPositioning(
        (location) => {
          setUserLoc(location);
          if (uploadDebuggingData) uploadUserLoc(location);
          SitumPlugin.updateNavigationWithLocation(location, (_) => {});
        },
        (status) => {
          console.log(status);
        },
        (error) => {
          console.log(error);
        },
        {
          useWife: true,
          useBle: true,
          useForegroundService: true,
        }
      ));
    }

    SitumPlugin.requestNavigationUpdates(
      (nav) => {
        console.log(nav.type)
        if (
          nav.currentIndication != undefined ||
          nav.currentIndication != null
        ) {
          setNavigationMsg({
            previousLocationInRoute:
              navigationMsgRef.current.closestLocationInRoute,
            closestLocationInRoute: nav.closestLocationInRoute,
            msg: nav.currentIndication.humanReadableMessage,
            orientationType: nav.currentIndication.orientationType,
            distance: Math.ceil(parseFloat(nav.distanceToGoal)),
            time: Math.ceil(parseFloat(nav.distanceToGoal) * 0.12),
          });
        } else {
          if (nav.type === "userOutsideRoute") {
            if (outOfRouteCountRef.current == 2) {
              console.log("Getting new direction")
              getDirection();
            } else {
              setOutOfRouteCount(outOfRouteCountRef.current + 1);
            }

          } else if (nav.type === "destinationReached") {
            stopNavigation();
            Alert.alert("Arrived", "You can unlock your bay now");
            navigation.pop();
          }
        }
      },
      (error) => {
        console.log("Navigation Updates error");
      },
      {
        distanceToGoalThreshold: 20,
        outsideRouteThreshold: 20,
      }
    );
  }

  function getNavigationETA(sec) {
    if (sec == undefined) return "--:--";
    return formatAmPm(new Date(Date.now() + sec * 1000));
  }

  return (
    <View style={styles.map}>
      {isNavigatingRef.current ? (
        <View style={{ height: StatusBar.currentHeight }}></View>
      ) : (
        <MyHeader title="Navigation" navigation={navigation} />
      )}
      <View style={styles.map}>
        {!isObjEmpty(building) && (
          <MapView
            ref={(ref) => setMap(ref)}
            mapType={MAP_TYPES.SATELLITE}
            style={styles.mapContainer}
            provider={PROVIDER_GOOGLE}
            showsIndoorLevelPicker={true}
            toolbarEnabled={false}
            onPanDrag={() => {
              if (isNavigatingRef.current && recenter) setRecenter(false);
            }}
          >
            {!isObjEmpty(currFloor) && (
              <Overlay
                image={currFloor.map}
                bounds={[
                  [
                    building.bounds.southWest.latitude,
                    building.bounds.southWest.longitude,
                  ],
                  [
                    building.bounds.northEast.latitude,
                    building.bounds.northEast.longitude,
                  ],
                ]}
                zIndex={1000}
                location={[building.center.latitude, building.center.longitude]}
                bearing={(building.rotation * 180) / Math.PI}
                anchor={[0.5, 0.5]}
                width={building.dimensions.width}
                height={building.dimensions.height}
              />
            )}

            {!isObjEmpty(currFloor) &&
              psInfo.floorId.toString() === currFloor.id && (
                <Marker
                  key={psInfo._id}
                  coordinate={{
                    latitude: psInfo.coordinate.lat,
                    longitude: psInfo.coordinate.lng,
                  }}
                  tracksViewChanges={false}
                  title={psInfo.name}
                  zIndex={1}
                ></Marker>
              )}
            {!isObjEmpty(userLocRef.current) &&
              userLocRef.current.floorIdentifier === currFloor.id && (
                <Marker
                  key={0}
                  coordinate={userLocRef.current.coordinate}
                  tracksViewChanges={false}
                  title="You"
                  icon={CarIcon}
                  zIndex={1}
                ></Marker>
              )}
            {!isObjEmpty(navigationRouteRef.current) &&
              !isObjEmpty(currFloor) &&
              getStairMarker(navigationRouteRef.current, currFloor).map(
                (coordinate, index) => (
                  <Marker
                    key={`stair${index}`}
                    coordinate={coordinate}
                    icon={StairIcon}
                  ></Marker>
                )
              )}
            {!isObjEmpty(navigationRouteRef.current) &&
              !isObjEmpty(currFloor) &&
              getPolyline(navigationRouteRef.current, currFloor).map((polyline, index) => (
                <Polyline
                  key={`polyline${index}}`}
                  coordinates={polyline}
                  strokeColor="#007fff"
                  zIndex={1001}
                  fillColor="rgba(255,0,0,0.5)"
                  strokeWidth={3}
                />
              ))}
          </MapView>
        )}

        <View
          style={{
            position: "absolute",
            bottom: 32,
            left: 16,
            backgroundColor: "white",
          }}
        >
          <FlatList
            keyExtractor={(item) => item._id.toString()}
            data={floors}
            renderItem={({ item }) => {
              if (
                !isObjEmpty(currFloor) &&
                currFloor.id === item._id.toString()
              ) {
                return (
                  <Button
                    mode="contained"
                    labelStyle={{ color: "white", fontFamily:"OpenSans-Bold"}}
                    style={{
                      padding: 4,
                      backgroundColor: THEME.primaryColor,
                      borderColor: THEME.secondaryColor,
                      borderRadius: 0,
                      borderWidth: 0.5,
                    }}
                    onPress={() => {
                      if (isNavigatingRef.current && recenter) {
                        setRecenter(false);
                      }

                      setCurrFloor({
                        id: item._id.toString(),
                        map: item.map.url,
                      });
                    }}
                  >
                    {item.name}
                  </Button>
                );
              }

              return (
                <Button
                  mode="contained"
                  labelStyle={{
                    color: THEME.secondaryColor,
                    fontFamily:"OpenSans-Bold"
                  }}
                  onPress={() => {
                    if (isNavigatingRef.current && recenter) {
                      setRecenter(false);
                    }

                    setCurrFloor({
                      id: item._id.toString(),
                      map: item.map.url,
                    });
                  }}
                  style={{
                    padding: 4,
                    backgroundColor: "#fae5df",
                    borderColor: THEME.secondaryColor,
                    borderWidth: 0.5,
                    borderRadius: 0,
                  }}
                >
                  {item.name}
                </Button>
              );
            }}
          />
        </View>

        {isNavigatingRef.current && !recenter && (
          <View style={{ position: "absolute", right: 16, bottom: 32 }}>
            <Button
              mode="contained"
              style={{ backgroundColor: THEME.primaryColor }}
              onPress={() => {
                for (const floor of floors) {
                  if (floor._id.toString() === userLocRef.current.floorIdentifier) {
                    if (currFloor.id !== userLocRef.current.floorIdentifier)
                      setCurrFloor({
                        id: userLocRef.current.floorIdentifier,
                        map: floor.map.url,
                      });
                  }
                }
                setRecenter(true);
              }}
            >
              <Icon
                name="navigation"
                type="material"
                color="white"
                style={{ marginRight: 16 }}
                size={14}
              />
              Recenter
            </Button>
          </View>
        )}

        {isNavigatingRef.current && navigationMsg.msg && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              padding: 8,
              width: "100%",
            }}
          >
            <View
              style={{
                borderRadius: 10,
                backgroundColor: THEME.primaryColor,
                padding: 16,
                width: "100%",
                alignItems: "center",
                flexDirection: "row",
                flex: 1,
                borderColor: "white",
                borderWidth: 1,
              }}
            >
              <Image
                source={getDirectionIcon(navigationMsg.orientationType)}
                style={{ height: 28, width: 28, marginRight: 16 }}
              />
              <Text
                style={{
                  flexShrink: 1,
                  color: "white",
                  fontSize: 24,
                  fontFamily:"OpenSans-Bold",
                }}
              >
                {navigationMsg.msg}
              </Text>
            </View>
          </View>
        )}
      </View>

      {!isNavigatingRef.current && (
        <View style={{ backgroundColor: "white", padding: 16 }}>
          <Button
            mode="contained"
            style={{ backgroundColor: THEME.primaryColor }}
            labelStyle={{fontFamily:"OpenSans-Bold"}}
            disabled={isObjEmpty(navigationRouteRef.current)}
            onPress={() => {
              startNavigation()
            }}
          >
            Start navigation
          </Button>
        </View>
      )}

      {isNavigatingRef.current && (
        <View
          style={{
            backgroundColor: "white",
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Button
            mode="outlined"
            style={{
              backgroundColor: "white",
              width: 50,
              borderRadius: 25,
              marginRight: 32,
            }}
            onPress={stopNavigation}
          >
            <Icon
              name="close"
              type="material"
              color={THEME.primaryColor}
              size={24}
            />
          </Button>
          <View style={{ justifyContent: "center" }}>
            <Text
              style={{
                fontSize: 24,
                color: THEME.primaryColor,
                fontFamily:"OpenSans-Bold"
              }}
            >
              {getNavigationDuration(navigationMsg.time)} min
            </Text>
            <Text style={{ fontSize: 16, color: THEME.secondaryColor, fontFamily:"OpenSans-Regular" }}>
              {navigationMsg.distance ?? "--"} m •{" "}
              {getNavigationETA(navigationMsg.time)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

// *Sample Response
/* 

!PS Info
{
  "_id": 79802,
  "category": "Parking",
  "coordinate": {
    "lat": 5.2700924419206,
    "lng": 100.501992973924
  },
  "cost": 0,
  "createdAt": "2021-09-18T14:23:20.064Z",
  "floorId": 23305,
  "floorMap": "https://dashboard.situm.com/uploads/floor/23305/7a703036-9ffd-4b4d-95e0-3099f62c6dc7.png",
  "floorName": "F1",
  "name": "A2",
  "pos": {
    "x": 17.6081219053126,
    "y": 17.8492170930091
  },
  "reservation": {
    "_id": "611a885abb8584142024f421",
    "contactNum": "012-4727438",
    "dateTime": "2021-09-22T13:43:00.000Z",
    "duration": 1,
    "email": "tanhoetheng@gmail.com",
    "username": "Jeffrey Tan"
  },
  "state": "reserved",
  "updatedAt": "2021-09-22T13:43:10.391Z"
}


!User location
{
  "accuracy": 2.393653631210327,
  "bearing": {
    "degrees": 382.00082777147617,
    "degreesClockwise": -22.000827771476168,
    "radians": 6.667172189956052,
    "radiansMinusPiPi": 0.3839868827764654
  },
  "bearingQuality": "HIGH",
  "buildingIdentifier": "8954",
  "cartesianBearing": {
    "degrees": 84.5477752685547,
    "degreesClockwise": 275.4522247314453,
    "radians": 1.4756370536725123,
    "radiansMinusPiPi": 1.4756370536725123
  },
  "cartesianCoordinate": {
    "x": 121.5,
    "y": 1.5
  },
  "coordinate": {
    "latitude": 5.269682926803851,
    "longitude": 100.50284893555623
  },
  "deviceId": "94842430621",
  "floorIdentifier": "23305",
  "hasBearing": true,
  "hasCartesianBearing": true,
  "isIndoor": true,
  "isOutdoor": false,
  "position": {
    "buildingIdentifier": "8954",
    "cartesianCoordinate": {
      "x": 121.5,
      "y": 1.5
    },
    "coordinate": {
      "latitude": 5.269682926803851,
      "longitude": 100.50284893555623
    },
    "floorIdentifier": "23305",
    "isIndoor": true,
    "isOutdoor": false
  },
  "provider": "SITUM_PROVIDER",
  "quality": "HIGH",
  "timestamp": "1632240288839"
}

! Building
{
  "updatedAt": "Mon Aug 09 12:40:12 +0800 2021",
  "createdAt": "Sun Jul 18 21:16:48 +0800 2021",
  "buildingIdentifier": "8954",
  "userIdentifier": "-1",
  "center": {
    "longitude": 100.502595802754,
    "latitude": 5.26986649136563
  },
  "rotation": 0.288827634266785,
  "pictureUrl": "",
  "customFields": {},
  "bounds": {
    "southEast": {
      "longitude": 100.50339705268318,
      "latitude": 5.26974924041485
    },
    "northWest": {
      "longitude": 100.5017945527621,
      "latitude": 5.269983742314979
    },
    "southWest": {
      "longitude": 100.5017945527621,
      "latitude": 5.26974924041485
    },
    "northEast": {
      "longitude": 100.50339705268318,
      "latitude": 5.269983742314979
    }
  },
  "address": "",
  "dimensions": {
    "height": 25.9320737514332,
    "width": 177.640417107835
  },
  "name": "Parking Lot",
  "infoHtml": "",
  "boundsRotated": {
    "southEast": {
      "longitude": 100.50333054817153,
      "latitude": 5.269525324278946
    },
    "northWest": {
      "longitude": 100.50186105732107,
      "latitude": 5.270207658450883
    },
    "southWest": {
      "longitude": 100.5017944262058,
      "latitude": 5.2699828699792075
    },
    "northEast": {
      "longitude": 100.50339717932121,
      "latitude": 5.2697501127506206
    }
  },
  "pictureThumbUrl": ""
}


!Route
{
  "TO": {
    "isOutdoor": false,
    "coordinate": {
      "longitude": 100.501932624221,
      "latitude": 5.27010713170941
    },
    "isIndoor": true,
    "cartesianCoordinate": {
      "y": 17.535573959350586,
      "x": 10.771053314208984
    },
    "floorIdentifier": "23305",
    "buildingIdentifier": "8954"
  },
  "indications": [
    {
      "humanReadableMessage": "Go ahead for 1 metre",
      "stepIdxOrigin": 1,
      "distance": 0.7757152440320213,
      "orientation": 0.019147491314531334,
      "neededLevelChange": false,
      "distanceToNextLevel": 0,
      "orientationType": "STRAIGHT",
      "stepIdxDestination": 1,
      "indicationType": "GO_AHEAD"
    },
    {
      "humanReadableMessage": "Turn right and go ahead for 7 metres",
      "stepIdxOrigin": 2,
      "distance": 6.759886046957699,
      "orientation": -1.5707963267948981,
      "neededLevelChange": false,
      "distanceToNextLevel": 0,
      "orientationType": "RIGHT",
      "stepIdxDestination": 2,
      "indicationType": "TURN"
    },
    {
      "humanReadableMessage": "Turn right and go ahead for 79 metres",
      "stepIdxOrigin": 3,
      "distance": 78.314,
      "orientation": -1.5899438181094268,
      "neededLevelChange": false,
      "distanceToNextLevel": 0,
      "orientationType": "RIGHT",
      "stepIdxDestination": 3,
      "indicationType": "TURN"
    },
    {
      "humanReadableMessage": "Turn right and go ahead for 11 metres",
      "stepIdxOrigin": 4,
      "distance": 10.614127378169155,
      "orientation": -1.565897176241827,
      "neededLevelChange": false,
      "distanceToNextLevel": 0,
      "orientationType": "RIGHT",
      "stepIdxDestination": 4,
      "indicationType": "TURN"
    },
    {
      "nextLevel": 0,
      "humanReadableMessage": "Go down to floor 0",
      "stepIdxOrigin": 5,
      "distance": 0,
      "orientation": 2.634685190683399,
      "neededLevelChange": true,
      "distanceToNextLevel": -1,
      "orientationType": "BACKWARD",
      "stepIdxDestination": 5,
      "indicationType": "CHANGE_FLOOR"
    },
    {
      "humanReadableMessage": "Go ahead for 11 metres",
      "stepIdxOrigin": 6,
      "distance": 10.432107409339686,
      "orientation": 0,
      "neededLevelChange": false,
      "distanceToNextLevel": 0,
      "orientationType": "STRAIGHT",
      "stepIdxDestination": 6,
      "indicationType": "GO_AHEAD"
    },
    {
      "humanReadableMessage": "Turn right and go ahead for 124 metres",
      "stepIdxOrigin": 7,
      "distance": 123.5461644392351,
      "orientation": -1.5833634598171633,
      "neededLevelChange": false,
      "distanceToNextLevel": 0,
      "orientationType": "RIGHT",
      "stepIdxDestination": 8,
      "indicationType": "TURN"
    },
    {
      "humanReadableMessage": "Turn right and go ahead for 22 metres",
      "stepIdxOrigin": 9,
      "distance": 21.108705028968497,
      "orientation": -1.5475945702186868,
      "neededLevelChange": false,
      "distanceToNextLevel": 0,
      "orientationType": "RIGHT",
      "stepIdxDestination": 9,
      "indicationType": "TURN"
    },
    {
      "humanReadableMessage": "Turn right and go ahead for 171 metres",
      "stepIdxOrigin": 10,
      "distance": 170.39538665703367,
      "orientation": -1.5981322090450982,
      "neededLevelChange": false,
      "distanceToNextLevel": 0,
      "orientationType": "RIGHT",
      "stepIdxDestination": 10,
      "indicationType": "TURN"
    },
    {
      "humanReadableMessage": "Turn right and go ahead for 21 metres",
      "stepIdxOrigin": 11,
      "distance": 20.196057040917665,
      "orientation": -1.5710426896013472,
      "neededLevelChange": false,
      "distanceToNextLevel": 0,
      "orientationType": "RIGHT",
      "stepIdxDestination": 11,
      "indicationType": "TURN"
    },
    {
      "humanReadableMessage": "Turn right and go ahead for 8 metres",
      "stepIdxOrigin": 12,
      "distance": 7.213860949394551,
      "orientation": -1.5609633649016184,
      "neededLevelChange": false,
      "distanceToNextLevel": 0,
      "orientationType": "RIGHT",
      "stepIdxDestination": 12,
      "indicationType": "TURN"
    },
    {
      "humanReadableMessage": "Turn right and go ahead for 6 metres",
      "stepIdxOrigin": 13,
      "distance": 5.417364542072367,
      "orientation": -1.5707963267948963,
      "neededLevelChange": false,
      "distanceToNextLevel": 0,
      "orientationType": "RIGHT",
      "stepIdxDestination": 13,
      "indicationType": "TURN"
    }
  ],
  "steps": [
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50292716124338,
          "latitude": 5.269731715583155
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 9.141646908394,
          "x": 128.27557304952362
        },
        "floorIdentifier": "23306",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50292041639182,
          "latitude": 5.269733584474924
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 9.126794815063477,
          "x": 127.5
        },
        "floorIdentifier": "23306",
        "buildingIdentifier": "8954"
      },
      "isFirst": true,
      "id": 1,
      "distanceToGoal": 454.9832723301991,
      "distance": 0.7757152440320213
    },
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50291091441012,
          "latitude": 5.269672795869867
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 2.383,
          "x": 128.405
        },
        "floorIdentifier": "23306",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50292716124338,
          "latitude": 5.269731715583155
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 9.141646908394,
          "x": 128.27557304952362
        },
        "floorIdentifier": "23306",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 2,
      "distanceToGoal": 454.20755708616707,
      "distance": 6.759886046957699
    },
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50223370447212,
          "latitude": 5.2698745080454445
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 2.383,
          "x": 50.091
        },
        "floorIdentifier": "23306",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50291091441012,
          "latitude": 5.269672795869867
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 2.383,
          "x": 128.405
        },
        "floorIdentifier": "23306",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 3,
      "distanceToGoal": 447.44767103920935,
      "distance": 78.314
    },
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.5022605269229,
          "latitude": 5.269966647924827
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 12.997,
          "x": 50.039
        },
        "floorIdentifier": "23306",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50223370447212,
          "latitude": 5.2698745080454445
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 2.383,
          "x": 50.091
        },
        "floorIdentifier": "23306",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 4,
      "distanceToGoal": 369.13367103920933,
      "distance": 10.614127378169155
    },
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.5022591807744,
          "latitude": 5.269965313083447
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 12.813,
          "x": 49.938
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.5022605269229,
          "latitude": 5.269966647924827
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 12.997,
          "x": 50.039
        },
        "floorIdentifier": "23306",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 5,
      "distanceToGoal": 358.5195436610402,
      "distance": 0.20989759407863529
    },
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50228466826076,
          "latitude": 5.2700561242272475
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 23.244,
          "x": 49.786
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.5022591807744,
          "latitude": 5.269965313083447
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 12.813,
          "x": 49.938
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 6,
      "distanceToGoal": 358.30964606696153,
      "distance": 10.432107409339686
    },
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50296057943632,
          "latitude": 5.269855808347739
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 23.351,
          "x": 127.918
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50228466826076,
          "latitude": 5.2700561242272475
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 23.244,
          "x": 49.786
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 7,
      "distanceToGoal": 347.87753865762187,
      "distance": 78.13207326700092
    },
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50335352485249,
          "latitude": 5.2697396249896356
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 23.442,
          "x": 173.332
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50296057943632,
          "latitude": 5.269855808347739
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 23.351,
          "x": 127.918
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 8,
      "distanceToGoal": 269.74546539062095,
      "distance": 45.41409117223419
    },
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50330390476904,
          "latitude": 5.2695553350717885
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 2.34,
          "x": 173.864
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50335352485249,
          "latitude": 5.2697396249896356
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 23.442,
          "x": 173.332
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 9,
      "distanceToGoal": 224.33137421838674,
      "distance": 21.108705028968497
    },
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50183136914289,
          "latitude": 5.269997365506962
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 2.703,
          "x": 3.469
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50330390476904,
          "latitude": 5.2695553350717885
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 2.34,
          "x": 173.864
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 10,
      "distanceToGoal": 203.22266918941824,
      "distance": 170.39538665703367
    },
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50188367678729,
          "latitude": 5.270172308016551
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 22.899,
          "x": 3.517
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50183136914289,
          "latitude": 5.269997365506962
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 2.703,
          "x": 3.469
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 11,
      "distanceToGoal": 32.82728253238459,
      "distance": 20.196057040917665
    },
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50194619417972,
          "latitude": 5.270154194147784
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 22.952787910803483,
          "x": 10.730660420192445
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50188367678729,
          "latitude": 5.270172308016551
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 22.899,
          "x": 3.517
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 12,
      "distanceToGoal": 12.631225491466918,
      "distance": 7.213860949394551
    },
    {
      "isLast": true,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.501932624221,
          "latitude": 5.27010713170941
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 17.535573959350586,
          "x": 10.771053314208984
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50194619417972,
          "latitude": 5.270154194147784
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 22.952787910803483,
          "x": 10.730660420192445
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 13,
      "distanceToGoal": 5.417364542072367,
      "distance": 5.417364542072367
    }
  ],
  "nodes": [
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50292041639182,
        "latitude": 5.269733584474924
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 9.126794815063477,
        "x": 127.5
      },
      "floorIdentifier": "23306",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50292716124338,
        "latitude": 5.269731715583155
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 9.141646908394,
        "x": 128.27557304952362
      },
      "floorIdentifier": "23306",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50291091441012,
        "latitude": 5.269672795869867
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 2.383,
        "x": 128.405
      },
      "floorIdentifier": "23306",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50223370447212,
        "latitude": 5.2698745080454445
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 2.383,
        "x": 50.091
      },
      "floorIdentifier": "23306",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.5022605269229,
        "latitude": 5.269966647924827
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 12.997,
        "x": 50.039
      },
      "floorIdentifier": "23306",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.5022591807744,
        "latitude": 5.269965313083447
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 12.813,
        "x": 49.938
      },
      "floorIdentifier": "23305",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50228466826076,
        "latitude": 5.2700561242272475
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 23.244,
        "x": 49.786
      },
      "floorIdentifier": "23305",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50296057943632,
        "latitude": 5.269855808347739
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 23.351,
        "x": 127.918
      },
      "floorIdentifier": "23305",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50335352485249,
        "latitude": 5.2697396249896356
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 23.442,
        "x": 173.332
      },
      "floorIdentifier": "23305",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50330390476904,
        "latitude": 5.2695553350717885
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 2.34,
        "x": 173.864
      },
      "floorIdentifier": "23305",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50183136914289,
        "latitude": 5.269997365506962
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 2.703,
        "x": 3.469
      },
      "floorIdentifier": "23305",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50188367678729,
        "latitude": 5.270172308016551
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 22.899,
        "x": 3.517
      },
      "floorIdentifier": "23305",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50194619417972,
        "latitude": 5.270154194147784
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 22.952787910803483,
        "x": 10.730660420192445
      },
      "floorIdentifier": "23305",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.501932624221,
        "latitude": 5.27010713170941
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 17.535573959350586,
        "x": 10.771053314208984
      },
      "floorIdentifier": "23305",
      "buildingIdentifier": "8954"
    }
  ],
  "lastStep": {
    "isLast": true,
    "TO": {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.501932624221,
        "latitude": 5.27010713170941
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 17.535573959350586,
        "x": 10.771053314208984
      },
      "floorIdentifier": "23305",
      "buildingIdentifier": "8954"
    },
    "from": {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50194619417972,
        "latitude": 5.270154194147784
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 22.952787910803483,
        "x": 10.730660420192445
      },
      "floorIdentifier": "23305",
      "buildingIdentifier": "8954"
    },
    "isFirst": false,
    "id": 13,
    "distanceToGoal": 5.417364542072367,
    "distance": 5.417364542072367
  },
  "points": [
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50292041639182,
        "latitude": 5.269733584474924
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 9.126794815063477,
        "x": 127.5
      },
      "floorIdentifier": "23306",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50292716124338,
        "latitude": 5.269731715583155
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 9.141646908394,
        "x": 128.27557304952362
      },
      "floorIdentifier": "23306",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50291091441012,
        "latitude": 5.269672795869867
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 2.383,
        "x": 128.405
      },
      "floorIdentifier": "23306",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50223370447212,
        "latitude": 5.2698745080454445
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 2.383,
        "x": 50.091
      },
      "floorIdentifier": "23306",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.5022605269229,
        "latitude": 5.269966647924827
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 12.997,
        "x": 50.039
      },
      "floorIdentifier": "23306",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.5022591807744,
        "latitude": 5.269965313083447
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 12.813,
        "x": 49.938
      },
      "floorIdentifier": "23305",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50228466826076,
        "latitude": 5.2700561242272475
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 23.244,
        "x": 49.786
      },
      "floorIdentifier": "23305",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50296057943632,
        "latitude": 5.269855808347739
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 23.351,
        "x": 127.918
      },
      "floorIdentifier": "23305",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50335352485249,
        "latitude": 5.2697396249896356
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 23.442,
        "x": 173.332
      },
      "floorIdentifier": "23305",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50330390476904,
        "latitude": 5.2695553350717885
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 2.34,
        "x": 173.864
      },
      "floorIdentifier": "23305",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50183136914289,
        "latitude": 5.269997365506962
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 2.703,
        "x": 3.469
      },
      "floorIdentifier": "23305",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50188367678729,
        "latitude": 5.270172308016551
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 22.899,
        "x": 3.517
      },
      "floorIdentifier": "23305",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50194619417972,
        "latitude": 5.270154194147784
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 22.952787910803483,
        "x": 10.730660420192445
      },
      "floorIdentifier": "23305",
      "buildingIdentifier": "8954"
    },
    {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.501932624221,
        "latitude": 5.27010713170941
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 17.535573959350586,
        "x": 10.771053314208984
      },
      "floorIdentifier": "23305",
      "buildingIdentifier": "8954"
    }
  ],
  "from": {
    "isOutdoor": false,
    "coordinate": {
      "longitude": 100.50292041639182,
      "latitude": 5.269733584474924
    },
    "isIndoor": true,
    "cartesianCoordinate": {
      "y": 9.126794815063477,
      "x": 127.5
    },
    "floorIdentifier": "23306",
    "buildingIdentifier": "8954"
  },
  "segments": [
    {
      "points": [
        {
          "isOutdoor": false,
          "coordinate": {
            "longitude": 100.50292041639182,
            "latitude": 5.269733584474924
          },
          "isIndoor": true,
          "cartesianCoordinate": {
            "y": 9.126794815063477,
            "x": 127.5
          },
          "floorIdentifier": "23306",
          "buildingIdentifier": "8954"
        },
        {
          "isOutdoor": false,
          "coordinate": {
            "longitude": 100.50292716124338,
            "latitude": 5.269731715583155
          },
          "isIndoor": true,
          "cartesianCoordinate": {
            "y": 9.141646908394,
            "x": 128.27557304952362
          },
          "floorIdentifier": "23306",
          "buildingIdentifier": "8954"
        },
        {
          "isOutdoor": false,
          "coordinate": {
            "longitude": 100.50291091441012,
            "latitude": 5.269672795869867
          },
          "isIndoor": true,
          "cartesianCoordinate": {
            "y": 2.383,
            "x": 128.405
          },
          "floorIdentifier": "23306",
          "buildingIdentifier": "8954"
        },
        {
          "isOutdoor": false,
          "coordinate": {
            "longitude": 100.50223370447212,
            "latitude": 5.2698745080454445
          },
          "isIndoor": true,
          "cartesianCoordinate": {
            "y": 2.383,
            "x": 50.091
          },
          "floorIdentifier": "23306",
          "buildingIdentifier": "8954"
        },
        {
          "isOutdoor": false,
          "coordinate": {
            "longitude": 100.5022605269229,
            "latitude": 5.269966647924827
          },
          "isIndoor": true,
          "cartesianCoordinate": {
            "y": 12.997,
            "x": 50.039
          },
          "floorIdentifier": "23306",
          "buildingIdentifier": "8954"
        }
      ],
      "floorIdentifier": "23306"
    },
    {
      "points": [
        {
          "isOutdoor": false,
          "coordinate": {
            "longitude": 100.5022591807744,
            "latitude": 5.269965313083447
          },
          "isIndoor": true,
          "cartesianCoordinate": {
            "y": 12.813,
            "x": 49.938
          },
          "floorIdentifier": "23305",
          "buildingIdentifier": "8954"
        },
        {
          "isOutdoor": false,
          "coordinate": {
            "longitude": 100.50228466826076,
            "latitude": 5.2700561242272475
          },
          "isIndoor": true,
          "cartesianCoordinate": {
            "y": 23.244,
            "x": 49.786
          },
          "floorIdentifier": "23305",
          "buildingIdentifier": "8954"
        },
        {
          "isOutdoor": false,
          "coordinate": {
            "longitude": 100.50296057943632,
            "latitude": 5.269855808347739
          },
          "isIndoor": true,
          "cartesianCoordinate": {
            "y": 23.351,
            "x": 127.918
          },
          "floorIdentifier": "23305",
          "buildingIdentifier": "8954"
        },
        {
          "isOutdoor": false,
          "coordinate": {
            "longitude": 100.50335352485249,
            "latitude": 5.2697396249896356
          },
          "isIndoor": true,
          "cartesianCoordinate": {
            "y": 23.442,
            "x": 173.332
          },
          "floorIdentifier": "23305",
          "buildingIdentifier": "8954"
        },
        {
          "isOutdoor": false,
          "coordinate": {
            "longitude": 100.50330390476904,
            "latitude": 5.2695553350717885
          },
          "isIndoor": true,
          "cartesianCoordinate": {
            "y": 2.34,
            "x": 173.864
          },
          "floorIdentifier": "23305",
          "buildingIdentifier": "8954"
        },
        {
          "isOutdoor": false,
          "coordinate": {
            "longitude": 100.50183136914289,
            "latitude": 5.269997365506962
          },
          "isIndoor": true,
          "cartesianCoordinate": {
            "y": 2.703,
            "x": 3.469
          },
          "floorIdentifier": "23305",
          "buildingIdentifier": "8954"
        },
        {
          "isOutdoor": false,
          "coordinate": {
            "longitude": 100.50188367678729,
            "latitude": 5.270172308016551
          },
          "isIndoor": true,
          "cartesianCoordinate": {
            "y": 22.899,
            "x": 3.517
          },
          "floorIdentifier": "23305",
          "buildingIdentifier": "8954"
        },
        {
          "isOutdoor": false,
          "coordinate": {
            "longitude": 100.50194619417972,
            "latitude": 5.270154194147784
          },
          "isIndoor": true,
          "cartesianCoordinate": {
            "y": 22.952787910803483,
            "x": 10.730660420192445
          },
          "floorIdentifier": "23305",
          "buildingIdentifier": "8954"
        },
        {
          "isOutdoor": false,
          "coordinate": {
            "longitude": 100.501932624221,
            "latitude": 5.27010713170941
          },
          "isIndoor": true,
          "cartesianCoordinate": {
            "y": 17.535573959350586,
            "x": 10.771053314208984
          },
          "floorIdentifier": "23305",
          "buildingIdentifier": "8954"
        }
      ],
      "floorIdentifier": "23305"
    }
  ],
  "firstStep": {
    "isLast": false,
    "TO": {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50292716124338,
        "latitude": 5.269731715583155
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 9.141646908394,
        "x": 128.27557304952362
      },
      "floorIdentifier": "23306",
      "buildingIdentifier": "8954"
    },
    "from": {
      "isOutdoor": false,
      "coordinate": {
        "longitude": 100.50292041639182,
        "latitude": 5.269733584474924
      },
      "isIndoor": true,
      "cartesianCoordinate": {
        "y": 9.126794815063477,
        "x": 127.5
      },
      "floorIdentifier": "23306",
      "buildingIdentifier": "8954"
    },
    "isFirst": true,
    "id": 1,
    "distanceToGoal": 454.9832723301991,
    "distance": 0.7757152440320213
  },
  "edges": [
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50292716124338,
          "latitude": 5.269731715583155
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 9.141646908394,
          "x": 128.27557304952362
        },
        "floorIdentifier": "23306",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50292041639182,
          "latitude": 5.269733584474924
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 9.126794815063477,
          "x": 127.5
        },
        "floorIdentifier": "23306",
        "buildingIdentifier": "8954"
      },
      "isFirst": true,
      "id": 1,
      "distanceToGoal": 454.9832723301991,
      "distance": 0.7757152440320213
    },
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50291091441012,
          "latitude": 5.269672795869867
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 2.383,
          "x": 128.405
        },
        "floorIdentifier": "23306",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50292716124338,
          "latitude": 5.269731715583155
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 9.141646908394,
          "x": 128.27557304952362
        },
        "floorIdentifier": "23306",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 2,
      "distanceToGoal": 454.20755708616707,
      "distance": 6.759886046957699
    },
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50223370447212,
          "latitude": 5.2698745080454445
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 2.383,
          "x": 50.091
        },
        "floorIdentifier": "23306",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50291091441012,
          "latitude": 5.269672795869867
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 2.383,
          "x": 128.405
        },
        "floorIdentifier": "23306",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 3,
      "distanceToGoal": 447.44767103920935,
      "distance": 78.314
    },
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.5022605269229,
          "latitude": 5.269966647924827
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 12.997,
          "x": 50.039
        },
        "floorIdentifier": "23306",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50223370447212,
          "latitude": 5.2698745080454445
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 2.383,
          "x": 50.091
        },
        "floorIdentifier": "23306",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 4,
      "distanceToGoal": 369.13367103920933,
      "distance": 10.614127378169155
    },
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.5022591807744,
          "latitude": 5.269965313083447
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 12.813,
          "x": 49.938
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.5022605269229,
          "latitude": 5.269966647924827
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 12.997,
          "x": 50.039
        },
        "floorIdentifier": "23306",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 5,
      "distanceToGoal": 358.5195436610402,
      "distance": 0.20989759407863529
    },
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50228466826076,
          "latitude": 5.2700561242272475
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 23.244,
          "x": 49.786
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.5022591807744,
          "latitude": 5.269965313083447
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 12.813,
          "x": 49.938
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 6,
      "distanceToGoal": 358.30964606696153,
      "distance": 10.432107409339686
    },
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50296057943632,
          "latitude": 5.269855808347739
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 23.351,
          "x": 127.918
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50228466826076,
          "latitude": 5.2700561242272475
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 23.244,
          "x": 49.786
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 7,
      "distanceToGoal": 347.87753865762187,
      "distance": 78.13207326700092
    },
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50335352485249,
          "latitude": 5.2697396249896356
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 23.442,
          "x": 173.332
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50296057943632,
          "latitude": 5.269855808347739
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 23.351,
          "x": 127.918
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 8,
      "distanceToGoal": 269.74546539062095,
      "distance": 45.41409117223419
    },
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50330390476904,
          "latitude": 5.2695553350717885
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 2.34,
          "x": 173.864
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50335352485249,
          "latitude": 5.2697396249896356
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 23.442,
          "x": 173.332
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 9,
      "distanceToGoal": 224.33137421838674,
      "distance": 21.108705028968497
    },
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50183136914289,
          "latitude": 5.269997365506962
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 2.703,
          "x": 3.469
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50330390476904,
          "latitude": 5.2695553350717885
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 2.34,
          "x": 173.864
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 10,
      "distanceToGoal": 203.22266918941824,
      "distance": 170.39538665703367
    },
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50188367678729,
          "latitude": 5.270172308016551
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 22.899,
          "x": 3.517
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50183136914289,
          "latitude": 5.269997365506962
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 2.703,
          "x": 3.469
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 11,
      "distanceToGoal": 32.82728253238459,
      "distance": 20.196057040917665
    },
    {
      "isLast": false,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50194619417972,
          "latitude": 5.270154194147784
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 22.952787910803483,
          "x": 10.730660420192445
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50188367678729,
          "latitude": 5.270172308016551
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 22.899,
          "x": 3.517
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 12,
      "distanceToGoal": 12.631225491466918,
      "distance": 7.213860949394551
    },
    {
      "isLast": true,
      "TO": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.501932624221,
          "latitude": 5.27010713170941
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 17.535573959350586,
          "x": 10.771053314208984
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "from": {
        "isOutdoor": false,
        "coordinate": {
          "longitude": 100.50194619417972,
          "latitude": 5.270154194147784
        },
        "isIndoor": true,
        "cartesianCoordinate": {
          "y": 22.952787910803483,
          "x": 10.730660420192445
        },
        "floorIdentifier": "23305",
        "buildingIdentifier": "8954"
      },
      "isFirst": false,
      "id": 13,
      "distanceToGoal": 5.417364542072367,
      "distance": 5.417364542072367
    }
  ]
}


!Navigation sdk message 
* Arrive
{
  message: Destination reached
  type: destinationReached
}

* Outside route
{
  message:"User outside route"
  type: userOutsideRoute
}

* Straight
{
  humanReadableMessage: "Go Ahead for 118 metres"
  neededLevelChange:False
  orientation: 0.005498
  orientationType: STRAIGHT
  indicationType: "GO_AHEAD"
  distance: "146.93423432"
}

* Right
{
  humanReadableMessage: "Go Ahead for 118 metres"
  neededLevelChange:False
  orientation: 0.005498
  orientationType: RIGHT
  indicationType: "TURN"
  distance: "146.93423432"
}

* Right
{
  humanReadableMessage: "Go Ahead for 118 metres"
  neededLevelChange:False
  orientation: 0.005498
  orientationType: BACKWARD
  indicationType: "TURN"
  distance: "146.93423432"
}

* LEFT
{
  humanReadableMessage: "Go Ahead for 118 metres"
  neededLevelChange:False
  orientation: 0.005498
  orientationType: LEFT
  indicationType: "TURN"
  distance: "146.93423432"
}

*/
