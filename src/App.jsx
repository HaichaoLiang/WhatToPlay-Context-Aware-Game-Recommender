import { useEffect, useMemo, useState } from 'react'
import './App.css'

const GOALS = ['Relax', 'Competitive', 'Story', 'Social']
const MOCK_ONLINE_FRIENDS = [
  { id: 1, name: 'Yining', game: 'Hades' },
  { id: 2, name: 'Haichao', game: 'Overwatch 2' },
  { id: 3, name: 'Alex', game: 'Vampire Survivors' },
]

const FALLBACK_GAMES = [
  {
    id: 1,
    title: 'Stardew Valley',
    genre: 'Simulation',
    platform: 'PC (Windows)',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=60',
    short_description: 'Build your farm, fish, and relax at your own pace.',
    release_date: '2016-02-26',
    publisher: 'ConcernedApe',
  },
  {
    id: 2,
    title: 'Hades',
    genre: 'Action RPG',
    platform: 'PC (Windows)',
    thumbnail: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=800&q=60',
    short_description: 'Fast runs with meaningful progress in short bursts.',
    release_date: '2020-09-17',
    publisher: 'Supergiant Games',
  },
  {
    id: 3,
    title: 'Minecraft',
    genre: 'Sandbox',
    platform: 'PC (Windows)',
    thumbnail: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=800&q=60',
    short_description: 'Creative or survival mode depending on your energy.',
    release_date: '2011-11-18',
    publisher: 'Mojang',
  },
  {
    id: 4,
    title: 'Overwatch 2',
    genre: 'Shooter',
    platform: 'PC (Windows)',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=60',
    short_description: 'Team-based competitive shooter with quick matches.',
    release_date: '2022-10-04',
    publisher: 'Blizzard Entertainment',
  },
]

const normalizeTitle = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

const clamp = (num, min, max) => Math.max(min, Math.min(max, num))

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const getSessionLengthByGenre = (genre = '') => {
  const key = genre.toLowerCase()
  if (key.includes('battle') || key.includes('moba') || key.includes('shooter')) return 30
  if (key.includes('roguel') || key.includes('action')) return 40
  if (key.includes('racing') || key.includes('sports')) return 35
  if (key.includes('strategy') || key.includes('rpg')) return 75
  if (key.includes('mmo')) return 90
  if (key.includes('adventure') || key.includes('story')) return 60
  if (key.includes('sandbox') || key.includes('simulation')) return 50
  return 45
}

const getIntensityByGenre = (genre = '') => {
  const key = genre.toLowerCase()
  if (key.includes('horror') || key.includes('battle') || key.includes('moba')) return 3
  if (key.includes('shooter') || key.includes('action') || key.includes('sports')) return 2
  if (key.includes('puzzle') || key.includes('adventure') || key.includes('rpg')) return 1
  if (key.includes('sandbox') || key.includes('simulation') || key.includes('casual')) return 0
  return 1
}

const isSocialGenre = (genre = '') => {
  const key = genre.toLowerCase()
  return (
    key.includes('mmo') ||
    key.includes('battle') ||
    key.includes('moba') ||
    key.includes('shooter') ||
    key.includes('sports')
  )
}

const getGoalBoost = (goal, genre = '', socialGame) => {
  const key = genre.toLowerCase()
  if (goal === 'Relax') {
    if (key.includes('simulation') || key.includes('sandbox') || key.includes('casual') || key.includes('puzzle')) {
      return 16
    }
    return -4
  }
  if (goal === 'Competitive') {
    if (key.includes('sports') || key.includes('battle') || key.includes('moba') || key.includes('shooter')) {
      return 16
    }
    return -4
  }
  if (goal === 'Story') {
    if (key.includes('adventure') || key.includes('rpg')) return 16
    return -3
  }
  if (goal === 'Social') {
    return socialGame ? 16 : -6
  }
  return 0
}

const createReasons = ({ game, timeAvailable, energy, goal, friendsOnline, device }) => {
  const reasons = []
  const sessionLength = getSessionLengthByGenre(game.genre)
  const socialGame = isSocialGenre(game.genre)
  const intensity = getIntensityByGenre(game.genre)

  if (Math.abs(sessionLength - timeAvailable) <= 20) {
    reasons.push(`Fits your ${timeAvailable} minute window`)
  }

  if (energy === 'Low' && intensity <= 1) {
    reasons.push('Low mental load for your current energy')
  }

  if (energy === 'High' && intensity >= 2) {
    reasons.push('High intensity option while you are focused')
  }

  if (goal === 'Social' && socialGame) {
    reasons.push('Built for social sessions')
  }

  if (friendsOnline && socialGame) {
    reasons.push('Friends online can make this more fun right now')
  }

  if (!friendsOnline && !socialGame) {
    reasons.push('Great solo flow when friends are offline')
  }

  if (device === 'Mobile' && game.platform?.toLowerCase().includes('browser')) {
    reasons.push('Playable on a lighter device setup')
  }

  if (game.salePrice) {
    reasons.push(`On sale for $${Number(game.salePrice).toFixed(2)}`)
  }

  return reasons.slice(0, 3)
}

