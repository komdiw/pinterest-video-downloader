import React from 'react';
import { LiquidGlass } from 'liquid-glass-react';

export default function LiquidGlassDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Pinterest Video Downloader - Liquid Glass Demo
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Basic Liquid Glass Effect */}
          <div className="relative">
            <LiquidGlass
              className="rounded-lg p-6 bg-white/10 backdrop-blur-md"
              intensity="medium"
            >
              <h2 className="text-2xl font-semibold text-white mb-4">
                Liquid Glass Effect
              </h2>
              <p className="text-white/80">
                This demonstrates the Apple-style liquid glass effect integrated
                with your Pinterest Video Downloader project.
              </p>
            </LiquidGlass>
          </div>

          {/* Stronger Effect */}
          <div className="relative">
            <LiquidGlass
              className="rounded-lg p-6 bg-white/10 backdrop-blur-md"
              intensity="strong"
            >
              <h2 className="text-2xl font-semibold text-white mb-4">
                Strong Effect
              </h2>
              <p className="text-white/80">
                A stronger liquid glass distortion effect with more pronounced
                visual dynamics.
              </p>
            </LiquidGlass>
          </div>

          {/* Custom Theme */}
          <div className="relative">
            <LiquidGlass
              className="rounded-lg p-6 bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-sm"
              intensity="light"
              theme="aurora"
            >
              <h2 className="text-2xl font-semibold text-white mb-4">
                Aurora Theme
              </h2>
              <p className="text-white/80">
                Custom aurora theme with subtle liquid animations.
              </p>
            </LiquidGlass>
          </div>

          {/* Interactive Card */}
          <div className="relative">
            <LiquidGlass
              className="rounded-lg p-6 bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all cursor-pointer"
              intensity="medium"
              interactive={true}
            >
              <h2 className="text-2xl font-semibold text-white mb-4">
                Interactive
              </h2>
              <p className="text-white/80">
                Hover over this card to see the interactive liquid glass effect
                respond to your mouse movements.
              </p>
            </LiquidGlass>
          </div>
        </div>

        <div className="mt-12">
          <LiquidGlass
            className="rounded-2xl p-8 bg-white/5 backdrop-blur-lg"
            intensity="medium"
          >
            <div className="text-center">
              <h3 className="text-3xl font-bold text-white mb-4">
                Integration Complete
              </h3>
              <p className="text-white/90 text-lg mb-6">
                The liquid-glass-react component has been successfully integrated
                into your Pinterest Video Downloader project!
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <span className="px-4 py-2 bg-white/20 rounded-full text-white text-sm">
                  React + TypeScript
                </span>
                <span className="px-4 py-2 bg-white/20 rounded-full text-white text-sm">
                  Tailwind CSS
                </span>
                <span className="px-4 py-2 bg-white/20 rounded-full text-white text-sm">
                  Shadcn/ui Ready
                </span>
                <span className="px-4 py-2 bg-white/20 rounded-full text-white text-sm">
                  Liquid Glass Effect
                </span>
              </div>
            </div>
          </LiquidGlass>
        </div>
      </div>
    </div>
  );
}