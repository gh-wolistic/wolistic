FROM python:3.12-slim

ARG INSTALL_DEV_DEPS=0

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    ; apt-get install -y --no-install-recommends build-essential \
    ; rm -rf /var/lib/apt/lists/*

COPY requirements.txt requirements-dev.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    ; pip install --no-cache-dir -r requirements.txt \
    ; if [ "$INSTALL_DEV_DEPS" = "1" ]; then pip install --no-cache-dir -r requirements-dev.txt; fi \
    ; python -m spacy download en_core_web_sm

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
