import React from "react";
import { CircularProgress } from "@material-ui/core";

export default function LoadingBar() {
  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh", minWidth: "100vw" }}
    >
      <CircularProgress />
      <h6 className="ms-3">Loading...</h6>
    </div>
  );
}
