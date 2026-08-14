import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const PHRASES = ['Mateo 24:14', 'Lucas 2:21', 'Juan 3:16']
const TYPE_MS = 65
const HOLD_MS = 550
const FADE_MS = 220

export default function SplashScreen({ onFinish }) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [showText, setShowText] = useState(true)
  const [showLogo, setShowLogo] = useState(false)

  // Máquina de escribir para la frase actual.
  useEffect(() => {
    if (!showText) return
    const phrase = PHRASES[phraseIndex]
    if (charCount >= phrase.length) return
    const t = setTimeout(() => setCharCount((c) => c + 1), TYPE_MS)
    return () => clearTimeout(t)
  }, [charCount, phraseIndex, showText])

  // Avanzar a la siguiente frase (o pasar al logo) una vez terminada de escribir.
  useEffect(() => {
    const phrase = PHRASES[phraseIndex]
    if (charCount < phrase.length || !showText) return

    const t = setTimeout(() => {
      if (phraseIndex < PHRASES.length - 1) {
        setShowText(false)
        setTimeout(() => {
          setPhraseIndex((i) => i + 1)
          setCharCount(0)
          setShowText(true)
        }, FADE_MS)
      } else {
        setShowText(false)
        setTimeout(() => setShowLogo(true), FADE_MS)
      }
    }, HOLD_MS)
    return () => clearTimeout(t)
  }, [charCount, phraseIndex, showText])

  // Terminar el splash una vez que el logo ya tuvo tiempo de mostrarse.
  useEffect(() => {
    if (!showLogo) return
    const t = setTimeout(onFinish, 1100)
    return () => clearTimeout(t)
  }, [showLogo, onFinish])

  const phrase = PHRASES[phraseIndex]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#161616]">
      <AnimatePresence mode="wait">
        {!showLogo ? (
          <motion.p
            key="typewriter"
            initial={{ opacity: 0 }}
            animate={{ opacity: showText ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: FADE_MS / 1000 }}
            className="font-display italic text-3xl md:text-4xl text-[#5ff2e8]"
            style={{ textShadow: '0 0 18px rgba(95,242,232,0.45)' }}
          >
            {phrase.slice(0, charCount)}
            <span className="inline-block w-[2px] h-[1em] bg-[#5ff2e8] ml-1 align-middle animate-pulse" />
          </motion.p>
        ) : (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.85, filter: 'blur(6px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, ease: [0.2, 0, 0, 1] }}
            className="flex flex-col items-center gap-4"
          >
            <img src="./icons/icon-512.png" alt="" className="w-24 h-24 rounded-[22%] shadow-2xl" />
            <p className="font-display text-lg text-[#5ff2e8] tracking-wide">NotePad TJ</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
