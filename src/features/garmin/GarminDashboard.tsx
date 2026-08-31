import { 
  Moon, Battery, Footprints, HeartPulse, Activity, Dumbbell, 
  PlusCircle, Trophy, Medal, ChevronRight 
} from 'lucide-react';
import { GarminCard, CardHeader, CardContent } from './components/GarminCard';

export function GarminDashboard() {
  return (
    <div className="min-h-full bg-[#f4f5f6] text-gray-800 p-6 font-sans overflow-y-auto">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Header / Sync status */}
        <div className="flex justify-end text-xs text-gray-500">
          Sincronizado 10 horas atrás
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Column (Left) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Essenciais */}
            <section>
              <h2 className="text-xl font-normal text-gray-700 mb-4">Essenciais</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GarminCard to="/garmin/sleep" className="h-32 justify-center text-center">
                  <CardContent className="items-center justify-center gap-2">
                    <Moon className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-500">Nenhum dado de sono</span>
                  </CardContent>
                </GarminCard>
                
                <GarminCard to="/garmin/body-battery" className="h-32 justify-center text-center">
                  <CardContent className="items-center justify-center gap-2">
                    <Battery className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-500">Não há dados do Body Battery</span>
                  </CardContent>
                </GarminCard>

                <GarminCard to="/garmin/steps" className="h-32 justify-center text-center">
                  <CardContent className="items-center justify-center gap-2">
                    <Footprints className="w-6 h-6 text-gray-400" />
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Nenhum passo hoje.</span>
                      <span className="text-xs text-gray-500">Hora de se mexer!</span>
                    </div>
                  </CardContent>
                </GarminCard>

                <GarminCard to="/garmin/health" className="h-32 justify-center text-center">
                  <CardContent className="items-center justify-center gap-2">
                    <HeartPulse className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-500">Não há dados de status de saúde</span>
                  </CardContent>
                </GarminCard>
              </div>
            </section>

            {/* Em foco */}
            <section>
              <h2 className="text-xl font-normal text-gray-700 mb-4">Em foco</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Body Battery Foco */}
                <GarminCard to="/garmin/body-battery" className="h-64">
                  <CardHeader title="Body Battery" icon={Battery} />
                  <CardContent className="items-center justify-center text-center px-8">
                    <h3 className="text-lg mb-2">Dados insuficientes</h3>
                    <p className="text-sm text-gray-500">Use seu relógio para obter uma leitura precisa de Body Battery.</p>
                  </CardContent>
                </GarminCard>

                {/* Passos Foco */}
                <GarminCard to="/garmin/steps" className="h-64">
                  <CardHeader title="Passos" icon={Footprints} />
                  <CardContent className="items-center justify-center text-center px-8">
                    <h3 className="text-lg mb-2">Nenhum passo hoje</h3>
                    <p className="text-sm text-gray-500">Hora de se mexer!</p>
                  </CardContent>
                </GarminCard>

                {/* Corrida Foco */}
                <GarminCard to="/garmin/running" className="h-64">
                  <CardHeader title="Corrida • Ago 25-31" icon={Activity}>
                    <PlusCircle className="w-5 h-5 text-[#007cc3]" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <div className="text-3xl font-light">9.05 <span className="text-lg text-gray-500">mi</span></div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">1:17:04</div>
                        <div className="text-xs text-gray-500">Tempo total</div>
                      </div>
                    </div>
                    
                    {/* Simulated chart */}
                    <div className="mt-auto pt-4 border-b border-gray-200 pb-2 flex items-end justify-between h-24 px-2">
                      <div className="w-4 h-0 bg-[#007cc3] rounded-t-sm"></div>
                      <div className="w-4 h-8 bg-[#007cc3] rounded-t-sm"></div>
                      <div className="w-4 h-0 bg-[#007cc3] rounded-t-sm"></div>
                      <div className="w-4 h-2 bg-[#007cc3] rounded-t-sm"></div>
                      <div className="w-4 h-16 bg-[#007cc3] rounded-t-sm"></div>
                      <div className="w-4 h-0 bg-[#007cc3] rounded-t-sm"></div>
                      <div className="w-4 h-0 bg-[#007cc3] rounded-t-sm"></div>
                    </div>
                    <div className="flex justify-between px-3 mt-2 text-xs text-gray-400">
                      <span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span><span>D</span><span>S</span>
                    </div>
                  </CardContent>
                </GarminCard>

                {/* Empty placeholder for grid balance */}
                <div className="h-64 bg-transparent"></div>

              </div>
            </section>
          </div>

          {/* Side Column (Right) */}
          <div className="flex flex-col gap-8">
            
            {/* Atividade do dia */}
            <section>
              <h2 className="text-xl font-normal text-gray-700 mb-4">Atividade do dia</h2>
              <GarminCard to="/garmin/activity">
                <CardContent>
                  <div className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded w-max mb-3">
                    TREINO
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <div className="text-lg">Base</div>
                      <div className="text-xs text-gray-500">Est. 30 min • 10K Plan</div>
                    </div>
                  </div>
                </CardContent>
              </GarminCard>
            </section>

            {/* Planos Garmin Coach */}
            <section>
              <h2 className="text-xl font-normal text-gray-700 mb-4">Planos Garmin Coach</h2>
              <GarminCard to="/garmin/coach">
                <CardHeader title="10K Plan" icon={Activity} />
                <CardContent>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative w-12 h-12">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="24" cy="24" r="20" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                        <circle cx="24" cy="24" r="20" stroke="#007cc3" strokeWidth="4" fill="none" strokeDasharray="125" strokeDashoffset="100" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-lg">Semana 2 de 7</div>
                      <div className="text-xs text-gray-500">4 treinos restantes</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs mt-2">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 bg-gray-400 rounded-sm flex items-center justify-center text-white"><Activity className="w-4 h-4"/></div>
                      <span className="text-gray-400">S</span>
                      <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-sm"></div>
                      <span className="text-gray-400">T</span>
                      <div className="w-1 h-1 rounded-full bg-transparent"></div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-sm flex items-center justify-center text-gray-400"><Activity className="w-4 h-4"/></div>
                      <span className="text-gray-400">Q</span>
                      <div className="w-1 h-1 rounded-full bg-transparent"></div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-sm flex items-center justify-center text-gray-400"><Activity className="w-4 h-4"/></div>
                      <span className="text-gray-400">Q</span>
                      <div className="w-1 h-1 rounded-full bg-transparent"></div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-sm"></div>
                      <span className="text-gray-400">S</span>
                      <div className="w-1 h-1 rounded-full bg-transparent"></div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-sm flex items-center justify-center text-gray-400"><Activity className="w-4 h-4"/></div>
                      <span className="text-gray-400">S</span>
                      <div className="w-1 h-1 rounded-full bg-transparent"></div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-sm flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-gray-400"></div></div>
                      <span className="text-gray-400">D</span>
                      <div className="w-1 h-1 rounded-full bg-transparent"></div>
                    </div>
                  </div>
                </CardContent>
              </GarminCard>
            </section>

            {/* Desafios */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-normal text-gray-700">Desafios</h2>
                <button className="text-[#007cc3] text-sm hover:underline">Ocultar</button>
              </div>
              <GarminCard>
                <CardContent className="items-center text-center py-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <Trophy className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg mb-2">Pronto para o desafio?</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Participe de desafios existentes ou crie o seu próprio.
                  </p>
                  <div className="flex flex-col w-full gap-2 px-4">
                    <button className="bg-[#007cc3] text-white py-2 rounded font-medium hover:bg-blue-700 transition-colors">
                      Encontrar um desafio
                    </button>
                    <button className="bg-gray-200 text-gray-800 py-2 rounded font-medium hover:bg-gray-300 transition-colors">
                      Criar um desafio
                    </button>
                  </div>
                </CardContent>
              </GarminCard>
            </section>
            
          </div>
        </div>
      </div>
    </div>
  );
}
