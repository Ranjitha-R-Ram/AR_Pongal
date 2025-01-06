import React, { useState, useRef, useEffect } from "react";
import { Camera } from "lucide-react";

export const PongalCelebration = () => {
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="relative w-64 h-64">
            <div className="absolute inset-0 flex items-center justify-center animate-bounce">
              <div className="w-32 h-32 bg-yellow-600 rounded-b-full relative">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="w-full h-full border-4 border-yellow-400 rounded-b-full" />
                  <div className="absolute top-1/4 left-0 right-0 h-2 bg-yellow-400" />
                  <div className="absolute top-1/2 left-0 right-0 h-2 bg-yellow-400" />
                </div>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                  <div className="relative">
                    <div className="absolute w-4 h-16 bg-white/40 rounded-full animate-steam" />
                    <div className="absolute w-4 h-16 bg-white/40 rounded-full animate-steam left-4 delay-100" />
                    <div className="absolute w-4 h-16 bg-white/40 rounded-full animate-steam -left-4 delay-200" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute inset-0">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-particle"
                  style={{
                    left: '50%',
                    top: '50%',
                    transformOrigin: 'center',
                    transform: `rotate(${i * 30}deg) translateY(-40px)`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          </div>
          
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <div className="text-4xl font-bold text-yellow-400 animate-pulse">
              Happy Pongal! 🎊
            </div>
          </div>
        </div>
      );
    };