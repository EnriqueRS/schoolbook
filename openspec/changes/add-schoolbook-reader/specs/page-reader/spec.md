# Spec Delta

## Purpose

Ofrece la lectura de un libro de texto a doble página en una tablet apaisada, con la menor interfaz posible, para que el libro ocupe la pantalla y el lector desaparezca.

## ADDED Requirements

### Requirement: Vista de dos páginas

La vista de lectura DEBE mostrar dos páginas consecutivas del libro, completas y sin recortes, en una pantalla de 2000 × 1200 en horizontal.

#### Scenario: Abrir un libro en la tablet

- **WHEN** se abre Lengua en una pantalla de 2000 × 1200 apaisada
- **THEN** se ven las dos páginas del pliego completo, ocupando el alto disponible sin recortar ni deformar

#### Scenario: Proporción del libro respetada

- **WHEN** se compone un pliego
- **THEN** cada página conserva su proporción original y el pliego queda centrado con márgenes laterales iguales

### Requirement: Interfaz mínima

La vista de lectura no DEBE mostrar barra de herramientas, menú ni botones permanentes; solo un indicador de posición discreto.

#### Scenario: Lectura sin interacción

- **WHEN** el usuario lleva unos segundos sin tocar la pantalla
- **THEN** no hay controles visibles salvo el indicador de posición

#### Scenario: Indicador de posición

- **WHEN** se muestra un pliego
- **THEN** el indicador muestra el rango de páginas actual y el total del libro

### Requirement: Navegación por pliegos

El lector DEBE permitir avanzar y retroceder un pliego mediante deslizamiento horizontal y mediante las teclas de flecha izquierda y derecha.

#### Scenario: Deslizar para avanzar

- **WHEN** el usuario desliza el dedo de derecha a izquierda
- **THEN** se muestra el pliego siguiente

#### Scenario: Deslizar para retroceder

- **WHEN** el usuario desliza el dedo de izquierda a derecha
- **THEN** se muestra el pliego anterior

#### Scenario: Navegación con teclado

- **WHEN** el usuario pulsa la flecha derecha o la flecha izquierda
- **THEN** avanza o retrocede un pliego respectivamente

### Requirement: Cambio de pliego inmediato

El lector DEBE precargar el pliego siguiente y el anterior para que el cambio sea instantáneo.

#### Scenario: Precarga del pliego siguiente

- **WHEN** se muestra un pliego
- **THEN** las imágenes del pliego siguiente ya están descargadas antes de que el usuario lo pida

#### Scenario: Precarga en el borde del libro

- **WHEN** se muestra el primer o el último pliego
- **THEN** la precarga se limita al pliego existente y no se produce ningún error

### Requirement: Memoria de posición por libro

El lector DEBE recordar el último pliego leído de cada libro y reabrirlo en esa posición.

#### Scenario: Retomar la lectura

- **WHEN** el usuario cierra Lengua en el pliego 34–35 y vuelve a abrirlo
- **THEN** el libro se abre en el pliego 34–35

#### Scenario: Posición independiente por libro

- **WHEN** el usuario alterna entre dos libros
- **THEN** cada uno conserva su propia última página

### Requirement: Portada y cierre del libro

El lector DEBE componer los pliegos incompletos del principio y del final del libro sin deformar ni desplazar la página existente.

#### Scenario: Primera página del libro

- **WHEN** se abre un libro por su primera página
- **THEN** la portada se muestra en un pliego con un hueco vacío en el lado que no existe

#### Scenario: Última página impar

- **WHEN** el último pliego del libro solo contiene una página
- **THEN** esa página se muestra sola con el hueco correspondiente, sin repetir la anterior

### Requirement: Orientación apaisada

La experiencia de dos páginas DEBE estar diseñada para orientación apaisada y no DEBE requerir interacción alguna para empezar a leer.

#### Scenario: Abrir sin configuración previa

- **WHEN** el usuario abre el lector
- **THEN** puede empezar a leer y pasar páginas sin configurar nada
