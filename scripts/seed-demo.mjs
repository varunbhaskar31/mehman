// Fills the demo database with six approved hosts (three in Bengaluru,
// three in Hyderabad), upcoming slots, one booking in every state, three
// demo logins and one host application waiting for the team.
//
// Safe to run again: it removes the previous demo rows first, then writes
// them fresh, so the end state is always the same. Never touches the
// production project (see scripts/demo-env.mjs).
//
// Run with: npm run seed:demo
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { demoEnv } from "./demo-env.mjs";

const env = demoEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY", "DEMO_PASSWORD"]);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DOMAIN = "demo.mehman.test";
const mail = (name) => `${name}@${DOMAIN}`;

function check(result, what) {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data;
}

// ------------------------------------------------------------- time

const HOUR = 3600_000;
// A time in India, some days from today: ist(2, "19:30").
function ist(days, time) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const base = new Date(`${today}T${time}:00+05:30`);
  return new Date(base.getTime() + days * 24 * HOUR);
}
const ago = (hours) => new Date(Date.now() - hours * HOUR).toISOString();

// ------------------------------------------------------------- people

const people = {
  // The three demo logins.
  guest: { email: mail("guest"), name: "Priya Sharma", phone: "+919845012345", role: "guest" },
  host: { email: mail("host"), name: "Farhana Begum", phone: "+919849011122", role: "host" },
  admin: { email: mail("team"), name: "Mehman Team", phone: "+919000012345", role: "admin" },
  // The other hosts.
  reddy: { email: mail("lakshmi"), name: "Lakshmi Reddy", phone: "+919866022233", role: "host" },
  ameena: { email: mail("ameena"), name: "Ameena Siddiqui", phone: "+919959033344", role: "host" },
  shobha: { email: mail("shobha"), name: "Shobha Hegde", phone: "+919880044455", role: "host" },
  menon: { email: mail("anjali"), name: "Anjali Menon", phone: "+919742055566", role: "host" },
  mariamma: { email: mail("mariamma"), name: "Mariamma Kurian", phone: "+919611066677", role: "host" },
  // Waiting for the team to approve, live in the demo.
  kavitha: { email: mail("kavitha"), name: "Kavitha Chettiar", phone: "+919731077788", role: "guest" },
  // Other guests, so every booking state shows up somewhere.
  rohan: { email: mail("rohan"), name: "Rohan Mehta", phone: "+919820088899", role: "guest" },
  neha: { email: mail("neha"), name: "Neha Iyer", phone: "+919884099900", role: "guest" },
  sameer: { email: mail("sameer"), name: "Sameer Khan", phone: "+919810011223", role: "guest" },
  divya: { email: mail("divya"), name: "Divya Rao", phone: "+919845033445", role: "guest" },
  arjun: { email: mail("arjun"), name: "Arjun Nair", phone: "+919895055667", role: "guest" },
  karan: { email: mail("karan"), name: "Karan Malhotra", phone: "+919811077889", role: "guest" },
};

async function allUsers() {
  const users = [];
  for (let page = 1; ; page++) {
    const { users: batch } = check(await db.auth.admin.listUsers({ page, perPage: 200 }), "list users");
    users.push(...batch);
    if (batch.length < 200) return users;
  }
}

async function ensureUsers() {
  const existing = new Map((await allUsers()).map((u) => [u.email, u]));
  const ids = {};
  for (const [key, person] of Object.entries(people)) {
    let user = existing.get(person.email);
    if (user) {
      check(await db.auth.admin.updateUserById(user.id, { password: env.DEMO_PASSWORD, email_confirm: true }), `update ${key}`);
    } else {
      user = check(
        await db.auth.admin.createUser({
          email: person.email,
          password: env.DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: person.name },
        }),
        `create ${key}`,
      ).user;
    }
    ids[key] = user.id;
    check(
      await db.from("profiles").update({ full_name: person.name, phone: person.phone, role: person.role, email: person.email }).eq("id", user.id),
      `profile ${key}`,
    );
  }
  return ids;
}

// ------------------------------------------------------------- photos

async function upload(bucket, localPath, remotePath, contentType) {
  const body = readFileSync(localPath);
  check(await db.storage.from(bucket).upload(remotePath, body, { contentType, upsert: true, cacheControl: "31536000" }), `upload ${localPath}`);
  return db.storage.from(bucket).getPublicUrl(remotePath).data.publicUrl;
}

