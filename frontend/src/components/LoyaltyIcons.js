/**
 * Premium Loyalty Tier Icons - Elegant Outlined Style
 * Skizzierte, elegante Icons die zum Hermann Böhmer Brand passen
 */

// Tier-Farben für Icons UND Text
export const tierColors = {
  'Bronze': '#CD7F32',
  'Silber': '#8A8A8A', 
  'Gold': '#D4AF37',
  'Platinum': '#7B8794',
  'Diamond': '#8B2E2E'
};

// Bronze - Eleganter Kreis mit Blatt (Anfänger, organisch)
export const BronzeIcon = ({ size = 20, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Einfacher eleganter Kreis */}
    <circle 
      cx="12" 
      cy="12" 
      r="9" 
      stroke="#CD7F32" 
      strokeWidth="1.5"
      fill="none"
    />
    {/* Kleines Blatt - Symbol für Wachstum/Anfang */}
    <path 
      d="M12 7C12 7 9 10 9 13C9 14.5 10.5 16 12 16C13.5 16 15 14.5 15 13C15 10 12 7 12 7Z" 
      stroke="#CD7F32" 
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path 
      d="M12 13V16" 
      stroke="#CD7F32" 
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

// Silber - Eleganter Stern (outlined)
export const SilberIcon = ({ size = 20, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 5-zackiger Stern - outlined */}
    <path 
      d="M12 2L14.4 8.6L21.5 9.2L16.2 13.9L17.8 21L12 17.3L6.2 21L7.8 13.9L2.5 9.2L9.6 8.6L12 2Z" 
      stroke="#8A8A8A" 
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

// Gold - Elegante Krone (outlined)
export const GoldIcon = ({ size = 20, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Krone - outlined, elegant */}
    <path 
      d="M4 17L5.5 8L9 12L12 6L15 12L18.5 8L20 17H4Z" 
      stroke="#D4AF37" 
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Basis der Krone */}
    <path 
      d="M4 17H20V19C20 19.5 19.5 20 19 20H5C4.5 20 4 19.5 4 19V17Z" 
      stroke="#D4AF37" 
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Kleine Juwelen */}
    <circle cx="12" cy="10" r="1" stroke="#D4AF37" strokeWidth="1" fill="none" />
  </svg>
);

// Platinum - Eleganter Edelstein/Kristall (outlined)
export const PlatinumIcon = ({ size = 20, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Hexagonaler Edelstein - elegant, outlined */}
    <path 
      d="M12 2L20 8L12 22L4 8L12 2Z" 
      stroke="#7B8794" 
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Innere Facetten */}
    <path 
      d="M4 8H20" 
      stroke="#7B8794" 
      strokeWidth="1"
      strokeLinecap="round"
    />
    <path 
      d="M8 8L12 22L16 8" 
      stroke="#7B8794" 
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path 
      d="M8 8L12 2L16 8" 
      stroke="#7B8794" 
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Diamond - Luxuriöser Diamant (outlined, mit Glanz)
export const DiamondIcon = ({ size = 20, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Diamant-Krone */}
    <path 
      d="M4.5 9L12 3L19.5 9" 
      stroke="#8B2E2E" 
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Diamant-Basis */}
    <path 
      d="M4.5 9H19.5L12 21L4.5 9Z" 
      stroke="#8B2E2E" 
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Innere Facetten */}
    <path 
      d="M8 9L12 21L16 9" 
      stroke="#8B2E2E" 
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path 
      d="M8 9L12 3L16 9" 
      stroke="#8B2E2E" 
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Glanz-Effekt (kleiner Stern) */}
    <path 
      d="M18 4L19 5L20 4L19 3L18 4Z" 
      stroke="#8B2E2E" 
      strokeWidth="0.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

// Tier Icon Selector - returns the correct icon for a tier
export const TierIcon = ({ tier, size = 20, className = "" }) => {
  const icons = {
    'Bronze': BronzeIcon,
    'Silber': SilberIcon,
    'Gold': GoldIcon,
    'Platinum': PlatinumIcon,
    'Diamond': DiamondIcon
  };
  
  const Icon = icons[tier] || BronzeIcon;
  return <Icon size={size} className={className} />;
};

// Loyalty Badge Component with elegant icons and matching text color
export const LoyaltyBadge = ({ tier, size = 'small', showLabel = true }) => {
  const color = tierColors[tier] || tierColors['Bronze'];
  const iconSize = size === 'large' ? 26 : size === 'small' ? 18 : 22;
  
  const sizeClasses = {
    small: 'text-xs px-2.5 py-1 gap-1.5',
    normal: 'text-sm px-3 py-1.5 gap-2',
    large: 'text-base px-4 py-2.5 gap-2.5 font-medium'
  };
  
  return (
    <span 
      className={`inline-flex items-center ${sizeClasses[size] || sizeClasses.normal}`}
      style={{ 
        backgroundColor: `${color}10`, 
        border: `1px solid ${color}40`,
        color: color
      }}
    >
      <TierIcon tier={tier} size={iconSize} />
      {showLabel && (
        <span style={{ color: color, fontWeight: size === 'large' ? 500 : 400 }}>
          {tier}
        </span>
      )}
    </span>
  );
};

export default LoyaltyBadge;
