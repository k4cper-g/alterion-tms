import MainLayout from "@/components/layout/MainLayout";

export default function OffersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
} 