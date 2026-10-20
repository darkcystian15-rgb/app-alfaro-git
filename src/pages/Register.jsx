import React from "react";
import { Link } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";
export default function Register() {
  return (
    <PageWrapper>
      <main className="alfaro-section text-center">
        <h1 className="alfaro-heading">Registro no disponible</h1>
        <p className="mt-4 text-slate-600">
          El registro de cuentas públicas aún no está habilitado. Puedes
          consultar nuestros inmuebles sin crear una cuenta.
        </p>
        <Link
          className="mt-6 inline-block rounded-xl bg-[#b7192a] px-6 py-3 font-semibold text-white no-underline"
          to="/propiedades"
        >
          Ver propiedades
        </Link>
      </main>
    </PageWrapper>
  );
}
