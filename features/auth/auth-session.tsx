"use client";

import { useEffect } from "react";
import { session } from "./session";
import { useAuthStore } from "./store";

/**
 * Restores the session from the refresh-token cookie after mount, then follows logins
 * and logouts made in other tabs. Renders nothing; mount it once near the root.
 */
export function AuthSession() {
  useEffect(() => {
    const { refresh, endSession } = useAuthStore.getState();
    session.removeLegacyStorage();
    refresh().then(() => useAuthStore.setState({ isLoading: false }));

    return session.onExternalChange((event) => {
      if (event === "logout") endSession("signed-out");
      else refresh();
    });
  }, []);

  return null;
}
