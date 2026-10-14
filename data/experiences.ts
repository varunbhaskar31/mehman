// Food experiences by dining city. These are illustrative concepts only:
// no host has been onboarded and nothing here can be booked.

import type { StaticImageData } from "next/image";
import bengaluruThumb from "@/assets/cities/bengaluru.png";
import hyderabadThumb from "@/assets/cities/hyderabad.png";
import jaipurThumb from "@/assets/cities/jaipur.png";
import kochiThumb from "@/assets/cities/kochi.png";
import kolkataThumb from "@/assets/cities/kolkata.png";
import lucknowThumb from "@/assets/cities/lucknow.png";
import awadhiDastarkhwan from "@/assets/experiences/awadhi-dastarkhwan.jpg";
import bengaliFamilyLunch from "@/assets/experiences/bengali-family-lunch.jpg";
import bengaliFishMeal from "@/assets/experiences/bengali-fish-meal.jpg";
import bengaliHomeDining from "@/assets/experiences/bengali-home-dining.jpg";
import dalBaatiChurma from "@/assets/experiences/dal-baati-churma-experience.jpg";
import deccaniMeal from "@/assets/experiences/deccani-meal.jpg";
import hyderabadiHomeFeast from "@/assets/experiences/hyderabadi-home-feast.jpg";
import karnatakaHomeMeal from "@/assets/experiences/karnataka-home-meal.jpg";
import keralaSadya from "@/assets/experiences/kerala-sadya.jpg";
import lucknowiHomeMeal from "@/assets/experiences/lucknowi-home-meal.jpg";
import malabarHomeDining from "@/assets/experiences/malabar-home-dining.jpg";
import rajasthaniFamilyThali from "@/assets/experiences/rajasthani-family-thali.jpg";
import syrianChristianHomeMeal from "@/assets/experiences/syrian-christian-home-meal.jpg";

export type PhotoCredit = {
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
};

export type Experience = {
  id: string;
  name: string;
  description: string;
  image: StaticImageData;
  imageAlt: string;
  credit: PhotoCredit;
};

export type ExploreCity = {
  id: string;
  name: string;
  // Other names people search for, lowercase.
  aliases: string[];
  thumbnail: StaticImageData;
  coords: { lat: number; lng: number };
  experienceIds: string[];
};

const ccBySa = (version: string) => ({
  license: `CC BY-SA ${version}`,
  licenseUrl: `https://creativecommons.org/licenses/by-sa/${version}/`,
});

const commons = (file: string) =>
  `https://commons.wikimedia.org/wiki/File:${file}`;