async function photos() {
  const meal = {};
  for (const file of [
    "hyderabadi-home-feast", "deccani-meal", "awadhi-dastarkhwan", "lucknowi-home-meal",
    "karnataka-home-meal", "kerala-sadya", "syrian-christian-home-meal", "malabar-home-dining",
  ]) {
    meal[file] = await upload("table-photos", `assets/experiences/${file}.jpg`, `demo/${file}.jpg`, "image/jpeg");
  }
  // Placeholder home photos from Mehman's own artwork; real hosts upload
  // their rooms.
  const home = [
    await upload("table-photos", "assets/welcome-desktop.jpg", "demo/home-courtyard.jpg", "image/jpeg"),
    await upload("table-photos", "assets/explore-scene.jpg", "demo/home-dining-room.jpg", "image/jpeg"),
  ];
  return { meal, home };
}

// ------------------------------------------------------------- hosts

function hostsData(ids, p) {
  return [
    {
      key: "host",
      city: "hyderabad",
      display_name: "Farhana's Dastarkhwan",
      locality: "Tolichowki",
      area: [17.3986, 78.4137],
      bio: "I learnt to cook from my mother-in-law in our old house near Charminar. Sundays in our home mean a long dastarkhwan on the floor, three generations talking over each other, and biryani made the slow kacchi way.",
      languages: ["Urdu", "Hindi", "English", "Telugu"],
      address: "Flat 302, Noor Residency, Road No. 4, Tolichowki, Hyderabad 500008",
      upi: "farhana.begum@okhdfcbank",
      venue: { floor: "3rd floor, with a lift", parking: "Two cars in the basement; street parking outside", pets: "None", seating: "Dastarkhwan on the floor, with cushions; chairs if you need one" },
      rules: "Shoes off at the door, please.\nWe don't serve alcohol at home.",
      table: {
        title: "Kacchi biryani Sunday dastarkhwan",
        cuisine: "Hyderabadi",
        veg: "non_veg",
        diet: ["non_veg", "halal"],
        price: 1400,
        max: 6,
        photos: [p.meal["hyderabadi-home-feast"], p.meal["deccani-meal"]],
        story: "Our kacchi gosht biryani cooks raw marinated mutton and rice together under a dough seal, the way my husband's family has made it for weddings since the Nizam's time. You'll eat it the way we do on Sundays: on the floor, with everyone reaching across.",
        menu: "Kacchi gosht biryani, mirchi ka salan, dahi ki chutney, khatti dal, double ka meetha, Irani chai to finish",
      },
    },
    {
      key: "reddy",
      city: "hyderabad",
      display_name: "The Reddy family table",
      locality: "Banjara Hills",
      area: [17.4156, 78.4347],
      bio: "We are a Telangana farming family who moved to the city two generations ago. My kitchen still runs on jowar, red chilli and gongura from my mother's village near Warangal.",
      languages: ["Telugu", "Hindi", "English"],
      address: "8-2-293/82, Road No. 12, Banjara Hills, Hyderabad 500034",
      upi: "lakshmi.reddy@oksbi",
      venue: { floor: "Ground floor house with a small garden", parking: "Space for one car inside the gate", pets: "A quiet old labrador, Bujji", seating: "Dining table for 8" },
      rules: "Children very welcome. Please tell us about allergies when you book.",
      table: {
        title: "Telangana village thali",
        cuisine: "Telangana",
        veg: "veg",
        diet: ["veg", "gluten_free"],
        price: 900,
        max: 8,
        photos: [p.meal["deccani-meal"]],
        story: "Everything on this plate comes from my mother's village: jonna rotte patted by hand, gongura pachadi pounded on a stone, and a pappu my children still ask for when they visit. No wheat anywhere, so it is gluten-free by habit, not by design.",
        menu: "Jonna rotte, sarva pindi, gongura pachadi, tomato pappu, bendakaya fry, rice with ghee, sakinalu, bellam paramannam",
      },
    },
    {
      key: "ameena",
      city: "hyderabad",
      display_name: "Ameena's Deccani kitchen",
      locality: "Purani Haveli",
      area: [17.3664, 78.4802],
      bio: "Our family has lived in the same haveli in the Old City for over a hundred years. I cook the Deccani dishes my grandmother wrote down in Urdu in a notebook I still keep in the kitchen.",
      languages: ["Urdu", "Hindi", "English"],
      address: "22-1-1046, Purani Haveli, Old City, Hyderabad 500002",
      upi: "ameena.siddiqui@okaxis",
      venue: { floor: "1st floor of the haveli, 18 steps, no lift", parking: "Lane is narrow; take an auto to the gate", pets: "Two cats who will ignore you", seating: "Low table in the courtyard for 6" },
      rules: "Please dress modestly for the old neighbourhood.\nNo alcohol.",
      table: {
        title: "Deccani dawat in a Purani Haveli courtyard",
        cuisine: "Deccani",
        veg: "non_veg",
        diet: ["non_veg", "halal"],
        price: 1200,
        max: 6,
        photos: [p.meal["awadhi-dastarkhwan"], p.meal["lucknowi-home-meal"]],
        story: "A dawat is how the Old City says welcome: too much food, served slowly, with stories about who used to live in every house on the lane. You'll eat under the neem tree in our courtyard.",
        menu: "Shikampuri kebab, dalcha with bagara khana, tamatar ka kut, khichdi-khatta-kheema, qubani ka meetha",
      },
    },
    {
      key: "shobha",
      city: "bengaluru",
      display_name: "Shobha's Malnad table",
      locality: "Basavanagudi",
      area: [12.9417, 77.5755],
      bio: "I grew up in a coffee estate in Malnad and moved to Bengaluru after marriage. Our Basavanagudi home still eats a proper oota on banana leaves every Sunday.",
      languages: ["Kannada", "English", "Hindi"],
      address: "No. 41, 2nd Cross, Gandhi Bazaar, Basavanagudi, Bengaluru 560004",
      upi: "shobha.hegde@okicici",
      venue: { floor: "Ground floor", parking: "Street parking on the cross road", pets: "None", seating: "Floor seating on mats, banana leaf service; chairs available" },
      rules: "We eat with our hands; spoons on request.\nNo onion or garlic in the kitchen.",
      table: {
        title: "Karnataka oota on a banana leaf",
        cuisine: "Malnad, Karnataka",
        veg: "veg",
        diet: ["veg", "jain"],
        price: 850,
        max: 6,
        photos: [p.meal["karnataka-home-meal"]],
        story: "Oota is served in a set order on a banana leaf, from the salt at the top left to the payasa at the end. I'll tell you why each thing sits where it does, and you'll leave knowing how to eat bisi bele bath like a Bengalurean.",
        menu: "Kosambari, palya, akki rotti with chutney, bisi bele bath, saaru, curd rice, holige with ghee, kesari bath",
      },
    },
    {
      key: "menon",
      city: "bengaluru",
      display_name: "The Menons of Indiranagar",
      locality: "Indiranagar",
      area: [12.9719, 77.6412],
      bio: "We are a Malayali family who have been in Bengaluru for thirty years. Our sadya is the one my amma made in Palakkad, scaled down for a city flat and a few new friends.",
      languages: ["Malayalam", "English", "Tamil"],
      address: "Flat 5B, Lakeview Apartments, 12th Main, HAL 2nd Stage, Indiranagar, Bengaluru 560038",
      upi: "anjali.menon@okhdfcbank",
      venue: { floor: "5th floor, with a lift", parking: "Visitor parking for two cars", pets: "A very friendly beagle, Kuttan", seating: "Dining table for 8" },
      rules: "Please arrive on time; sadya is served hot and all at once.",
      table: {
        title: "Palakkad sadya for a slow Sunday",
        cuisine: "Kerala",
        veg: "veg",
        diet: ["veg", "vegan", "gluten_free"],
        price: 1100,
        max: 8,
        photos: [p.meal["kerala-sadya"]],
        story: "Twenty-odd dishes on one banana leaf, made with coconut oil and no dairy except the ghee we can leave out. We'll show you the right order and tease you if you eat the payasam first.",
        menu: "Banana chips, sharkara varatti, inji puli, avial, thoran, olan, kalan, sambar, rasam, parippu, pachadi, two payasams",
      },
    },
    {
      key: "mariamma",
      city: "bengaluru",
      display_name: "Mariamma's Kuttanad kitchen",
      locality: "Koramangala",
      area: [12.9352, 77.6245],
      bio: "I'm from a Syrian Christian family from Kuttanad. Sunday lunch after church was the biggest meal of the week, and I still cook it every week for whoever turns up.",
      languages: ["Malayalam", "English"],
      address: "No. 18, 4th Block, 1st Cross, Koramangala, Bengaluru 560034",
      upi: "mariamma.kurian@okaxis",
      venue: { floor: "1st floor, outside stairs", parking: "Street parking", pets: "None", seating: "Dining table for 6 on the terrace" },
      rules: "Kids welcome. Tell us if you don't eat beef; we always have a duck option.",
      table: {
        title: "Syrian Christian Sunday lunch",
        cuisine: "Kerala Syrian Christian",
        veg: "non_veg",
        diet: ["non_veg"],
        price: 1500,
        max: 6,
        photos: [p.meal["syrian-christian-home-meal"], p.meal["malabar-home-dining"]],
        story: "Lace appams, a slow duck roast, and meen pollichathu wrapped in banana leaf: the lunch my grandmother made after Sunday mass in Kuttanad. We finish with a strong coffee and stories from the backwaters.",
        menu: "Appam, duck roast, meen pollichathu, beef ularthiyathu, cabbage thoran, Kerala rice, pal payasam",
      },
    },
  ];
}

