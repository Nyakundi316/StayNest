import HeroSection from "@/components/HeroSection";
import FeaturedStays from "@/components/FeaturedStays";
import PopularLocations from "@/components/PopularLocations";
import WhyChoose from "@/components/WhyChoose";
import HostCTA from "@/components/HostCTA";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedStays />
      <PopularLocations />
      <WhyChoose />
      <HostCTA />
    </>
  );
}
