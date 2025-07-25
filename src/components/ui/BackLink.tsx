import { ArrowLeft } from "react-feather";
import { cn } from "../../lib/utils";
import { useNavigate } from "react-router-dom";

interface BackLinkProps {
  to?: string; // Changed from href to to
  className?: string;
  onClick?: () => void;
}

export const BackLink = ({ to, className, onClick }: BackLinkProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1); // Go back one page if no destination specified
    }
  };

  return (
    <button 
      onClick={handleClick}
      className={cn(
        "inline-flex items-center text-sm text-accent hover:underline",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent",
        className
      )}
    >
      <ArrowLeft size={16} className="mr-1" />
      Retour
    </button>
  );
};