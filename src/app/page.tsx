import HeroSection from "@/components/HeroSection";
import FeaturedStays from "@/components/FeaturedStays";
import PopularLocations from "@/components/PopularLocations";
import WhyChoose from "@/components/WhyChoose";
import HostCTA from "@/components/HostCTA";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedStays
        listingType="short_stay"
        eyebrow="Featured stays"
        title="Stays our guests love"
        subtitle="Hand-picked short-stay homes with consistently glowing reviews."
      />
      <FeaturedStays
        listingType="sale"
        eyebrow="On the market"
        title="Homes for sale"
        subtitle="Verified listings with title deeds — go from viewing to offer in days."
      />
      <FeaturedStays
        listingType="lease"
        eyebrow="To lease"
        title="Long-term homes"
        subtitle="Furnished and unfurnished options on flexible 6 to 24-month leases."
      />
      <PopularLocations />
      <WhyChoose />
      <HostCTA />
    </>
  );
}
