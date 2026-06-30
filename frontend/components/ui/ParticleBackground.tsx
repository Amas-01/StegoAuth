'use client'

import { useCallback } from 'react'
import { ParticlesProvider, useParticlesProvider } from '@tsparticles/react'
import Particles from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { ISourceOptions, Engine } from '@tsparticles/engine'

const particleOptions: ISourceOptions = {
  fpsLimit: 30,
  particles: {
    number: { value: 40, density: { enable: true } },
    color: { value: '#3b82f6' },
    opacity: { value: 0.08 },
    size: { value: { min: 1, max: 2 } },
    move: {
      enable: true,
      speed: 0.4,
      direction: 'none',
      random: true,
      outModes: { default: 'out' },
    },
    links: {
      enable: true,
      distance: 130,
      color: '#3b82f6',
      opacity: 0.06,
      width: 1,
    },
  },
  detectRetina: true,
  interactivity: {
    events: {
      onHover: { enable: false },
      onClick: { enable: false },
    },
  },
}

function ParticlesCanvas() {
  const { loaded } = useParticlesProvider()

  if (!loaded) return null

  return (
    <Particles
      id="tsparticles"
      options={particleOptions}
      className="absolute inset-0 -z-10 pointer-events-none"
    />
  )
}

export default function ParticleBackground() {
  const init = useCallback(async (engine: Engine) => {
    await loadSlim(engine)
  }, [])

  return (
    <ParticlesProvider init={init}>
      <ParticlesCanvas />
    </ParticlesProvider>
  )
}
