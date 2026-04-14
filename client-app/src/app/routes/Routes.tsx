import { RouteObject, createBrowserRouter } from "react-router-dom";
import Login from "../../features/account/Login";
import Home from "../../features/attendee/Home";
import SessionDetails from "../../features/dashboard/SessionDetails";
import SessionHistory from "../../features/dashboard/SessionHistory";
import UserProfile from "../../features/dashboard/UserProfile";
import App from "../../App";
import GenerateQRCodeForm from "../../features/dashboard/GenerateQRCodeForm";
import CurrentSession from "../../features/dashboard/CurrentSession";
import SignUp from "../../features/account/SignUp";
import AuthRoutes from "./AuthRoutes";
import AttendanceRoutes from "./AttendanceRoutes";
import NotFound from "../../features/Errors/NotFound";
import TestErrors from "../../features/Errors/TestErrors";
import ServerError from "../../features/Errors/ServerError";
import DashboardLayout from "../layout/DashboardLayout";
import ClassList from "../../features/dashboard/ClassList";
import ClassDetails from "../../features/dashboard/ClassDetails";
import CreateClassForm from "../../features/dashboard/CreateClassForm";

export const Routes: RouteObject[] = [
  {
    path: "/",
    element: <App />,
    children: [
      {
        element: <AttendanceRoutes />,
        children: [
          {
            path: "/",
            element: <Home />,
          },
        ],
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/signup",
        element: <SignUp />,
      },

      {
        element: <AuthRoutes />,
        children: [
          {
            path: "/user-profile",
            element: <DashboardLayout />,
            children: [
              {
                index: true,
                element: <CurrentSession />,
              },
              {
                path: "current-session",
                element: <CurrentSession />,
              },
              {
                path: "generate-qr-code/:id?",
                element: <GenerateQRCodeForm />,
              },
              {
                path: "session-history",
                element: <SessionHistory />,
              },
              {
                path: "classes",
                element: <ClassList />,
              },
              {
                path: "classes/:id",
                element: <ClassDetails />,
              },
              {
                path: "create-class/:id?",
                element: <CreateClassForm />,
              },
              {
                path: "profile",
                element: <UserProfile />,
              },
              {
                path: "session-details/:id",
                element: <SessionDetails />,
              },
            ],
          },
          {
            path: "/session-details/:id",
            element: <SessionDetails />,
          },
        ],
      },

      {
        element: <AuthRoutes roles={["Admin"]} />,
        children: [
          {
            path: "/test-errors",
            element: <TestErrors />,
          },
        ],
      },

      {
        path: "/server-error",
        element: <ServerError />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
];

export const router = createBrowserRouter(Routes);
