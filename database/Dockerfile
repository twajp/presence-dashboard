FROM mysql:latest

COPY my.cnf /etc/mysql/conf.d/my.cnf
RUN chmod 644 /etc/mysql/conf.d/my.cnf

COPY init.sql /docker-entrypoint-initdb.d/
