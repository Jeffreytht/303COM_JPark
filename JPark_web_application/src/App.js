import SignInForm from "./components/signInForm";
import Dashboard from "./components/dashboard";
import ParkingLot from "./components/parkingLot";
import Setting from "./components/setting";
import UserListing from "./components/userListing";
import PrivateRoute from "./privateRoute";
import LoadingBar from "./components/loadingBar";

import {
  BrowserRouter as Router,
  Switch,
  Redirect,
  Route,
} from "react-router-dom";

import { useState, useEffect } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap-css-only/css/bootstrap.min.css";
import "mdbreact/dist/css/mdb.css";
import "./sass/app.scss";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setisLoading] = useState(true);

  useEffect(() => {
    const axios = require("axios");
    const checkIsAuthenticated = async () => {
      const refreshToken = localStorage.getItem("refreshToken");
      const response = await axios.post(
        "/api/admin/user/token",
        {
          token: refreshToken,
        },
        {
          validateStatus: () => true,
        }
      );

      if (response.status === 200) {
        localStorage.setItem("jwtToken", response.data.accessToken);
        setIsAuthenticated(true);
      }
      setisLoading(false);
    };

    checkIsAuthenticated();
  }, []);

  return isLoading ? (
    <LoadingBar />
  ) : (
    <Router>
      <Switch>
        <Redirect from="/" to="/dashboard" exact={true} />
        <Route
          path="/signIn"
          exact={true}
          render={(props) =>
            isAuthenticated ? (
              <Redirect to="/dashboard" />
            ) : (
              <SignInForm setIsAuthenticated={setIsAuthenticated}></SignInForm>
            )
          }
        />
        <PrivateRoute
          authed={isAuthenticated}
          exact={true}
          path="/dashboard"
          component={Dashboard}
        />
        <PrivateRoute
          authed={isAuthenticated}
          exact={true}
          path="/parkingLot"
          component={ParkingLot}
        />
        <PrivateRoute
          authed={isAuthenticated}
          exact={true}
          path="/userListing"
          component={UserListing}
        />
        <PrivateRoute
          authed={isAuthenticated}
          exact={true}
          path="/setting"
          component={Setting}
        />
      </Switch>
    </Router>
  );
}

export default App;
