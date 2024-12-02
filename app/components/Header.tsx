import { motion } from 'framer-motion';

export default function Header() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <motion.h1 
        className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        HAR Privacy Scrubber
      </motion.h1>
      <motion.p 
        className="mt-6 text-lg leading-8 text-gray-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        Securely scrub sensitive data from your HAR files using Chrome&apos;s Local AI
      </motion.p>
    </motion.div>
  );
}
