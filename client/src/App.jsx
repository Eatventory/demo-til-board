import React, { Component } from "react";
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials, clearAuth } from "./feat/authSlice";

import Home from "./Home";
import ProtectedRoute from "./ProtectedRoute";
import LoginForm from "./LoginForm";
import Header from "./Header";
import Footer from "./Footer";
import PostDetail from "./Postdetail";
import PostCreate from "./PostCreate";
import PostEdit from "./PostEdit";
import Mypage from "./Mypage";
import Error from "./Error";
import AnalyticsDashboard from "./AnalyticsDashboard";
import "./css/App.css";
import AnalyticsSDK from "./analytics";

// 라우팅 이벤트 추적을 위한 컴포넌트
function RouteTracker() {
  const location = useLocation();
  const user = useSelector((state) => state.auth);

  useEffect(() => {
    AnalyticsSDK.sendEvent(
      "page_view",
      {
        path: location.pathname,
        search: location.search,
        hash: location.hash,
      },
      user.id
    );
  }, [location, user.id]);

  return null;
}

function App() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth);

  useEffect(() => {
    fetch("/api/refresh-token", { method: "POST", credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.accessToken) {
          AnalyticsSDK.sendEvent(
            "user_session_restored",
            {
              user_id: data.id,
              username: data.username,
            },
            data.id
          );
          dispatch(
            setCredentials({
              accessToken: data.accessToken,
              username: data.username,
              id: data.id,
              name: data.name,
            })
          );
        } else {
          AnalyticsSDK.sendEvent("user_session_expired", {}, user.id);
          dispatch(clearAuth());
        }
      })
      .catch(() => {
        AnalyticsSDK.sendEvent("user_session_error", {}, user.id);
        dispatch(clearAuth());
      });
  }, []);

  return (
    <BrowserRouter>
      <RouteTracker />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<LoginForm />} />
          <Route path="/signup" element={<LoginForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/posts/new" element={<PostCreate />} />
            <Route path="/mypage" element={<Mypage />} />
          </Route>
          <Route path="/posts/:id/edit" element={<PostEdit />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="*" element={<Error />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
