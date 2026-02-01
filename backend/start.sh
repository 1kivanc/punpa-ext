#!/bin/bash

cd "$(dirname "$0")"

VENV_DIR="../venv"

if [ ! -d "$VENV_DIR" ]; then
    echo "Sanal ortam (venv) kök dizinde oluşturuluyor..."
    python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"

echo "Bağımlılıklar kontrol ediliyor..."
pip install -r requirements.txt

echo "🚀 PaddleOCR Sunucusu Başlatılıyor..."
echo "-----------------------------------"

export FLAGS_enable_pir_api=0
export FLAGS_enable_pir_in_executor=0
export FLAGS_use_mkldnn=0

python server.py