// ------------------------------------------------------------- write

async function clean(ids) {
  const all = Object.values(ids);
  // Removing the hosts removes their tables, slots, bookings and reviews.
  check(await db.from("hosts").delete().in("user_id", all), "clean hosts");
  check(await db.from("bookings").delete().in("guest_id", all), "clean bookings");
  check(await db.from("notifications").delete().in("user_id", all), "clean notifications");
  check(await db.from("conversations").delete().in("guest_id", all), "clean chats");
  check(await db.from("saved_tables").delete().in("user_id", all), "clean saved");
}

async function createHost(ids, h, status = "approved") {
  const host = check(
    await db
      .from("hosts")
      .insert({
        user_id: ids[h.key],
        city_id: h.city,
        display_name: h.display_name,
        bio: h.bio,
        languages: h.languages,
        locality: h.locality,
        area_lat: h.area[0],
        area_lng: h.area[1],
        venue_floor: h.venue.floor,
        venue_parking: h.venue.parking,
        venue_pets: h.venue.pets,
        venue_seating: h.venue.seating,
        house_rules: h.rules,
        home_photo_paths: h.homePhotos ?? [],
        status,
      })
      .select()
      .single(),
    `host ${h.key}`,
  );
  check(
    await db.from("host_private").insert({ host_id: host.id, address: h.address, contact_phone: people[h.key].phone, upi_id: h.upi }),
    `private ${h.key}`,
  );
  const table = check(
    await db
      .from("tables")
      .insert({
        host_id: host.id,
        title: h.table.title,
        story: h.table.story,
        menu: h.table.menu,
        cuisine: h.table.cuisine,
        veg: h.table.veg,
        diet_tags: h.table.diet,
        price_per_guest_inr: h.table.price,
        max_guests: h.table.max,
        photo_paths: h.table.photos,
        status: status === "approved" ? "approved" : "pending",
      })
      .select()
      .single(),
    `table ${h.key}`,
  );
  return { host, table };
}

