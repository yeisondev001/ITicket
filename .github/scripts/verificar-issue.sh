#!/usr/bin/env bash
# Revisa que la descripción de un PR enlace al menos una tarea real del tablero:
# un issue (no un PR) abierto de este repositorio que esté en el proyecto.
#
# Variables: DESCRIPCION (cuerpo del PR), REPOSITORIO (dueño/nombre),
# PROYECTO (número del proyecto de GitHub) y GH_TOKEN (para consultar GitHub).
set -uo pipefail

patron='(close[sd]?|fix(e[sd])?|resolve[sd]?|relacionado con):?[[:space:]]*#[0-9]+'
numeros=$(printf '%s' "${DESCRIPCION:-}" | grep -oiE "$patron" | grep -oE '[0-9]+' | sort -un)

if [ -z "$numeros" ]; then
  echo "::error::Agrega en la descripción del PR 'Closes #N' (si termina la tarea) o 'Relacionado con #N' (si solo la avanza), con el número de una tarea del tablero."
  exit 1
fi

dueno=${REPOSITORIO%%/*}
nombre=${REPOSITORIO#*/}
validos=0

for n in $numeros; do
  # Tipo y estado del número: issue o PR, abierto o cerrado.
  if ! datos=$(gh api graphql \
      -f query='query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){issueOrPullRequest(number:$n){__typename ... on Issue{state title}}}}' \
      -f o="$dueno" -f r="$nombre" -F n="$n" \
      --jq '.data.repository.issueOrPullRequest | if . == null then "NADA" else "\(.__typename)|\(.state // "")|\(.title // "")" end' 2>/dev/null); then
    datos="NADA"
  fi

  IFS='|' read -r tipo estado titulo <<< "$datos"
  if [ "$tipo" = "NADA" ] || [ -z "$tipo" ]; then
    echo "::warning::#$n no existe en este repositorio."
    continue
  fi
  if [ "$tipo" != "Issue" ]; then
    echo "::warning::#$n es un Pull Request, no una tarea. Enlaza el issue de la tarea."
    continue
  fi
  if [ "$estado" != "OPEN" ]; then
    echo "::warning::#$n ($titulo) ya está cerrado. Enlaza una tarea abierta."
    continue
  fi

  # ¿Está en el tablero? Si GitHub no deja leer el proyecto con el token del
  # workflow, se acepta igual: la automatización del tablero agrega todos los
  # issues abiertos del repositorio.
  if proyectos=$(gh api graphql \
      -f query='query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){issue(number:$n){projectItems(first:20){nodes{project{number}}}}}}' \
      -f o="$dueno" -f r="$nombre" -F n="$n" \
      --jq '[.data.repository.issue.projectItems.nodes[].project.number] | map(tostring) | join(" ")' 2>/dev/null) \
      && [ -n "$proyectos" ]; then
    if ! printf ' %s ' "$proyectos" | grep -q " $PROYECTO "; then
      echo "::warning::#$n ($titulo) no está en el tablero. Agrégalo al tablero o enlaza otra tarea."
      continue
    fi
  fi

  echo "✔ #$n: $titulo"
  validos=$((validos + 1))
done

if [ "$validos" -eq 0 ]; then
  echo "::error::Ninguno de los números del PR es una tarea abierta del tablero. Usa 'Closes #N' con el número de la tarjeta."
  exit 1
fi
echo "El PR está enlazado a $validos tarea(s) del tablero."
