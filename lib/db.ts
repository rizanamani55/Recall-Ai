// lib/db.ts
import fs from "fs";
import path from "path";
import { isSupabaseConfiguredServer, supabaseServer } from "./supabase/server";

export interface DBUser {
  id: string;
  clerk_id: string;
  email: string;
  plan: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  created_at: string;
}

export interface DBDeck {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  source_text: string;
  card_count: number;
  created_at: string;
  updated_at: string;
}

export interface DBCard {
  id: string;
  deck_id: string;
  position: number;
  sentence: string;
  blanks: { term: string; hint: string }[];
  created_at: string;
}

// LOCAL FILE DATABASE FALLBACK SETUP
const DB_FILE_PATH = path.join(process.cwd(), "db.json");

function readLocalDB() {
  if (!fs.existsSync(DB_FILE_PATH)) {
    const initial = { users: [], decks: [], cards: [], daily_usage: [] };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
  try {
    const content = fs.readFileSync(DB_FILE_PATH, "utf8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading db.json, resetting", err);
    return { users: [], decks: [], cards: [], daily_usage: [] };
  }
}

function writeLocalDB(data: any) {
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
}

// UNIFIED EXPORTS
export async function getOrCreateUser(clerkId: string, email: string): Promise<DBUser> {
  if (isSupabaseConfiguredServer && supabaseServer) {
    const { data: existing, error: selectError } = await supabaseServer
      .from("users")
      .select("*")
      .eq("clerk_id", clerkId)
      .maybeSingle();

    if (existing) {
      return { ...existing, plan: "pro" };
    }

    const { data: created, error: insertError } = await supabaseServer
      .from("users")
      .insert([{ clerk_id: clerkId, email, plan: "pro" }])
      .select("*")
      .single();

    if (insertError) {
      console.error("Supabase User Insert Error:", insertError);
      throw insertError;
    }
    return { ...created, plan: "pro" };
  } else {
    // Local JSON DB
    const db = readLocalDB();
    let user = db.users.find((u: any) => u.clerk_id === clerkId);
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        clerk_id: clerkId,
        email,
        plan: "pro", // Default to pro for 100% free unlimited edition!
        created_at: new Date().toISOString(),
      };
      db.users.push(user);
      writeLocalDB(db);
    } else if (user.plan !== "pro") {
      user.plan = "pro"; // Auto upgrade existing mock users
      writeLocalDB(db);
    }
    return user;
  }
}

export async function updateUserSubscription(
  clerkId: string,
  plan: string,
  stripeCustomerId?: string | null,
  stripeSubscriptionId?: string | null
): Promise<void> {
  if (isSupabaseConfiguredServer && supabaseServer) {
    const { error } = await supabaseServer
      .from("users")
      .update({
        plan,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
      })
      .eq("clerk_id", clerkId);

    if (error) console.error("Supabase user update error:", error);
  } else {
    const db = readLocalDB();
    const user = db.users.find((u: any) => u.clerk_id === clerkId);
    if (user) {
      user.plan = plan;
      if (stripeCustomerId !== undefined) user.stripe_customer_id = stripeCustomerId;
      if (stripeSubscriptionId !== undefined) user.stripe_subscription_id = stripeSubscriptionId;
      writeLocalDB(db);
    }
  }
}

