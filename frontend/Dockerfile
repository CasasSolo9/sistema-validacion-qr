FROM nginx:alpine

COPY . /usr/share/nginx/html

RUN echo 'server {     listen 80;     server_name localhost;     root /usr/share/nginx/html;     index index.html;     location / {         try_files $uri $uri/ =404;     } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
