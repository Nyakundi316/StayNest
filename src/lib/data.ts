import { Owner, Property, Booking } from "./types";

// Realistic Kenyan/East-African BnB sample data.
// Replace this module with Supabase queries later (same return shapes).

export const owners: Owner[] = [
  { id: "o1", name: "Wanjiru Kamau", phone: "+254 711 222 333", email: "wanjiru@example.com", payoutMethod: "M-Pesa" },
  { id: "o2", name: "Brian Otieno",  phone: "+254 722 444 555", email: "brian@example.com",  payoutMethod: "Bank" },
  { id: "o3", name: "Aisha Hassan",  phone: "+254 733 666 777", email: "aisha@example.com",  payoutMethod: "M-Pesa" },
  { id: "o4", name: "Kevin Mwangi",  phone: "+254 700 888 999", email: "kevin@example.com",  payoutMethod: "M-Pesa" }
];

export const properties: Property[] = [
  {
    id: "p1",
    name: "Sunlit Studio in Kilimani",
    location: "Kilimani, Nairobi",
    city: "Nairobi",
    type: "Studio",
    description:
      "A bright, modern studio in the heart of Kilimani. Perfect for solo travellers or couples. Walk to cafés, restaurants and Yaya Centre in minutes.",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200"
    ],
    bedrooms: 1,
    bathrooms: 1,
    guests: 2,
    ownerBasePrice: 2500,
    markup: 500,
    amenities: ["Wi-Fi", "Hot Shower", "Kitchenette", "Smart TV", "Parking"],
    rules: ["No smoking", "No parties", "Check-in after 2pm"],
    rating: 4.8,
    reviews: 124,
    available: true,
    ownerId: "o1",
    createdAt: "2026-01-12"
  },
  {
    id: "p2",
    name: "Ocean Breeze Villa",
    location: "Diani Beach, Kwale",
    city: "Diani",
    type: "Villa",
    description:
      "Luxury 4-bedroom villa steps from the white sand of Diani Beach. Private pool, full chef service available, ideal for family getaways.",
    images: [
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200",
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200"
    ],
    bedrooms: 4,
    bathrooms: 4,
    guests: 8,
    ownerBasePrice: 15000,
    markup: 2000,
    amenities: ["Wi-Fi", "Private Pool", "Beach Access", "Air Conditioning", "Chef Available", "Parking"],
    rules: ["No loud music after 10pm", "No pets"],
    rating: 4.95,
    reviews: 86,
    available: true,
    ownerId: "o2",
    createdAt: "2026-01-20"
  },
  {
    id: "p3",
    name: "Cozy Westlands Apartment",
    location: "Westlands, Nairobi",
    city: "Nairobi",
    type: "Apartment",
    description:
      "Stylish 2-bedroom apartment with rooftop access. Close to Sarit Centre and Westgate. Fast Wi-Fi for remote workers.",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1200",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200"
    ],
    bedrooms: 2,
    bathrooms: 2,
    guests: 4,
    ownerBasePrice: 5500,
    markup: 1000,
    amenities: ["Wi-Fi", "Workspace", "Kitchen", "Smart TV", "Lift", "Gym"],
    rating: 4.7,
    reviews: 58,
    available: true,
    ownerId: "o3",
    createdAt: "2026-02-02"
  },
  {
    id: "p4",
    name: "Naivasha Lakeside House",
    location: "Naivasha, Nakuru",
    city: "Naivasha",
    type: "House",
    description:
      "Three-bedroom house with sweeping views of Lake Naivasha. Fire pit, garden and easy access to Hells Gate National Park.",
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200"
    ],
    bedrooms: 3,
    bathrooms: 2,
    guests: 6,
    ownerBasePrice: 8000,
    markup: 1500,
    amenities: ["Wi-Fi", "Fireplace", "Garden", "Parking", "BBQ Grill"],
    rating: 4.85,
    reviews: 41,
    available: true,
    ownerId: "o4",
    createdAt: "2026-02-12"
  },
  {
    id: "p5",
    name: "Lamu Old Town Room",
    location: "Lamu Old Town, Lamu",
    city: "Lamu",
    type: "Room",
    description:
      "Charming Swahili-style private room inside a heritage house. Authentic local breakfast included.",
    images: [
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200",
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=1200",
      "https://images.unsplash.com/photo-1587574293340-e0011c4e8ecf?w=1200"
    ],
    bedrooms: 1,
    bathrooms: 1,
    guests: 2,
    ownerBasePrice: 1800,
    markup: 400,
    amenities: ["Wi-Fi", "Breakfast", "Rooftop View", "Fan"],
    rating: 4.6,
    reviews: 32,
    available: true,
    ownerId: "o1",
    createdAt: "2026-02-25"
  },
  {
    id: "p6",
    name: "Karen Garden Cottage",
    location: "Karen, Nairobi",
    city: "Nairobi",
    type: "House",
    description:
      "Quiet 2-bedroom cottage on a leafy compound in Karen. Ideal for families. Close to Giraffe Centre and Karen Blixen Museum.",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200"
    ],
    bedrooms: 2,
    bathrooms: 2,
    guests: 4,
    ownerBasePrice: 6500,
    markup: 1200,
    amenities: ["Wi-Fi", "Garden", "Parking", "Kitchen", "Workspace"],
    rating: 4.9,
    reviews: 67,
    available: true,
    ownerId: "o2",
    createdAt: "2026-03-04"
  },
  {
    id: "p7",
    name: "Nyali Beachfront Apartment",
    location: "Nyali, Mombasa",
    city: "Mombasa",
    type: "Apartment",
    description:
      "Sea-view 1-bedroom apartment in a secure gated complex with shared pool. Steps to Nyali Beach.",
    images: [
      "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200",
      "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=1200",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200"
    ],
    bedrooms: 1,
    bathrooms: 1,
    guests: 3,
    ownerBasePrice: 4500,
    markup: 800,
    amenities: ["Wi-Fi", "Shared Pool", "Beach Access", "Air Conditioning", "Parking"],
    rating: 4.75,
    reviews: 49,
    available: true,
    ownerId: "o3",
    createdAt: "2026-03-15"
  },
  {
    id: "p8",
    name: "Nanyuki Mt. Kenya Lodge",
    location: "Nanyuki, Laikipia",
    city: "Nanyuki",
    type: "House",
    description:
      "Rustic 3-bedroom lodge with views of Mt. Kenya. Wood-burning stove, perfect base for safari and hiking.",
    images: [
      "https://images.unsplash.com/photo-1518733057094-95b53143d2a7?w=1200",
      "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=1200",
      "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1200"
    ],
    bedrooms: 3,
    bathrooms: 2,
    guests: 6,
    ownerBasePrice: 7500,
    markup: 1500,
    amenities: ["Wi-Fi", "Fireplace", "Mountain View", "Parking", "Kitchen"],
    rating: 4.8,
    reviews: 28,
    available: true,
    ownerId: "o4",
    createdAt: "2026-03-22"
  }
];

