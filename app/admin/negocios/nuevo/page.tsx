import { redirect } from "next/navigation";
import { requerirAdmin } from "../../../../lib/admin/auth";

export default async function NuevoNegocioPage() {
  await requerirAdmin("negocios_gestionar");
  redirect("/admin/negocios?nuevo=1");
}
