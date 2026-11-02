import awadhiDastarkhwan from "@/assets/experiences/awadhi-dastarkhwan.jpg";
import bengaliFamilyLunch from "@/assets/experiences/bengali-family-lunch.jpg";
import bengaliFishMeal from "@/assets/experiences/bengali-fish-meal.jpg";
import dalBaatiChurma from "@/assets/experiences/dal-baati-churma-experience.jpg";
import karnatakaHomeMeal from "@/assets/experiences/karnataka-home-meal.jpg";
import keralaSadya from "@/assets/experiences/kerala-sadya.jpg";
import lucknowiHomeMeal from "@/assets/experiences/lucknowi-home-meal.jpg";
import rajasthaniFamilyThali from "@/assets/experiences/rajasthani-family-thali.jpg";
import syrianChristianHomeMeal from "@/assets/experiences/syrian-christian-home-meal.jpg";
import deccaniMeal from "@/assets/experiences/deccani-meal.jpg";
import hyderabadiHomeFeast from "@/assets/experiences/hyderabadi-home-feast.jpg";
import malabarHomeDining from "@/assets/experiences/malabar-home-dining.jpg";
import bengaliHomeDining from "@/assets/experiences/bengali-home-dining.jpg";
import type { DemoState, DiningSession, DiningTable, Host, Profile, VegType } from "./types";

// Sample people and tables so every journey can be tried on one phone.
// All of it is invented; the app labels it as sample data.

export const DEMO_ADMIN_ID = "user-admin";

function daysFromNow(days: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}


// More family tables, so every city's map has a few neighbourhoods on it.
type NearbyHost = {
  key: string;
  cityId: string;
  name: string;
  phone: string;
  displayName: string;
  bio: string;
  languages: string[];
  locality: string;
  area: { lat: number; lng: number };
  title: string;
  story: string;
  menu: string;
  cuisine: string;
  veg: VegType;
  price: number;
  seats: number;
  photos: string[];
  // Days from today and the hour of the next two meals.
  meals: [number, number][];
};

