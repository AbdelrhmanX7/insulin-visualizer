import "./globals.css";

export const metadata = {
  title: "Overlap & Onset",
  description: "A dosing field guide for insulin-dependent diabetes — visualize insulin/carb peak overlap and plan rapid-acting doses.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0e0a07",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
