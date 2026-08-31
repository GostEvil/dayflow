import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GarminCard, CardContent } from './components/GarminCard';

export function GarminSubPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Helper to translate route param to a nice title
  const getTitle = (t?: string) => {
    switch (t) {
      case 'sleep': return 'Sono';
      case 'body-battery': return 'Body Battery';
      case 'steps': return 'Passos';
      case 'health': return 'Status de Saúde';
      case 'running': return 'Corrida';
      case 'activity': return 'Atividade';
      case 'coach': return 'Garmin Coach';
      default: return 'Detalhes';
    }
  };

  const handlePrevDay = () => setCurrentDate(prev => subDays(prev, 1));
  const handleNextDay = () => setCurrentDate(prev => addDays(prev, 1));

  const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="min-h-full bg-[#f4f5f6] text-gray-800 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header navigation */}
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate('/garmin')}
            className="flex items-center text-[#007cc3] hover:underline"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
        </div>

        {/* Date Picker Bar */}
        <div className="flex items-center justify-between bg-[#2a3033] text-white p-3 rounded-t-lg">
          <button onClick={handlePrevDay} className="p-1 hover:bg-gray-700 rounded">
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 font-medium">
            <Calendar className="w-4 h-4 text-gray-400" />
            {isToday ? 'Hoje' : format(currentDate, "d 'de' MMMM", { locale: ptBR })}
          </div>
          
          <button 
            onClick={handleNextDay} 
            disabled={isToday}
            className={`p-1 rounded ${isToday ? 'text-gray-600 cursor-not-allowed' : 'hover:bg-gray-700'}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <GarminCard className="rounded-t-none rounded-b-lg border-t-0 shadow-sm min-h-[400px]">
          <CardContent className="items-center justify-center text-center">
            <h2 className="text-2xl font-light text-gray-700 mb-4">{getTitle(type)}</h2>
            
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              {/* Generic placeholder icon */}
              <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
              </svg>
            </div>
            
            <h3 className="text-lg text-gray-800 mb-2">Não há dados disponíveis</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Sincronize o seu dispositivo para ver as informações de {getTitle(type).toLowerCase()} para este dia.
            </p>
          </CardContent>
        </GarminCard>

      </div>
    </div>
  );
}
