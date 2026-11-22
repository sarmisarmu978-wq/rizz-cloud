import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title:"RIZZ CLOUD — Your files, everywhere", description:"Personal cloud storage and file sharing." };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="id"><body><div className="bg-orbs"><i className="orb"/><i className="orb"/><i className="orb"/></div>{children}</body></html>; }