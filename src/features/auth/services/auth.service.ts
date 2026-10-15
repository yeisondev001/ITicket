import { ROLES ,type Rol, type UsuarioActual } from '@/types/usuario'
import { supabase } from '@/lib/supabase'
import type { CredencialesLogin } from '../lib/validacionLogin'

export class CredencialesInvalidasError extends Error {
  constructor() {
    super('Correo o contraseña incorrectos.')
    this.name = 'CredencialesInvalidasError'
  }
}

function esRol(valor: unknown): valor is Rol {
    return typeof valor === 'string' && ROLES.some((rol) => rol === valor)
}

export async function obtenerUsuarioPorId(id: string): Promise<UsuarioActual> {
    const { data: perfil, error } = await supabase
        .from('perfiles')
        .select('id, nombre, rol, activo')
        .eq('id', id)
        .maybeSingle()

    if (error) {
        throw new Error('No se pudo cargar el perfil. Intenta de nuevo.')
    }

    if (!perfil || !perfil.activo || !esRol(perfil.rol) || typeof perfil.nombre !== 'string') {
        await supabase.auth.signOut()
        throw new Error('La cuenta no tiene un perfil activo. Contacta al administrador.')
    }

    return {
        id: perfil.id,
        nombre: perfil.nombre,
        rol: perfil.rol,
    }
}


export async function obtenerUsuarioActual(): Promise < UsuarioActual | null > {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
        throw new Error('No se pudo recuperar la sesion.')
    }

    if (!data.session) {
        return null
    }

    return obtenerUsuarioPorId(data.session.user.id)
}

export async function iniciarSesion({
    correo,
    contrasena,
}: CredencialesLogin): Promise<UsuarioActual> {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: correo.trim().toLowerCase(),
        password: contrasena,
    })

    if (error) {
        if (error.code === 'invalid_credentials') {
            throw new CredencialesInvalidasError()
        }

        if (error.code === 'email_not_confirmed') {
            throw new Error('El correo electrónico no ha sido confirmado.')
        }

        throw new Error('No se pudo iniciar sesión. Inténtalo de nuevo más tarde.')
    }

    return obtenerUsuarioPorId(data.user.id)
}

export async function cerrarSesion(): Promise<void> {
    const { error } = await supabase.auth.signOut()

    if (error) {
        throw new Error('No se pudo cerrar sesión. Inténtalo de nuevo más tarde.')
    }
}