import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { UsuarioActual } from '@/types/usuario' 
import { supabase } from '@/lib/supabase'
import type { CredencialesLogin } from '../lib/validacionLogin'
import * as auth from '../services/auth.service'
import { AuthContext } from './AuthContext'

type SesionAuth = { user: { id: string } } | null

export function AuthProvider({ children }: { children: ReactNode }) {
    const [usuario, setUsuario] = useState<UsuarioActual | null>(null)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        let activo = true
        let revision = 0

        const actualizarSesion = (sesion: SesionAuth) => {
            const revisionActual = ++revision

            window.setTimeout(() => {
                const cargarPerfil = sesion ? auth.obtenerUsuarioPorId(sesion.user.id) : Promise.resolve(null)

                void cargarPerfil.then((usuarioActual) => {
                    if (activo && revisionActual === revision) {
                        setUsuario(usuarioActual)
                    }
                }).catch(() => {
                    if (activo && revisionActual === revision) {
                        setUsuario(null)
                    }
                }).finally(() => {
                    if (activo && revisionActual === revision) {
                        setCargando(false)
                    }
                })
            }, 0)
        }

        const { data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
                actualizarSesion(session)
            }
        })

        const revisionInicial = ++revision

        void auth.obtenerUsuarioActual()
            .then((usuarioActual) => {
                if (activo && revisionInicial === revision) {
                    setUsuario(usuarioActual)
                }
            }).catch(() => {
                if (activo && revisionInicial === revision) {
                    setUsuario(null)
                }
            })
            .finally(() => {
                if (activo && revisionInicial === revision) {
                    setCargando(false)
                }
            })

        return () => {
            activo = false
            subscription.unsubscribe()
        }

    }, [])

    const iniciarSesion = useCallback(async (credenciales: CredencialesLogin) => {
        const usuarioAutenticado = await auth.iniciarSesion(credenciales)
        setUsuario(usuarioAutenticado)
        setCargando(false)
        return usuarioAutenticado
    }, [])

    const cerrarSesion = useCallback(async () => {
        await auth.cerrarSesion()
        setUsuario(null)
        setCargando(false)
    }, [])

    const valor = useMemo(
        () => ({ usuario, cargando, iniciarSesion, cerrarSesion }),
        [usuario, cargando, iniciarSesion, cerrarSesion]
    )

    return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
    
}