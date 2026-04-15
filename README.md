# Simulador de Jubilación - España

Aplicación web que analiza tu documento de **Vida Laboral** (PDF) y calcula tu edad de jubilación, fecha estimada y pensión según la legislación española vigente.

**https://cristianabrante.github.io/retirement-simulator-spain/**

## Funcionalidades

- Carga de PDF de Vida Laboral con drag-and-drop
- Parseo del documento 100% en el navegador (sin envío a servidores)
- Cálculo de edad ordinaria de jubilación (calendario transitorio 2013–2027+)
- Jubilación anticipada voluntaria e involuntaria con coeficientes reductores
- Estimación de pensión por porcentaje de cotización
- Cálculo personalizado introduciendo salario bruto anual
- Historial de períodos de trabajo
- Datos guardados en localStorage (no hace falta volver a subir el PDF)

## Desarrollo local

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js 16 + TypeScript
- Tailwind CSS v4
- pdfjs-dist (parseo de PDF en cliente)
- Desplegado en GitHub Pages con GitHub Actions