const rankGames = ({ games, context }) => {
  return games
    .map((game) => {
      const sessionLength = getSessionLengthByGenre(game.genre)
      const intensity = getIntensityByGenre(game.genre)
      const socialGame = isSocialGenre(game.genre)

      const timeFit = 40 - clamp(Math.abs(context.timeAvailable - sessionLength), 0, 40)
      const energyFit =
        context.energy === 'Low'
          ? intensity <= 1
            ? 18
            : -10
          : intensity >= 2
            ? 18
            : 2

      const socialFit = context.friendsOnline ? (socialGame ? 14 : -5) : socialGame ? -2 : 8
      const goalBoost = getGoalBoost(context.goal, game.genre, socialGame)

      const platform = game.platform?.toLowerCase() || ''
      const deviceFit =
        context.device === 'PC'
          ? platform.includes('pc')
            ? 10
            : 2
          : context.device === 'Console'
            ? platform.includes('pc')
              ? 4
              : 9
            : platform.includes('browser') || platform.includes('web')
              ? 10
              : 3

      const qualitySignal = clamp((Number(game.steamRatingPercent) || 70) / 10, 0, 10)
      const score = timeFit + energyFit + socialFit + goalBoost + deviceFit + qualitySignal

      return {
        ...game,
        sessionLength,
        score,
        reasons: createReasons({
          game,
          timeAvailable: context.timeAvailable,
          energy: context.energy,
          goal: context.goal,
          friendsOnline: context.friendsOnline,
          device: context.device,
        }),
      }
    })
    .sort((a, b) => b.score - a.score)
}

