import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs = ({ items }) => {
  return (
    <nav className="flex items-center gap-2 text-sm text-[#969088] mb-6 flex-wrap" aria-label="Breadcrumb">
      <Link to="/" className="hover:text-[#8B2E2E] transition-colors">
        <Home size={14} />
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          <ChevronRight size={14} className="text-[#D6D0C4]" />
          {item.href ? (
            <Link to={item.href} className="hover:text-[#8B2E2E] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[#5C5852]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
};
