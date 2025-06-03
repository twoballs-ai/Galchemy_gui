# Stage 1: build
FROM node:20 AS builder

WORKDIR /app

# Копируем package.json и lock файлы отдельно для кэширования установки
COPY package.json package-lock.json ./

RUN npm install

COPY . .

# Сборка Vite проекта
RUN npm run build

# Stage 2: nginx
FROM nginx:stable-alpine

# Скопируем сборку
COPY --from=builder /app/dist /usr/share/nginx/html

# Удалим дефолтный nginx конфиг
RUN rm /etc/nginx/conf.d/default.conf

# Подключим свой конфиг
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
