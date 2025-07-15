import { ArrowLeft } from "react-feather";
import { cn } from "../../lib/utils"; // Since you already have this

interface BackLinkProps {
  href: string;
  className?: string;
}

export const BackLink = ({ href, className }: BackLinkProps) => {
  return (
    <a href={href} className={cn("inline-flex items-center text-sm text-accent hover:underline", className)}>
      <ArrowLeft size={16} className="mr-1" />
      Retour
    </a>
  );
};
