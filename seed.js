/**
 * seed.js — Populates the database with dummy data
 *
 * Run from the backend/ directory:
 *   node seed.js
 *
 * NOTE: Uses the real model files (src/models/*) so that:
 *   - Password hashing is handled by the User pre('save') hook — no double-hashing
 *   - syncIndexes() drops stale indexes and creates new ones per the models
 */

require('dotenv').config();
const mongoose = require('mongoose');
const dns      = require('node:dns');

try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (_) {}

// ── Import actual models (indexes + hooks already defined there) ──────────────
const User = require('./src/models/User');
const Note = require('./src/models/Note');
const Post = require('./src/models/Post');

// ── Seed Data ─────────────────────────────────────────────────────────────────
const usersData = [
  {
    name: 'Admin User',
    email: 'admin@noteapp.com',
    password: 'admin123',   // pre('save') hook will hash this
    role: 'admin',
    interests: ['management', 'productivity', 'technology'],
  },
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'password123',
    role: 'user',
    interests: ['chess', 'reading', 'cooking'],
  },
  {
    name: 'Bob Smith',
    email: 'bob@example.com',
    password: 'password123',
    role: 'user',
    interests: ['chess', 'gaming', 'music'],
  },
  {
    name: 'Carol Williams',
    email: 'carol@example.com',
    password: 'password123',
    role: 'user',
    interests: ['reading', 'photography', 'travel'],
  },
  {
    name: 'David Brown',
    email: 'david@example.com',
    password: 'password123',
    role: 'user',
    interests: ['coding', 'music', 'gaming'],
  },
  {
    name: 'Eva Martinez',
    email: 'eva@example.com',
    password: 'password123',
    role: 'user',
    interests: ['cooking', 'travel', 'reading'],
  },
];

const notesData = [
  // Alice (3)
  { title: 'Chess Opening Strategies', content: 'The Sicilian Defense is one of the most popular responses to 1.e4. It leads to complex, asymmetrical positions where both sides fight for the initiative. Key lines include the Najdorf, Dragon, and Scheveningen variations.' },
  { title: 'Recipe: Pasta Carbonara', content: 'Ingredients: 400g spaghetti, 200g pancetta, 4 eggs, 100g Pecorino Romano, black pepper. Cook pancetta until crispy. Mix eggs and cheese. Toss pasta with pancetta off heat, add egg mixture slowly.' },
  { title: 'Book Notes: Atomic Habits', content: 'Key insight: tiny changes compound over time. The 1% rule — improving by 1% every day leads to being 37x better in a year. Focus on systems not goals. Identity-based habits: "I am a reader" not "I want to read."' },
  // Bob (2)
  { title: 'Gaming Session Notes', content: 'Finally cleared the last boss in Elden Ring after 12 attempts. Key strategy: use mimic tear ashes, equip fire damage reduction armor, use rivers of blood katana. The fight took roughly 8 minutes.' },
  { title: 'Guitar Chord Progressions', content: 'Common progressions: I-IV-V-I (C-F-G-C), ii-V-I in jazz (Dm7-G7-Cmaj7). Practice barre chords daily. The F chord is the most difficult for beginners — keep at it for at least 2 weeks.' },
  // Carol (3)
  { title: 'Photography Tips', content: 'Golden hour is 1 hour after sunrise and 1 hour before sunset. Rule of thirds: place subject at intersection points. Use a tripod for shutter speeds below 1/60s. RAW format gives more editing flexibility.' },
  { title: 'Japan Travel Itinerary', content: 'Day 1-3: Tokyo — Shibuya crossing, Senso-ji temple, Akihabara. Day 4: Hakone — Mt. Fuji views, ryokan stay. Day 5-7: Kyoto — Fushimi Inari, Arashiyama bamboo, Kinkaku-ji. Day 8: Osaka — Dotonbori, street food.' },
  { title: 'Books to Read This Year', content: '1. Sapiens by Yuval Noah Harari\n2. The Name of the Wind by Patrick Rothfuss\n3. Meditations by Marcus Aurelius\n4. Dune by Frank Herbert\n5. The Pragmatic Programmer' },
  // David (3)
  { title: 'JavaScript Async Notes', content: 'Promises vs async/await: async/await is syntactic sugar over Promises. Always use try/catch with await. Promise.all() runs in parallel — much faster than sequential awaits. Use Promise.allSettled() when you want all results even on failure.' },
  { title: 'MongoDB Aggregation Study', content: '$match → $group → $project → $sort is the typical pipeline order. $lookup is for joining collections. $unwind deconstructs array fields. $facet allows multiple pipelines in parallel. Always add indexes to fields used in $match.' },
  { title: 'Music Production Setup', content: 'DAW: Ableton Live 11. Audio Interface: Focusrite Scarlett 2i2. Monitors: Yamaha HS5. VSTs: Serum for synths, Kontakt for samples, FabFilter Pro-Q3 for EQ. Room treatment is critical — bass traps in corners first.' },
  // Eva (2)
  { title: 'Thai Curry Recipe', content: 'Red curry paste, coconut milk, Thai basil, fish sauce, palm sugar. Fry paste in coconut cream first to release oils. Add chicken, then thin coconut milk. Simmer 15 mins. Balance: salty (fish sauce), sweet (palm sugar), sour (lime).' },
  { title: 'Bali Trip Planning', content: 'Best months: April-June, September-October (dry season). Stay in Ubud for culture, Seminyak for beach. Must see: Tanah Lot temple at sunset, Tegallalang rice terraces, Uluwatu for cliffside views. Budget: $60-100/day mid-range.' },
];

