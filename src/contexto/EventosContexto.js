import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../config/supabase';

const EventosContext = createContext();

export function EventosProvider({ children }) {
  const [eventos, setEventos] = useState([]);
  const [carregandoEventos, setCarregandoEventos] = useState(true);

  const carregarEventos = useCallback(async () => {
    setCarregandoEventos(true);

    const { data, error } = await supabase
      .from('eventos')
      .select(`
        *,
        curtidas(count),
        comentarios(count),
        fotos_evento(count)
      `)
      .eq('ativo', true);

    if (!error && data) {
      const eventosComTotais = data.map(ev => ({
        ...ev,
        totalCurtidas: ev.curtidas?.[0]?.count || 0,
        totalComentarios: ev.comentarios?.[0]?.count || 0,
        totalFotos: ev.fotos_evento?.[0]?.count || 0
      }));

      setEventos(eventosComTotais);
    } else {
      console.log('Erro ao buscar eventos:', error);
    }

    setCarregandoEventos(false);
  }, []);

  useEffect(() => {
    carregarEventos();
  }, [carregarEventos]);

  const atualizarEventoAtualizado = useCallback((eventoAtualizado) => {
    setEventos((anteriores) =>
      anteriores.map((ev) =>
        ev.id === eventoAtualizado.id ? { ...ev, ...eventoAtualizado } : ev
      )
    );
  }, []);

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
