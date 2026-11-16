import { BookOpen, UserRoundPen } from "lucide-react";

interface SidebarToolsProps {
  onStartTour: () => void;
  onOpenProfile: () => void;
}

export default function SidebarTools({
  onStartTour,
  onOpenProfile,
}: SidebarToolsProps) {
  return (
    <aside className="w-16 h-screen shrink-0 bg-[#E8EEF4] border-r border-[#D5DEE8] flex flex-col items-center py-5 gap-4">
      {/* Acceso al tutorial */}
      <button
        type="button"
        data-tour="sidebar-tour"
        onClick={onStartTour}
        title="Tutorial guiado"
        aria-label="Abrir tutorial guiado"
        className="w-11 h-11 flex items-center justify-center rounded-xl text-[#0A3D70] hover:bg-[#D5E2EF] hover:text-[#082A4D] transition-all duration-200"
      >
        <BookOpen size={21} strokeWidth={2} />
      </button>

      {/* Acceso a la configuración del perfil */}
      <button
        type="button"
        data-tour="sidebar-profile"
        onClick={onOpenProfile}
        title="Actualizar perfil"
        aria-label="Abrir configuración del perfil"
        className="w-11 h-11 flex items-center justify-center rounded-xl text-[#0A3D70] hover:bg-[#D5E2EF] hover:text-[#082A4D] transition-all duration-200"
      >
        <UserRoundPen size={21} strokeWidth={2} />
      </button>
    </aside>
  );
}