async function fetchGameData(device) {
  const platformParam = device === 'Mobile' ? 'browser' : 'pc'

  const [freeToGameRes, dealRes] = await Promise.all([
    fetch(`/api/freetogame/games?platform=${platformParam}`),
    fetch('/api/cheapshark/deals?pageSize=80&storeID=1&sortBy=DealRating&onSale=1'),
  ])

  if (!freeToGameRes.ok || !dealRes.ok) {
    throw new Error('Failed to load API data')
  }

  const [freeToGame, deals] = await Promise.all([freeToGameRes.json(), dealRes.json()])
  const dealMap = new Map(deals.map((deal) => [normalizeTitle(deal.title), deal]))

  return freeToGame.slice(0, 60).map((game) => {
    const deal = dealMap.get(normalizeTitle(game.title))
    return {
      ...game,
      dealID: deal?.dealID,
      salePrice: deal?.salePrice,
      normalPrice: deal?.normalPrice,
      savings: deal?.savings,
      steamRatingPercent: deal?.steamRatingPercent,
      thumb: deal?.thumb,
    }
  })
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme)
  const [timeAvailable, setTimeAvailable] = useState(45)
  const [energy, setEnergy] = useState('Low')
  const [goal, setGoal] = useState('Relax')
  const [device, setDevice] = useState('PC')
  const [friendsOnline, setFriendsOnline] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rankedGames, setRankedGames] = useState([])
  const [shuffleIndex, setShuffleIndex] = useState(0)
  const [feedback, setFeedback] = useState({})

  const topPick = rankedGames[shuffleIndex] || null
  const alternatives = useMemo(() => rankedGames.slice(shuffleIndex + 1, shuffleIndex + 6), [rankedGames, shuffleIndex])

  const handleTimeChange = (value) => {
    const numeric = Number(value)
    if (Number.isNaN(numeric)) return
    const clamped = Math.max(15, Math.min(180, numeric))
    setTimeAvailable(clamped)
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const handleRecommend = async () => {
    setLoading(true)
    setError('')

    try {
      const apiGames = await fetchGameData(device)
      const ranked = rankGames({
        games: apiGames.length ? apiGames : FALLBACK_GAMES,
        context: { timeAvailable, energy, goal, device, friendsOnline },
      })
      setRankedGames(ranked)
      setShuffleIndex(0)
    } catch {
      const rankedFallback = rankGames({
        games: FALLBACK_GAMES,
        context: { timeAvailable, energy, goal, device, friendsOnline },
      })
      setRankedGames(rankedFallback)
      setShuffleIndex(0)
      setError('Live API fetch failed, showing local demo data.')
    } finally {
      setLoading(false)
    }
  }

  const handleShuffle = () => {
    if (rankedGames.length <= 1) return
    setShuffleIndex((prev) => (prev + 1) % rankedGames.length)
  }

  const setDecision = (gameId, value) => {
    setFeedback((prev) => ({ ...prev, [gameId]: value }))
  }

  return (
    <main className="app-shell">
      <section className="checkin-panel">
        <div className="panel-header">
          <p className="eyebrow">GameFlow Studio</p>
          <button
            className={theme === 'dark' ? 'theme-toggle is-dark' : 'theme-toggle'}
            type="button"
            onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <span className="theme-switch-track">
              <span className="theme-icon sun" aria-hidden="true">
                ☀
              </span>
              <span className="theme-icon moon" aria-hidden="true">
                ☾
              </span>
              <span className="theme-knob" aria-hidden="true" />
            </span>
          </button>
        </div>
        <h1>What should you play right now?</h1>
        <p className="subtitle">
          Context check-in first. We rank games by time fit, energy match, social context, and device feasibility.
        </p>

        <div className="time-row">
          <label htmlFor="time-slider">Time Available</label>
          <div className="time-input-wrap">
            <input
              id="time-input"
              className="time-input"
              type="number"
              min="15"
              max="180"
              step="5"
              value={timeAvailable}
              onChange={(event) => handleTimeChange(event.target.value)}
            />
            <span>min</span>
          </div>
        </div>
        <input
          id="time-slider"
          type="range"
          min="15"
          max="180"
          step="5"
          value={timeAvailable}
          onChange={(event) => handleTimeChange(event.target.value)}
        />

        <div className="row-group">
          <div>
            <span>Energy</span>
            <div className="chip-row">
              {['Low', 'High'].map((option) => (
                <button
                  key={option}
                  type="button"
                  className={energy === option ? 'chip active' : 'chip'}
                  onClick={() => setEnergy(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span>Right now I want</span>
            <div className="chip-row wrap">
              {GOALS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={goal === option ? 'chip active' : 'chip'}
                  onClick={() => setGoal(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="device-row">
            <label htmlFor="device">Device</label>
            <select id="device" value={device} onChange={(event) => setDevice(event.target.value)}>
              <option>PC</option>
              <option>Console</option>
              <option>Mobile</option>
            </select>
          </div>

          <label className="checkbox-row" htmlFor="friends-online">
            <input
              id="friends-online"
              type="checkbox"
              checked={friendsOnline}
              onChange={(event) => setFriendsOnline(event.target.checked)}
            />
            Friends online
          </label>

          <div className="friends-presence">
            <p>Online now (sample)</p>
            <ul className="friends-list">
              {MOCK_ONLINE_FRIENDS.map((friend) => (
                <li key={friend.id}>
                  <span>{friend.name}</span>
                  <small>Playing {friend.game}</small>
                </li>
              ))}
            </ul>
            {!friendsOnline && <small className="friends-note">Enable the toggle to prioritize social recommendations.</small>}
          </div>
        </div>

        <button className="cta" type="button" onClick={handleRecommend} disabled={loading}>
          {loading ? 'Building your Play Now list...' : 'Generate Play Now List'}
        </button>

        {error && <p className="error-note">{error}</p>}
      </section>

      <section className="results-panel">
        {!topPick && <p className="placeholder">Run the check-in to see your ranked recommendations.</p>}

        {topPick && (
          <>
            <article className="top-pick-card">
              <p className="label">Top Pick</p>
              <img src={topPick.thumbnail || topPick.thumb} alt={topPick.title} />
              <h2>{topPick.title}</h2>
              <p>{topPick.short_description}</p>
              <div className="meta-row">
                <span>{topPick.genre}</span>
                <span>~{topPick.sessionLength} min session</span>
                <span>{topPick.platform}</span>
              </div>
              <ul>
                {topPick.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>

              <div className="decision-row">
                <button type="button" onClick={handleShuffle}>
                  Shuffle
                </button>
                <button type="button" onClick={() => setDecision(topPick.id, 'accepted')}>
                  Accept
                </button>
                <button type="button" onClick={() => setDecision(topPick.id, 'rejected')}>
                  Reject
                </button>
              </div>

              {feedback[topPick.id] && <p className="feedback">You marked this as: {feedback[topPick.id]}</p>}
            </article>

            <section className="alt-list">
              <h3>Alternatives</h3>
              {alternatives.map((game) => (
                <article className="alt-card" key={game.id}>
                  <img src={game.thumbnail || game.thumb} alt={game.title} />
                  <div>
                    <h4>{game.title}</h4>
                    <p>{game.genre}</p>
                    <small>{game.reasons[0] || 'Good contextual match'}</small>
                  </div>
                  <strong>{Math.round(game.score)}</strong>
                </article>
              ))}
            </section>
          </>
        )}
      </section>
    </main>
  )
}

export default App
