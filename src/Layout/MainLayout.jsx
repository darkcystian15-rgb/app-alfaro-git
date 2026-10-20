import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="w-full flex-grow pt-20">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
