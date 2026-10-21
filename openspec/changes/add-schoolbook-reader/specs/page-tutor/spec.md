# Spec Delta

## Purpose

Acompaña la lectura con un tutor conversacional que explica, ejemplifica y comprueba la comprensión de lo que el niño tiene delante, sin sustituir el esfuerzo de estudiarlo.

## ADDED Requirements

### Requirement: Contexto del pliego visible

Las respuestas del tutor DEBEN basarse en el contenido de las dos páginas que se están viendo.

#### Scenario: Pregunta sobre lo visible

- **WHEN** el niño pregunta por un concepto que aparece en la página izquierda del pliego
- **THEN** la respuesta trata ese concepto y su explicación es coherente con lo que dice el libro

#### Scenario: Pregunta sobre algo que no está en el pliego

- **WHEN** el niño pregunta por algo que no aparece en las páginas visibles
- **THEN** el tutor lo dice y ofrece ampliar el contexto al tema o responder sobre lo que sí está en pantalla

### Requirement: Ampliar el contexto al tema

El tutor DEBE permitir ampliar el contexto al tema completo cuando la duda lo requiera.

#### Scenario: Ampliar al tema

- **WHEN** el niño pide explícitamente el tema completo
- **THEN** el tutor responde usando el contenido de todas las páginas del tema actual

#### Scenario: Volver al pliego

- **WHEN** el niño sigue preguntando después de ampliar
- **THEN** el tutor puede volver a responder sobre el pliego si la pregunta vuelve a ser local

### Requirement: Voz de tutor de quinto

El tutor DEBE usar frases cortas, ejemplos de la vida cotidiana de un niño de diez años y evitar tecnicismos innecesarios.

#### Scenario: Explicación solicitada

- **WHEN** el niño pide una explicación
- **THEN** recibe una explicación breve, con un ejemplo cercano y sin jerga

#### Scenario: Cierre con comprobación

- **WHEN** el tutor termina una explicación
- **THEN** cierra con una pregunta sencilla para comprobar que se ha entendido

### Requirement: No resolver los ejercicios del libro

El tutor DEBE guiar hacia la respuesta sin entregar directamente la solución de los ejercicios impresos en el libro.

#### Scenario: Pedir la solución de un ejercicio

- **WHEN** el niño pide la respuesta de un ejercicio que aparece en el libro
- **THEN** el tutor ofrece una pista, el primer paso y una pregunta que le acerque a resolverlo

#### Scenario: Insistencia en la solución

- **WHEN** el niño insiste en obtener la respuesta directa
- **THEN** el tutor mantiene la guía sin resolver el ejercicio por él

### Requirement: Acciones sugeridas

El panel del tutor DEBE ofrecer acciones preparadas para las dudas más frecuentes: explicación más fácil, un ejemplo, una pregunta de comprobación y la utilidad de lo que se está viendo.

#### Scenario: Abrir el tutor

- **WHEN** se abre el panel del tutor
- **THEN** están disponibles las cuatro acciones sugeridas sin escribir nada

#### Scenario: Usar una acción sugerida

- **WHEN** el niño toca una acción sugerida
- **THEN** la conversación continúa con esa petición sin que tenga que redactarla

### Requirement: Respuesta progresiva

La respuesta del tutor DEBE mostrarse mientras se genera, sin esperar a que esté completa.

#### Scenario: Respuesta en curso

- **WHEN** el modelo empieza a responder
- **THEN** el texto aparece de forma progresiva en el panel

### Requirement: Fallo del modelo

Si el modelo no responde, el sistema DEBE informarlo y permitir reintentar sin perder la conversación.

#### Scenario: Error del proveedor

- **WHEN** el servicio de IA devuelve un error o no responde
- **THEN** el panel muestra un aviso comprensible y conserva los mensajes anteriores

#### Scenario: Reintentar

- **WHEN** el niño reintenta después de un fallo
- **THEN** la pregunta se vuelve a enviar con el contexto intacto