const nearbyHosts: NearbyHost[] = [
  { key: "anitha", cityId: "bengaluru", name: "Anitha Shetty", phone: "+91 98450 00011", displayName: "Anitha's Mangalorean table", bio: "We moved from Mangaluru twenty years ago and still cook every fish curry the coastal way.", languages: ["Tulu", "Kannada", "English"], locality: "Koramangala", area: { lat: 12.9352, lng: 77.6245 }, title: "Mangalorean fish curry lunch", story: "Kori rotti, kane rava fry and a fish curry my aunt still argues about.", menu: "Kori rotti, kane rava fry, meen gassi, neer dosa, kokum saaru, payasa", cuisine: "Mangalorean", veg: "non_veg", price: 1000, seats: 6, photos: [malabarHomeDining.src], meals: [[2, 13], [8, 13]] },
  { key: "deepa", cityId: "bengaluru", name: "Deepa Gowda", phone: "+91 98450 00012", displayName: "Deepa's ragi mudde dinner", bio: "Old Mysuru farm food, the way my grandmother cooked it in Mandya. Simple, filling, honest.", languages: ["Kannada", "English"], locality: "Bellandur", area: { lat: 12.9260, lng: 77.6762 }, title: "Ragi mudde and saaru dinner", story: "Ragi mudde with soppu saaru, eaten by hand, and holige for dessert.", menu: "Ragi mudde, soppu saaru, bassaru, kosambari, chitranna, holige", cuisine: "Karnataka", veg: "veg", price: 750, seats: 5, photos: [karnatakaHomeMeal.src], meals: [[3, 19], [6, 19]] },
  { key: "annamma", cityId: "kochi", name: "Annamma Joseph", phone: "+91 98470 00013", displayName: "Annamma's Syrian Christian table", bio: "Appam, stew and a duck roast my family has made every Christmas since my grandmother's time.", languages: ["Malayalam", "English"], locality: "Kadavanthra", area: { lat: 9.9667, lng: 76.2985 }, title: "Appam, stew and duck roast", story: "A Syrian Christian Sunday lunch, with the stories that come with it.", menu: "Appam, chicken stew, duck roast, meen pollichathu, cabbage thoran, payasam", cuisine: "Kerala", veg: "non_veg", price: 1100, seats: 6, photos: [syrianChristianHomeMeal.src], meals: [[4, 13], [11, 13]] },
  { key: "fathima", cityId: "kochi", name: "Fathima Rahman", phone: "+91 98470 00014", displayName: "Fathima's Malabar kitchen", bio: "My mother is from Thalassery. We cook Malabar biryani and pathiri for anyone who'll sit down.", languages: ["Malayalam", "English", "Arabic"], locality: "Kaloor", area: { lat: 9.9985, lng: 76.2935 }, title: "Malabar biryani and pathiri", story: "Thalassery biryani with kaima rice, pathiri and a sulaimani to finish.", menu: "Thalassery biryani, pathiri, chicken varutharachathu, date pickle, sulaimani", cuisine: "Malabar", veg: "non_veg", price: 950, seats: 6, photos: [malabarHomeDining.src], meals: [[5, 20], [12, 20]] },
  { key: "sunita", cityId: "jaipur", name: "Sunita Agarwal", phone: "+91 94140 00015", displayName: "Sunita's Marwari rasoi", bio: "A Marwari home where nothing is wasted and nobody leaves hungry.", languages: ["Hindi", "Marwari", "English"], locality: "Bani Park", area: { lat: 26.9300, lng: 75.7920 }, title: "Marwari thali", story: "Ker sangri, papad ki sabzi and churma, cooked without onion or garlic.", menu: "Ker sangri, papad ki sabzi, dal, bajra roti, churma, gond laddoo", cuisine: "Marwari", veg: "veg", price: 900, seats: 8, photos: [dalBaatiChurma.src], meals: [[3, 19], [10, 19]] },
  { key: "pooja", cityId: "jaipur", name: "Pooja Shekhawat", phone: "+91 94140 00016", displayName: "Pooja's laal maas evening", bio: "My father's family are from Shekhawati. Laal maas is our Sunday ritual.", languages: ["Hindi", "English"], locality: "Malviya Nagar", area: { lat: 26.8540, lng: 75.8180 }, title: "Laal maas and bajra roti", story: "Fiery laal maas, slow-cooked over coals, with bajra roti and white butter.", menu: "Laal maas, safed maas, bajra roti, kadhi, mirchi vada, moong dal halwa", cuisine: "Rajasthani", veg: "non_veg", price: 1300, seats: 6, photos: [rajasthaniFamilyThali.src], meals: [[5, 20], [12, 20]] },
  { key: "mitali", cityId: "kolkata", name: "Mitali Ghosh", phone: "+91 98300 00017", displayName: "Mitali's North Kolkata lunch", bio: "We live in an old house in Shyambazar. Lunch here starts at two and ends at five.", languages: ["Bengali", "English"], locality: "Shyambazar", area: { lat: 22.6010, lng: 88.3720 }, title: "Kosha mangsho and luchi", story: "Luchi, kosha mangsho and the sweets from the shop down our lane.", menu: "Luchi, cholar dal, begun bhaja, kosha mangsho, chutney, rosogolla", cuisine: "Bengali", veg: "non_veg", price: 1100, seats: 6, photos: [bengaliHomeDining.src], meals: [[4, 13], [11, 13]] },
  { key: "rupa", cityId: "kolkata", name: "Rupa Banerjee", phone: "+91 98300 00018", displayName: "Rupa's niramish table", bio: "A widow's kitchen tradition: no onion, no garlic, and somehow the best food in the family.", languages: ["Bengali", "Hindi", "English"], locality: "Bhowanipore", area: { lat: 22.5350, lng: 88.3460 }, title: "Bengali niramish lunch", story: "Shukto, chhanar dalna and mochar ghonto, the vegetarian Bengal few people know.", menu: "Shukto, moong dal, mochar ghonto, chhanar dalna, aamer chutney, payesh", cuisine: "Bengali", veg: "veg", price: 950, seats: 5, photos: [bengaliFamilyLunch.src], meals: [[6, 13], [13, 13]] },
  { key: "zeba", cityId: "lucknow", name: "Zeba Khan", phone: "+91 94150 00019", displayName: "Zeba's Awadhi dawat", bio: "My grandfather was a cook in a nawab's house. We still make his korma.", languages: ["Urdu", "Hindi", "English"], locality: "Hazratganj", area: { lat: 26.8500, lng: 80.9460 }, title: "Awadhi korma and sheermal", story: "Korma, sheermal and kakori kebab, spread out for sharing.", menu: "Kakori kebab, mutton korma, sheermal, ulte tawe ka paratha, phirni", cuisine: "Awadhi", veg: "non_veg", price: 1300, seats: 6, photos: [awadhiDastarkhwan.src], meals: [[3, 20], [10, 20]] },
  { key: "renu", cityId: "lucknow", name: "Renu Srivastava", phone: "+91 94150 00020", displayName: "Renu's Kayastha kitchen", bio: "Kayastha food is Lucknow's best-kept secret. Come and taste why.", languages: ["Hindi", "English"], locality: "Aminabad", area: { lat: 26.8460, lng: 80.9250 }, title: "Kayastha family dinner", story: "Kofta, arbi ki sabzi and kheer, from a family recipe book older than me.", menu: "Shami kebab, kofta curry, arbi ki sabzi, tehri, kheer", cuisine: "Kayastha", veg: "both", price: 1000, seats: 6, photos: [lucknowiHomeMeal.src], meals: [[4, 20], [11, 20]] },
  { key: "shalini", cityId: "lucknow", name: "Shalini Tiwari", phone: "+91 94150 00021", displayName: "Shalini's satvik thali", bio: "Vegetarian Awadh, cooked in pure ghee on a wood fire at weekends.", languages: ["Hindi", "Awadhi", "English"], locality: "Gomti Nagar", area: { lat: 26.8500, lng: 80.9950 }, title: "Awadhi vegetarian thali", story: "Dal, kathal ki sabzi, puri and malai makhan, the gentler side of Awadh.", menu: "Arhar dal, kathal ki sabzi, puri, raita, khasta kachori, malai makhan", cuisine: "Awadhi", veg: "veg", price: 850, seats: 8, photos: [lucknowiHomeMeal.src], meals: [[5, 13], [12, 13]] },
  { key: "ayesha", cityId: "hyderabad", name: "Ayesha Siddiqui", phone: "+91 98490 00022", displayName: "Ayesha's dum biryani", bio: "Our dum biryani recipe came with my great-grandmother from the old city. We seal the pot with dough.", languages: ["Urdu", "Telugu", "English"], locality: "Charminar", area: { lat: 17.3616, lng: 78.4747 }, title: "Kacchi dum biryani dinner", story: "Kacchi biryani opened at the table, with mirchi ka salan and double ka meetha.", menu: "Kacchi dum biryani, mirchi ka salan, dahi chutney, haleem, double ka meetha", cuisine: "Hyderabadi", veg: "non_veg", price: 1200, seats: 8, photos: [hyderabadiHomeFeast.src], meals: [[2, 20], [9, 20]] },
  { key: "padma", cityId: "hyderabad", name: "Padma Reddy", phone: "+91 98490 00023", displayName: "Padma's Telangana bhojanam", bio: "Telangana village food: sharp, sour and full of greens. My mother still sends the pickles.", languages: ["Telugu", "English"], locality: "Banjara Hills", area: { lat: 17.4156, lng: 78.4347 }, title: "Telangana bhojanam", story: "Jonna rotte, gongura and pachi pulusu, served on a steel plate the way we eat at home.", menu: "Jonna rotte, gongura pachadi, pachi pulusu, bagara rice, sakinalu, sarva pindi", cuisine: "Telangana", veg: "veg", price: 800, seats: 6, photos: [deccaniMeal.src], meals: [[4, 13], [11, 13]] },
  { key: "farida", cityId: "hyderabad", name: "Farida Baig", phone: "+91 98490 00024", displayName: "Farida's Deccani dastarkhwan", bio: "We live in Secunderabad and cook the old Deccani dishes that weddings have forgotten.", languages: ["Urdu", "English"], locality: "Secunderabad", area: { lat: 17.4399, lng: 78.4983 }, title: "Deccani dastarkhwan", story: "Marag, khatti dal and dalcha, the dishes Hyderabadi families eat on ordinary days.", menu: "Mutton marag, khatti dal, dalcha, bagara baingan, sheer khurma", cuisine: "Deccani", veg: "non_veg", price: 1150, seats: 6, photos: [deccaniMeal.src], meals: [[6, 20], [13, 20]] },
];