export const experiences: Experience[] = [
  {
    id: "rajasthani-family-thali",
    name: "Rajasthani Family Thali",
    description:
      "Dal, kadhi, gatte and bajra roti, served together on one generous thali.",
    image: rajasthaniFamilyThali,
    imageAlt:
      "A Rajasthani thali of small brass bowls arranged on a large brass plate.",
    credit: {
      author: "Ashwin Kumar",
      ...ccBySa("2.0"),
      sourceUrl: commons("Rajasthani_Thali_(26444240868).jpg"),
    },
  },
  {
    id: "karnataka-home-meal",
    name: "Traditional Karnataka Home Meal",
    description:
      "Rice, saaru, palya and payasa, laid out in order on a banana leaf.",
    image: karnatakaHomeMeal,
    imageAlt: "A vegetarian Karnataka meal served on a banana leaf.",
    credit: {
      author: "Kalesh",
      ...ccBySa("4.0"),
      sourceUrl: commons("Karnataka_Vegetarian_Meal.jpg"),
    },
  },
  {
    id: "bengali-home-dining",
    name: "Bengali Home Dining",
    description:
      "Rice, dal, bhaja and fish, served course by course from bitter to sweet.",
    image: bengaliHomeDining,
    imageAlt:
      "A Bengali thali with rice, dal, vegetables and fries around a steel plate.",
    credit: {
      author: "Konistha1269",
      ...ccBySa("4.0"),
      sourceUrl: commons("Bengali_Thali_2.jpg"),
    },
  },
  {
    id: "awadhi-dastarkhwan",
    name: "Awadhi Dastarkhwan",
    description:
      "Melt-soft galouti kebabs, sheermal and slow-cooked korma, spread for sharing.",
    image: awadhiDastarkhwan,
    imageAlt: "Galouti kebabs garnished with coriander, beside a paratha.",
    credit: {
      author: "Fatimahope",
      ...ccBySa("4.0"),
      sourceUrl: commons("Mouth_Watering_Gauloti_Kababs.jpg"),
    },
  },
  {
    id: "kerala-sadya",
    name: "Traditional Kerala Sadya",
    description:
      "Rice and more than twenty vegetarian dishes on a banana leaf, served in order.",
    image: keralaSadya,
    imageAlt:
      "An Onam sadya on a banana leaf with rice, papadam, banana and curries.",
    credit: {
      author: "Vis M",
      ...ccBySa("4.0"),
      sourceUrl: commons("Onam_Sadya_2024.jpg"),
    },
  },
  {
    id: "syrian-christian-home-meal",
    name: "Kerala Syrian Christian Home Meal",
    description:
      "Lacy appam with a mild, coconut-milk stew, gently scented with whole spices.",
    image: syrianChristianHomeMeal,
    imageAlt: "Coconut-milk stew in a copper bowl, with appam behind it.",
    credit: {
      author: "Sudiptorana",
      ...ccBySa("4.0"),
      sourceUrl: commons("Massa_Stew_with_Appam.jpg"),
    },
  },
  {
    id: "malabar-home-dining",
    name: "Malabar Home Dining",
    description:
      "Biryani made with fragrant short-grain rice, with pickle and fish fry on the side.",
    image: malabarHomeDining,
    imageAlt:
      "A plate of Kerala biryani topped with fried onions, with pickle and fish fry.",
    credit: {
      author: "Kalakki at Malayalam Wikipedia",
      ...ccBySa("2.5"),
      sourceUrl: commons("Kerala_Biriyani.JPG"),
    },
  },
  {
    id: "lucknowi-home-meal",
    name: "Traditional Lucknowi Home Meal",
    description:
      "Dum-cooked biryani, sealed in its pot and opened at the table.",
    image: lucknowiHomeMeal,
    imageAlt:
      "Mutton dum biryani in a clay matka, with its lid set to one side.",
    credit: {
      author: "Kalesh",
      ...ccBySa("4.0"),
      sourceUrl: commons("Lucknowi_Mutton_Matka_Dum_Biriyani.jpg"),
    },
  },
  {
    id: "dal-baati-churma-experience",
    name: "Dal Baati Churma Experience",
    description:
      "Baked wheat baati, broken into ghee-rich dal, with sweet churma to finish.",
    image: dalBaatiChurma,
    imageAlt: "Baked baati with a bowl of dal and churma on a round plate.",
    credit: {
      author: "Mahi Tatavarty",
      ...ccBySa("4.0"),
      sourceUrl: commons("%22Delectable_Dal_Baati_Churma%22.jpg"),
    },
  },
  {
    id: "bengali-family-lunch",
    name: "Bengali Family Lunch",
    description:
      "A long, unhurried lunch of rice, dal, fries, fish curry and chutney.",
    image: bengaliFamilyLunch,
    imageAlt:
      "A Bengali thali of rice, dal, fish, vegetables, curd and chutney on a brass plate.",
    credit: {
      author: "Pallabbanerjee89",
      license: "CC0",
      licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      sourceUrl: commons("Traditional_Bengali_Thali_7.jpg"),
    },
  },
  {
    id: "bengali-fish-meal",
    name: "Traditional Bengali Fish Meal",
    description:
      "Hilsa in a sharp mustard and poppy-seed sauce, with plain rice.",
    image: bengaliFishMeal,
    imageAlt: "Pieces of hilsa in a mustard and poppy-seed sauce.",
    credit: {
      author: "Rajeeb Dutta",
      ...ccBySa("4.0"),
      sourceUrl: commons("Sorse_posto_ilish_mach-MB05.jpg"),
    },
  },
  {
    id: "hyderabadi-home-feast",
    name: "Hyderabadi Home Feast",
    description:
      "Dum biryani, mirchi ka salan and raita, cooked for a full family table.",
    image: hyderabadiHomeFeast,
    imageAlt: "Chicken biryani in a copper handi, with raita on the side.",
    credit: {
      author: "Dheerajk88",
      ...ccBySa("4.0"),
      sourceUrl: commons("Chicken_Hyderabadi_Biryani.JPG"),
    },
  },
  {
    id: "deccani-meal",
    name: "Traditional Deccani Meal",
    description:
      "Slow-pounded haleem of wheat, lentils and meat, topped with fried onions.",
    image: deccaniMeal,
    imageAlt:
      "Hyderabadi haleem topped with fried onions, cashews and a wedge of lime.",
    credit: {
      author: "Chandu7299",
      ...ccBySa("4.0"),
      sourceUrl: commons("Haleem_hyderabadi.jpg"),
    },
  },
];

