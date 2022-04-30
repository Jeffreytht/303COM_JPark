import React, { useEffect, useState } from "react";
import NavigationBar from "./navigationBar";
import Chart from "react-google-charts";
import { MDBDataTableV5 } from "mdbreact";
import "../sass/dashboard.scss";
import axios from "axios";
import {
  faParking,
  faCalendarCheck,
  faCheckSquare,
  faDatabase,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { capitalizeFirstLetter, formatDdMM } from "../utility";

export default function Dashboard() {
  const [statistic, setstatistic] = useState({
    empty: 0,
    reserved: 0,
    occupied: 0,
  });

  const [parkingSpaces, _setParkingSpacesRef] = useState([]);
  const [reservationsCount, setReservationsCount] = useState([]);
  const parkingSpacesRef = React.useRef(parkingSpaces);

  const setParkingSpaces = (data) => {
    parkingSpacesRef.current = data;
    _setParkingSpacesRef(data);
  };

  const getDatatableRows = (data) =>
    data.map((elem) => ({
      id: elem.floors.parkingSpaces._id,
      name: elem.floors.parkingSpaces.name,
      floor: elem.floors.name,
      state: capitalizeFirstLetter(elem.floors.parkingSpaces.state),
      updatedAt: new Date(
        Date.parse(elem.floors.parkingSpaces.updatedAt)
      ).toLocaleString(),
    }));

  useEffect(() => {
    document.title = "Dashboard";

    const initDataTable = async () => {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) return;

      const response = await axios.get(
        "http://localhost:3001/api/admin/parking-lot/parking-spaces",
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      setParkingSpaces(response.data.map((e) => e));
    };

    const initReservationCount = async () => {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) return;

      const response = await axios.get(
        "http://localhost:3001/api/admin/parking-lot/reservations-count",
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (response.status !== 200) return;

      const reservationData = [];
      let date = new Date();
      for (let i = 0; i < 7; i++) {
        reservationData.push([formatDdMM(date), 0]);
        date.setDate(date.getDate() - 1);
      }
      reservationData.reverse();

      response.data.forEach((reservation) => {
        const key = formatDdMM(new Date(reservation.dateTime));
        for (const data of reservationData) {
          if (data[0] === key) {
            data[1]++;
            break;
          }
        }
      });

      setReservationsCount(reservationData);
    };

    const rtStatistic = async () => {
      let esStatistic = new EventSource(
        "http://localhost:3001/api/admin/real-time/parking-spaces-statistic"
      );

      esStatistic.onmessage = (msg) => {
        let data = JSON.parse(msg.data);
        setstatistic(data);
        initReservationCount();
      };
    };

    const rtParkingSpaceChanges = () => {
      let esPSChanged = new EventSource(
        "http://localhost:3001/api/admin/real-time/parking-spaces-changes"
      );

      esPSChanged.onmessage = (msg) => {
        let data = JSON.parse(msg.data);
        let newParkingSpaces = JSON.parse(
          JSON.stringify(parkingSpacesRef.current)
        );
        for (let ps of newParkingSpaces) {
          if (ps.floors.parkingSpaces._id === data._id) {
            ps.floors.parkingSpaces.state = data.state;
            ps.floors.parkingSpaces.updatedAt = data.updatedAt;
            break;
          }
        }
        setParkingSpaces(newParkingSpaces);
      };
    };

    initDataTable();
    initReservationCount();
    rtStatistic();
    rtParkingSpaceChanges();
  }, []);

  return (
    <>
      <NavigationBar />
      <div className="main">
        <div className="row gx-4 mb-4">
          <div className="col">
            <div className="card parking-space-empty-info px-5 py-3">
              <h3>
                <FontAwesomeIcon icon={faParking} className="me-3" />
                {statistic.empty}
              </h3>
              <h6>Empty parking spaces</h6>
            </div>
          </div>
          <div className="col">
            <div className="card parking-space-reserved-info px-5 py-3">
              <h3>
                <FontAwesomeIcon icon={faCalendarCheck} className="me-3" />
                {statistic.reserved}
              </h3>
              <h6>Reserved parking spaces</h6>
            </div>
          </div>
          <div className="col">
            <div className="card parking-space-occupied-info px-5 py-3">
              <h3>
                <FontAwesomeIcon icon={faCheckSquare} className="me-3" />
                {statistic.occupied}
              </h3>
              <h6>Occupied parking spaces</h6>
            </div>
          </div>
          <div className="col">
            <div className="card parking-space-total-info px-5 py-3">
              <h3>
                <FontAwesomeIcon icon={faDatabase} className="me-3" />
                {statistic.occupied + statistic.reserved + statistic.empty}
              </h3>
              <h6>Total parking spaces</h6>
            </div>
          </div>
        </div>
        <div className="row gx-4 mb-4">
          <div className="col-md-6">
            <div className="card">
              <Chart
                width={"100%"}
                height={"300px"}
                chartType="PieChart"
                loader={<div>Loading Chart</div>}
                data={[
                  ["State", "Number"],
                  ["Empty", statistic.empty],
                  ["Reserved", statistic.reserved],
                  ["Occupied", statistic.occupied],
                ]}
                options={{
                  title: "Parking Spaces",
                  is3D: true,
                  slices: {
                    0: { color: "MediumSeaGreen" },
                    1: { color: "DodgerBlue" },
                    2: { color: "Tomato" },
                  },
                }}
                rootProps={{ "data-testid": "2" }}
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <Chart
                width={"100%"}
                height={"300px"}
                chartType="LineChart"
                loader={<div>Loading Chart</div>}
                data={[["x", "Number of reservations"], ...reservationsCount]}
                options={{
                  hAxis: {
                    title: "Days",
                  },
                  vAxis: {
                    title: "Total reservation",
                  },
                }}
                rootProps={{ "data-testid": "1" }}
              />
            </div>
          </div>
        </div>
        <div className="row pb-5">
          <div className="col">
            <div className="card p-3">
              <MDBDataTableV5
                hover
                entriesOptions={[5, 20, 25]}
                entries={5}
                pagesAmount={4}
                data={{
                  columns: [
                    { label: "Id", field: "id", width: 150, attributes: {} },
                    {
                      label: "Name",
                      field: "name",
                      width: 150,
                      attributes: {},
                    },
                    {
                      label: "Floor",
                      field: "floor",
                      width: 150,
                      attributes: {},
                    },
                    {
                      label: "State",
                      field: "state",
                      width: 150,
                      attributes: {},
                    },
                    {
                      label: "Updated At",
                      field: "updatedAt",
                      width: 150,
                      attributes: {},
                    },
                  ],
                  rows: getDatatableRows(parkingSpaces),
                }}
                materialSearch
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
