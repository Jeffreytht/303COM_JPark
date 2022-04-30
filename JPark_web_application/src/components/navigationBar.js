import { Navbar, Nav } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt, faCog } from "@fortawesome/free-solid-svg-icons";
import { useLocation } from "react-router";
import React from "react";
import "../sass/navigationBar.scss";

export default function NavigationBar() {
  const currPath = useLocation().pathname;

  const handleSignOut = (e) => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("refreshToken");
    window.location.reload();
  };

  return (
    <Navbar className="px-3 shadow-sm nav" variant="light">
      <Navbar.Brand>
        <Nav.Link className="nav-brand" href="/dashboard">
          JPark
        </Nav.Link>
      </Navbar.Brand>

      <Nav>
        <Nav.Link
          className={
            "nav-item " + (currPath === "/dashboard" ? "nav-active" : "")
          }
          href="/dashboard"
        >
          Dashboard
        </Nav.Link>
        <Nav.Link
          className={
            "nav-item " + (currPath === "/parkingLot" ? "nav-active" : "")
          }
          href="/parkingLot"
        >
          Parking Lot
        </Nav.Link>
        <Nav.Link
          className={
            "nav-item " + (currPath === "/userListing" ? "nav-active" : "")
          }
          href="/userListing"
        >
          User Listing
        </Nav.Link>
      </Nav>
      <Nav className="ms-auto">
        <Nav.Link
          className={
            "nav-item " + (currPath === "/setting" ? "nav-active-icon" : "")
          }
          href="/setting"
        >
          <FontAwesomeIcon icon={faCog} className="fa-lg" />
        </Nav.Link>
        <Nav.Link className="nav-item">
          <span onClick={handleSignOut}>
            <FontAwesomeIcon icon={faSignOutAlt} className="fa-lg" />
          </span>
        </Nav.Link>
      </Nav>
    </Navbar>
  );
}