export async function createDeck(
  clerkId: string,
  title: string,
  subject: string,
  sourceText: string,
  cards: { sentence: string; blanks: { term: string; hint: string }[] }[]
): Promise<DBDeck> {
  const user = await getOrCreateUser(clerkId, `${clerkId}@example.com`);

  if (isSupabaseConfiguredServer && supabaseServer) {
    const { data: deck, error: deckError } = await supabaseServer
      .from("decks")
      .insert([
        {
          user_id: user.id,
          title,
          subject,
          source_text: sourceText,
          card_count: cards.length,
        },
      ])
      .select("*")
      .single();

    if (deckError || !deck) {
      console.error("Supabase deck creation error:", deckError);
      throw deckError || new Error("Failed to create deck");
    }

    const cardsToInsert = cards.map((c, index) => ({
      deck_id: deck.id,
      position: index,
      sentence: c.sentence,
      blanks: c.blanks,
    }));

    const { error: cardsError } = await supabaseServer.from("cards").insert(cardsToInsert);
    if (cardsError) {
      console.error("Supabase cards insert error:", cardsError);
      // Clean up orphaned deck
      await supabaseServer.from("decks").delete().eq("id", deck.id);
      throw cardsError;
    }

    return deck;
  } else {
    // Local JSON DB
    const db = readLocalDB();
    const deckId = crypto.randomUUID();
    const newDeck: DBDeck = {
      id: deckId,
      user_id: user.id,
      title,
      subject,
      source_text: sourceText,
      card_count: cards.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newCards: DBCard[] = cards.map((c, i) => ({
      id: crypto.randomUUID(),
      deck_id: deckId,
      position: i,
      sentence: c.sentence,
      blanks: c.blanks,
      created_at: new Date().toISOString(),
    }));

    db.decks.push(newDeck);
    db.cards.push(...newCards);
    writeLocalDB(db);

    return newDeck;
  }
}

export async function getDecks(clerkId: string): Promise<DBDeck[]> {
  const user = await getOrCreateUser(clerkId, `${clerkId}@example.com`);

  if (isSupabaseConfiguredServer && supabaseServer) {
    const { data, error } = await supabaseServer
      .from("decks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase getDecks error:", error);
      return [];
    }
    return data || [];
  } else {
    const db = readLocalDB();
    return db.decks
      .filter((d: any) => d.user_id === user.id)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export async function getDeck(
  clerkId: string,
  deckId: string
): Promise<{ deck: DBDeck; cards: DBCard[] } | null> {
  const user = await getOrCreateUser(clerkId, `${clerkId}@example.com`);

  if (isSupabaseConfiguredServer && supabaseServer) {
    const { data: deck, error: deckError } = await supabaseServer
      .from("decks")
      .select("*")
      .eq("id", deckId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (deckError || !deck) return null;

    const { data: cards, error: cardsError } = await supabaseServer
      .from("cards")
      .select("*")
      .eq("deck_id", deckId)
      .order("position", { ascending: true });

    if (cardsError) return null;

    return { deck, cards: cards || [] };
  } else {
    const db = readLocalDB();
    const deck = db.decks.find((d: any) => d.id === deckId && d.user_id === user.id);
    if (!deck) return null;

    const cards = db.cards
      .filter((c: any) => c.deck_id === deckId)
      .sort((a: any, b: any) => a.position - b.position);

    return { deck, cards };
  }
}

export async function deleteDeck(clerkId: string, deckId: string): Promise<boolean> {
  const user = await getOrCreateUser(clerkId, `${clerkId}@example.com`);

  if (isSupabaseConfiguredServer && supabaseServer) {
    const { error } = await supabaseServer
      .from("decks")
      .delete()
      .eq("id", deckId)
      .eq("user_id", user.id);

    return !error;
  } else {
    const db = readLocalDB();
    const index = db.decks.findIndex((d: any) => d.id === deckId && d.user_id === user.id);
    if (index === -1) return false;

    db.decks.splice(index, 1);
    db.cards = db.cards.filter((c: any) => c.deck_id !== deckId);
    writeLocalDB(db);
    return true;
  }
}

export async function getDailyUsage(clerkId: string): Promise<number> {
  const user = await getOrCreateUser(clerkId, `${clerkId}@example.com`);
  const today = new Date().toISOString().split("T")[0];

  if (isSupabaseConfiguredServer && supabaseServer) {
    const { data, error } = await supabaseServer
      .from("daily_usage")
      .select("conversions_used")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    if (error || !data) return 0;
    return data.conversions_used || 0;
  } else {
    const db = readLocalDB();
    const entry = db.daily_usage.find((du: any) => du.user_id === user.id && du.date === today);
    return entry ? entry.conversions_used : 0;
  }
}

export async function incrementDailyUsage(clerkId: string): Promise<number> {
  const user = await getOrCreateUser(clerkId, `${clerkId}@example.com`);
  const today = new Date().toISOString().split("T")[0];

  if (isSupabaseConfiguredServer && supabaseServer) {
    const current = await getDailyUsage(clerkId);
    const nextVal = current + 1;

    const { error } = await supabaseServer.from("daily_usage").upsert({
      user_id: user.id,
      date: today,
      conversions_used: nextVal,
    });

    if (error) console.error("Supabase usage increment error:", error);
    return nextVal;
  } else {
    const db = readLocalDB();
    let entry = db.daily_usage.find((du: any) => du.user_id === user.id && du.date === today);
    if (!entry) {
      entry = { user_id: user.id, date: today, conversions_used: 1 };
      db.daily_usage.push(entry);
    } else {
      entry.conversions_used += 1;
    }
    writeLocalDB(db);
    return entry.conversions_used;
  }
}