function nearbyRecords(now: string) {
  const profiles: Profile[] = [];
  const hosts: Host[] = [];
  const tables: DiningTable[] = [];
  const sessions: DiningSession[] = [];
  for (const h of nearbyHosts) {
    profiles.push({ id: `user-${h.key}`, email: `${h.key}@example.com`, fullName: h.name, phone: h.phone, role: "host", createdAt: now });
    hosts.push({ id: `host-${h.key}`, userId: `user-${h.key}`, cityId: h.cityId, displayName: h.displayName, bio: h.bio, languages: h.languages, address: `${h.locality} (sample address)`, locality: h.locality, area: h.area, contactPhone: h.phone, status: "approved", reviewNote: null, createdAt: now });
    tables.push({ id: `table-${h.key}`, hostId: `host-${h.key}`, title: h.title, story: h.story, menu: h.menu, cuisine: h.cuisine, veg: h.veg, pricePerGuest: h.price, maxGuests: h.seats, photos: h.photos, status: "approved", reviewNote: null, createdAt: now });
    h.meals.forEach(([days, hour], i) => {
      sessions.push({ id: `s-${h.key}-${i + 1}`, tableId: `table-${h.key}`, startsAt: daysFromNow(days, hour), seatsTotal: h.seats });
    });
  }
  return { profiles, hosts, tables, sessions };
}

