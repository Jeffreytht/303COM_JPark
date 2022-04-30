import React from "react";
import { Route } from "react-router-dom";
import { Redirect } from "react-router";

export default function privateRoute({
  component: Component,
  authed,
  ...rest
}) {
  return (
    <Route
      {...rest}
      render={(props) =>
        authed === true ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{ pathname: "/signIn", state: { from: props.location } }}
          />
        )
      }
    />
  );
}
