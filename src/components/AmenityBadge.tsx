import {
  Wifi,
  Tv,
  Car,
  Waves,
  Wind,
  Utensils,
  Trees,
  Flame,
  ParkingCircle,
  Coffee,
  Mountain,
  Bath,
  Briefcase,
  ChefHat,
  Dumbbell,
  ArrowUpDown,
  Sun
} from "lucide-react";

const map: Record<string, React.ReactNode> = {
  "Wi-Fi": <Wifi size={16} />,
  "Smart TV": <Tv size={16} />,
  "Parking": <ParkingCircle size={16} />,
  "Private Pool": <Waves size={16} />,
  "Shared Pool": <Waves size={16} />,
  "Beach Access": <Sun size={16} />,
  "Air Conditioning": <Wind size={16} />,
  "Kitchen": <Utensils size={16} />,
  "Kitchenette": <Utensils size={16} />,
  "Garden": <Trees size={16} />,
  "Fireplace": <Flame size={16} />,
  "BBQ Grill": <Flame size={16} />,
  "Breakfast": <Coffee size={16} />,
  "Mountain View": <Mountain size={16} />,
  "Rooftop View": <Mountain size={16} />,
  "Hot Shower": <Bath size={16} />,
  "Workspace": <Briefcase size={16} />,
  "Chef Available": <ChefHat size={16} />,
  "Gym": <Dumbbell size={16} />,
  "Lift": <ArrowUpDown size={16} />,
  "Fan": <Wind size={16} />
};

export default function AmenityBadge({ name }: { name: string }) {
  const icon = map[name] ?? <Car size={16} />;
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-ink-50 text-ink-700 text-sm">
      <span className="text-brand-500">{icon}</span>
      <span>{name}</span>
    </div>
  );
}
