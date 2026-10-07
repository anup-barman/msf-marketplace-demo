import StoreApp, { type Screen } from "@/components/StoreApp";

const SCREENS: Screen[] = ["upay_home", "store_catalog", "product_detail"];

interface HomeProps {
  searchParams: Promise<{ screen?: string; modal?: string }>;
}

// ?screen=store_catalog|product_detail and ?modal=payment open a specific view directly (handy for screenshots).
export default async function Home({ searchParams }: HomeProps) {
  const { screen, modal } = await searchParams;
  const initialScreen = SCREENS.includes(screen as Screen) ? (screen as Screen) : "upay_home";

  return <StoreApp initialScreen={initialScreen} initialModal={modal ?? null} />;
}
