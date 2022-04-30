import React, { useState, useEffect } from "react";
import logo from "../assets/logo.png";
import { useHistory } from "react-router-dom";
import { MDBInput } from "mdbreact";
import "../sass/signInForm.scss";

const axios = require("axios");

export default function SignInForm(props) {
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Sign In";
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();

    const response = await axios.post(
      "/api/admin/user/login",
      {
        email: email,
        password: password,
      },
      {
        validateStatus: function (status) {
          return status < 500;
        },
      }
    );

    if (response.status === 200) {
      setError("");

      localStorage.setItem("jwtToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);

      props.setIsAuthenticated(true);
      history.replace("/");
    } else {
      const data = response.data;
      setError(`*${data[Object.keys(data)[0]].msg}`);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center main">
      <div className="card card-body login-card">
        <form className="px-4" onSubmit={handleSignIn}>
          <div>
            <h1 style={{fontWeight:'bold', textAlign:"center", fontSize:48}} className="sign-in-title">JPark</h1>
          </div>
          <div className="mb-4">
            <h4 className="text-center sign-in-title mt-4">Sign in</h4>
          </div>
          <div>
            <div className="form-group mb-3">
              <MDBInput
                label="Email address"
                type="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <MDBInput
                label="Password"
                type="password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <span className="text-danger">{error}</span>
          <div className="d-flex justify-content-center my-4">
            <button className="btn btn-sign-in col-12">Sign in</button>
          </div>
        </form>
      </div>
    </div>
  );
}
