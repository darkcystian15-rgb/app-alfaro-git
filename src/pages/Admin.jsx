import React from "react";
import { Link } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";
export default function Admin() {
  return (
    <PageWrapper>
      <main className="alfaro-section text-center">
        <h1 className="alfaro-heading">Administración independiente</h1>
        <p className="mt-4 text-slate-600">
          Este portal no incluye un panel administrativo público. Utiliza los
          accesos privados de la intranet.
        </p>
        <Link to="/" className="mt-6 inline-block font-semibold text-[#b7192a]">
          Volver al inicio
        </Link>
      </main>
    </PageWrapper>
  );
}
