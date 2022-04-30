import React, { useEffect, useState, useRef } from "react";
import NavigationBar from "./navigationBar";
import LoadingBar from "./loadingBar";
import SweetAlert from "react-bootstrap-sweetalert";
import { capitalizeFirstLetter } from "../utility";
import "../sass/parkingLot.scss";
import axios from "axios";
import { formatAmPm, formatDdMMyyyy } from "../utility";

export default function ParkingLot() {
  const [state, _setState] = useState({
    isLoading: true,
    floorPlan: {
      isLoaded: false,
      height: 0,
    },
    parkingLot: {},
    parkingLotError: "",
    currFloor: 0,
    selectedPS: null,
  });

  const [showDialog, setShowDialog] = useState(false);
  const [ratio, setRatio] = useState(1)
  const refFloorPlan = useRef(null);
  const stateRef = useRef(state);

  const setState = (state) => {
    stateRef.current = state;
    _setState(state);
  };


  useEffect(() => {
    document.title = "Parking Lot";

    const initParkingLot = async () => {
      let newState = {
        ...state,
      };

      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) return;

      const response = await axios.get("/api/admin/parking-lot", {
        validateStatus: (_) => true,
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (response.status === 500) {
        newState.parkingLotError = "*" + response.data;
      } else {
        newState.parkingLot = response.data;
        newState.currFloor = 0;
      }

      newState.isLoading = false;
      setState(newState);
    };

    const rtParkingSpaceChanges = () => {
      let esPSChanged = new EventSource(
        "http://localhost:3001/api/admin/real-time/parking-spaces-changes"
      );

      esPSChanged.onmessage = (msg) => {
        let ps = JSON.parse(msg.data);
        let newState = { ...stateRef.current };
        for (let floor of newState.parkingLot.floors) {
          for (let parkingSpace of floor.parkingSpaces) {
            if (parkingSpace._id === ps._id) {
              for (const elem in ps) {
                parkingSpace[elem] = ps[elem];
              }
            }
          }
        }

        if (newState.selectedPS && ps._id === newState.selectedPS._id) {
          newState.selectedPS = {
            _id: ps._id,
            state: ps.state,
            name: ps.name,
            reservation: ps.reservation,
          };
        }

        setState(newState);
      };
    };

    initParkingLot();
    rtParkingSpaceChanges();
  }, []);

  useEffect(()=>{
    if (refFloorPlan.current == null || refFloorPlan.current.height <= 0)
      return 
      
    const height = refFloorPlan.current.height
    const actualHeight = Math.min(height, 480)
    setRatio(actualHeight / height)

  }, [refFloorPlan.current])

  //* Map's scale = pixel per meter
  const transMToPx = (val) => val * state.parkingLot.floors[0].map.scale;

  const transCartesianToPx = (x, y) => {
    return [x, state.floorPlan.height - y];
  };

  const handleFloorPlanLoaded = () => {
    if (state.floorPlan.isLoaded) return;

    setState({
      ...state,
      floorPlan: {
        isLoaded: true,
        height:
          2 * refFloorPlan.current.getBoundingClientRect().height -
          refFloorPlan.current.offsetHeight,
      },
    });
  };

  const handleChangeFloor = (e) => {
    setState({ ...state, currFloor: parseInt(e.target.value) });
  };

  const handleParkingSpaceClicked = (e) => {
    const ps = getParkingSpaceInfo(parseInt(e.target.id));
    if (!ps) return;

    setState({
      ...state,
      selectedPS: {
        _id: ps._id,
        state: ps.state,
        name: ps.name,
        reservation: ps.reservation,
      },
    });
  };

  const getParkingSpaceInfo = (parkingSpaceId) => {
    let target = null;
    state.parkingLot.floors.forEach((floor) => {
      if (!target)
        target = floor.parkingSpaces.find((ps) => ps._id === parkingSpaceId);
    });
    return JSON.parse(JSON.stringify(target));
  };

  //* Render */
  if (state.isLoading) {
    return (
      <>
        <NavigationBar />
        <LoadingBar />
      </>
    );
  }

  if (state.parkingLotError) {
    return (
      <>
        <NavigationBar />
        <div className="main">
          <span className="text-danger">{state.parkingLotError}</span>
        </div>
      </>
    );
  }

  const getFloorPlanChildren = () => {
    if (!state.floorPlan.isLoaded) return [];
    const floor = state.parkingLot.floors[state.currFloor];

    let parkingSpaces = [];
    for (let parkingSpace of floor.parkingSpaces) {
      const [mx, my] = [parkingSpace.pos.x, parkingSpace.pos.y];
      const [cx, cy] = [transMToPx(mx), transMToPx(my)];
      const [dx, dy] = transCartesianToPx(cx, cy);
      const x = dx * ratio
      const y = dy * ratio

      if (parkingSpace.state === "deleted") continue;

      parkingSpaces.push({
        x: x,
        y: y,
        id: parkingSpace._id,
        state: parkingSpace.state,
      });
    }

    return parkingSpaces.map((item) => {
      return (
        <div
          key={item.id}
          id={item.id}
          className={
            `parking-space-${item.state} ` +
            (state.selectedPS?._id === item.id ? "parking-space-selected" : "")
          }
          style={{
            id: item.id,
            left: item.x,
            top: item.y,
          }}
          onClick={handleParkingSpaceClicked}
        ></div>
      );
    });
  };

  return (
    <>
      <NavigationBar />
      <div className="main">
        <FloorSelector
          className="mb-4"
          onClick={handleChangeFloor}
          floors={state.parkingLot.floors}
          currFloor={state.currFloor}
        />
        <FloorPlan
          className="mb-2"
          height={state.floorPlan.height}
          mapUrl={state.parkingLot.floors[state.currFloor].map.url}
          mapName={state.parkingLot.floors[state.currFloor].map.name}
          onFloorPlanLoaded={handleFloorPlanLoaded}
          ratio = {ratio}
          children={getFloorPlanChildren()}
          refFloorPlan={refFloorPlan}
        />
        <FloorPlanNote className="mb-5" />
        <ParkingSpaceInfo className="mb-5" ps={state.selectedPS} />
        {state.selectedPS !== null && state.selectedPS.state === "reserved" ? (
          <ReservationInfo
            className="mb-3"
            psId={state.selectedPS?._id}
            reservation={state.selectedPS?.reservation}
          />
        ) : (
          <></>
        )}
        {state.selectedPS !== null && state.selectedPS.state === "empty" ? (
          <EmptyInfo
            className="mb-3"
            psId={state.selectedPS?._id}
            setShowDialog={setShowDialog}
          />
        ) : (
          <></>
        )}
        <div style={{ minHeight: 1 }}></div>
        <ShowReserveDialog show={showDialog} setShow={setShowDialog} />
      </div>
    </>
  );
}

function EmptyInfo(props) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [duration, setDuration] = useState(1);
  const [time, setTime] = useState(Date.now());
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const initUsers = async () => {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) return;

      const axios = require("axios");
      const response = await axios.get("/api/admin/user/users", {
        validateStatus: (_) => true,
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (response.status === 200) {
        setUsers(response.data);
      }
    };

    initUsers();
    const handler = setInterval(() => {
      setTime(Date.now());
    }, 1000);

    return () => {
      clearInterval(handler);
    };
  }, []);

  const handleUserChanged = (e) => {
    setSelectedUser(e.target.value);
  };

  const handleDurationChanged = (e) => {
    setDuration(e.target.value);
  };

  const handleReserve = async (e) => {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) return;

    const axios = require("axios");

    const url = "/api/admin/parking-space/reserve";
    const res = await axios.post(
      url,
      {
        parkingSpaceId: props.psId,
        userId: selectedUser,
        duration: duration,
      },
      {
        validateStatus: (_) => true,
        headers: {
          "Content-Type": "Application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (res.status !== 200) {
      const data = res.data;
      setErrorMsg(data[Object.keys(data)[0]].msg);
    } else {
      props.setShowDialog(true);
    }
  };

  const getUserOptions = () =>
    users.map((user) => {
      return (
        <option key={user._id} value={user._id}>
          {user.username}
        </option>
      );
    });

  return (
    <div className={props.className}>
      <h6 className="smallHeading">Reservation info</h6>
      <span className="text-danger">{errorMsg && "*" + errorMsg}</span>
      {/*Parking space reserved by*/}
      <div className="mb-2 row">
        <label htmlFor="reservedBy" className="col-sm-3 col-form-label">
          Reserved by:
        </label>
        <div className="col-sm-9">
          <select
            className="browser-default custom-select"
            value={selectedUser}
            onChange={handleUserChanged}
          >
            <option value="" disabled={true}>
              None
            </option>
            {getUserOptions()}
          </select>
        </div>
      </div>
      {/*Date*/}
      <div className="mb-2 row">
        <div className="col-sm-3">
          <label htmlFor="date">Date</label>
        </div>
        <div className="col-sm-9">
          <input
            type="date"
            className="form-control"
            readOnly={true}
            value={new Date(Date.now()).toISOString().split("T")[0]}
          ></input>
        </div>
      </div>
      {/*Start Time*/}
      <div className="mb-2 row">
        <div className="col-sm-3">
          <label htmlFor="date">Time</label>
        </div>
        <div className="col-sm-9">
          <input
            type="text"
            className="form-control"
            value={formatAmPm(new Date(time))}
            readOnly={true}
          ></input>
        </div>
      </div>
      {/*End time*/}
      <div className="mb-2 row">
        <div className="col-sm-3">
          <label htmlFor="date">End Time</label>
        </div>
        <div className="col-sm-9">
          <input
            type="text"
            className="form-control"
            readOnly={true}
            value={formatAmPm(new Date(time + duration * 3600000))}
          ></input>
        </div>
      </div>
      {/*Duration*/}
      <div className="mb-2 row">
        <div className="col-sm-3">
          <label htmlFor="duration" className="col-form-label">
            Duration
          </label>
        </div>
        <div className="col-sm-9 input-group">
          <input
            type="number"
            className="form-control"
            value={duration}
            onChange={handleDurationChanged}
          ></input>
          <span className="input-group-text">hour(s)</span>
        </div>
      </div>
      <div className="my-3"></div>
      <div>
        <button className="btn btn-save w-100" onClick={handleReserve}>
          Reserve
        </button>
      </div>
    </div>
  );
}

