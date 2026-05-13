"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { Profile } from "@/types";

interface MatchModalProps {
  isOpen: boolean;
  matchId: string | null;
  matchedProfile: Profile | null;
  currentProfile: Profile | null;
  onClose: () => void;
}

export default function MatchModal({
  isOpen,
  matchId,
  matchedProfile,
  currentProfile,
  onClose,
}: MatchModalProps) {
  return (
    <AnimatePresence>
      {isOpen && matchedProfile && currentProfile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-card border border-border rounded-3xl p-8 mx-4 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Match animation header */}
            <div className="mb-6">
              <span className="text-5xl">🏓</span>
              <h2 className="text-3xl font-bold text-primary mt-3">
                Мач намерен!
              </h2>
              <p className="text-muted mt-1">Имате взаимен интерес</p>
            </div>

            {/* Avatars */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="relative">
                <Image
                  src={
                    currentProfile.avatar_url ||
                    `https://api.dicebear.com/8.x/avataaars/png?seed=${currentProfile.id}&backgroundColor=b6e3f4,c0aede,ffd5dc,ffdfbf`
                  }
                  alt="Вашият профил"
                  width={80}
                  height={80}
                  className="rounded-full border-2 border-primary object-cover"
                />
              </div>
              <div className="text-2xl font-bold text-primary">VS</div>
              <div className="relative">
                <Image
                  src={
                    matchedProfile.avatar_url ||
                    `https://api.dicebear.com/8.x/avataaars/png?seed=${matchedProfile.id}&backgroundColor=b6e3f4,c0aede,ffd5dc,ffdfbf`
                  }
                  alt={matchedProfile.username}
                  width={80}
                  height={80}
                  className="rounded-full border-2 border-primary object-cover"
                />
              </div>
            </div>

            <p className="text-white font-semibold text-lg mb-6">
              {matchedProfile.username} прие предизвикателството!
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {matchId && (
                <Link
                  href={`/chat/${matchId}`}
                  className="btn-primary w-full text-center block"
                  onClick={onClose}
                >
                  💬 Изпрати съобщение
                </Link>
              )}
              <button onClick={onClose} className="btn-secondary w-full">
                Продължи да търсиш
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
