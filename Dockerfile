FROM node:24-alpine

# Herramientas de los scripts de datos: render (poppler + cwebp) y OCR (tesseract + español).
RUN apk add --no-cache poppler-utils libwebp-tools tesseract-ocr tesseract-ocr-data-spa

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

EXPOSE 8098
CMD ["node", "src/server.js"]
