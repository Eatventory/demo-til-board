import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";

import App from "./App.jsx";
import store from "./app/store";
import "./css/index.css";
import "./analytics.js";

// Redux store를 전역에 노출 (analytics에서 접근하기 위해)
window.__REDUX_STORE__ = store;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
