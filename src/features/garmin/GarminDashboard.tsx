import { useState, useEffect } from 'react';
import { 
  Moon, Battery, Footprints, HeartPulse, Activity, Dumbbell, 
  PlusCircle, Trophy, Medal, ChevronRight, AlertCircle, RefreshCw
} from 'lucide-react';
import { GarminCard, CardHeader, CardContent } from './components/GarminCard';

export function GarminDashboard() {
  const [data, setData] = useState<any>(() => {
    const cached = localStorage.getItem('garmin_dashboard_cache');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);

  const fetchGarminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8787/api/garmin/summary');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      localStorage.setItem('garmin_dashboard_cache', JSON.stringify(json));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!data) {
      fetchGarminData();
    }
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-full bg-[#f4f5f6] flex items-center justify-center p-6">
        <div className="flex flex-col items-center text-gray-500 gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-[#007cc3]" />
          <p>A sincronizar com o Garmin Connect...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-full bg-[#f4f5f6] p-6">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg border border-red-200 shadow-sm text-center flex flex-col items-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">Erro de Autenticação</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Certifique-se de que adicionou <code>GARMIN_USERNAME</code> e <code>GARMIN_PASSWORD</code> no ficheiro <code>.env</code> do servidor e reiniciou o servidor.
          </p>
          <button 
            onClick={fetchGarminData}
            className="mt-6 px-4 py-2 bg-[#007cc3] text-white rounded hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Parse data for the dashboard
  // Use raw data to see if keys are different if needed
  const sleepTime = data?.sleep?.dailySleepDTO?.sleepTimeSeconds 
    ? Math.floor(data.sleep.dailySleepDTO.sleepTimeSeconds / 3600) + 'h ' + Math.floor((data.sleep.dailySleepDTO.sleepTimeSeconds % 3600) / 60) + 'm'
    : 'Nenhum dado';

  // Some versions of garmin-connect return totalSteps directly or inside a wrapper
  const stepsToday = data?.steps?.[0]?.totalSteps || data?.steps?.totalSteps || 'Nenhum passo';
  const stepsGoal = data?.steps?.[0]?.stepGoal || data?.steps?.stepGoal || 0;
  
  const hrResting = data?.hr?.restingHeartRate || data?.hr?.[0]?.restingHeartRate || 'Não há dados';

  // Use Strava for activities if available, fallback to Garmin
  const hasStrava = data?.errors?.stravaConnected;
  const stravaActivities = data?.stravaActivities || [];
  const garminActivities = data?.activities || [];
  
  const lastActivity = hasStrava && stravaActivities.length > 0 
    ? stravaActivities[0] 
    : garminActivities[0];

  // Strava uses meters for distance and seconds for moving_time
  const isStrava = hasStrava && stravaActivities.length > 0;
  
  let distanceMiles = '0';
  let durationStr = '0:00:00';
  
  if (lastActivity) {
    if (isStrava) {
      distanceMiles = (lastActivity.distance * 0.000621371).toFixed(2);
      durationStr = new Date(lastActivity.moving_time * 1000).toISOString().substring(11, 19);
    } else {
      distanceMiles = lastActivity.distance ? (lastActivity.distance * 0.000621371).toFixed(2) : '0';
      durationStr = lastActivity.duration ? new Date(lastActivity.duration * 1000).toISOString().substring(11, 19) : '0:00:00';
    }
  }

  const handleConnectStrava = () => {
    window.location.href = 'http://localhost:8787/auth/strava';
  };

  return (
    <div className="min-h-full bg-[#f4f5f6] text-gray-800 p-6 font-sans overflow-y-auto">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Header / Sync status */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchGarminData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700 shadow-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sincronizar
            </button>
            {!hasStrava && (
              <button 
                onClick={handleConnectStrava}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#fc4c02] border border-[#ea4c00] rounded-md hover:bg-[#ea4c00] text-white shadow-sm transition-colors"
              >
                Conectar ao Strava
              </button>
            )}
          </div>
          <span>
            {error ? <span className="text-red-500 mr-2">Erro API ({error})</span> : null}
            {data?.errors?.garmin ? <span className="text-orange-500 mr-2">Garmin offline</span> : null}
            Última sincronização: {new Date().toLocaleTimeString()}
          </span>
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
                    <Moon className="w-6 h-6 text-[#007cc3]" />
                    <span className="text-xl font-medium text-gray-900">{sleepTime !== 'Nenhum dado' ? sleepTime : '-'}</span>
                    <span className="text-xs text-gray-500">{sleepTime === 'Nenhum dado' ? 'Nenhum dado de sono' : 'Tempo de sono'}</span>
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
                    <Footprints className="w-6 h-6 text-[#007cc3]" />
                    {stepsToday !== 'Nenhum passo' ? (
                      <>
                        <span className="text-xl font-medium text-gray-900">{stepsToday}</span>
                        <span className="text-xs text-gray-500">Objetivo: {stepsGoal}</span>
                      </>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Nenhum passo hoje.</span>
                      </div>
                    )}
                  </CardContent>
                </GarminCard>

                <GarminCard to="/garmin/health" className="h-32 justify-center text-center">
                  <CardContent className="items-center justify-center gap-2">
                    <HeartPulse className="w-6 h-6 text-[#007cc3]" />
                    <span className="text-xl font-medium text-gray-900">{hrResting !== 'Não há dados' ? hrResting + ' bpm' : '-'}</span>
                    <span className="text-xs text-gray-500">{hrResting === 'Não há dados' ? 'Sem dados de FC' : 'FC em repouso'}</span>
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
                    <p className="text-sm text-gray-500">Use seu relógio para obter uma leitura precisa.</p>
                  </CardContent>
                </GarminCard>

                {/* Passos Foco */}
                <GarminCard to="/garmin/steps" className="h-64">
                  <CardHeader title="Passos" icon={Footprints} />
                  <CardContent className="items-center justify-center text-center px-8">
                    {stepsToday !== 'Nenhum passo' ? (
                      <>
                        <h3 className="text-4xl font-light mb-2 text-[#007cc3]">{stepsToday}</h3>
                        <p className="text-sm text-gray-500">Passos dados hoje</p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg mb-2">Nenhum passo hoje</h3>
                        <p className="text-sm text-gray-500">Hora de se mexer!</p>
                      </>
                    )}
                  </CardContent>
                </GarminCard>

                {/* Corrida Foco */}
                <GarminCard to="/garmin/running" className="h-64">
                  <CardHeader title={`Corrida (Última via ${isStrava ? 'Strava' : 'Garmin'})`} icon={Activity}>
                    <PlusCircle className="w-5 h-5 text-[#007cc3]" />
                  </CardHeader>
                  <CardContent>
                    {lastActivity ? (
                      <div className="flex justify-between items-end mb-6">
                        <div>
                          <div className="text-3xl font-light">{distanceMiles} <span className="text-lg text-gray-500">mi</span></div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{durationStr}</div>
                          <div className="text-xs text-gray-500">Tempo total</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 my-auto">Sem atividades recentes</div>
                    )}
                    
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
