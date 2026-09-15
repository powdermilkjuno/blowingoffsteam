export default function FavoriteStarButton({
  favorited,
  labeled = false,
}: {
  favorited: boolean;
  labeled?: boolean;
}) {
  return (
    <button
      type="submit"
      aria-pressed={favorited}
      aria-label={favorited ? "Unfavorite group" : "Favorite group"}
      className="inline-flex items-center gap-2 rounded-sm p-1 text-clay hover:text-signal"
    >
      <span className="flex size-10 items-center justify-center text-3xl leading-none" aria-hidden>
        {favorited ? "★" : "☆"}
      </span>
      {labeled ? (
        <span className="text-sm">
          {favorited ? "Favorited" : "Favorite"}
        </span>
      ) : null}
    </button>
  );
}
