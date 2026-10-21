# Spec Delta

## Purpose

Genera y corrige un test de estudio para un tema concreto del libro, a partir de su contenido real, con preguntas que remiten a la página donde se responde.

## ADDED Requirements

### Requirement: Test por tema

El sistema DEBE generar un test para un tema concreto usando como material el texto de las páginas de ese tema.

#### Scenario: Pedir el test de un tema

- **WHEN** se pide el test del tema 2 de Lengua
- **THEN** el test se genera a partir del contenido de las páginas 24 a 37 de ese libro

#### Scenario: Tema inexistente

- **WHEN** se pide el test de un tema que no existe en ese libro
- **THEN** la respuesta es un error explícito y no un test vacío

### Requirement: Composición del test

El test DEBE contener seis preguntas de opción múltiple con cuatro opciones y una sola correcta, y dos preguntas de respuesta corta, cada una con su explicación.

#### Scenario: Estructura completa

- **WHEN** se genera un test de un tema con contenido suficiente
- **THEN** contiene exactamente seis preguntas de opción múltiple y dos de respuesta corta, todas con explicación

#### Scenario: Enunciado legible para un niño de 10 años

- **WHEN** se lee cualquier pregunta del test
- **THEN** el enunciado usa frases cortas y vocabulario propio de quinto de primaria

### Requirement: Fidelidad al contenido del libro

Las preguntas DEBEN derivarse únicamente del texto de las páginas del tema; el sistema DEBE reducir el número de preguntas antes que inventar contenido que no aparezca en el libro.

#### Scenario: Tema con poco texto

- **WHEN** el contenido disponible no permite formular las ocho preguntas
- **THEN** el test devuelve menos preguntas e indica que se ha recortado por falta de contenido

#### Scenario: Contenido ajeno al tema

- **WHEN** una pregunta requiere un conocimiento que no está en las páginas del tema
- **THEN** esa pregunta no forma parte del test

### Requirement: Referencia a la página del libro

Cada pregunta DEBE indicar la página del libro donde se encuentra la respuesta.

#### Scenario: Consultar un fallo

- **WHEN** el usuario falla una pregunta
- **THEN** ve la explicación y la página a la que puede volver para repasar

#### Scenario: Ir a la página desde el test

- **WHEN** el usuario toca la referencia de página de una pregunta
- **THEN** se abre el lector en esa página

### Requirement: Corrección del test

Las preguntas de opción múltiple DEBEN corregirse al instante y las de respuesta corta DEBEN evaluarse con una rúbrica, con un comentario que explique qué faltó.

#### Scenario: Respuesta de opción múltiple

- **WHEN** el usuario elige una opción
- **THEN** sabe de inmediato si es correcta y por qué, sin esperar al final

#### Scenario: Respuesta corta correcta

- **WHEN** el usuario responde con sus propias palabras una pregunta abierta y la respuesta es correcta
- **THEN** recibe la valoración y un refuerzo breve

#### Scenario: Respuesta corta incompleta

- **WHEN** la respuesta abierta es incompleta pero encaminada
- **THEN** recibe qué faltaba y no se le marca como fallo total

### Requirement: Test sin tiempo y sin persistencia

El test no DEBE tener límite de tiempo ni DEBE guardar los resultados al terminar.

#### Scenario: Abandonar a medias

- **WHEN** el usuario cierra el test sin terminarlo
- **THEN** al volver a abrirlo empieza de cero

#### Scenario: Fin del test

- **WHEN** el usuario termina el test
- **THEN** ve el resultado de esa sesión y no se almacena en ningún sitio

### Requirement: Repetir el test

El sistema DEBE permitir generar otro test del mismo tema con preguntas distintas.

#### Scenario: Otro test del mismo tema

- **WHEN** el usuario pide otro test del tema que acaba de hacer
- **THEN** recibe un conjunto de preguntas distinto del anterior
