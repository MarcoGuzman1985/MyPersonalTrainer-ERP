import { redirect } from "next/navigation";

/** La raíz redirige al primer módulo del ERP (Admin SaaS). */
export default function Home() {
  redirect("/saas");
}
