import React, { JSX } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

export const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};