export const exploreCities: ExploreCity[] = [
  {
    id: "bengaluru",
    name: "Bengaluru",
    aliases: ["bangalore"],
    thumbnail: bengaluruThumb,
    coords: { lat: 12.9716, lng: 77.5946 },
    experienceIds: [
      "rajasthani-family-thali",
      "karnataka-home-meal",
      "bengali-home-dining",
      "awadhi-dastarkhwan",
    ],
  },
  {
    id: "kochi",
    name: "Kochi",
    aliases: ["cochin", "ernakulam"],
    thumbnail: kochiThumb,
    coords: { lat: 9.9312, lng: 76.2673 },
    experienceIds: [
      "kerala-sadya",
      "syrian-christian-home-meal",
      "malabar-home-dining",
    ],
  },
  {
    id: "lucknow",
    name: "Lucknow",
    aliases: [],
    thumbnail: lucknowThumb,
    coords: { lat: 26.8467, lng: 80.9462 },
    experienceIds: ["awadhi-dastarkhwan", "lucknowi-home-meal"],
  },
  {
    id: "jaipur",
    name: "Jaipur",
    aliases: [],
    thumbnail: jaipurThumb,
    coords: { lat: 26.9124, lng: 75.7873 },
    experienceIds: ["rajasthani-family-thali", "dal-baati-churma-experience"],
  },
  {
    id: "kolkata",
    name: "Kolkata",
    aliases: ["calcutta"],
    thumbnail: kolkataThumb,
    coords: { lat: 22.5726, lng: 88.3639 },
    experienceIds: ["bengali-family-lunch", "bengali-fish-meal"],
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    aliases: ["secunderabad"],
    thumbnail: hyderabadThumb,
    coords: { lat: 17.385, lng: 78.4867 },
    experienceIds: ["hyderabadi-home-feast", "deccani-meal"],
  },
];

export const defaultExploreCity = exploreCities[0];

export function findExploreCity(id: string | null | undefined) {
  return exploreCities.find((city) => city.id === id);
}

export function findExperience(id: string) {
  return experiences.find((experience) => experience.id === id);
}

export function experiencesFor(city: ExploreCity) {
  return city.experienceIds.flatMap((id) => findExperience(id) ?? []);
}

// Matches city names and common alternatives ("Bangalore", "Cochin").
export function searchCities(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return exploreCities;
  return exploreCities.filter(
    (city) =>
      city.name.toLowerCase().startsWith(q) ||
      city.aliases.some((alias) => alias.startsWith(q)),
  );
}

// The nearest supported city within maxKm, or undefined.
export function nearestCity(lat: number, lng: number, maxKm = 60) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  let best: { city: ExploreCity; km: number } | undefined;
  for (const city of exploreCities) {
    const dLat = toRad(city.coords.lat - lat);
    const dLng = toRad(city.coords.lng - lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat)) *
        Math.cos(toRad(city.coords.lat)) *
        Math.sin(dLng / 2) ** 2;
    const km = 6371 * 2 * Math.asin(Math.sqrt(a));
    if (!best || km < best.km) best = { city, km };
  }
  return best && best.km <= maxKm ? best.city : undefined;
}

export function exploreCityHref(city: ExploreCity) {
  return `/explore?city=${city.id}`;
}

export function experienceHref(experience: Experience, city: ExploreCity) {
  return `/experiences/${experience.id}?city=${city.id}`;
}
