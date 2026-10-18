import AuthShell from "../../components/AuthShell";
import LoginForm from "./LoginForm";

/** Acceso único: empresas y equipo interno (superadmin) usan el mismo formulario. */
export default function LoginPage() {
  return (
    <AuthShell
      titulo="Bienvenido de nuevo"
      descripcion="Inicia sesión para entrar a tu panel. El equipo de Turismo Link usa este mismo acceso con su cuenta interna."
    >
      <LoginForm />
    </AuthShell>
  );
}