const postsData = [
  // Alice (2)
  { title: 'Why Chess Makes You Smarter', body: 'Chess develops critical thinking, pattern recognition, and planning skills. Studies show chess players have enhanced memory and problem-solving abilities. Even 30 minutes a day of puzzles on Chess.com can make a measurable difference in cognitive function.' },
  { title: 'My Top 5 Cookbook Recommendations', body: 'After years of cooking, these are the books that genuinely changed how I cook: 1) Salt, Fat, Acid, Heat by Samin Nosrat. 2) The Food Lab by J. Kenji López-Alt — the science of cooking. 3) Jerusalem by Yotam Ottolenghi.' },
  // Bob (2)
  { title: 'Best RPGs of the Last Decade', body: 'The RPG genre has exploded in quality. Elden Ring redefined open-world design. The Witcher 3 set the standard for narrative. Disco Elysium proved that dialogue IS gameplay. Baldur\'s Gate 3 brought CRPG to mainstream audiences.' },
  { title: 'Learning Guitar at 25: Month 3 Update', body: 'Three months in and I can finally play a few songs all the way through. Blackbird by the Beatles is my current goal. My biggest advice: practice 20 minutes every day rather than 2 hours once a week.' },
  // Carol (2)
  { title: 'Solo Travel as a Woman: What I Learned', body: 'After traveling solo to 15 countries: trust your gut, over-communicate your itinerary, learn basic local phrases, and always have offline maps. Japan and Portugal are the safest for solo female travelers.' },
  { title: 'Film Photography Revival', body: 'Film is back. Kodak Portra 400 is hard to find but worth it. The grain, the colors, the forced intentionality of 36 exposures — digital cannot replicate the feeling. I shoot with a Canon AE-1 Program from 1981.' },
  // David (2)
  { title: 'MongoDB Indexing: A Practical Guide', body: 'Compound indexes are almost always better than single-field indexes for real queries. Avoid over-indexing — every index slows writes. Use .explain("executionStats") to verify index usage. The $lookup stage benefits enormously from an index on the foreignField.' },
  { title: 'Why I Switched from Webpack to Vite', body: 'Vite\'s dev server starts in under 300ms regardless of project size. HMR is instant. Configuration is simple. For new projects there is no reason to reach for Webpack. Migration took me less than a day for a medium-sized React app.' },
  // Eva (2)
  { title: 'Street Food Guide: Southeast Asia', body: 'The best food in Southeast Asia costs less than $2. Bangkok: pad see ew from street carts. Vietnam: bún bò Huế for depth of flavor. Malaysia: nasi lemak for breakfast. Always eat where locals eat — queue length is the quality indicator.' },
  { title: 'Fermenting at Home: A Beginner\'s Journey', body: 'Started fermenting kimchi, kombucha, and sourdough this year. Key lesson: temperature control matters above all. 18-22°C is the sweet spot for most lacto-fermentation. Start with kimchi — most forgiving and most delicious.' },
];

// ── Main Seed Function ─────────────────────────────────────────────────────────
const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Note.deleteMany({}),
      Post.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Sync indexes — drops stale indexes and creates fresh ones per model definitions
    await Promise.all([
      User.syncIndexes(),
      Note.syncIndexes(),
      Post.syncIndexes(),
    ]);
    console.log('🔄 Synced indexes and dropped stale indexes');

    // Create users — passwords are hashed automatically by the pre('save') hook in User.js
    const created = [];
    for (const u of usersData) {
      const doc = await User.create(u);
      created.push(doc);
      console.log(`👤 Created user: ${doc.email} (${doc.role})`);
    }

    // Map users by name for easy reference
    const byName = {};
    created.forEach(u => { byName[u.name] = u; });

    const alice = byName['Alice Johnson'];
    const bob   = byName['Bob Smith'];
    const carol = byName['Carol Williams'];
    const david = byName['David Brown'];
    const eva   = byName['Eva Martinez'];

    // Assign notes to users
    const noteOwners = [alice, alice, alice, bob, bob, carol, carol, carol, david, david, david, eva, eva];
    for (let i = 0; i < notesData.length; i++) {
      const note = await Note.create({ ...notesData[i], owner: noteOwners[i]._id });
      console.log(`📝 Created note: "${note.title}" → ${noteOwners[i].name}`);
    }

    // Assign posts to users
    const postOwners = [alice, alice, bob, bob, carol, carol, david, david, eva, eva];
    for (let i = 0; i < postsData.length; i++) {
      const post = await Post.create({ ...postsData[i], author: postOwners[i]._id });
      console.log(`📢 Created post: "${post.title}" → ${postOwners[i].name}`);
    }

    console.log('\n✅ Seeding complete!\n');
    console.log('═══════════════════════════════════════════════');
    console.log('  LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════════════');
    console.log('  ADMIN  → admin@noteapp.com    / admin123');
    console.log('  USER   → alice@example.com    / password123');
    console.log('  USER   → bob@example.com      / password123');
    console.log('  USER   → carol@example.com    / password123');
    console.log('  USER   → david@example.com    / password123');
    console.log('  USER   → eva@example.com      / password123');
    console.log('═══════════════════════════════════════════════\n');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed.');
    process.exit(0);
  }
};

seed();
