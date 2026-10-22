# Schoolbook

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%E2%89%A520-brightgreen.svg)
![Docker](https://img.shields.io/badge/deploy-Docker-2496ED.svg)
![OpenSpec](https://img.shields.io/badge/workflow-OpenSpec-8A2BE2.svg)

Lector propio en tablet para los libros de texto de 5º de Primaria (Santillana), con test por tema y tutor conversacional con IA.

## El problema

Los libros de texto existen solo como PDFs de 92–211 MB cuyas páginas son imagen vectorizada sin capa de texto: no se pueden leer cómodamente en una tablet ni sacar nada de ellas para estudiar. Un adulto acaba pasando páginas en un visor genérico, y un niño de 10 años no puede repasar un tema por su cuenta.

## Qué ofrece

- **Catálogo de libros y temas** — los 4 libros (Lengua, Matemáticas, Conocimiento del Medio, Religión) segmentados en 45 temas.
- **Lector de pliego** — vista de dos páginas en tablet apaisada, sin barra de herramientas, navegación por deslizamiento y teclado, con memoria de la última página por libro.
- **Test por tema** — 8 preguntas generadas con IA (6 tipo test + 2 de respuesta corta), corrección inmediata y enlace a la página del libro de cada pregunta.
- **Tutor guiado** — chat contextual sobre el pliego que se está viendo, ampliable al tema completo, con respuesta en streaming.

## Cómo funciona

- Cada página del PDF se renderiza una vez a WebP (~150 KB): se sustituyen 555 MB de PDF por ~109 MB de imágenes servidas como estático.
- OCR offline (tesseract `spa`) produce el texto de las 749 páginas como material de trabajo para el modelo; no se muestra al usuario.
- Un único proceso Node/Express sirve el cliente (sin build step) y cuatro endpoints: catálogo, texto por página, generar test y chat con streaming.
- El modelo se consume a través de un proxy LiteLLM; la ruta de lectura funciona sin IA, sin latencia ni coste.
- Uso doméstico en red local: sin cuentas, sin base de datos, sin progreso persistente.

## Estado

Implementado y verificado en local. En fase de pulido guiada por [OpenSpec](openspec/changes/add-schoolbook-reader/): propuesta, diseño, specs y tareas al día.

## Puesta en marcha

Requisitos: Node ≥ 20, `poppler-utils`, `libwebp-tools` y `tesseract-ocr` + `tesseract-ocr-data-spa` (todo dentro de la imagen Docker, así que en el host solo hace falta Docker).

```bash
cp .env.example .env      # rellena LITELLM_API_KEY
npm install
npm run render            # PDF -> data/pages/<libro>/*.webp (una vez, ~15 min)
npm run ocr               # PDF -> data/pages/<libro>/*.txt (una vez, ~100 min con los 4 en paralelo)
npm run check             # valida la tabla de temas y los tests
docker compose up -d --build
```

El lector queda en `http://<ip-del-host>:8098`. Los dos pipelines son idempotentes: si se interrumpen, al relanzarlos siguen donde se quedaron. Se pueden ejecutar por libro (`npm run render -- lengua`).

Enlace directo a una página: `http://<host>:8098/#lengua/60`.

## Estructura

```
books/            PDFs originales (fuera de git)
data/books.json   los 4 libros y los 45 temas con su rango de páginas
data/pages/       derivados: 749 .webp + 749 .txt (fuera de git, regenerables)
src/              servidor Express: catálogo, texto por página, test y chat
public/           cliente sin build step (index.html, app.js, app.css)
scripts/          render.js, ocr.js y check.js
test/             pruebas con node --test
```

## Sobre los PDFs

Los PDFs originales y sus derivados (imágenes, texto OCR) quedan fuera del repositorio; se colocan en `books/`. Del repo solo se versiona el pipeline, la tabla de temas y la configuración.

## Licencia

[MIT](LICENSE)
