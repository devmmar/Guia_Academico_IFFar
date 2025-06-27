import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../config/supabase';

const EventosContext = createContext();

export function EventosProvider({ children }) {
  const [eventos, setEventos] = useState([]);
  const [carregandoEventos, setCarregandoEventos] = useState(true);

  // 🔄 Carrega apenas eventos ativos
  const carregarEventos = useCallback(async () => {
    setCarregandoEventos(true);
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('ativo', true); // ← Apenas eventos ativos

    if (!error) {
      setEventos(data);
    } else {
      console.log('Erro ao buscar eventos:', error);
    }

    setCarregandoEventos(false);
  }, []);

  useEffect(() => {
    carregarEventos();
  }, [carregarEventos]);

  // 🔁 Atualiza um evento individual (ex: edição ou encerramento)
  const atualizarEventoAtualizado = useCallback((eventoAtualizado) => {
    setEventos((anteriores) =>
      anteriores.map((ev) =>
        ev.id === eventoAtualizado.id ? { ...ev, ...eventoAtualizado } : ev
      )
    );
  }, []);

  // 🛑 Marca evento como encerrado no banco e remove da lista local
  const encerrarEvento = useCallback(async (id) => {
    const { data, error } = await supabase
      .from('eventos')
      .update({ ativo: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao encerrar evento:', error);
      return { sucesso: false, erro };
    }

    // remove localmente da lista de ativos
    setEventos((anteriores) => anteriores.filter((ev) => ev.id !== id));

    return { sucesso: true, eventoAtualizado: data };
  }, []);

  return (
    <EventosContext.Provider
      value={{
        eventos,
        carregarEventos,
        atualizarEventoAtualizado,
        encerrarEvento,
        carregandoEventos,
      }}
    >
      {children}
    </EventosContext.Provider>
  );
}

export function useEventos() {
  return useContext(EventosContext);
}