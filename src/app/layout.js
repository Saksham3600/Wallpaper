import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "nprogress/nprogress.css";
import { AuthProvider } from "@/context/AuthContext";
import Navigation from "@/components/Navigation";
import DebugAuth from "@/components/DebugAuth";
import LoadingBar from "@/components/LoadingBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Wallpaper App",
  description: "Upload and share beautiful wallpapers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          #nprogress {
            pointer-events: none;
          }
          
          #nprogress .bar {
            background: #f74b00;
            position: fixed;
            z-index: 1031;
            top: 0;
            left: 0;
            width: 100%;
            height: 5px;
          }
          
          #nprogress .peg {
            display: block;
            position: absolute;
            right: 0px;
            width: 100px;
            height: 100%;
            box-shadow: 0 0 10px #f74b00, 0 0 5px #f74b00;
            opacity: 1.0;
            transform: rotate(3deg) translate(0px, -4px);
          }
        `}</style>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <LoadingBar />
          <Navigation />
          {children}
          <DebugAuth />
        </AuthProvider>
      </body>
    </html>
  );
}