export const bookings: Booking[] = [
  {
    id: "b1",
    propertyId: "p1",
    guestName: "Sarah Kimani",
    guestEmail: "sarah@example.com",
    guestPhone: "+254 712 345 678",
    checkIn: "2026-05-12",
    checkOut: "2026-05-15",
    guests: 2,
    nights: 3,
    pricePerNight: 3000,
    subtotal: 9000,
    serviceFee: 450,
    total: 9450,
    ownerPayout: 7500,
    agentProfit: 1500,
    status: "confirmed",
    createdAt: "2026-04-20"
  },
  {
    id: "b2",
    propertyId: "p2",
    guestName: "James Achieng'",
    guestEmail: "james@example.com",
    guestPhone: "+254 722 555 111",
    checkIn: "2026-06-01",
    checkOut: "2026-06-05",
    guests: 6,
    nights: 4,
    pricePerNight: 17000,
    subtotal: 68000,
    serviceFee: 3400,
    total: 71400,
    ownerPayout: 60000,
    agentProfit: 8000,
    status: "pending",
    createdAt: "2026-05-01"
  },
  {
    id: "b3",
    propertyId: "p3",
    guestName: "Liam Müller",
    guestEmail: "liam@example.com",
    guestPhone: "+254 700 100 200",
    checkIn: "2026-04-02",
    checkOut: "2026-04-09",
    guests: 3,
    nights: 7,
    pricePerNight: 6500,
    subtotal: 45500,
    serviceFee: 2275,
    total: 47775,
    ownerPayout: 38500,
    agentProfit: 7000,
    status: "completed",
    createdAt: "2026-03-15"
  },
  {
    id: "b4",
    propertyId: "p6",
    guestName: "Mary Njoki",
    guestEmail: "mary@example.com",
    guestPhone: "+254 715 909 808",
    checkIn: "2026-05-20",
    checkOut: "2026-05-23",
    guests: 4,
    nights: 3,
    pricePerNight: 7700,
    subtotal: 23100,
    serviceFee: 1155,
    total: 24255,
    ownerPayout: 19500,
    agentProfit: 3600,
    status: "pending",
    createdAt: "2026-05-02"
  }
];

// Helpers — these mimic Supabase-style fetch shapes
export function getProperty(id: string) {
  return properties.find((p) => p.id === id);
}

export function getOwner(id: string) {
  return owners.find((o) => o.id === id);
}

export function getOwnerForProperty(propertyId: string) {
  const p = getProperty(propertyId);
  return p ? getOwner(p.ownerId) : undefined;
}

export function similarProperties(id: string, limit = 4) {
  const target = getProperty(id);
  if (!target) return [];
  return properties
    .filter((p) => p.id !== id && (p.type === target.type || p.city === target.city))
    .slice(0, limit);
}

export const popularLocations = [
  { name: "Nairobi", image: "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=900", count: 4 },
  { name: "Diani",   image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900", count: 1 },
  { name: "Mombasa", image: "https://images.unsplash.com/photo-1571406761758-9a3eed5338ef?w=900", count: 1 },
  { name: "Naivasha",image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=900", count: 1 },
  { name: "Lamu",    image: "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=900", count: 1 },
  { name: "Nanyuki", image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=900", count: 1 }
];
