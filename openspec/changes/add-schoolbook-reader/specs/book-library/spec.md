# Spec Delta

## Purpose

Define el catálogo de libros de texto disponibles y su segmentación en temas, para que el resto del sistema sepa qué páginas componen cada tema, dónde empieza el pliego y qué se puede pedir.

## ADDED Requirements

### Requirement: Catálogo de libros

El sistema DEBE exponer los libros disponibles con un identificador estable, un título y su número de páginas.

#### Scenario: Consultar el catálogo

- **WHEN** el cliente solicita el catálogo
- **THEN** recibe los cuatro libros (Lengua, Matemáticas, Conocimiento del Medio y Religión), cada uno con identificador, título y total de páginas

#### Scenario: Catálogo con cobertura de temas

- **WHEN** el cliente solicita el catálogo
- **THEN** la respuesta declara también los 45 temas repartidos como 12, 12, 12 y 9 por libro

### Requirement: Segmentación en temas

Cada tema DEBE tener identificador, número, título, página inicial y página final, y los temas de un libro DEBEN devolverse ordenados por número.

#### Scenario: Listar los temas de un libro

- **WHEN** se solicitan los temas de Lengua
- **THEN** se devuelven 12 temas ordenados del 1 al 12, con título y rango de páginas

#### Scenario: Título del tema

- **WHEN** se consulta el tema 1 de Religión
- **THEN** su título es "Mujer, sociedad y religión" y su rango empieza en la página 6

### Requirement: Continuidad de rangos

Las páginas que no pertenecen a ningún tema DEBEN atribuirse al tema anterior: el final de un tema es la página previa al inicio del siguiente.

#### Scenario: Páginas de repaso

- **WHEN** entre el tema 4 y el tema 5 de Lengua hay páginas de repaso trimestral
- **THEN** esas páginas quedan dentro del rango del tema 4

#### Scenario: Último tema del libro

- **WHEN** se calcula el rango del último tema de Religión
- **THEN** termina en la página anterior a la sección "Historias para leer", no en la última página del libro

#### Scenario: Rango sin solapes

- **WHEN** se recorre cualquier libro de principio a fin
- **THEN** ningún número de página aparece en dos temas y la primera página de cada tema es la declarada como inicio

### Requirement: Paridad de pliego por libro

El catálogo DEBE declarar, para cada libro, qué página ocupa la posición izquierda del pliego.

#### Scenario: Componer un pliego

- **WHEN** el lector solicita el pliego que contiene la página 10
- **THEN** el par de páginas se compone según la paridad declarada para ese libro

#### Scenario: Libro con paridad distinta

- **WHEN** dos libros declaran paridades opuestas
- **THEN** cada uno compone sus pliegos con la página que le corresponde a la izquierda, sin reglas globales

### Requirement: Petición de página fuera de rango

Una petición de página inexistente DEBE devolver un error explícito en lugar de una imagen vacía.

#### Scenario: Página que no existe

- **WHEN** se solicita la página 999 de un libro de 242 páginas
- **THEN** la respuesta es un error que indica que la página no existe
