import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from "./context/AuthContext";
import App from "./App";
import "./styles.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
     {/* // <-- SWAP ORDER: BrowserRouter is now outermost --> */}
    <BrowserRouter>
      <AuthProvider> {/* AuthProvider is INSIDE BrowserRouter */}
        <App />
      </AuthProvider>
    </BrowserRouter>
     {/* // <-- End swapped order --> */}
  </React.StrictMode>
);
