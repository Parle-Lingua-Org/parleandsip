"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  Bookmark,
  ChevronDown,
  Flame,
  Gamepad2,
  Menu,
  Search,
  Sparkles,
  Star,
  UsersRound,
  X,
} from "lucide-react";

type Game = {
  title: string;
  studio: string;
  category: string;
  rating: string;
  players: string;
  image: string;
  color: string;
  tag?: string;
};

const games: Game[] = [
  {
    title: "Wildwood",
    studio: "Mosslight Studio",
    category: "Adventure",
    rating: "4.9",
    players: "12k",
    image: "photo-1470770841072-f978cf4d019e",
    color: "#456d50",
    tag: "JUST DROPPED",
  },
  {
    title: "Afterglow",
    studio: "Soft Signal",
    category: "RPG",
    rating: "4.8",
    players: "8.4k",
    image: "photo-1519608487953-e999c86e7455",
    color: "#9b5578",
    tag: "COMMUNITY PICK",
  },
  {
    title: "Driftline",
    studio: "Little Engine",
    category: "Action",
    rating: "4.7",
    players: "6.1k",
    image: "photo-1500530855697-b586d89ba3ee",
    color: "#ca6e3d",
  },
  {
    title: "Paper Garden",
    studio: "Sunday Games",
    category: "Cozy",
    rating: "4.9",
    players: "4.2k",
    image: "photo-1441974231531-c6227db76b6e",
    color: "#7d9a51",
  },
  {
    title: "Deep Current",
    studio: "Blue Hour",
    category: "Adventure",
    rating: "4.6",
    players: "3.8k",
    image: "photo-1518837695005-2083093ee35b",
    color: "#367b83",
  },
  {
    title: "Little Orbit",
    studio: "Soft Signal",
    category: "Cozy",
    rating: "4.8",
    players: "2.9k",
    image: "photo-1462331940025-496dfbfc7564",
    color: "#655c91",
  },
];

const categories = ["For you", "All games", "Action", "Adventure", "RPG", "Cozy"];

const trending = [
  { title: "Glasshouse", detail: "A puzzle that won't let go", score: "98%" },
  { title: "Rooftop Rally", detail: "Fast, loud, and very fun", score: "96%" },
  { title: "Tiny Tactics", detail: "Big strategy, little guys", score: "95%" },
];

