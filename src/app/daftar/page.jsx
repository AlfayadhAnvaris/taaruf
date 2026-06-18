/* eslint-disable react-refresh/only-export-components */
import AuthPage from "@/components/auth/AuthPage";

export const metadata = {
  title: "Daftar Akun - Separuh Agama",
  description: "Daftar akun di Separuh Agama untuk memulai perjalanan taaruf yang syar'i dan terjaga.",
};

export default function RegisterPage() {
  return <AuthPage initialIsLogin={false} />;
}
