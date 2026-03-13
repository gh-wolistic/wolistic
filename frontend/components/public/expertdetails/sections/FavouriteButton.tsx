"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { useSessionStore } from "@/store/session";
import {
  addFavourite,
  fetchFavouriteStatus,
  removeFavourite,
} from "@/components/public/data/favouritesApi";

type FavouriteButtonProps = {
  professionalId: string;
};

export function FavouriteButton({ professionalId }: FavouriteButtonProps) {
  const { accessToken: sessionToken } = useAuthSession();
  const storeToken = useSessionStore((state) => state.token);
  const token = storeToken ?? sessionToken;

  const [isFavourited, setIsFavourited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load persisted state for logged-in users on mount.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchFavouriteStatus(professionalId, token).then((value) => {
      if (!cancelled) setIsFavourited(value);
    });
    return () => {
      cancelled = true;
    };
  }, [professionalId, token]);

  const handleToggle = async () => {
    if (!token) {
      // Guest — no action; button title conveys the requirement.
      return;
    }

    const next = !isFavourited;
    setIsFavourited(next); // optimistic
    setIsLoading(true);
    try {
      if (next) {
        await addFavourite(professionalId, token);
      } else {
        await removeFavourite(professionalId, token);
      }
    } catch {
      setIsFavourited(!next); // revert on error
    } finally {
      setIsLoading(false);
    }
  };

  const label = token
    ? isFavourited
      ? "Remove from favourites"
      : "Save to favourites"
    : "Sign in to save to favourites";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="rounded-full"
      aria-label={label}
      title={label}
      disabled={isLoading}
      onClick={() => void handleToggle()}
    >
      <Heart
        size={20}
        className={isFavourited ? "fill-red-500 text-red-500" : ""}
      />
    </Button>
  );
}
