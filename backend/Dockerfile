FROM python:3.11-slim

# System packages for psycopg / asyncpg / ldap3
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY . .

# Expose the FastAPI port
EXPOSE 8000

# Run Uvicorn without reload (reload only works on host)
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