function imageUrl(id: string, width = 900) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("For you");
  const [search, setSearch] = useState("");
  const [savedGames, setSavedGames] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleGames = useMemo(() => {
    const query = search.trim().toLowerCase();
    return games.filter((game) => {
      const matchesCategory =
        activeCategory === "For you" ||
        activeCategory === "All games" ||
        game.category === activeCategory;
      const matchesSearch =
        !query || `${game.title} ${game.studio} ${game.category}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  function toggleSaved(title: string) {
    setSavedGames((current) =>
      current.includes(title) ? current.filter((game) => game !== title) : [...current, title],
    );
  }

  return (
    <main>
      <div className="announcement">
        <span className="announcement-dot" />
        <span>YOUR NEXT FAVORITE GAME IS OUT THERE</span>
        <ArrowDownRight size={14} strokeWidth={2.5} aria-hidden="true" />
      </div>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Sidequest home">
          <span className="brand-mark"><Gamepad2 size={21} strokeWidth={2.5} /></span>
          <span>sidequest<span className="brand-period">.</span></span>
        </a>

        <button
          className="mobile-menu-button icon-button"
          type="button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>

        <nav className={`main-nav${menuOpen ? " is-open" : ""}`} aria-label="Main navigation">
          <a className="nav-link is-active" href="#discover" onClick={() => setMenuOpen(false)}>Discover</a>
          <a className="nav-link" href="#trending" onClick={() => setMenuOpen(false)}>Charts</a>
          <a className="nav-link" href="#community" onClick={() => setMenuOpen(false)}>Community</a>
        </nav>

        <div className="header-actions">
          <button className="header-search" type="button" onClick={() => document.getElementById("game-search")?.focus()}>
            <Search size={16} aria-hidden="true" />
            <span>Find a game</span>
            <kbd>/</kbd>
          </button>
          <button className="sign-in-button" type="button">Sign in <ArrowRight size={15} /></button>
        </div>
      </header>

      <div className="page-shell" id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-art" role="img" aria-label="A quiet mountain lake at sunset" />
          <div className="hero-grain" />
          <div className="hero-content">
            <div className="hero-kicker"><span /> THIS WEEK&apos;S BIG ADVENTURE</div>
            <p className="hero-overline">THE WILD IS CALLING</p>
            <h1 id="hero-title">Find your<br />way <em>out there.</em></h1>
            <p className="hero-description">Take the long way home. Wildwood is a hand-painted open-world adventure about getting wonderfully lost.</p>
            <div className="hero-meta">
              <span><Star size={15} fill="currentColor" /> 4.9</span>
              <i />
              <span>Adventure</span>
              <i />
              <span>Out now</span>
            </div>
            <a className="hero-cta" href="#discover">Explore Wildwood <ArrowRight size={17} /></a>
          </div>
          <div className="hero-counter"><span>01</span> / 04</div>
          <div className="hero-caption"><span>01 / 04</span><span>THE QUIET EDGE OF THE WORLD</span></div>
        </section>

        <section className="discovery-section" id="discover" aria-labelledby="discovery-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow"><Sparkles size={14} /> HAND-PICKED FOR YOU</p>
              <h2 id="discovery-title">A good place to <em>start.</em></h2>
            </div>
            <label className="search-box" htmlFor="game-search">
              <Search size={17} aria-hidden="true" />
              <input
                id="game-search"
                type="search"
                placeholder="Search games or studios"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <ChevronDown size={15} className="search-chevron" aria-hidden="true" />
            </label>
          </div>

          <div className="discovery-layout">
            <div className="game-discovery">
              <div className="category-row" role="tablist" aria-label="Game categories">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`category-tab${activeCategory === category ? " is-selected" : ""}`}
                    type="button"
                    role="tab"
                    aria-selected={activeCategory === category}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {visibleGames.length > 0 ? (
                <div className="game-grid">
                  {visibleGames.map((game, index) => {
                    const isSaved = savedGames.includes(game.title);
                    return (
                      <article className="game-card" key={game.title} style={{ "--card-delay": `${index * 55}ms` } as React.CSSProperties}>
                        <a
                          className="game-cover"
                          href="#community"
                          style={{ backgroundImage: `linear-gradient(180deg, transparent 54%, rgba(12, 21, 17, .46)), url("${imageUrl(game.image)}")`, backgroundColor: game.color }}
                          aria-label={`View ${game.title}`}
                        >
                          {game.tag && <span className="cover-tag">{game.tag}</span>}
                          <span className="cover-category">{game.category}</span>
                        </a>
                        <div className="game-info">
                          <div className="game-copy">
                            <h3>{game.title}</h3>
                            <p>{game.studio}</p>
                          </div>
                          <button
                            className={`save-button${isSaved ? " is-saved" : ""}`}
                            type="button"
                            aria-label={isSaved ? `Remove ${game.title} from saved games` : `Save ${game.title}`}
                            aria-pressed={isSaved}
                            onClick={() => toggleSaved(game.title)}
                          >
                            <Bookmark size={17} fill={isSaved ? "currentColor" : "none"} />
                          </button>
                        </div>
                        <div className="game-stats"><span><Star size={13} fill="currentColor" /> {game.rating}</span><span><UsersRound size={14} /> {game.players} playing</span></div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <Search size={22} />
                  <p>No games found. Try another title or category.</p>
                  <button type="button" onClick={() => { setSearch(""); setActiveCategory("For you"); }}>Clear filters</button>
                </div>
              )}
              <a className="browse-link" href="#discover">Browse all games <ArrowRight size={16} /></a>
            </div>

            <aside className="trending-panel" id="trending" aria-labelledby="trending-title">
              <div className="trending-heading">
                <div><p className="eyebrow"><Flame size={14} /> THE PEOPLE HAVE SPOKEN</p><h2 id="trending-title">On the rise</h2></div>
                <button className="more-button" type="button" aria-label="More trending games"><ArrowRight size={17} /></button>
              </div>
              <ol className="trending-list">
                {trending.map((game, index) => (
                  <li key={game.title}>
                    <span className="trend-number">0{index + 1}</span>
                    <div className={`trend-art trend-art-${index + 1}`} role="img" aria-label={`${game.title} cover art`} />
                    <div className="trend-copy"><h3>{game.title}</h3><p>{game.detail}</p></div>
                    <span className="trend-score">{game.score}</span>
                  </li>
                ))}
              </ol>
              <div className="community-note" id="community">
                <div className="community-icon"><UsersRound size={18} /></div>
                <div><strong>Good games are better together.</strong><p>Meet the people who play what you play.</p></div>
                <ArrowRight size={16} className="community-arrow" />
              </div>
              <p className="panel-footnote">UPDATED EVERY DAY <span>•</span> BUILT BY PLAYERS</p>
            </aside>
          </div>
        </section>

        <footer className="site-footer">
          <a className="brand footer-brand" href="#top"><span className="brand-mark"><Gamepad2 size={18} strokeWidth={2.5} /></span><span>sidequest<span className="brand-period">.</span></span></a>
          <p>Make room for play.</p>
          <span className="footer-note">A LITTLE CORNER OF THE INTERNET FOR GAMES</span>
        </footer>
      </div>
    </main>
  );
}