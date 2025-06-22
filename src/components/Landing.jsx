import React from 'react';
import { motion } from 'framer-motion';
import { Input, Button } from './Primitives';

/* A cheeky inline logo */
const Logo = () => (
  <div className="flex items-center gap-2 text-3xl font-bold text-white">
    ⚡
    <span>ZapFind</span>
  </div>
);

export default function Landing({ onSearch, geocoding }) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col justify-center items-center
                 bg-gradient-to-br from-green-600 via-emerald-500 to-teal-500
                 text-center px-4"
    >
      <Logo />
      <p className="mt-4 text-white text-lg">
        Find a zap for your EV in seconds.
      </p>

      {/* Search form */}
      <form onSubmit={onSearch} className="mt-8 w-full max-w-md flex gap-2">
        <Input
          name="q"
          placeholder="Type city or PIN..."
          className="flex-grow"
        />
        <Button type="submit" disabled={geocoding}>
          🔍 Go
        </Button>
      </form>

      <p className="mt-2 text-white/80 text-sm">
        Powered by OpenChargeMap
      </p>
    </motion.section>
  );
}
