import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../config/supabase';

const CursosContexto = createContext();

export function CursosProvider({ children }) {
  const [cursos, setCursos] = useState([]);
  const [carregandoCursos, setCarregandoCursos] = useState(true);

  // 🔄 Carregar todos os cursos
  const carregarCursos = useCallback(async () => {
    setCarregandoCursos(true);
    const { data, error } = await supabase.from('cursos').select('*');

    if (!error) {
      setCursos(data);
    } else {
      console.error('Erro ao buscar cursos:', error);
    }

    setCarregandoCursos(false);
  }, []);

  useEffect(() => {
    carregarCursos();
  }, [carregarCursos]);

  // ➕ Adiciona um curso localmente após inserção no banco
  const adicionarCurso = useCallback((novoCurso) => {
    setCursos((anteriores) => [novoCurso, ...anteriores]);
  }, []);

  // 🔁 Atualiza um curso localmente após edição
  const atualizarCurso = useCallback((cursoAtualizado) => {
    setCursos((anteriores) =>
      anteriores.map((curso) =>
        curso.id === cursoAtualizado.id ? { ...curso, ...cursoAtualizado } : curso
      )
    );
  }, []);

  // 🗑️ Remove curso localmente (ou você pode adaptar para marcar como inativo)
  const removerCurso = useCallback((id) => {
    setCursos((anteriores) => anteriores.filter((curso) => curso.id !== id));
  }, []);

  return (
    <CursosContexto.Provider
      value={{
        cursos,
        carregarCursos,
        adicionarCurso,
        atualizarCurso,
        removerCurso,
        carregandoCursos,
      }}
    >
      {children}
    </CursosContexto.Provider>
  );
}

export function useCursos() {
  return useContext(CursosContexto);
}