async function slot(tableId, startsAt, seats, minutes = 180) {
  return check(
    await db
      .from("sessions")
      .insert({ table_id: tableId, starts_at: startsAt.toISOString(), seats_total: seats, duration_minutes: minutes })
      .select()
      .single(),
    "slot",
  );
}

async function main() {
  console.log("Demo project:", env.NEXT_PUBLIC_SUPABASE_URL);
  const ids = await ensureUsers();
  await clean(ids);
  const p = await photos();

  const tables = {};
  const hosts = {};
  for (const h of hostsData(ids, p)) {
    if (h.key === "host" || h.key === "menon") h.homePhotos = p.home;
    const made = await createHost(ids, h);
    tables[h.key] = made.table;
    hosts[h.key] = made.host;
  }

  // Upcoming slots: lunch (3 hours) and dinner (2 hours) over the next
  // ten days, so every city page has dates to filter by.
  const upcoming = {};
  for (const [key, table] of Object.entries(tables)) {
    upcoming[key] = [];
    for (const days of [1, 2, 3, 5, 6, 8, 10]) {
      const lunch = days % 2 === 0;
      upcoming[key].push(await slot(table.id, ist(days, lunch ? "13:00" : "19:30"), table.max_guests, lunch ? 180 : 120));
    }
  }

  // Past slots for meals that already happened.
  const past = {
    farhanaLastWeek: await slot(tables.host.id, ist(-6, "13:00"), 6),
    shobhaLastWeek: await slot(tables.shobha.id, ist(-4, "13:00"), 6),
    ameenaRecent: await slot(tables.ameena.id, ist(-3, "19:30"), 6, 120),
    // Started 6 hours ago and ended 4 hours ago: the host can still mark a
    // no-show for about 20 hours (demo step).
    farhanaLastNight: await slot(tables.host.id, new Date(Date.now() - 6 * HOUR), 6, 120),
  };

  const B = (guest, session, table, party, status, extra = {}) => ({
    guest_id: ids[guest],
    session_id: session.id,
    party_size: party,
    price_per_guest_inr: table.price_per_guest_inr,
    deposit_inr: Math.min(500, party * table.price_per_guest_inr),
    status,
    ...extra,
  });

  const rows = [
    // requested: waiting for Farhana (host demo login).
    B("rohan", upcoming.host[2], tables.host, 2, "requested", { note: "First time in Hyderabad, my wife and I. Mild spice please!", created_at: ago(0.5) }),
    // awaiting_deposit
    B("neha", upcoming.reddy[1], tables.reddy, 2, "awaiting_deposit", { accepted_at: ago(1), created_at: ago(3) }),
    // deposit_claimed: Lakshmi has to check her UPI app.
    B("sameer", upcoming.reddy[3], tables.reddy, 3, "deposit_claimed", { deposit_status: "claimed", accepted_at: ago(5), deposit_claimed_at: ago(2), created_at: ago(8) }),
    // confirmed: shows in the WhatsApp groups queue.
    B("divya", upcoming.menon[2], tables.menon, 4, "confirmed", { deposit_status: "received", accepted_at: ago(20), deposit_claimed_at: ago(18), confirmed_at: ago(17), created_at: ago(24) }),
    // completed, reviewed both ways.
    B("arjun", past.farhanaLastWeek, tables.host, 2, "completed", { deposit_status: "received", accepted_at: ago(200), confirmed_at: ago(190), closed_at: ago(140), created_at: ago(210) }),
    // completed for the demo guest, with a review.
    B("guest", past.shobhaLastWeek, tables.shobha, 2, "completed", { deposit_status: "received", accepted_at: ago(150), confirmed_at: ago(140), closed_at: ago(90), created_at: ago(160) }),
    // completed last night: the host can mark a no-show in the demo.
    B("karan", past.farhanaLastNight, tables.host, 2, "completed", { deposit_status: "received", accepted_at: ago(40), confirmed_at: ago(38), closed_at: ago(4), whatsapp_group_at: ago(37), created_at: ago(44) }),
    // declined
    B("arjun", upcoming.mariamma[1], tables.mariamma, 2, "declined", { closed_at: ago(10), created_at: ago(12) }),
    // expired: the host never answered.
    B("rohan", upcoming.shobha[3], tables.shobha, 2, "expired", { closed_at: ago(2), created_at: ago(8) }),
    // cancelled_unpaid: the deposit never came.
    B("neha", upcoming.host[4], tables.host, 2, "cancelled_unpaid", { accepted_at: ago(14), closed_at: ago(2), created_at: ago(16) }),
    // in_review: Mariamma says the deposit never arrived.
    B("sameer", upcoming.mariamma[3], tables.mariamma, 2, "in_review", { deposit_status: "claimed", accepted_at: ago(10), deposit_claimed_at: ago(8), created_at: ago(12) }),
    // host_cancelled: the team cancelled for Lakshmi; refund owed.
    B("divya", upcoming.reddy[4], tables.reddy, 2, "host_cancelled", { deposit_status: "refund_due", accepted_at: ago(30), confirmed_at: ago(28), closed_at: ago(3), created_at: ago(32) }),
    // guest_cancelled: the demo guest cancelled early and was refunded.
    B("guest", upcoming.menon[5], tables.menon, 2, "guest_cancelled", { deposit_status: "refunded", accepted_at: ago(50), confirmed_at: ago(48), closed_at: ago(26), created_at: ago(52) }),
    // no_show
    B("rohan", past.ameenaRecent, tables.ameena, 3, "no_show", { deposit_status: "kept", accepted_at: ago(100), confirmed_at: ago(96), closed_at: ago(60), created_at: ago(110) }),
  ];
  const bookings = check(await db.from("bookings").insert(rows).select(), "bookings");
  const find = (guest, sessionId) => bookings.find((b) => b.guest_id === ids[guest] && b.session_id === sessionId);

  // Reviews both ways for past meals.
  const arjunMeal = find("arjun", past.farhanaLastWeek.id);
  const priyaMeal = find("guest", past.shobhaLastWeek.id);
  const karanMeal = find("karan", past.farhanaLastNight.id);
  check(
    await db.from("reviews").insert([
      { booking_id: arjunMeal.id, table_id: tables.host.id, guest_id: ids.arjun, rating: 5, body: "The best biryani I've eaten, and Farhana's mother-in-law told us stories about the Old City for an hour.", host_reply: "Come back for Ramzan, Arjun!" },
      { booking_id: priyaMeal.id, table_id: tables.shobha.id, guest_id: ids.guest, rating: 5, body: "Learnt to eat bisi bele bath properly. The holige was unreal." },
    ]),
    "reviews",
  );
  check(
    await db.from("guest_reviews").insert([
      { booking_id: arjunMeal.id, guest_id: ids.arjun, host_id: hosts.host.id, rating: 5, body: "On time, curious, ate everything." },
      { booking_id: priyaMeal.id, guest_id: ids.guest, host_id: hosts.shobha.id, rating: 5, body: "A lovely guest. Brought flowers." },
    ]),
    "guest reviews",
  );
  void karanMeal;

  const hostCancelled = find("divya", upcoming.reddy[4].id);
  const dispute = find("sameer", upcoming.mariamma[3].id);
  check(
    await db.from("booking_notes").insert([
      { booking_id: hostCancelled.id, author_id: ids.admin, body: "Status: confirmed → host_cancelled. Deposit: received → refund_due. Lakshmi has a family emergency; she'll refund Divya by UPI tonight." },
      { booking_id: dispute.id, author_id: ids.admin, body: "Sameer sent a UPI screenshot (ref 4321…). Asked Mariamma to check her other bank account." },
    ]),
    "notes",
  );

  // The application the team approves live in the demo.
  const kavitha = {
    key: "kavitha",
    city: "bengaluru",
    display_name: "Kavitha's Chettinad corner",
    locality: "Whitefield",
    area: [12.9698, 77.75],
    bio: "My family is from Karaikudi in Chettinad. I've cooked for neighbours in our Whitefield society for years, and my friends finally talked me into opening our table to travellers.",
    languages: ["Tamil", "English", "Kannada"],
    address: "Villa 27, Palm Meadows, Whitefield, Bengaluru 560066",
    upi: "kavitha.c@okicici",
    venue: { floor: "Ground floor villa", parking: "Driveway for two cars", pets: "None", seating: "Dining table for 6" },
    rules: "Spice levels are real. Tell us if you want it gentler.",
    table: {
      title: "Chettinad Sunday kozhambu and kola urundai",
      cuisine: "Chettinad",
      veg: "both",
      diet: ["veg", "non_veg"],
      price: 1000,
      max: 6,
      photos: [p.meal["malabar-home-dining"]],
      story: "Chettinad cooking is all about freshly roasted and ground spice, kalpasi and marathi mokku that you won't find in a restaurant. I'll cook the Sunday meal my aachi made in our ancestral house, with a vegetarian thali alongside.",
      menu: "Kola urundai kozhambu, pepper chicken, kavuni arisi, vatha kuzhambu, paal paniyaram",
    },
  };
  const pending = await createHost(ids, kavitha, "pending");
  for (const days of [4, 7]) await slot(pending.table.id, ist(days, "13:00"), 6);
  // An optional kitchen photo in the private bucket, for the team to open.
  const kitchenPath = `${ids.kavitha}/kitchen-demo.jpg`;
  check(
    await db.storage.from("host-verification").upload(kitchenPath, readFileSync("assets/experiences/karnataka-home-meal.jpg"), { contentType: "image/jpeg", upsert: true }),
    "verification upload",
  );
  check(await db.from("host_documents").insert({ host_id: pending.host.id, kind: "kitchen", path: kitchenPath }), "document");
  check(
    await db.from("notifications").insert({ user_id: ids.admin, title: "New host application", body: kavitha.display_name, href: "/admin" }),
    "notify team",
  );

  // Demo mode lets the team run the timers as if it were later.
  check(await db.from("app_settings").update({ demo_mode: true }).eq("id", true), "demo mode");

  const counts = {};
  for (const b of bookings) counts[b.status] = (counts[b.status] ?? 0) + 1;
  console.log("Bookings by state:", counts);
  console.log("\nDemo logins (password: DEMO_PASSWORD in .env.demo.local):");
  console.log(`  Guest  ${people.guest.email}`);
  console.log(`  Host   ${people.host.email}  (Farhana's Dastarkhwan, Hyderabad)`);
  console.log(`  Team   ${people.admin.email}`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
