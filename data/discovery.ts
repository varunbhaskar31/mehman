// Local content for the discovery journey. Dining cities and cultural
// regions are independent: a guest in one city can explore any region's
// cuisine. Nothing here describes a real host, booking or availability.

export type DiningCity = {
  id: string;
  name: string;
  isLaunchCity: boolean;
};

export type Dish = {
  name: string;
  description: string;
};

export type CulturalRegion = {
  id: string;
  name: string;
  // One line for the Explore preview.
  summary: string;
  // Longer introduction for the culture page.
  intro: string;
  // Illustrative examples, not an exhaustive picture of the cuisine.
  dishes: Dish[];
  tradition: string;
  mealPhrase: string;
};

export const diningCities: DiningCity[] = [
  { id: "bengaluru", name: "Bengaluru", isLaunchCity: true },
  { id: "kochi", name: "Kochi", isLaunchCity: false },
  { id: "lucknow", name: "Lucknow", isLaunchCity: false },
  { id: "jaipur", name: "Jaipur", isLaunchCity: false },
  { id: "kolkata", name: "Kolkata", isLaunchCity: false },
  { id: "hyderabad", name: "Hyderabad", isLaunchCity: false },
];

export const culturalRegions: CulturalRegion[] = [
  {
    id: "rajasthan",
    name: "Rajasthan",
    summary:
      "Desert cooking built on ghee, lentils, millets and dried beans that keep through the dry months.",
    intro:
      "Food shaped by the desert. Where fresh vegetables were scarce, cooks turned to ghee, millet, gram flour, and berries and beans dried in the sun.",
    dishes: [
      {
        name: "Dal Baati Churma",
        description:
          "Baked wheat dumplings broken into lentils, with sweet crumbled churma.",
      },
      {
        name: "Gatte ki Sabzi",
        description: "Gram-flour dumplings simmered in a spiced yoghurt curry.",
      },
      {
        name: "Ker Sangri",
        description:
          "Desert berries and beans, dried, then cooked with spices.",
      },
    ],
    tradition:
      "Rajasthani hosts practise manuhar: the warm, insistent offering of one more helping, and then another. Guests are served first, and refusing takes real determination.",
    mealPhrase: "a traditional Rajasthani meal",
  },
  {
    id: "awadh",
    name: "Awadh",
    summary:
      "Slow-cooked, delicately spiced dishes from the royal kitchens of Lucknow.",
    intro:
      "The cuisine of Lucknow, where patience is an ingredient. Meat cooks for hours over gentle heat, sealed in its pot, and breads are enriched with milk and saffron.",
    dishes: [
      {
        name: "Nihari",
        description: "A rich meat stew, traditionally simmered overnight.",
      },
      {
        name: "Galouti Kebab",
        description: "Finely minced kebabs, famously soft enough to melt.",
      },
      {
        name: "Sheermal",
        description: "A lightly sweet, saffron-scented flatbread.",
      },
    ],
    tradition:
      "Lucknow prides itself on tehzeeb, a culture of courtesy. At the table that means unhurried meals, attentive serving and conversation that outlasts the food.",
    mealPhrase: "a traditional Awadhi meal",
  },
  {
    id: "kerala",
    name: "Kerala",
    summary:
      "Coconut, rice and coastal spices, with fresh seafood from the backwaters and the sea.",
    intro:
      "Coconut, rice and the spices of the Malabar coast, with fish from the backwaters and the sea. Breakfast alone can be a lesson in steaming and fermenting rice.",
    dishes: [
      {
        name: "Appam",
        description:
          "Lacy rice-and-coconut pancakes with soft, spongy centres.",
      },
      {
        name: "Puttu",
        description: "Steamed cylinders of rice flour layered with coconut.",
      },
      {
        name: "Regional fish curries",
        description:
          "Coconut or kudampuli-soured curries that change from coast to backwater.",
      },
    ],
    tradition:
      "Festive meals are served on a banana leaf, each dish in its appointed place. The Onam sadya can run to more than twenty dishes, served in a set order.",
    mealPhrase: "a traditional Kerala meal",
  },
  {
    id: "bengal",
    name: "Bengal",
    summary:
      "Mustard, freshwater fish and a careful balance of bitter, sharp and sweet.",
    intro:
      "A cuisine of rivers and rice. Freshwater fish, sharp mustard and a meal that moves deliberately from bitter to sweet.",
    dishes: [
      {
        name: "Shorshe Ilish",
        description: "Hilsa cooked in a pungent mustard sauce.",
      },
      {
        name: "Shukto",
        description: "A gently bitter vegetable dish that opens the meal.",
      },
      {
        name: "Mishti Doi",
        description: "Sweetened, caramelised yoghurt set in clay pots.",
      },
    ],
    tradition:
      "A traditional Bengali meal is served course by course, bitter first and sweet last. Hosts take quiet pride in guests who ask for the fish twice.",
    mealPhrase: "a traditional Bengali meal",
  },
  {
    id: "karnataka",
    name: "Karnataka",
    summary:
      "Hearty home cooking of ragi, rice and lentils, from the coast to the Deccan plateau.",
    intro:
      "Home cooking built on ragi, rice and lentils, from the coastal kitchens of Udupi and Mangaluru to the farms of the Deccan plateau.",
    dishes: [
      {
        name: "Bisi Bele Bath",
        description:
          "Rice, lentils and vegetables cooked with a tamarind spice blend.",
      },
      {
        name: "Ragi Mudde",
        description: "Finger-millet balls, eaten with saaru or a spicy curry.",
      },
      {
        name: "Akki Roti",
        description:
          "Rice-flour flatbread, patted out by hand with onion and herbs.",
      },
    ],
    tradition:
      "Festive meals are laid out on a banana leaf, every dish in its place, and hosts keep serving until a guest firmly says enough.",
    mealPhrase: "a traditional Karnataka meal",
  },
  {
    id: "tamil-nadu",
    name: "Tamil Nadu",
    summary:
      "Tamarind, lentils and rice, served as an unhurried, carefully ordered home meal.",
    intro:
      "Tamarind, lentils and rice, brought together in a home meal with its own careful order, from the first spoon of kuzhambu to the last of curd rice.",
    dishes: [
      {
        name: "Kuzhambu",
        description: "A tamarind-based gravy, eaten with rice.",
      },
      {
        name: "Kootu",
        description: "Vegetables and lentils cooked with coconut.",
      },
      {
        name: "Pongal",
        description:
          "Rice and lentils cooked soft with pepper, cumin and ghee.",
      },
    ],
    tradition:
      "A meal on a banana leaf moves through rice with kuzhambu, then rasam, then curd rice. Feeding a guest well is a point of family pride.",
    mealPhrase: "a traditional Tamil meal",
  },
];

export const defaultCity = diningCities[0];
export const defaultRegion = culturalRegions[0];

export function findCity(id: string | null | undefined) {
  return diningCities.find((city) => city.id === id);
}

export function findRegion(id: string | null | undefined) {
  return culturalRegions.find((region) => region.id === id);
}

export function availabilityMessage(city: DiningCity): string {
  return city.isLaunchCity
    ? `Mehman experiences are launching soon in ${city.name}.`
    : `Home dining experiences are coming soon to ${city.name}.`;
}

export function exploreHref(city: DiningCity, region?: CulturalRegion) {
  const params = new URLSearchParams({ city: city.id });
  if (region) params.set("region", region.id);
  return `/explore?${params}`;
}

export function cultureHref(region: CulturalRegion, city: DiningCity) {
  return `/culture/${region.id}?city=${city.id}`;
}

export function earlyAccessHref(city: DiningCity, region: CulturalRegion) {
  return `/early-access?city=${city.id}&region=${region.id}`;
}
