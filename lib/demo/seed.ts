import awadhiDastarkhwan from "@/assets/experiences/awadhi-dastarkhwan.jpg";
import bengaliFamilyLunch from "@/assets/experiences/bengali-family-lunch.jpg";
import bengaliFishMeal from "@/assets/experiences/bengali-fish-meal.jpg";
import dalBaatiChurma from "@/assets/experiences/dal-baati-churma-experience.jpg";
import karnatakaHomeMeal from "@/assets/experiences/karnataka-home-meal.jpg";
import keralaSadya from "@/assets/experiences/kerala-sadya.jpg";
import lucknowiHomeMeal from "@/assets/experiences/lucknowi-home-meal.jpg";
import rajasthaniFamilyThali from "@/assets/experiences/rajasthani-family-thali.jpg";
import syrianChristianHomeMeal from "@/assets/experiences/syrian-christian-home-meal.jpg";
import type { DemoState } from "./types";

// Sample people and tables so every journey can be tried on one phone.
// All of it is invented; the app labels it as sample data.

export const DEMO_ADMIN_ID = "user-admin";

function daysFromNow(days: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function createSeed(): DemoState {
  const now = new Date().toISOString();
  return {
    version: 4,
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
    ],
    hosts: [
      { id: "host-meenakshi", userId: "user-meenakshi", cityId: "kochi", displayName: "Meenakshi's kitchen", bio: "Three generations of us cook together for Onam. My mother still decides the order of the curries.", languages: ["Malayalam", "English"], address: "Near St. Francis Church, Fort Kochi", contactPhone: "+91 98470 00001", status: "approved", reviewNote: null, createdAt: now },
      { id: "host-rathore", userId: "user-rathore", cityId: "jaipur", displayName: "The Rathore haveli table", bio: "We cook the way my grandmother did in Jodhpur: slow, with ghee, and with far too much food.", languages: ["Hindi", "Marwari", "English"], address: "C-Scheme, Jaipur", contactPhone: "+91 94140 00002", status: "approved", reviewNote: null, createdAt: now },
      { id: "host-sharmila", userId: "user-sharmila", cityId: "kolkata", displayName: "Sharmila's Sunday lunch", bio: "Sunday lunch in our house is a three-hour affair. You'll hear about every fish my father ever bought.", languages: ["Bengali", "English", "Hindi"], address: "Gariahat, Kolkata", contactPhone: "+91 98300 00003", status: "approved", reviewNote: null, createdAt: now },
      { id: "host-lakshmi", userId: "user-lakshmi", cityId: "bengaluru", displayName: "Lakshmi's banana-leaf lunch", bio: "A Mysuru family in Bengaluru. We serve on banana leaf, in the old order, and we will refill your rice.", languages: ["Kannada", "English", "Tamil"], address: "Basavanagudi, Bengaluru", contactPhone: "+91 98450 00004", status: "approved", reviewNote: null, createdAt: now },
      { id: "host-nasreen", userId: "user-nasreen", cityId: "lucknow", displayName: "Nasreen's dastarkhwan", bio: "My family has cooked for weddings in old Lucknow for forty years. I'd love to cook for travellers.", languages: ["Urdu", "Hindi", "English"], address: "Chowk, Lucknow", contactPhone: "+91 94150 00005", status: "pending", reviewNote: null, createdAt: now },
    ],
    tables: [
      { id: "table-sadya", hostId: "host-meenakshi", title: "Kerala sadya on a banana leaf", story: "Twenty-odd dishes, served in the order they've always been served, on a leaf from our backyard.", menu: "Parippu with ghee, sambar, avial, thoran, olan, kaalan, pachadi, pickles, pappadam, two payasams", cuisine: "Kerala", veg: "veg", pricePerGuest: 900, maxGuests: 6, photos: [keralaSadya.src, syrianChristianHomeMeal.src], status: "approved", reviewNote: null, createdAt: now },
      { id: "table-thali", hostId: "host-rathore", title: "A Rajasthani family thali", story: "Dal baati churma made the slow way, gatte from my mother's recipe, and stories from the haveli.", menu: "Dal baati churma, gatte ki sabzi, ker sangri, bajra roti, kadhi, malpua", cuisine: "Rajasthani", veg: "veg", pricePerGuest: 1100, maxGuests: 8, photos: [rajasthaniFamilyThali.src, dalBaatiChurma.src], status: "approved", reviewNote: null, createdAt: now },
      { id: "table-sunday", hostId: "host-sharmila", title: "Bengali Sunday lunch", story: "Bitter to sweet, course by course: the way lunch has always gone in our family.", menu: "Shukto, dal, begun bhaja, shorshe ilish, chicken curry, chutney, mishti doi", cuisine: "Bengali", veg: "non_veg", pricePerGuest: 1200, maxGuests: 5, photos: [bengaliFamilyLunch.src, bengaliFishMeal.src], status: "approved", reviewNote: null, createdAt: now },
      { id: "table-oota", hostId: "host-lakshmi", title: "Mysuru-style oota", story: "Saaru, palya, kosambari and payasa, served in the old order on a banana leaf.", menu: "Kosambari, palya, saaru, huli, chitranna, curd rice, holige, payasa", cuisine: "Karnataka", veg: "veg", pricePerGuest: 800, maxGuests: 6, photos: [karnatakaHomeMeal.src], status: "approved", reviewNote: null, createdAt: now },
      { id: "table-dastarkhwan", hostId: "host-nasreen", title: "An Awadhi dastarkhwan", story: "Galouti, sheermal and a matka biryani, spread on the floor the way we eat at home.", menu: "Galouti kebab, sheermal, matka biryani, nihari, shahi tukda", cuisine: "Awadhi", veg: "non_veg", pricePerGuest: 1400, maxGuests: 6, photos: [awadhiDastarkhwan.src, lucknowiHomeMeal.src], status: "pending", reviewNote: null, createdAt: now },
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