function ParkingSpaceInfo(props) {
  if (!props.ps) return <></>;
  return (
    <div className={props.className}>
      <h6 className="smallHeading">Parking Space's Info</h6>
      {/*Parking space name*/}
      <div className="mb-2 row">
        <span className="col-sm-3">Name</span>
        <span className="col-sm-9">{props.ps.name}</span>
      </div>
      {/*Parking space status*/}
      <div className="mb-2 row">
        <span className="col-sm-3">Status</span>
        <span className="col-sm-9">
          {capitalizeFirstLetter(props.ps.state)}
        </span>
      </div>
    </div>
  );
}

function FloorPlanNote(props) {
  return (
    <div className={props.className}>
      <div className="d-flex align-items-center">
        <div className="parking-space-empty-indicator light-indicator me-1"></div>
        <small className="me-3">Empty</small>
        <div className="parking-space-reserved-indicator light-indicator me-1"></div>
        <small className="me-3">Reserved</small>
        <div className="parking-space-occupied-indicator light-indicator me-1"></div>
        <small className="me-3">Occupied</small>
        <div className="mx-3"></div>
      </div>
    </div>
  );
}

function FloorSelector(props) {
  return (
    <div className={props.className}>
      <h6 className="smallHeading">Choose a floor</h6>
      {props.floors.map((floor) => (
        <button
          key={floor._id}
          value={floor.level}
          onClick={props.onClick}
          className={`btn ms-0 me-3 ${
            floor.level === props.currFloor ? "btn-floor-checked" : "btn-floor"
          }`}
        >
          {floor.name}
        </button>
      ))}
    </div>
  );
}

