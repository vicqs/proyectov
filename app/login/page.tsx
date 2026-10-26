import AuthShell from "../../components/AuthShell";
import LoginForm from "./LoginForm";

/** Acceso único: empresas y equipo interno (superadmin) usan el mismo formulario. */
export default function LoginPage() {
  return (
    <AuthShell
      titulo="Bienvenido de nuevo"
      descripcion="Entra a tu cuenta y continúa creando experiencias. Empresas y equipo de vuki usan este mismo acceso."
    >
      <LoginForm />
    </AuthShell>
  );
}
