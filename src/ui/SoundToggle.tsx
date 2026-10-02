import { useEffect, useState } from 'react'
import { isSoundOn, onSoundChange, setSound, soundPreferred } from '../audio/ambient'

/**
 * Sound on/off. Off by default; if the viewer turned it on during a previous visit,
 * it resumes on their first interaction (browsers block audio before a gesture).
 */
export function SoundToggle() {
  const [on, setOn] = useState(isSoundOn())

  useEffect(() => onSoundChange(setOn), [])

  useEffect(() => {
    if (!soundPreferred() || isSoundOn()) return
    const resume = (e: Event) => {
      // A first click on the toggle itself is handled by the toggle.
      if (e.target instanceof Element && e.target.closest('[data-sound-toggle]')) return
      void setSound(true)
    }
    window.addEventListener('pointerdown', resume, { once: true })
    window.addEventListener('keydown', resume, { once: true })
    return () => {
      window.removeEventListener('pointerdown', resume)
      window.removeEventListener('keydown', resume)
    }
  }, [])

  return (
    <button
      type="button"
      data-sound-toggle
      onClick={() => void setSound(!on)}
      aria-pressed={on}
      aria-label={on ? 'Turn sound off' : 'Turn sound on'}
      title={on ? 'Sound on' : 'Sound off'}
      className="group grid size-10 place-items-center rounded-full border border-white/15 bg-black/30 backdrop-blur-md transition hover:border-sun/60"
    >
      {/* Four bars: still when off, gently moving when on. */}
      <span className="flex h-3.5 items-end gap-[3px]" aria-hidden="true">
        {[0.55, 1, 0.7, 0.85].map((h, i) => (
          <span
            key={i}
            className={`w-[2px] rounded-full transition-colors ${on ? 'sound-bar bg-sun' : 'bg-white/55 group-hover:bg-white/80'}`}
            style={{ height: `${(on ? h : h * 0.45) * 100}%`, animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </span>
    </button>
  )
}
