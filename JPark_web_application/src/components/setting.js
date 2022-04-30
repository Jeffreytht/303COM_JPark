import React, { useEffect, useState } from "react";
import NavigationBar from "./navigationBar";
import "../sass/setting.scss";
import TimePicker from "react-time-picker";
const axios = require("axios");

export default function Setting() {
  const [operatingHour, setOperatingHour] = useState([]);
  const [isReservationEnable, setIsReservationEnable] = useState(true);
  const [reservationFeePerHour, setReservationFeePerHour] = useState(0.0);
  const [maxReservationDuration, setMaxReservationDuration] = useState(1);

  const [operatingHourMsg, setOperatingHourMsg] = useState({
    status: true,
    msg: "",
  });

  const [reservationFeePerHourMsg, setReservationFeePerHourMsg] = useState({
    status: true,
    msg: "",
  });

  const [maxReservationDurationMsg, setMaxReservationDurationMsg] = useState({
    status: true,
    msg: "",
  });

  const DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  useEffect(() => {
    async function initOperatingHour() {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) return;

      const response = await axios.get("/api/admin/setting/", {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });
      
      if (response.data == null)
        return 

      setOperatingHour(response.data.operatingHours);
      setIsReservationEnable(response.data.isReservationEnable);
      setReservationFeePerHour(response.data.reservationFeePerHour);
      setMaxReservationDuration(response.data.maxReservationDuration);
    }

    document.title = "Setting";
    initOperatingHour();
  }, []);

  async function handleUpdateReservationFee(e) {
    e.preventDefault();
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) return;

    const response = await axios.put(
      "/api/admin/setting/reservation-fee",
      { reservationFeePerHour: reservationFeePerHour },
      {
        validateStatus: function (status) {
          return status < 500;
        },
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    if (response.status === 200) {
      setReservationFeePerHourMsg({ status: true, msg: "Saved successfully" });
    } else {
      const data = response.data;
      setReservationFeePerHourMsg({
        status: false,
        msg: data[Object.keys(data)[0]].msg,
      });
    }
  }

  async function handleUpdateReservationDuration(e) {
    e.preventDefault();
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) return;

    const response = await axios.put(
      "/api/admin/setting/reservation-duration",
      { maxReservationDuration: maxReservationDuration },
      {
        validateStatus: function (status) {
          return status < 500;
        },
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    if (response.status === 200) {
      setMaxReservationDurationMsg({ status: true, msg: "Saved successfully" });
    } else {
      const data = response.data;
      setMaxReservationDurationMsg({
        status: false,
        msg: data[Object.keys(data)[0]].msg,
      });
    }
  }

  async function handleImport(e) {
    e.preventDefault();
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) return;

    const response = await axios.post(
      "/api/admin/building/import",
      {},
      {
        validateStatus: function (status) {
          return status < 500;
        },
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    alert(response.data);
  }

  async function handleUpdateIsReservationEnable(e) {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) return;

    const isReservationEnable = e.target.checked;

    const res = await axios.put(
      "/api/admin/setting/reservation",
      { isReservationEnable: isReservationEnable },
      {
        validateStatus: function (status) {
          return status < 500;
        },
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (res.status === 200) setIsReservationEnable(isReservationEnable);
  }

  async function handleUpdateOperatingHour(e) {
    e.preventDefault();

    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) return;

    const response = await axios.put(
      "/api/admin/setting/operating-hour",
      { operatingHour: operatingHour },
      {
        validateStatus: function (status) {
          return status < 500;
        },
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (response.status === 200) {
      setOperatingHourMsg({ status: true, msg: "Saved successfully" });
    } else {
      const data = response.data;
      setOperatingHourMsg({
        status: false,
        msg: data[Object.keys(data)[0]].msg,
      });
    }
  }

  return (
    <>
      <NavigationBar />
      <div className="main container">
        <div className="row setting">
          {/* IMPORT SITUM DATA */}
          <div className="mb-5">
            <h5>Parking Lot</h5>
            <div className="border rounded p-3">
              <h6>Parking Lot's Name</h6>
              <div className="d-flex align-items-center mb-3">
                <div className="form-group m-0">
                  <input  
                    className="form-control"
                    style={{ width: "300px" }}
                    value={"INTI International College Penang"}
                    >
                  </input>
                </div>
                <button
                      className="btn btn-setting ms-3"
                      onClick={handleUpdateReservationFee}
                    >
                      Save
                </button>
              </div>
              <div className="d-flex align-items-center mb-3">
                <div className="form-group">
                  <h6>Address</h6>
                  <div className="input-group">
                  <textarea  
                    className="form-control" 
                    style={{width: "300px"}} 
                    rows={3}
                    value={"1-Z, Lebuh Bukit Jambul, Bukit Jambul, 11900 Bayan Lepas, Pulau Pinang"}
                  >
                  </textarea>
                  <div>
                    <button
                        className="btn btn-setting ms-3"
                        onClick={handleUpdateReservationFee}
                      >
                        Save
                    </button>
                  </div>
                  </div>
                </div>
              </div>
              <h6>Contact Number (Person In Charge)</h6>
              <div className="d-flex align-items-center mb-3">
                <div className="form-group m-0">
                  <input  
                    className="form-control"
                    style={{ width: "300px" }}
                    value={"04-631 0138"}
                    >
                  </input>
                </div>
                <button
                      className="btn btn-setting ms-3"
                      onClick={handleUpdateReservationFee}
                    >
                      Save
                </button>
              </div>
              
              <h6>Import parking lot</h6>
              <div className="d-flex">
                <div className="flex-grow-1">
                  <p className="content">
                    Importing parking lot's name, floor plans, parking spaces,
                    routes etc. to JPark. To configure your parking lot, please
                    sign in{" "}
                    <a
                      href="https://dashboard.situm.com/"
                      className="link-primary"
                    >
                      https://dashboard.situm.com/
                    </a>{" "}
                    to with your credentials.
                  </p>
                </div>
                <div className="flex-shrink-0 ms-3">
                  <button className="btn btn-setting" onClick={handleImport}>
                    Import
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="mb-5">
            <h5>Reservation</h5>
            <div className="border p-3 rounded">
              <div className="row mb-4">
                <div className="col-auto">
                  <div className="custom-control custom-switch">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="switchReservation"
                      checked={isReservationEnable}
                      onChange={handleUpdateIsReservationEnable}
                    />
                    <label
                      className="custom-control-label content"
                      htmlFor="switchReservation"
                    >
                      When the reservation is disabled, users will no longer
                      able to make reservation.
                    </label>
                  </div>
                </div>
              </div>
              <div className="row mb-4">
                <div className="col-md-12">
                  <h6>Reservation Fee</h6>
                  <div className="d-flex align-items-center">
                    <div>
                      <div className="input-group">
                        <span className="input-group-text">RM</span>
                        <input
                          type="number"
                          step={0.1}
                          className="form-control"
                          style={{ textAlign: "right", width: "100px" }}
                          onChange={(e) =>
                            setReservationFeePerHour(parseFloat(e.target.value))
                          }
                          value={reservationFeePerHour.toFixed(2)}
                        />
                        <span className="input-group-text" id="basic-addon2">
                          per hour
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn btn-setting ms-3"
                      onClick={handleUpdateReservationFee}
                    >
                      Save
                    </button>
                  </div>

                  <span
                    className={
                      reservationFeePerHourMsg.status
                        ? "text-success"
                        : "text-danger"
                    }
                  >
                    <span>{!reservationFeePerHourMsg.status && "*"}</span>
                    {reservationFeePerHourMsg.msg}
                  </span>
                </div>
              </div>
              <div className="row">
                <div className="col-md-12">
                  <h6>Maximum Reservation Duration</h6>
                  <div className="d-flex align-items-center">
                    <div>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          style={{ textAlign: "right", width: "60px" }}
                          value={maxReservationDuration}
                          onChange={(e) =>
                            setMaxReservationDuration(parseInt(e.target.value))
                          }
                        />
                        <span className="input-group-text" id="basic-addon2">
                          hour
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn btn-setting ms-3"
                      onClick={handleUpdateReservationDuration}
                    >
                      Save
                    </button>
                  </div>
                </div>
                <span
                  className={
                    maxReservationDurationMsg.status
                      ? "text-success"
                      : "text-danger"
                  }
                >
                  <span>{!maxReservationDurationMsg.status && "*"}</span>
                  {maxReservationDurationMsg.msg}
                </span>
              </div>
            </div>
          </div>
          {/* Operating Hour */}
          <div className="mb-5">
            <h5>Operating Hours</h5>
            <div className="border rounded p-3">
              <div className="d-flex">
                <div className="flex-grow-1">
                  {operatingHour.map((item, idx) => (
                    <div className="mb-3" key={DAYS[idx]}>
                      <div className="row">
                        <div className="col-md-2">
                          <p className="content mb-0">{DAYS[idx]}</p>
                        </div>
                        <div className="col-auto d-flex align-items-center">
                          <TimePicker
                            clearIcon={null}
                            disableClock={true}
                            onChange={(time) => {
                              let newOperatingHour = [...operatingHour];
                              newOperatingHour[idx] = {
                                ...item,
                                startTime: time,
                              };

                              setOperatingHour(newOperatingHour);
                            }}
                            disabled={item.open24Hour || item.closed}
                            value={item.startTime}
                          />
                          <span className="mx-1"> - </span>
                          <TimePicker
                            clearIcon={null}
                            disableClock={true}
                            onChange={(time) => {
                              let newOperatingHour = [...operatingHour];
                              newOperatingHour[idx] = {
                                ...item,
                                endTime: time,
                              };

                              setOperatingHour(newOperatingHour);
                            }}
                            disabled={item.open24Hour || item.closed}
                            value={item.endTime}
                          />
                          <input
                            type="checkbox"
                            id={`${DAYS[idx]}24Hour`}
                            value="Open"
                            className="ml-5 mr-2"
                            checked={item.open24Hour}
                            onChange={(e) => {
                              let newOperatingHour = [...operatingHour];
                              newOperatingHour[idx] = {
                                ...item,
                                closed: false,
                                open24Hour: e.target.checked,
                              };

                              setOperatingHour(newOperatingHour);
                            }}
                          />
                          <label
                            htmlFor={`${DAYS[idx]}24Hour`}
                            className="mb-0"
                          >
                            Open 24 hours
                          </label>
                          <input
                            type="checkbox"
                            id={`${DAYS[idx]}Closed`}
                            value="Open"
                            className="ml-5 mr-2"
                            checked={item.closed}
                            onChange={(e) => {
                              let newOperatingHour = [...operatingHour];
                              newOperatingHour[idx] = {
                                ...item,
                                closed: e.target.checked,
                                open24Hour: false,
                              };

                              setOperatingHour(newOperatingHour);
                            }}
                          />
                          <label
                            htmlFor={`${DAYS[idx]}Closed`}
                            className="mb-0"
                          >
                            Closed
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex-shrink-0">
                  <button
                    className="btn btn-setting"
                    onClick={handleUpdateOperatingHour}
                  >
                    Save
                  </button>
                </div>
              </div>
              <span
                className={
                  operatingHourMsg.status === true
                    ? "text-success"
                    : "text-danger"
                }
              >
                {operatingHourMsg.status !== true &&
                  operatingHourMsg.msg &&
                  "*"}
                {operatingHourMsg.msg}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
