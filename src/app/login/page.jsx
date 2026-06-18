/* eslint-disable react-refresh/only-export-components */
import AuthPage from "@/components/auth/AuthPage";

export const metadata = {
  title: "Masuk - Separuh Agama",
  description: "Masuk ke akun Separuh Agama untuk melanjutkan ikhtiar taaruf Anda.",
};

export default function LoginPage() {
  return <AuthPage initialIsLogin={true} />;
}
