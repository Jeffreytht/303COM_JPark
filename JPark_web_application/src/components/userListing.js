import React, { useState, useEffect } from "react";
import { MDBModal, MDBModalBody, MDBDataTableV5 } from "mdbreact";
import { formatDdMMyyyy, formatAmPm } from "../utility/index";
import NavigationBar from "./navigationBar";
import "../sass/userListing.scss";

const axios = require("axios");

export default function UserListing(props) {
  const getTemplate = (responseData = []) => {
    const mapData = (data) =>
      data.map((elem, index) => ({
        no: index + 1,
        username: elem.username,
        email: elem.email,
        reservations: elem.reservations,
        clickEvent(row) {
          setModalData(row);
        },
      }));

    return {
      columns: [
        {
          label: "No.",
          field: "no",
          width: 150,
          attributes: {},
        },
        {
          label: "Username",
          field: "username",
          width: 150,
          attributes: {},
        },
        {
          label: "Email",
          field: "email",
          width: 150,
          attributes: {},
        },
      ],
      rows: mapData(responseData),
    };
  };

  const mapReservationsData = (reservations) =>
    reservations.map((reservation, index) => ({
      ...reservation,
      no: index + 1,
      dateTime: `${formatDdMMyyyy(new Date(reservation.dateTime))} ${formatAmPm(
        new Date(reservation.dateTime)
      )}`,
    }));

  const [modalData, setModalData] = useState(null);
  const [dataTable, setDataTable] = useState(getTemplate());

  useEffect(() => {
    document.title = "User Listing";
  }, []);

  useEffect(() => {
    async function handleQueryUserList() {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) return;

      const response = await axios.get("/api/admin/user/listUsers", {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (response.status === 200) {
        setDataTable(getTemplate(response.data));
      } else {
        alert("Error Occurred");
      }
    }

    handleQueryUserList();
  }, []);

  return (
    <>
      <NavigationBar />
      {modalData && (
        <MDBModal
          size="lg"
          isOpen={!!modalData}
          toggle={() => {
            setModalData(null);
          }}
        >
          <MDBModalBody>
            <h3 className="modal-username">{modalData.username}</h3>
            <p className="modal-title">Reservations</p>
            <MDBDataTableV5
              hover
              entriesOptions={[5, 10]}
              entries={5}
              data={{
                columns: [
                  {
                    label: "Date",
                    field: "dateTime",
                    width: 150,
                    attributes: {},
                  },
                  {
                    label: "Duration",
                    field: "duration",
                    width: 150,
                    attributes: {},
                  },
                  {
                    label: "Credit",
                    field: "cost",
                    width: 150,
                    attributes: {},
                  },
                  {
                    label: "Status",
                    field: "status",
                    width: 150,
                    attributes: {},
                  },
                ],
                rows: mapReservationsData(modalData.reservations),
              }}
              materialSearch
            />
          </MDBModalBody>
        </MDBModal>
      )}

      <div className="main">
        <div className="card p-3">
          <MDBDataTableV5
            hover
            entriesOptions={[5, 20, 25]}
            entries={5}
            data={dataTable}
            materialSearch
          />
        </div>
      </div>
    </>
  );
}
