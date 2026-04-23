import {
  confirmAddItemBtn,
  addItemInput,
} from "./dom.js";
import { supabaseClient } from './supabase-client.js';
import { generateShareLink } from "./share-name-list.js";



async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser();

  if (error) {
    console.error("Fehler beim Laden des Users:", error.message);
    return null;
  }

  return user;
}

export function saveWheelDB(): void {
    console.log("saveWheelDB() wurde aufgerufen");
    confirmAddItemBtn?.addEventListener("click", async () => {
        const user = await getCurrentUser();

        if (!user) {
            console.error("Kein Nutzer eingeloggt.");
            return;
        }

        const itemName = addItemInput?.value.trim();

        if (!itemName) {
            console.error("Kein Name eingegeben.");
            return;
        }

        const link = generateShareLink();

        const { error } = await supabaseClient
            .from("saved_links")
            .insert([
                {
                    user_id: user.id,
                    link_name: itemName,
                    url: link
                }
            ]);

        if (error) {
            console.error("Fehler beim Speichern in der Datenbank:", error.message);
            return;
        }

        console.log("Wheel erfolgreich gespeichert.");
        if (addItemInput) {
            addItemInput.value = "";
        }
    });
}
