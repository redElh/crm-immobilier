import { ArrowLeft } from "react-feather";
import { cn } from "../../lib/utils";
import { useNavigate } from "react-router-dom";

interface BackLinkProps {
  to?: string;
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
      navigate(-1);
    }
  };

  return (
    <button 
      onClick={handleClick}
      className={cn(
        "btn-ghost text-xs gap-1.5",
        className
      )}
    >
      <ArrowLeft size={14} />
      Retour
    </button>
  );
};
