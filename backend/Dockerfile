FROM rocker/r-ver:4.3.2

# System deps
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    libcurl4-openssl-dev libssl-dev libxml2-dev \
    libfontconfig1-dev libharfbuzz-dev libfribidi-dev \
    libfreetype6-dev libpng-dev libtiff5-dev libjpeg-dev \
    && rm -rf /var/lib/apt/lists/*

# R packages
RUN Rscript -e "install.packages(c('jsonlite','corrplot','ggplot2','reshape2','GGally','openxlsx','gridExtra'), repos='https://cloud.r-project.org')"

# Python deps
WORKDIR /app
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
