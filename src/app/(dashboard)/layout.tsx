import Header from "@/components/header";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative">
      <Header />
      <main className="relative z-10">{children}</main>
    </div>
  );
}
