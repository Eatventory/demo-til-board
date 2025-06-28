import React, { Component } from "react";
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials, clearAuth } from "./feat/authSlice";

import Home from "./Home";
import ProtectedRoute from "./ProtectedRoute";
import LoginForm from "./LoginForm";
import Header from "./Header";
import Footer from "./Footer";
import PostDetail from "./Postdetail";
import PostCreate from "./PostCreate";
import PostEdit from "./PostEdit"
import Mypage from "./Mypage";
import Error from "./Error";
import "./css/App.css";

function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    fetch("/api/refresh-token", { method: "POST", credentials: "include",})
      .then((res) => res.json())
      .then((data) => {
      if (data.accessToken) {
        dispatch(setCredentials({
          accessToken: data.accessToken,
          username: data.username,
          id: data.id,
          name: data.name,
        }));
      } else {
        dispatch(clearAuth());
      }
    })
    .catch(() => {
      dispatch(clearAuth());
    });
  }, []);

  return (
    <BrowserRouter>
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
          <Route path="*" element={<Error />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