export function createSeed(): DemoState {
  const now = new Date().toISOString();
  const nearby = nearbyRecords(now);
  return {
    version: 5,
    currentUserId: null,
    profiles: [
      { id: DEMO_ADMIN_ID, email: "team@mehman.in", fullName: "Mehman team", phone: "", role: "admin", createdAt: now },
      { id: "user-meenakshi", email: "meenakshi@example.com", fullName: "Meenakshi Nair", phone: "+91 98470 00001", role: "host", createdAt: now },
      { id: "user-rathore", email: "rathore@example.com", fullName: "Kavita Rathore", phone: "+91 94140 00002", role: "host", createdAt: now },
      { id: "user-sharmila", email: "sharmila@example.com", fullName: "Sharmila Sen", phone: "+91 98300 00003", role: "host", createdAt: now },
      { id: "user-lakshmi", email: "lakshmi@example.com", fullName: "Lakshmi Rao", phone: "+91 98450 00004", role: "host", createdAt: now },
      { id: "guest-rohan", email: "rohan@example.com", fullName: "Rohan Mehta", phone: "+91 98200 11111", role: "guest", createdAt: now },
      { id: "guest-priya", email: "priya@example.com", fullName: "Priya Iyer", phone: "+91 98410 22222", role: "guest", createdAt: now },
      { id: "guest-sam", email: "sam@example.com", fullName: "Sam Carter", phone: "+44 7700 900123", role: "guest", createdAt: now },
      { id: "user-nasreen", email: "nasreen@example.com", fullName: "Nasreen Fatima", phone: "+91 94150 00005", role: "guest", createdAt: now },
      ...nearby.profiles,
    ],
    hosts: [
      { id: "host-meenakshi", userId: "user-meenakshi", cityId: "kochi", displayName: "Meenakshi's kitchen", bio: "Three generations of us cook together for Onam. My mother still decides the order of the curries.", languages: ["Malayalam", "English"], address: "Near St. Francis Church, Fort Kochi", locality: "Fort Kochi", area: { lat: 9.9658, lng: 76.2421 }, contactPhone: "+91 98470 00001", status: "approved", reviewNote: null, createdAt: now },
      { id: "host-rathore", userId: "user-rathore", cityId: "jaipur", displayName: "The Rathore haveli table", bio: "We cook the way my grandmother did in Jodhpur: slow, with ghee, and with far too much food.", languages: ["Hindi", "Marwari", "English"], address: "C-Scheme, Jaipur", locality: "C-Scheme", area: { lat: 26.9050, lng: 75.8000 }, contactPhone: "+91 94140 00002", status: "approved", reviewNote: null, createdAt: now },
      { id: "host-sharmila", userId: "user-sharmila", cityId: "kolkata", displayName: "Sharmila's Sunday lunch", bio: "Sunday lunch in our house is a three-hour affair. You'll hear about every fish my father ever bought.", languages: ["Bengali", "English", "Hindi"], address: "Gariahat, Kolkata", locality: "Gariahat", area: { lat: 22.5180, lng: 88.3670 }, contactPhone: "+91 98300 00003", status: "approved", reviewNote: null, createdAt: now },
      { id: "host-lakshmi", userId: "user-lakshmi", cityId: "bengaluru", displayName: "Lakshmi's banana-leaf lunch", bio: "A Mysuru family in Bengaluru. We serve on banana leaf, in the old order, and we will refill your rice.", languages: ["Kannada", "English", "Tamil"], address: "8th Cross, Malleshwaram, Bengaluru", locality: "Malleshwaram", area: { lat: 13.0031, lng: 77.5643 }, contactPhone: "+91 98450 00004", status: "approved", reviewNote: null, createdAt: now },
      { id: "host-nasreen", userId: "user-nasreen", cityId: "lucknow", displayName: "Nasreen's dastarkhwan", bio: "My family has cooked for weddings in old Lucknow for forty years. I'd love to cook for travellers.", languages: ["Urdu", "Hindi", "English"], address: "Chowk, Lucknow", locality: "Chowk", area: { lat: 26.8686, lng: 80.9110 }, contactPhone: "+91 94150 00005", status: "pending", reviewNote: null, createdAt: now },
      ...nearby.hosts,
    ],
    tables: [
      { id: "table-sadya", hostId: "host-meenakshi", title: "Kerala sadya on a banana leaf", story: "Twenty-odd dishes, served in the order they've always been served, on a leaf from our backyard.", menu: "Parippu with ghee, sambar, avial, thoran, olan, kaalan, pachadi, pickles, pappadam, two payasams", cuisine: "Kerala", veg: "veg", pricePerGuest: 900, maxGuests: 6, photos: [keralaSadya.src, syrianChristianHomeMeal.src], status: "approved", reviewNote: null, createdAt: now },
      { id: "table-thali", hostId: "host-rathore", title: "A Rajasthani family thali", story: "Dal baati churma made the slow way, gatte from my mother's recipe, and stories from the haveli.", menu: "Dal baati churma, gatte ki sabzi, ker sangri, bajra roti, kadhi, malpua", cuisine: "Rajasthani", veg: "veg", pricePerGuest: 1100, maxGuests: 8, photos: [rajasthaniFamilyThali.src, dalBaatiChurma.src], status: "approved", reviewNote: null, createdAt: now },
      { id: "table-sunday", hostId: "host-sharmila", title: "Bengali Sunday lunch", story: "Bitter to sweet, course by course: the way lunch has always gone in our family.", menu: "Shukto, dal, begun bhaja, shorshe ilish, chicken curry, chutney, mishti doi", cuisine: "Bengali", veg: "non_veg", pricePerGuest: 1200, maxGuests: 5, photos: [bengaliFamilyLunch.src, bengaliFishMeal.src], status: "approved", reviewNote: null, createdAt: now },
      { id: "table-oota", hostId: "host-lakshmi", title: "Mysuru-style oota", story: "Saaru, palya, kosambari and payasa, served in the old order on a banana leaf.", menu: "Kosambari, palya, saaru, huli, chitranna, curd rice, holige, payasa", cuisine: "Karnataka", veg: "veg", pricePerGuest: 800, maxGuests: 6, photos: [karnatakaHomeMeal.src], status: "approved", reviewNote: null, createdAt: now },
      { id: "table-dastarkhwan", hostId: "host-nasreen", title: "An Awadhi dastarkhwan", story: "Galouti, sheermal and a matka biryani, spread on the floor the way we eat at home.", menu: "Galouti kebab, sheermal, matka biryani, nihari, shahi tukda", cuisine: "Awadhi", veg: "non_veg", pricePerGuest: 1400, maxGuests: 6, photos: [awadhiDastarkhwan.src, lucknowiHomeMeal.src], status: "pending", reviewNote: null, createdAt: now },
      ...nearby.tables,
    ],
    sessions: [
      { id: "s-sadya-1", tableId: "table-sadya", startsAt: daysFromNow(3, 12, 30), seatsTotal: 6 },
      { id: "s-sadya-2", tableId: "table-sadya", startsAt: daysFromNow(10, 12, 30), seatsTotal: 6 },
      { id: "s-thali-1", tableId: "table-thali", startsAt: daysFromNow(2, 19, 30), seatsTotal: 8 },
      { id: "s-thali-2", tableId: "table-thali", startsAt: daysFromNow(9, 19, 30), seatsTotal: 8 },
      { id: "s-sunday-1", tableId: "table-sunday", startsAt: daysFromNow(5, 13), seatsTotal: 5 },
      { id: "s-oota-1", tableId: "table-oota", startsAt: daysFromNow(4, 12), seatsTotal: 6 },
      { id: "s-oota-2", tableId: "table-oota", startsAt: daysFromNow(11, 12), seatsTotal: 6 },
      { id: "s-dastar-1", tableId: "table-dastarkhwan", startsAt: daysFromNow(6, 20), seatsTotal: 6 },
      // Meals that already happened, for earnings, guest history and reviews.
      { id: "s-sadya-past-1", tableId: "table-sadya", startsAt: daysFromNow(-24, 12, 30), seatsTotal: 6 },
      { id: "s-sadya-past-2", tableId: "table-sadya", startsAt: daysFromNow(-10, 12, 30), seatsTotal: 6 },
      { id: "s-sadya-past-3", tableId: "table-sadya", startsAt: daysFromNow(-3, 12, 30), seatsTotal: 6 },
      { id: "s-thali-past-1", tableId: "table-thali", startsAt: daysFromNow(-12, 19, 30), seatsTotal: 8 },
      ...nearby.sessions,
    ],
    bookings: [
      { id: "b-past-1", sessionId: "s-sadya-past-1", guestId: "guest-sam", pricePerGuest: 900, partySize: 2, note: "First time in India!", status: "completed", createdAt: now },
      { id: "b-past-2", sessionId: "s-sadya-past-1", guestId: "guest-priya", pricePerGuest: 900, partySize: 3, note: "", status: "completed", createdAt: now },
      { id: "b-past-3", sessionId: "s-sadya-past-2", guestId: "guest-rohan", pricePerGuest: 900, partySize: 4, note: "Bringing my parents.", status: "completed", createdAt: now },
      { id: "b-past-4", sessionId: "s-sadya-past-3", guestId: "guest-priya", pricePerGuest: 900, partySize: 2, note: "", status: "accepted", createdAt: now },
      { id: "b-past-5", sessionId: "s-thali-past-1", guestId: "guest-rohan", pricePerGuest: 1100, partySize: 2, note: "", status: "completed", createdAt: now },
      { id: "b-up-1", sessionId: "s-sadya-1", guestId: "guest-rohan", pricePerGuest: 900, partySize: 2, note: "My colleague is vegan, is that possible?", status: "requested", createdAt: now },
      { id: "b-up-2", sessionId: "s-sadya-1", guestId: "guest-sam", pricePerGuest: 900, partySize: 1, note: "", status: "accepted", createdAt: now },
    ],
    reviews: [
      { id: "r-1", bookingId: "b-past-1", tableId: "table-sadya", guestId: "guest-sam", rating: 5, text: "Meenakshi's mother explained every dish and the order to eat them in. The best meal of our trip by a mile.", hostReply: "You were wonderful guests. Come back for Onam!", createdAt: daysFromNow(-23, 18) },
      { id: "r-2", bookingId: "b-past-3", tableId: "table-sadya", guestId: "guest-rohan", rating: 5, text: "My parents felt right at home. Two payasams and endless refills.", hostReply: null, createdAt: daysFromNow(-9, 20) },
      { id: "r-3", bookingId: "b-past-5", tableId: "table-thali", guestId: "guest-rohan", rating: 4, text: "Huge, generous thali and great stories about the haveli. Go hungry.", hostReply: null, createdAt: daysFromNow(-11, 21) },
    ],
    saved: [],
    notifications: [
      { id: "n-1", userId: "user-meenakshi", title: "New request from Rohan Mehta", body: "2 guests · asks about a vegan option", href: "/host/requests", read: false, createdAt: daysFromNow(0, 9) },
      { id: "n-2", userId: "user-meenakshi", title: "Rohan Mehta left you a review", body: "★★★★★ “My parents felt right at home.”", href: "/host/earnings", read: true, createdAt: daysFromNow(-9, 20) },
    ],
  };
}