function FloorPlan(props) {
  if (props.ratio == 1)
    return (
      <div className={props.className}>
        <div className="floor-plan" style={{ height: props.height * props.ratio}}>
          <img
            ref={props.refFloorPlan}
            src={props.mapUrl}
            alt={props.mapName}
            onLoad={props.onFloorPlanLoaded}
          />
          {props.children}
        </div>
      </div>
    );
  
  return (
      <div className={props.className}>
        <div className="floor-plan" style={{ height: props.height * props.ratio}}>
          <img
            ref={props.refFloorPlan}
            src={props.mapUrl}
            alt={props.mapName}
            onLoad={props.onFloorPlanLoaded}
            height={props.height * props.ratio}
          />
          {props.children}
        </div>
      </div>
    );
}

function ReservationInfo(props) {
  const [duration, setDuration] = useState(props.reservation.duration);
  const [showDialog, setShowDialog] = useState(false);

  const handleDurationChanged = (e) => {
    setDuration(e.target.value);
  };

  const handleCancelReservation = async () => {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) return;

    const axios = require("axios");

    const url = "/api/admin/parking-space/clear";
    await axios.post(
      url,
      {
        parkingSpaceId: props.psId,
      },
      {
        headers: {
          "Content-Type": "Application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
  };

  const handleUpdateReservation = async (e) => {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) return;

    const axios = require("axios");

    const url = "/api/admin/parking-space/reserve";
    await axios.put(
      url,
      {
        parkingSpaceId: props.psId,
        duration: duration,
      },
      {
        headers: {
          "Content-Type": "Application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
  };

  function ShowCancelReserveDialog(props) {
    if (showDialog === true) {
      return (
        <SweetAlert
          title="Reservation Cancellation"
          type="warning"
          onConfirm={() => {
            setShowDialog(false);
            handleCancelReservation();
          }}
          showCancel={true}
          onCancel={() => {
            setShowDialog(false);
          }}
        >
          Please note that reservation cancellation will not refund and cannot
          be undo. Are you sure you want to cancel the reservation?
        </SweetAlert>
      );
    }
    return <></>;
  }

  return (
    <div className={props.className}>
      <h6 className="smallHeading">Reservation info</h6>
      {/*Parking space reserved by*/}
      <div className="mb-2 row">
        <label htmlFor="reservedBy" className="col-sm-3 col-form-label">
          Reserved by:
        </label>
        <div className="col-sm-9">
          <input
            type="text"
            className="form-control"
            readOnly={true}
            value={props.reservation.username}
          ></input>
        </div>
      </div>
      {/*Date*/}
      <div className="mb-2 row">
        <div className="col-sm-3">
          <label htmlFor="date">Date</label>
        </div>
        <div className="col-sm-9">
          <input
            type="date"
            className="form-control"
            readOnly={true}
            value={formatDdMMyyyy(props.reservation.dateTime)}
          ></input>
        </div>
      </div>
      {/*Time*/}
      <div className="mb-2 row">
        <div className="col-sm-3">
          <label htmlFor="date">Start Time</label>
        </div>
        <div className="col-sm-9">
          <input
            type="text"
            className="form-control"
            readOnly={true}
            value={formatAmPm(new Date(props.reservation.dateTime))}
          ></input>
        </div>
      </div>
      {/*End time*/}
      <div className="mb-2 row">
        <div className="col-sm-3">
          <label htmlFor="date">End Time</label>
        </div>
        <div className="col-sm-9">
          <input
            type="text"
            className="form-control"
            readOnly={true}
            value={formatAmPm(
              new Date(
                new Date(props.reservation.dateTime).getTime() +
                  3600000 * duration
              )
            )}
          ></input>
        </div>
      </div>
      <div className="mb-2 row">
        <div className="col-sm-3">
          <label htmlFor="duration" className="col-form-label">
            Duration
          </label>
        </div>
        <div className="col-sm-9 input-group">
          <input
            type="number"
            className="form-control"
            value={duration}
            disabled={true}
            onChange={handleDurationChanged}
          ></input>
          <span className="input-group-text">hour(s)</span>
        </div>
      </div>
      <div className="my-3"></div>
      <div className="d-flex justify-content-between align-items-center">
        <a
          href="#/"
          className="link-danger text-center ms-auto"
          onClick={() => {
            setShowDialog(true);
          }}
        >
          Cancel reservation
        </a>
      </div>
      <ShowCancelReserveDialog />
    </div>
  );
}

function ShowReserveDialog(props) {
  if (props.show === true) {
    return (
      <SweetAlert
        title="Done"
        type="success"
        onConfirm={() => {
          props.setShow(false);
        }}
      >
        Parking space reserved successfully
      </SweetAlert>
    );
  }
  return <></>;
}

/**  Unused
  const transPxToM = (val) => val / parkingLot.floors[0].map.scale;

  const transPxToCartesian = (x, y) => {
    return [x, refFloorPlan.current.height - y];
  };

  const transGbToLcl = (x, y) => {
    return [
      x - refFloorPlan.current.getBoundingClientRect().left,
      y - refFloorPlan.current.getBoundingClientRect().top,
    ];
  };

  const transLclToGb = (x, y = 0) => {
    return [
      x + refFloorPlan.current.getBoundingClientRect().left,
      y + refFloorPlan.current.getBoundingClientRect().top,
    ];
  };

  const logParkingLotCoordinate = (event) => {
    const [x, y] = transGbToLcl(event.pageX, event.pageY);
    const [cx, cy] = transPxToCartesian(x, y);
    const [mx, my] = [transPxToM(cx), transPxToM(cy)];

    console.log("Debugging info from click");
    console.log(`Event px : ${event.pageX}, ${event.pageY}`);
    console.log(`Local px : ${x}, ${y}`);
    console.log(`Cartesian px : ${cx}, ${cy}`);
    console.log(`meter: ${mx}, ${my}`);
    console.log("End debugging info");
  };

  const getParkingSpaceState = async (parkingSpaceId) => {
    const axios = require("axios");
    const parkingSpaceRes = await axios.get("/api/user/parking-space", {
      validateStatus: (status) => status === 200,
      params: {
        parkingSpaceId: parkingSpaceId,
      },
    });

    const parkingSpace = parkingSpaceRes.data;
    if (!parkingSpace || !parkingSpace.state) return null;
    return parkingSpace.state;
  };

  const handleChangeParkingSpaceState = async (e) => {
    const parkingSpaceId = e.target.id.split("-").slice(-1)[0];
    if (parkingSpaceId === undefined) return;

    const parkingSpaceState = await getParkingSpaceState(parkingSpaceId);
    let url = "";

    switch (parkingSpaceState) {
      case "empty":
        url = "/api/admin/parking-space/reserve";
        break;
      case "reserved":
        url = "/api/admin/parking-space/park";
        break;
      case "occupied":
        url = "/api/admin/parking-space/clear";
        break;
      default:
        return;
    }

    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) return;

    const axios = require("axios");
    await axios.post(
      url,
      { parkingSpaceId: parkingSpaceId },
      {
        headers: {
          "Content-Type": "Application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    const latParkingSpaceState = await getParkingSpaceState(parkingSpaceId);
    const newState = { ...state };

    for (let floor of newState.parkingLot.floors) {
      for (let parkingSpace of floor.parkingSpaces) {
        if (parkingSpace._id === parseInt(parkingSpaceId)) {
          parkingSpace.state = latParkingSpaceState;
          setstate(newState);
          return;
        }
      }
    }
  };

  */
