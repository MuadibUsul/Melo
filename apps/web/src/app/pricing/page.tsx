import { PricingPlans } from "@/components/PricingPlans";
import { SiteNav } from "@/components/SiteNav";
import { StudioShell } from "@/components/StudioShell";

export default function PricingPage() {
  return (
    <>
      <SiteNav />
      <StudioShell eyebrow="套餐" title="\u5957\u9910">
        <PricingPlans />
      </StudioShell>
    </>
  );
}
