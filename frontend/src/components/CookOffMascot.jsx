import React from 'react'

/**
 * Cook-Off Mascot - Chef Character
 * A friendly chef character representing the Cook-Off platform
 */
export default function CookOffMascot({ className = "w-32 h-32" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Chef Hat */}
      <g>
        {/* Hat puff */}
        <ellipse cx="100" cy="45" rx="55" ry="30" fill="#FFFFFF" stroke="#FF6B35" strokeWidth="3"/>
        <ellipse cx="70" cy="50" rx="25" ry="20" fill="#FFFFFF" stroke="#FF6B35" strokeWidth="3"/>
        <ellipse cx="130" cy="50" rx="25" ry="20" fill="#FFFFFF" stroke="#FF6B35" strokeWidth="3"/>
        {/* Hat band */}
        <rect x="45" y="60" width="110" height="15" rx="3" fill="#FF6B35"/>
      </g>

      {/* Face */}
      <g>
        <circle cx="100" cy="110" r="45" fill="#FFD4A3" stroke="#FF8C42" strokeWidth="2"/>
        
        {/* Eyes */}
        <g>
          {/* Left eye */}
          <ellipse cx="85" cy="105" rx="8" ry="10" fill="#2D3142"/>
          <circle cx="87" cy="103" r="3" fill="#FFFFFF"/>
          
          {/* Right eye */}
          <ellipse cx="115" cy="105" rx="8" ry="10" fill="#2D3142"/>
          <circle cx="117" cy="103" r="3" fill="#FFFFFF"/>
        </g>

        {/* Rosy cheeks */}
        <ellipse cx="70" cy="115" rx="8" ry="6" fill="#FFB4A3" opacity="0.6"/>
        <ellipse cx="130" cy="115" rx="8" ry="6" fill="#FFB4A3" opacity="0.6"/>

        {/* Smile */}
        <path
          d="M 85 120 Q 100 130 115 120"
          stroke="#2D3142"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Mustache */}
        <g>
          <path
            d="M 75 118 Q 70 115 65 118"
            stroke="#2D3142"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 125 118 Q 130 115 135 118"
            stroke="#2D3142"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </g>

      {/* Body - Chef's coat */}
      <g>
        <rect x="60" y="145" width="80" height="50" rx="5" fill="#FFFFFF" stroke="#FF8C42" strokeWidth="2"/>
        
        {/* Coat buttons */}
        <circle cx="100" cy="160" r="4" fill="#FF6B35"/>
        <circle cx="100" cy="175" r="4" fill="#FF6B35"/>
        
        {/* Coat collar */}
        <path d="M 60 145 L 70 155 L 130 155 L 140 145" fill="#F4F4F4" stroke="#FF8C42" strokeWidth="2"/>
      </g>

      {/* Arms */}
      <g>
        {/* Left arm with spatula */}
        <rect x="30" y="155" width="35" height="12" rx="6" fill="#FFD4A3" stroke="#FF8C42" strokeWidth="2"/>
        <rect x="15" y="160" width="25" height="4" rx="2" fill="#8B4513"/>
        <path d="M 12 157 L 18 157 L 18 170 L 12 170 Z" fill="#D3D3D3" stroke="#666" strokeWidth="1"/>
        
        {/* Right arm with spoon */}
        <rect x="135" y="155" width="35" height="12" rx="6" fill="#FFD4A3" stroke="#FF8C42" strokeWidth="2"/>
        <rect x="160" y="160" width="20" height="3" rx="1.5" fill="#8B4513"/>
        <ellipse cx="182" cy="161" rx="6" ry="8" fill="#D3D3D3" stroke="#666" strokeWidth="1"/>
      </g>

      {/* Sparkles/steam effect */}
      <g opacity="0.8">
        <path d="M 160 40 L 162 45 L 167 45 L 163 48 L 165 53 L 160 50 L 155 53 L 157 48 L 153 45 L 158 45 Z" fill="#FFD700"/>
        <path d="M 40 45 L 42 50 L 47 50 L 43 53 L 45 58 L 40 55 L 35 58 L 37 53 L 33 50 L 38 50 Z" fill="#FFD700"/>
        <circle cx="180" cy="70" r="2" fill="#FFD700"/>
        <circle cx="25" cy="75" r="2" fill="#FFD700"/>
      </g>
    </svg>
  )
}
