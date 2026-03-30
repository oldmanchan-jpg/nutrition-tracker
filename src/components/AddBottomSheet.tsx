import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CookingPot, PencilSimple } from '@phosphor-icons/react'

interface AddBottomSheetProps {
  open: boolean
  onClose: () => void
}

export default function AddBottomSheet({ open, onClose }: AddBottomSheetProps) {
  const navigate = useNavigate()

  function handleOption(path: string) {
    onClose()
    navigate(path)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] px-4 pt-6 pb-10"
            style={{ backgroundColor: 'var(--card)' }}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ backgroundColor: 'var(--muted-foreground)', opacity: 0.3 }} />

            <button
              onClick={() => handleOption('/log')}
              className="w-full flex items-center gap-4 p-4 rounded-lg bg-transparent border-none cursor-pointer text-left mb-2"
              style={{ backgroundColor: 'var(--background)' }}
            >
              <CookingPot size={28} weight="duotone" color="var(--accent)" />
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  Dalle ricette
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  Scegli tra i pasti preimpostati
                </div>
              </div>
            </button>

            <button
              onClick={() => handleOption('/log/custom')}
              className="w-full flex items-center gap-4 p-4 rounded-lg bg-transparent border-none cursor-pointer text-left"
              style={{ backgroundColor: 'var(--background)' }}
            >
              <PencilSimple size={28} weight="duotone" color="var(--accent)" />
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  Alimento personalizzato
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  Aggiungi calorie e macro manualmente
                </div>
              </div>
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
