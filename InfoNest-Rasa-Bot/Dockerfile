FROM rasa/rasa:3.6.20-full
WORKDIR /app
USER root
COPY --chown=1001:1001 config.yml domain.yml /app/
COPY --chown=1001:1001 data /app/data
USER 1001
RUN rasa train
COPY --chown=1001:1001 endpoints.yml /app/endpoints.yml
EXPOSE 5005
CMD ["run", "--enable-api", "--cors", "*", "--debug", "--port", "5005"]