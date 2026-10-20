import React from "react";
import { Link } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";
export default function Login() {
  return (
    <PageWrapper>
      <main className="alfaro-section text-center">
        <h1 className="alfaro-heading">Acceso al sistema</h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-600">
          La administración de inmuebles se realiza desde la intranet
          institucional. Esta web no ofrece acceso administrativo público.
        </p>
        <Link
          className="mt-6 inline-block rounded-xl bg-[#b7192a] px-6 py-3 font-semibold text-white no-underline"
          to="/"
        >
          Volver al inicio
        </Link>
      </main>
    </PageWrapper>
  );
}
