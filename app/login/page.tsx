import AuthShell from "../../components/AuthShell";
import LoginForm from "./LoginForm";

/** Acceso único: empresas y equipo interno (superadmin) usan el mismo formulario. */
export default function LoginPage() {
  return (
    <AuthShell
      titulo="Bienvenido de nuevo"
      descripcion="Ingresa a tu panel para gestionar servicios, reservas y finanzas."
    >
      <LoginForm />
    </AuthShell>
  );
}
