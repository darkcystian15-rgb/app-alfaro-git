// src/App.jsx
import { RouterProvider } from "react-router-dom";
import router from "./router";
import { PortalProvider } from "./context/PortalContext";
import "./styles/main.css";
import "./styles/portal.css";
import { Toaster } from "react-hot-toast";

const App = () => {
  return (
    <div className="font-sans bg-gray-100 min-h-screen text-gray-800">
      <PortalProvider>
        <RouterProvider router={router} />
      </PortalProvider>
      {/* 🔔 Toaster GLOBAL, nunca se desmonta */}
      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
};

export default App;
