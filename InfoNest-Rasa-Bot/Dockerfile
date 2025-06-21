FROM python:3.7-slim

RUN apt-get update && apt-get install -y build-essential git

RUN pip install --upgrade pip setuptools
RUN pip install protobuf==3.20.3
RUN pip install rasa==1.10.2

WORKDIR /app
COPY . /app

# --- ADD THIS LINE TO TRAIN THE MODEL DURING BUILD ---
RUN rasa train

# New CMD command to run the Rasa server with API enabled
CMD ["rasa", "run", "--enable-api", "--cors", "*", "--debug", "-p", "5005"]