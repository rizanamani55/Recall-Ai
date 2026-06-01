// lib/indexeddb.ts - IndexedDB wrapper for browser-only storage

const DB_NAME = "recall_ai_db";
const DB_VERSION = 1;
const STORE_USERS = "users";
const STORE_DECKS = "decks";
const STORE_CARDS = "cards";

interface DBSchema {
  users: { key: string; value: any };
  decks: { key: string; value: any };
  cards: { key: string; value: any };
}

let db: IDBDatabase | null = null;

async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!database.objectStoreNames.contains(STORE_USERS)) {
        database.createObjectStore(STORE_USERS, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(STORE_DECKS)) {
        database.createObjectStore(STORE_DECKS, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(STORE_CARDS)) {
        database.createObjectStore(STORE_CARDS, { keyPath: "id" });
      }
    };
  });
}

export async function getOrCreateUser(userId: string, email: string) {
  const database = await initDB();
  const tx = database.transaction([STORE_USERS], "readwrite");
  const store = tx.objectStore(STORE_USERS);
  
  return new Promise((resolve, reject) => {
    const getRequest = store.get(userId);
    
    getRequest.onsuccess = () => {
      if (getRequest.result) {
        resolve(getRequest.result);
      } else {
        const newUser = {
          id: userId,
          email,
          plan: "free",
          createdAt: new Date(),
        };
        const putRequest = store.put(newUser);
        putRequest.onsuccess = () => resolve(newUser);
        putRequest.onerror = () => reject(putRequest.error);
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function getDecks(userId: string) {
  const database = await initDB();
  const tx = database.transaction([STORE_DECKS], "readonly");
  const store = tx.objectStore(STORE_DECKS);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const decks = (request.result || []).filter((d: any) => d.userId === userId);
      resolve(decks);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getDeck(userId: string, deckId: string) {
  const database = await initDB();
  const tx = database.transaction([STORE_DECKS, STORE_CARDS], "readonly");
  
  return new Promise((resolve, reject) => {
    const deckStore = tx.objectStore(STORE_DECKS);
    const deckRequest = deckStore.get(deckId);

    deckRequest.onsuccess = () => {
      const deck = deckRequest.result;
      if (!deck || deck.userId !== userId) {
        resolve(null);
        return;
      }

      const cardStore = tx.objectStore(STORE_CARDS);
      const cardsRequest = cardStore.getAll();

      cardsRequest.onsuccess = () => {
        const cards = (cardsRequest.result || []).filter(
          (c: any) => c.deckId === deckId
        );
        resolve({ deck, cards });
      };
      cardsRequest.onerror = () => reject(cardsRequest.error);
    };
    deckRequest.onerror = () => reject(deckRequest.error);
  });
}

export async function createDeck(
  userId: string,
  title: string,
  subject: string,
  sourceText: string,
  cards: any[]
) {
  const database = await initDB();
  const deckId = `deck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const deck = {
    id: deckId,
    userId,
    title,
    subject,
    sourceText,
    createdAt: new Date(),
    cardCount: cards.length,
  };

  const tx = database.transaction([STORE_DECKS, STORE_CARDS], "readwrite");

  return new Promise((resolve, reject) => {
    const deckStore = tx.objectStore(STORE_DECKS);
    const deckRequest = deckStore.put(deck);

    deckRequest.onsuccess = () => {
      const cardStore = tx.objectStore(STORE_CARDS);
      const cardsToInsert = cards.map((card, idx) => ({
        ...card,
        id: `card_${deckId}_${idx}`,
        deckId,
      }));

      let cardCount = 0;
      cardsToInsert.forEach((card) => {
        const cardRequest = cardStore.put(card);
        cardRequest.onsuccess = () => {
          cardCount++;
          if (cardCount === cardsToInsert.length) {
            resolve({ deck, cards: cardsToInsert });
          }
        };
        cardRequest.onerror = () => reject(cardRequest.error);
      });

      if (cardsToInsert.length === 0) {
        resolve({ deck, cards: [] });
      }
    };
    deckRequest.onerror = () => reject(deckRequest.error);
  });
}

export async function deleteDeck(userId: string, deckId: string) {
  const database = await initDB();
  const tx = database.transaction([STORE_DECKS, STORE_CARDS], "readwrite");

  return new Promise((resolve, reject) => {
    const deckStore = tx.objectStore(STORE_DECKS);
    const getRequest = deckStore.get(deckId);

    getRequest.onsuccess = () => {
      const deck = getRequest.result;
      if (!deck || deck.userId !== userId) {
        resolve(false);
        return;
      }

      const deleteRequest = deckStore.delete(deckId);
      deleteRequest.onsuccess = () => {
        const cardStore = tx.objectStore(STORE_CARDS);
        const cardRequest = cardStore.getAll();

        cardRequest.onsuccess = () => {
          const cardsToDelete = (cardRequest.result || []).filter(
            (c: any) => c.deckId === deckId
          );
          let deleted = 0;
          cardsToDelete.forEach((card) => {
            const delRequest = cardStore.delete(card.id);
            delRequest.onsuccess = () => {
              deleted++;
              if (deleted === cardsToDelete.length) {
                resolve(true);
              }
            };
          });
          if (cardsToDelete.length === 0) {
            resolve(true);
          }
        };
      };
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function getDailyUsage(userId: string) {
  // Browser version - unlimited usage
  return 0;
}
