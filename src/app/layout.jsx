import "./globals.css";
/* eslint-disable react-refresh/only-export-components */
import { AppContextProvider } from "@/context/AppContext";

export const metadata = {
  title: "Separuh Agama - Platform Taaruf Syar'i",
  description: "Platform mediasi taaruf online yang mengutamakan privasi dan dibimbing Asatidzah.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppContextProvider>
          {children}
        </AppContextProvider>
      </body>
    </html>
  );
}
