import { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../config/supabase";

const UsuarioContext = createContext();

export const UsuarioProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function restaurarSessao() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.log("Erro ao obter sessão:", error);
        setCarregando(false);
        return;
      }

      const session = data?.session;

      if (session?.user) {
        setUsuario(session.user);

        const { data: perfilUsuario, error: erroPerfil } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!erroPerfil) {
          setPerfil(perfilUsuario);
        } else {
          console.log("Erro ao buscar perfil:", erroPerfil);
        }
      }

      setCarregando(false);
    }

    restaurarSessao();
  }, []);

  return (
    <UsuarioContext.Provider
      value={{
        usuario,
        setUsuario,
        perfil,
        setPerfil,
        carregando,
        setCarregando,
      }}
    >
      {children}
    </UsuarioContext.Provider>
  );
};

export const useUsuario = () => useContext(UsuarioContext);
