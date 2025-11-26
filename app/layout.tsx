import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "CYBERPUNK 2077 - Полное Погружение",
  description: "Полное погружение в мир Cyberpunk 2077",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        {children}
        <Toaster 
          position="top-center"
          theme="dark"
          toastOptions={{
            style: {
              background: 'rgba(0, 0, 0, 0.9)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              color: '#FFFFFF',
            },
          }}
        />
      </body>
    </html>
  );
}

