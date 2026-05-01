import OddsBoard from "@/components/OddsBoard";
import { getOdds } from "@/lib/odds";

export default async function Home() {
  let initial = null;
  try {
    initial = await getOdds();
  } catch {
    // client will retry
  }

  return (
    <main className="h-full w-full px-4 py-3 sm:px-6 sm:py-4 flex flex-col">
      <OddsBoard initial={initial} />
    </main>
  );
}
